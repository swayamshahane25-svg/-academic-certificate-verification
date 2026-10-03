const express = require("express");
const rateLimit = require("express-rate-limit");
const { z } = require("zod");
const crypto = require("crypto");

const {
  createUser,
  getUserByEmail,
  getUserById,
  listUsers,
  updateUserRole,
  updateUserStatus,
  countUsersByRole,
  countUsers,
  createPasswordResetToken,
  getPasswordResetTokenByHash,
  markPasswordResetTokenUsed,
  invalidateUserPasswordTokens,
  updateUserPassword,
} = require("./db");

const {
  hashPassword,
  comparePassword,
  signToken,
  createAuthPayload,
  authenticateUser,
  requireRole,
  createResetToken,
  hashResetToken,
} = require("./auth");

const { registrationSchema, loginSchema, passwordResetRequestSchema, passwordResetConfirmSchema } = require("./validate");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again later." },
});

const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many password reset requests. Please try again later." },
});

function getUserLoginError(user) {
  if (!user) {
    return { status: 401, error: "Invalid email or password." };
  }

  const normalizedStatus = String(user.status || "").toUpperCase();
  if (normalizedStatus === "DISABLED" || user.status === "disabled") {
    return { status: 403, error: "This account has been disabled." };
  }

  if (String(user.role || "").toUpperCase() === "ISSUER" && (normalizedStatus === "PENDING" || user.status === "pending")) {
    return { status: 403, error: "Your issuer account is awaiting admin approval." };
  }

  return null;
}

function setAuthCookie(res, token, rememberMe) {
  const isProduction = process.env.NODE_ENV === "production";
  const maxAge = rememberMe ? 1000 * 60 * 60 * 24 * 30 : 1000 * 60 * 60 * 24;

  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge,
    path: "/",
  });
}

