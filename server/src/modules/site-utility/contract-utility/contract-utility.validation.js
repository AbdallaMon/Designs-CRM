import { z } from "zod";
import { CONTRACT_LEVELS, validationMessagesCodes as V } from "@dms/shared";

// Contract-utility Zod schemas. Framework-agnostic class of static schemas; the
// `validate` middleware returns 422 + field details on failure.
//
// The legacy endpoints persisted loosely-typed bodies straight to Prisma. We mirror
// the model columns exactly and use `.strict()` so unknown keys are rejected
// (mass-assignment hardening — `contractUtilityId`, ids, etc. are server-derived).

// ContractLevel enum values mirror the frozen Prisma enum through @dms/shared.
export const CONTRACT_LEVEL_VALUES = Object.values(CONTRACT_LEVELS);

const orderField = z.coerce.number().int().min(0).optional();

export class ContractUtilityValidation {
  static idParams = z.object({
    clauseId: z.coerce
      .number()
      .int()
      .positive(V.POSITIVE_INTEGER_REQUIRED),
  });

  // ── Obligations (ContractUtility singleton) ──────────────────────────────────
  // All four columns are required non-null Text in the schema; the legacy save sent
  // all four. They are upserted as a unit.
  static obligationsSchema = z
    .object({
      obligationsPartyOneAr: z.string(),
      obligationsPartyOneEn: z.string(),
      obligationsPartyTwoAr: z.string(),
      obligationsPartyTwoEn: z.string(),
    })
    .strict();

  // ── Stage clauses ────────────────────────────────────────────────────────────
  static createStageClauseSchema = z
    .object({
      headingAr: z.string(),
      headingEn: z.string(),
      titleAr: z.string(),
      titleEn: z.string(),
      descriptionAr: z.string(),
      descriptionEn: z.string(),
      order: orderField,
    })
    .strict();

  static updateStageClauseSchema = z
    .object({
      headingAr: z.string().optional(),
      headingEn: z.string().optional(),
      titleAr: z.string().optional(),
      titleEn: z.string().optional(),
      descriptionAr: z.string().optional(),
      descriptionEn: z.string().optional(),
      order: orderField,
    })
    .strict()
    .refine((o) => Object.keys(o).length > 0, {
      message: V.AT_LEAST_ONE_FIELD_REQUIRED,
    });

  // ── Special clauses ──────────────────────────────────────────────────────────
  // textEn is nullable in the schema.
  static createSpecialClauseSchema = z
    .object({
      textAr: z.string(),
      textEn: z.string().nullable().optional(),
      order: orderField,
      isActive: z.boolean().optional(),
    })
    .strict();

  static updateSpecialClauseSchema = z
    .object({
      textAr: z.string().optional(),
      textEn: z.string().nullable().optional(),
      order: orderField,
      isActive: z.boolean().optional(),
    })
    .strict()
    .refine((o) => Object.keys(o).length > 0, {
      message: V.AT_LEAST_ONE_FIELD_REQUIRED,
    });

  // ── Level clauses ────────────────────────────────────────────────────────────
  static createLevelClauseSchema = z
    .object({
      level: z.enum(CONTRACT_LEVEL_VALUES),
      textAr: z.string(),
      textEn: z.string().nullable().optional(),
      order: orderField,
      isActive: z.boolean().optional(),
    })
    .strict();

  static updateLevelClauseSchema = z
    .object({
      level: z.enum(CONTRACT_LEVEL_VALUES).optional(),
      textAr: z.string().optional(),
      textEn: z.string().nullable().optional(),
      order: orderField,
      isActive: z.boolean().optional(),
    })
    .strict()
    .refine((o) => Object.keys(o).length > 0, {
      message: V.AT_LEAST_ONE_FIELD_REQUIRED,
    });
}
