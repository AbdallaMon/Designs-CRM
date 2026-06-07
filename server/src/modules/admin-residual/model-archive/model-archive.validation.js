import { z } from "zod";
import { ADMIN_ARCHIVE_MODEL_ALLOWLIST } from "@dms/shared";

// admin-residual/model-archive validation. The `model` query is constrained to the
// case-insensitive allow-list (the projects broad-delete lesson) — anything else is
// rejected at the validation layer (422). `isArchived` is a strict boolean; `id` coerced.
// The usecase re-checks the allow-list (defence in depth) before touching Prisma.
const allowedKeys = Object.keys(ADMIN_ARCHIVE_MODEL_ALLOWLIST);

export class ModelArchiveValidation {
  static query = z
    .object({
      model: z
        .string()
        .trim()
        .min(1)
        .refine((v) => allowedKeys.includes(v.toLowerCase()), {
          message: "Unsupported model",
        }),
    })
    .strip();

  static body = z
    .object({
      isArchived: z.boolean(),
    })
    .strict();

  static idParam = z
    .object({
      id: z.coerce.number().int().positive(),
    })
    .strip();
}
