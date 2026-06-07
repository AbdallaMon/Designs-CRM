import { z } from "zod";

// admin-residual/fixed-data validation. The frozen create/edit services read ONLY
// `title` + `description`; `.strict()` whitelists exactly those (mass-assignment
// hardening). Params coerced.
export class FixedDataValidation {
  static createBody = z
    .object({
      title: z.string().trim().min(1),
      description: z.string().nullish(),
    })
    .strict();

  // edit is a partial — the frozen service applies title only if present and description
  // only if explicitly provided; require at least one field.
  static updateBody = z
    .object({
      title: z.string().trim().min(1).optional(),
      description: z.string().nullish(),
    })
    .strict()
    .refine((b) => b.title !== undefined || b.description !== undefined, {
      message: "At least one field is required",
    });

  static idParam = z
    .object({
      id: z.coerce.number().int().positive(),
    })
    .strip();
}
