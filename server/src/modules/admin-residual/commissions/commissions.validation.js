import { z } from "zod";

// admin-residual/commissions validation. Money fields are coerced to finite positive
// numbers (the frozen service ALSO re-validates and throws on <= 0 / NaN, preserved).
// Mutating bodies are `.strict()` — only the consumed fields are accepted (mass-assignment
// hardening). Params/query ids are coerced.
export class CommissionsValidation {
  static listQuery = z
    .object({
      userId: z.coerce.number().int().positive(),
    })
    .strip();

  static createBody = z
    .object({
      userId: z.coerce.number().int().positive(),
      leadId: z.coerce.number().int().positive(),
      amount: z.coerce.number().finite().positive(),
      commissionReason: z.string().trim().min(1),
    })
    .strict();

  static idParam = z
    .object({
      id: z.coerce.number().int().positive(),
    })
    .strip();

  static updateBody = z
    .object({
      amount: z.coerce.number().finite().positive(),
    })
    .strict();
}
