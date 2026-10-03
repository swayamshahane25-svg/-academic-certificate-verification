const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { getUserByEmail, getUserById } = require("./db");

const JWT_SECRET = process.env.JWT_SECRET || "certichain-dev-secret-change-me";

function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

function comparePassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      university: user.university,
      status: user.status,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function createAuthPayload(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    university: user.university,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function getTokenFromRequest(req) {
  const headerToken = req.headers.authorization || "";
  if (headerToken.startsWith("Bearer ")) {
    return headerToken.slice(7).trim();
  }

  if (req.headers.cookie) {
    const cookies = Object.fromEntries(
      req.headers.cookie.split(";").map((entry) => {
        const [key, ...rest] = entry.trim().split("=");
        if (!key) return [null, null];
        return [key, decodeURIComponent(rest.join("="))];
      }).filter(([key]) => key)
    );

    return cookies.token || cookies.session || null;
  }

  return null;
}

function authenticateUser(req, res, next) {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({ error: "Authentication required." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Session expired or invalid token." });
  }
}

function requireRole(...roles) {
  return async function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const role = String(req.user.role || "").toUpperCase();
    if (!roles.includes(role)) {
      return res.status(403).json({ error: "Access denied for your role." });
    }

    const user = await getUserById(req.user.sub);
    if (!user) {
      return res.status(401).json({ error: "User not found." });
    }

    const userStatus = String(user.status || "").toUpperCase();
    if (userStatus === "DISABLED") {
      return res.status(403).json({ error: "This account is disabled." });
    }

    if (user.role === "ISSUER" || userStatus === "PENDING") {
      if (String(user.role || "").toUpperCase() === "ISSUER" && userStatus === "PENDING") {
        return res.status(403).json({ error: "Issuer account is awaiting admin approval." });
      }
    }

    req.userProfile = user;
    next();
  };
}

function createResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashResetToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

module.exports = {
  hashPassword,
  comparePassword,
  signToken,
  createAuthPayload,
  authenticateUser,
  requireRole,
  createResetToken,
  hashResetToken,
  JWT_SECRET,
  getUserByEmail,
  getUserById,
};
