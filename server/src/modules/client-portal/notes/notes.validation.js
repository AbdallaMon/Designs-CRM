// client-portal/notes validation — the PUBLIC client note surface.
//
// SECURITY: legacy `routes/client/notes.js` passed the RAW `req.query` to `getNotes` and the
// RAW `req.body` (spread) to `addNote`, where `idKey` is interpolated DIRECTLY into a Prisma
// `where`/`data` key. A client could therefore target ANY relation column of the Note model
// (paymentId, commissionId, contractId, userId, ...). For the public client surface a note
// only ever attaches to a lead-owned entity, so `idKey` is constrained to a small allow-list
// (`clientLeadId` / `updateId`). This is mass-assignment / dynamic-key hardening that does
// NOT change behavior for legitimate client submissions (which always send `clientLeadId`).
import { z } from "zod";

// The only note targets a public client is allowed to address.
export const CLIENT_NOTE_ID_KEYS = ["clientLeadId", "updateId"];

const idKey = z.enum(CLIENT_NOTE_ID_KEYS);
const id = z.coerce.number().int().positive();

const MAX_CONTENT_LENGTH = 360; // mirrors the legacy `addNote` client guard

export const NotesValidation = {
  // GET /notes?idKey=clientLeadId&id=123
  listQuery: z
    .object({
      idKey,
      id,
    })
    .strip(),

  // POST /notes — the acting user is forced to ADMIN inside the frozen service (client:true);
  // a client-supplied userId is NEVER honored. `idKey`/`id` are constrained above.
  create: z
    .object({
      idKey,
      id,
      content: z.string().trim().min(1).max(MAX_CONTENT_LENGTH),
      attachment: z.string().trim().optional(),
    })
    .strict(),
};
