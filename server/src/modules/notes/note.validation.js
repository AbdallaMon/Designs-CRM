// notes validation — the AUTHENTICATED generic note surface (legacy `shared/notes`).
//
// SECURITY: master's `shared/index.js` `GET/POST /notes` passed the RAW `req.query` / `req.body`
// straight into `getNotes` / `addNote`, where `idKey` is interpolated DIRECTLY into a Prisma
// `where` / `data` key. Any string was accepted; an unknown column threw a Prisma 500. We keep
// the exact same behavior for every legitimate key but constrain `idKey` to the actual `Note`
// owner-relation columns (schema.prisma `model Note`), turning garbage keys into a clean 422
// instead of a 500. This does NOT narrow behavior for any real caller. Access itself stays
// auth-only, matching master (this endpoint served every owner off one gate).
import { z } from "zod";

// Every relation-owner column on the Note model (schema.prisma). `userId` is the AUTHOR, not a
// note target, so it is intentionally excluded; `notedUserId` (UserSubjectNotes) IS a target.
export const NOTE_ID_KEYS = [
  "clientLeadId",
  "baseEmployeeSalaryId",
  "rentId",
  "rentPeriodId",
  "operationalExpensesId",
  "paymentId",
  "invoiceId",
  "taskId",
  "commissionId",
  "updateId",
  "sharedUpdateId",
  "imageSessionId",
  "selectedImageId",
  "contractId",
  "salesStageId",
  "deliveryScheduleId",
  "notedUserId",
];

const idKey = z.enum(NOTE_ID_KEYS);
const id = z.coerce.number().int().positive();

export const NoteValidation = {
  deleteParams: z.object({ id }),
  // GET /notes?idKey=taskId&id=2
  listQuery: z
    .object({
      idKey,
      id,
    })
    .strip(),

  // POST /notes — the author is forced to the acting user in the usecase; a client-supplied
  // userId is NEVER honored. `content`/`attachment` stay loose to match master (which accepted
  // either an empty note or an attachment-only note).
  addNote: z
    .object({
      idKey,
      id,
      content: z.string().optional(),
      attachment: z.string().nullish(),
    })
    .strict(),
};
