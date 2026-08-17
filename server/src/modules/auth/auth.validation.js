import { validationMessagesCodes as V } from "@dms/shared";
import { z } from "zod";

class AuthSchemas {
  // ─── Private field builders ─────────────────────────────────────────────────

  static #email = () =>
    z.email({ error: V.INVALID_EMAIL_ADDRESS }).trim().toLowerCase();

  static #password = () =>
    z
      .string({ error: V.FIELD_REQUIRED })
      .min(8, V.PASSWORD_TOO_SHORT)
      .max(100, V.PASSWORD_TOO_LONG)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]*$/,
        V.PASSWORD_COMPLEXITY_REQUIRED,
      );

  // ─── Schemas ────────────────────────────────────────────────────────────────

  // POST /login
  login = z.object({
    email: AuthSchemas.#email(),
    password: z
      .string({ error: V.FIELD_REQUIRED })
      .min(1, V.FIELD_REQUIRED),
  });

  // POST /reset  (request reset link)
  requestReset = z.object({
    email: AuthSchemas.#email(),
  });

  // POST /profile/switch  (self-service: set the active profile)
  switchProfile = z.object({
    profileId: z.coerce.number().int().positive(),
  });

  // POST /reset/:token  (perform reset)
  resetPassword = z
    .object({
      password: AuthSchemas.#password(),
      confirmPassword: z.string({ error: V.FIELD_REQUIRED }),
      token: z.string({ error: V.FIELD_REQUIRED }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: V.PASSWORDS_DO_NOT_MATCH,
      path: ["confirmPassword"],
    });
}

export const authSchemas = new AuthSchemas();