function clearAuthCookie(res) {
  res.clearCookie("token", { path: "/", httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax" });
}

router.post("/register", async (req, res) => {
  try {
    const parsed = registrationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid registration data." });
    }

    const { name, email, password, role, university } = parsed.data;
    const existing = await getUserByEmail(email);

    if (existing) {
      return res.status(409).json({ error: "An account with that email already exists." });
    }

    if (role === "ADMIN") {
      return res.status(403).json({ error: "Admin creation is restricted to secure internal setup." });
    }

    const passwordHash = await hashPassword(password);
    const status = role === "ISSUER" ? "PENDING" : "ACTIVE";
    const user = await createUser({
      name,
      email,
      passwordHash,
      role,
      university,
      status,
    });

    const token = signToken(user);
    return res.status(201).json({
      token,
      user: createAuthPayload(user),
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ error: "Unable to create account." });
  }
});

router.post("/login", loginLimiter, async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid login data." });
    }

    const { email, password, rememberMe } = parsed.data;
    const user = await getUserByEmail(email);
    const loginError = getUserLoginError(user);

    if (loginError) {
      return res.status(loginError.status).json({ error: loginError.error });
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = signToken(user);
    const sessionRemember = Boolean(rememberMe);
    setAuthCookie(res, token, sessionRemember);

    return res.json({
      token,
      user: createAuthPayload(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Unable to authenticate user." });
  }
});

router.post("/logout", authenticateUser, async (req, res) => {
  clearAuthCookie(res);
  return res.json({ success: true, message: "Logged out successfully." });
});

router.get("/me", authenticateUser, async (req, res) => {
  try {
    const user = await getUserById(req.user.sub);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const normalizedStatus = String(user.status || "").toUpperCase();
    if (normalizedStatus === "DISABLED" || user.status === "disabled") {
      return res.status(403).json({ error: "This account is disabled." });
    }

    if (String(user.role || "").toUpperCase() === "ISSUER" && (normalizedStatus === "PENDING" || user.status === "pending")) {
      return res.status(403).json({ error: "Issuer account is awaiting admin approval." });
    }

    return res.json({ user: createAuthPayload(user) });
  } catch (error) {
    console.error("Auth me error:", error);
    return res.status(500).json({ error: "Unable to load profile." });
  }
});

router.post("/forgot-password", resetLimiter, async (req, res) => {
  try {
    const parsed = passwordResetRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Please provide a valid email." });
    }

    const { email } = parsed.data;
    const user = await getUserByEmail(email);

    if (user) {
      const resetToken = createResetToken();
      const tokenHash = hashResetToken(resetToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      await invalidateUserPasswordTokens(user.id);
      await createPasswordResetToken({ userId: user.id, tokenHash, expiresAt });

      const resetUrl = `${process.env.APP_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;
      console.log(`[DEV RESET] User: ${user.email} | Reset URL: ${resetUrl}`);
    }

    return res.json({
      message: "If an account exists for that email, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ error: "Unable to process password reset request." });
  }
});

router.post("/reset-password", resetLimiter, async (req, res) => {
  try {
    const parsed = passwordResetConfirmSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid reset request." });
    }

    const { token, password, confirmPassword } = parsed.data;
    if (!token) {
      return res.status(400).json({ error: "Reset token is required." });
    }

    const tokenHash = hashResetToken(token);
    const resetRecord = await getPasswordResetTokenByHash(tokenHash);

    if (!resetRecord) {
      return res.status(400).json({ error: "This password reset link is invalid or has already been used." });
    }

    if (resetRecord.usedAt) {
      return res.status(400).json({ error: "This password reset link has already been used." });
    }

    const expiresAt = new Date(resetRecord.expiresAt);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ error: "This password reset link has expired." });
    }

    const user = await getUserById(resetRecord.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const passwordHash = await hashPassword(password);
    await updateUserPassword(user.id, passwordHash);
    await markPasswordResetTokenUsed(resetRecord.id);

    return res.json({
      success: true,
      message: "Password reset successfully. Please log in again.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ error: "Unable to reset password." });
  }
});

router.get("/admin/users", authenticateUser, requireRole("ADMIN"), async (req, res) => {
  try {
    const users = await listUsers();
    return res.json({ users });
  } catch (error) {
    console.error("Users list error:", error);
    return res.status(500).json({ error: "Unable to load user list." });
  }
});

router.patch("/admin/users/:id/role", authenticateUser, requireRole("ADMIN"), async (req, res) => {
  try {
    const { role } = req.body || {};
    if (!role || !["ADMIN", "ISSUER", "STUDENT"].includes(role)) {
      return res.status(400).json({ error: "Valid role is required." });
    }

    const user = await getUserById(Number(req.params.id));
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const activeAdmins = await countUsersByRole("ADMIN");
    if (user.role === "ADMIN" && role !== "ADMIN" && activeAdmins <= 1) {
      return res.status(400).json({ error: "At least one active admin must remain." });
    }

    const updated = await updateUserRole(user.id, role);
    return res.json({ user: createAuthPayload(updated) });
  } catch (error) {
    console.error("Role update error:", error);
    return res.status(500).json({ error: "Unable to update user role." });
  }
});

router.patch("/admin/users/:id/status", authenticateUser, requireRole("ADMIN"), async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!status || !["ACTIVE", "PENDING", "DISABLED"].includes(String(status).toUpperCase())) {
      return res.status(400).json({ error: "Valid status is required." });
    }

    const user = await getUserById(Number(req.params.id));
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const normalizedStatus = String(status).toUpperCase();
    if (user.role === "ADMIN" && normalizedStatus === "DISABLED") {
      const activeAdmins = await countUsersByRole("ADMIN");
      if (activeAdmins <= 1) {
        return res.status(400).json({ error: "Cannot disable the last active administrator." });
      }
    }

    const updated = await updateUserStatus(user.id, normalizedStatus);
    return res.json({ user: createAuthPayload(updated) });
  } catch (error) {
    console.error("Status update error:", error);
    return res.status(500).json({ error: "Unable to update user status." });
  }
});

router.post("/admin/users/issuer", authenticateUser, requireRole("ADMIN"), async (req, res) => {
  try {
    const { name, email, password, university } = req.body || {};
    if (!name || !email || !password || !university) {
      return res.status(400).json({ error: "Name, email, password, and university are required." });
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "An account with that email already exists." });
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser({
      name,
      email,
      passwordHash,
      role: "ISSUER",
      university,
      status: "PENDING",
    });

    return res.status(201).json({ user: createAuthPayload(user) });
  } catch (error) {
    console.error("Create issuer error:", error);
    return res.status(500).json({ error: "Unable to create issuer account." });
  }
});

router.get("/admin/stats", authenticateUser, requireRole("ADMIN"), async (req, res) => {
  try {
    const [totalUsers, issuers, students, totalCertificates, revokedCertificates] = await Promise.all([
      countUsers(),
      countUsersByRole("ISSUER"),
      countUsersByRole("STUDENT"),
      0,
      0,
    ]);

    return res.json({
      totalUsers,
      totalIssuers: issuers,
      totalStudents: students,
      totalCertificates,
      activeCertificates: totalCertificates,
      revokedCertificates,
      fraudAnalyses: 0,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return res.status(500).json({ error: "Unable to load admin statistics." });
  }
});

module.exports = router;
