// accounting/note Zod schemas. The legacy note routes were intentionally generic — GET
// /notes read `{ idKey, id }` straight off the query, and POST /notes spread an arbitrary
// body ({ content, attachment, idKey, id }) into addNote. The mutating body is `.strict()`
// (unknown keys rejected) — the legacy service only consumed these four fields plus the
// server-set userId, so behavior is unchanged for valid input. `idKey` names the FK column the note attaches to (e.g.
// paymentId / rentId / baseEmployeeSalaryId) — kept as a free string to match legacy.
import { z } from "zod";

export class NoteValidation {
  static listQuery = z.object({}).passthrough();

  static create = z
    .object({
      content: z.string().nullish(),
      attachment: z.string().nullish(),
      idKey: z.string().optional(),
      id: z.union([z.string(), z.number()]).optional(),
    })
    .strict();
}
