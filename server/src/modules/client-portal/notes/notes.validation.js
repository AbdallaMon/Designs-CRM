// client-portal/notes validation — the PUBLIC client note surface.
//
// SECURITY: legacy `routes/client/notes.js` passed the RAW `req.query` to `getNotes` and the
// RAW `req.body` (spread) to `addNote`, where `idKey` is interpolated DIRECTLY into a Prisma
// `where`/`data` key. A client could therefore target ANY relation column of the Note model
// (paymentId, commissionId, contractId, userId, ...). For the public client surface a note
// only ever attaches to a lead-owned entity, so `idKey` is constrained to a small allow-list.
// This is mass-assignment / dynamic-key hardening that does NOT change behavior for legitimate
// client submissions. The image-session client flow legitimately attaches notes to the session
// (`imageSessionId`) and to a chosen design (`selectedImageId`) — both trace back to the
// owning lead — so they belong on the allow-list alongside the lead/update targets.
import { z } from "zod";

// The note targets a public client is allowed to address (all lead-owned).
export const CLIENT_NOTE_ID_KEYS = [
  "clientLeadId",
  "updateId",
  "imageSessionId",
  "selectedImageId",
];

const idKey = z.enum(CLIENT_NOTE_ID_KEYS);
const id = z.coerce.number().int().positive();
// The per-session image-session token. Optional at the schema layer (lead/update targets don't
// carry one); the usecase REQUIRES + object-scope-checks it for image-session targets.
const token = z.string().trim().min(1).optional();

const MAX_CONTENT_LENGTH = 360; // mirrors the legacy `addNote` client guard

export const NotesValidation = {
  // GET /notes?idKey=selectedImageId&id=123&token=...
  listQuery: z
    .object({
      idKey,
      id,
      token,
    })
    .strip(),

  // POST /notes — the acting user is forced to ADMIN inside the frozen service (client:true);
  // a client-supplied userId is NEVER honored. `idKey`/`id` are constrained above and the
  // `token` object-scope is enforced in the usecase.
  create: z
    .object({
      idKey,
      id,
      content: z.string().trim().min(1).max(MAX_CONTENT_LENGTH),
      attachment: z.string().trim().optional(),
      token,
    })
    .strict(),
};
