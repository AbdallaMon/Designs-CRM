import { z } from "zod";

// Site-utility Zod schemas. Framework-agnostic class of static schemas; the
// `validate` middleware returns 422 + field details on failure.
//
// The legacy endpoints accepted loosely-typed bodies and persisted whatever was
// sent. We mirror the SiteUtility / ContractPaymentCondition columns so the
// observable inputs are preserved while stripping unknown keys.
export class SiteUtilityValidation {
  // ── PDF config (SiteUtility singleton, id = 1) ─────────────────────────────
  // All columns are nullable Strings in the schema; the legacy POST upserted a
  // partial body. Every field is optional; `.passthrough()` is intentionally NOT
  // used so unknown keys are stripped (Prisma would reject them anyway).
  static updatePdfConfigSchema = z
    .object({
      pdfFrame: z.string().nullable().optional(),
      pdfHeader: z.string().nullable().optional(),
      introPage: z.string().nullable().optional(),
      pageTitle: z.string().nullable().optional(),
      pdfSignaturePart: z.string().nullable().optional(),
    })
    .strict();

  // ── Contract payment conditions ────────────────────────────────────────────
  // Columns conditionType/condition/labelAr/labelEn are all required (non-null)
  // in the schema; the legacy create persisted req.body directly.
  static createPaymentConditionSchema = z.object({
    conditionType: z.string().min(1),
    condition: z.string().min(1),
    labelAr: z.string().min(1),
    labelEn: z.string().min(1),
  });

  // Update is a partial of the create shape (legacy passed req.body straight to
  // prisma.update, which only touches provided columns).
  static updatePaymentConditionSchema = z
    .object({
      conditionType: z.string().min(1).optional(),
      condition: z.string().min(1).optional(),
      labelAr: z.string().min(1).optional(),
      labelEn: z.string().min(1).optional(),
    })
    .refine((obj) => Object.keys(obj).length > 0, {
      message: "At least one field must be provided",
    });

  static idParams = z.object({
    id: z.coerce.number().int().positive("id must be a positive integer"),
  });
}
