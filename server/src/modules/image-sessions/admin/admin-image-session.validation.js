// image-sessions/admin Zod schemas. The ADMIN reference-data CRUD payloads are COMPLEX,
// nested, language-keyed text-create structures (e.g. `{ title: {creates, edits}, ... }`)
// that the FROZEN-ish legacy service consumes by shape; the legacy routes spread `req.body`
// straight in. We therefore keep the bodies permissive (`.passthrough()`) to preserve
// observable behavior 1:1 — the hardening we CAN apply without risking behavior change is:
//   - PARAMS are strictly coerced to positive ints (`:spaceId`, `:materialId`, … `:id`).
//   - QUERY flags (`notArchived`, `type`, pagination) are coerced/whitelisted.
//   - The pros-and-cons bodies whitelist the known top-level fields the service reads
//     (`type`, `id`, `item`, `itemType`) while leaving the nested `item` free-form.
// This mirrors the way the already-migrated modules treated their frozen-service payloads.
import { z } from "zod";

const idParam = z.coerce.number().int().positive();

// notArchived is read as the string "true" by legacy (`req.query.notArchived === "true"`);
// we accept the boolean-ish string and pass a real boolean down.
const notArchivedQuery = z
  .object({
    notArchived: z
      .union([z.literal("true"), z.literal("false"), z.boolean()])
      .optional()
      .transform((v) => v === true || v === "true"),
  })
  .passthrough();

export class AdminImageSessionValidation {
  // ── params ─────────────────────────────────────────────────────────────────────────
  static spaceIdParam = z.object({ spaceId: idParam });
  static templateIdParam = z.object({ templateId: idParam });
  static materialIdParam = z.object({ materialId: idParam });
  static styleIdParam = z.object({ styleId: idParam });
  static colorIdParam = z.object({ colorId: idParam });
  static imageIdParam = z.object({ imageId: idParam });
  static pageInfoIdParam = z.object({ pageInfoId: idParam });
  static proConIdParam = z.object({ id: idParam });

  // ── query ────────────────────────────────────────────────────────────────────────────
  static notArchivedQuery = notArchivedQuery;
  static typeQuery = z.object({ type: z.string().optional() }).passthrough();
  static imagesQuery = z
    .object({
      notArchived: z
        .union([z.literal("true"), z.literal("false"), z.boolean()])
        .optional()
        .transform((v) => v === true || v === "true"),
      limit: z.coerce.number().int().positive().optional(),
      skip: z.coerce.number().int().nonnegative().optional(),
      page: z.coerce.number().int().positive().optional(),
    })
    .passthrough();

  // ── bodies (complex nested service payloads — kept permissive) ─────────────────────────
  static referenceBody = z.object({}).passthrough();

  // pros-and-cons: whitelist the known top-level fields the service reads; the `item`
  // payload (descriptions / edits / creates) stays free-form.
  static createProCon = z
    .object({
      type: z.string().optional(),
      id: z.union([z.coerce.number().int(), z.string()]).optional(),
      itemType: z.string().optional(),
      item: z.any().optional(),
    })
    .passthrough();
  static reorderProsCons = z
    .object({
      itemType: z.string().min(1),
      data: z.array(z.object({}).passthrough()),
    })
    .passthrough();
  static updateProCon = z
    .object({
      itemType: z.string().min(1),
      item: z.any().optional(),
    })
    .passthrough();
  static deleteProCon = z.object({ itemType: z.string().min(1) }).passthrough();
}
