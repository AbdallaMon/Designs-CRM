import { z } from "zod";

class AuthSchemas {
  // ─── Private field builders ─────────────────────────────────────────────────

  static #email = () =>
    z.email({ error: "Invalid email address" }).trim().toLowerCase();

  static #password = () =>
    z
      .string({ error: "Password is required" })
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password must be at most 100 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]*$/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      );

  // ─── Schemas ────────────────────────────────────────────────────────────────

  // POST /login
  login = z.object({
    email: AuthSchemas.#email(),
    password: z
      .string({ error: "Password is required" })
      .min(1, "Password is required"),
  });

  // POST /reset  (request reset link)
  requestReset = z.object({
    email: AuthSchemas.#email(),
  });

  // POST /reset/:token  (perform reset)
  resetPassword = z
    .object({
      password: AuthSchemas.#password(),
      confirmPassword: z.string({ error: "Please confirm your password" }),
      token: z.string({ error: "Reset token is required" }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });
}

export const authSchemas = new AuthSchemas();
