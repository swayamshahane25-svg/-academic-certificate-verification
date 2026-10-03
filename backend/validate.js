const { z } = require("zod");

const passwordSchema = z
  .string()
  .trim()
  .min(8, "Password must be at least 8 characters long.")
  .regex(/[A-Z]/, "Password must include at least one uppercase letter.")
  .regex(/[a-z]/, "Password must include at least one lowercase letter.")
  .regex(/[0-9]/, "Password must include at least one number.")
  .regex(/[^A-Za-z0-9]/, "Password must include at least one symbol.");

const baseRegistrationSchema = z.object({
  name: z.string().trim().min(2, "Name is required."),
  email: z.string().trim().email("Please enter a valid email."),
  password: passwordSchema,
  role: z.enum(["ADMIN", "ISSUER", "STUDENT"], {
    errorMap: () => ({ message: "Role must be ADMIN, ISSUER, or STUDENT." }),
  }),
  university: z
    .string()
    .trim()
    .min(2, "University is required.")
    .optional()
    .or(z.literal("")),
});

const userSchema = baseRegistrationSchema
  .extend({
    confirmPassword: z.string().trim().min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.role !== "ADMIN", {
    message: "Normal registration cannot create ADMIN accounts.",
    path: ["role"],
  });

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
  rememberMe: z.boolean().optional().default(false),
});

const registrationSchema = baseRegistrationSchema.refine(
  (data) => data.role !== "ADMIN",
  {
    message: "Normal registration cannot create ADMIN accounts.",
    path: ["role"],
  }
);

const passwordResetRequestSchema = z.object({
  email: z.string().trim().email("Please enter a valid email."),
});

const passwordResetConfirmSchema = z
  .object({
    token: z.string().trim().min(1, "Reset token is required."),
    password: passwordSchema,
    confirmPassword: z.string().trim().min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

module.exports = {
  userSchema,
  loginSchema,
  registrationSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
};
