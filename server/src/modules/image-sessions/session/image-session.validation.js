// image-sessions/session Zod schemas (the SHARED, lead-scoped surface). Path ids are
// authoritative over the body. Mutating bodies are `.strict()` — they whitelist ONLY the
// fields the legacy service consumes (mass-assignment hardening: the legacy routes spread
// `req.body` straight in). The acting userId is taken from req.auth, NEVER the body.
import { z } from "zod";

const idParam = z.coerce.number().int().positive();

export class ImageSessionValidation {
  // ── params ─────────────────────────────────────────────────────────────────────────
  static clientLeadIdParam = z.object({ clientLeadId: idParam });
  static sessionParams = z.object({ clientLeadId: idParam, sessionId: idParam });

  // ── bodies ─────────────────────────────────────────────────────────────────────────
  // POST /:clientLeadId/sessions — createClientImageSession reads ONLY `spaces` (the
  // selected space ids). userId comes from req.auth (not the body); clientLeadId from the
  // path. At least one space is required (the service throws otherwise — we reject earlier).
  static createSession = z
    .object({
      spaces: z.array(z.coerce.number().int().positive()).min(1),
    })
    .strict();

  // PUT /:clientLeadId/sessions/:sessionId — editSessionFileds writes arbitrary scalar
  // session fields (name, sessionStatus, …). Kept permissive but blocks injected relational
  // keys that could be mass-assigned; only known editable scalars are accepted.
  static editSession = z
    .object({
      name: z.string().nullish(),
      sessionStatus: z.string().nullish(),
      pdfUrl: z.string().nullish(),
      signatureUrl: z.string().nullish(),
      isArchived: z.boolean().optional(),
    })
    .strict();

  // ── query ────────────────────────────────────────────────────────────────────────────
  // GET /ids — model is required; the rest of the query is the (now allow-listed + parse-
  // guarded) legacy searchParams. Kept passthrough for the legit pick-list params.
  static modelIdsQuery = z.object({ model: z.string().min(1) }).passthrough();
}
