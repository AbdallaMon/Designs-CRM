// notifications Zod schemas. `validate(schema, source)` returns 422 + details on failure.
//
// CRITICAL (the IDOR fix): NONE of these schemas accept a `userId` / `staffId` target —
// the authenticated user is the ONLY subject, derived in the usecase from req.auth.id.
// The legacy `userId`/`staffId`/`filters.staffId` query inputs that selected WHOSE
// notifications to read are intentionally NOT modelled here; any such field is simply
// ignored (query schema is permissive but the usecase never reads a target user from it).
import { z } from "zod";

const pageNum = z.coerce.number().int().positive().default(1);
const limitNum = z.coerce.number().int().positive().max(100).default(9);

export class NotificationValidation {
  // GET list (all + unread) — pagination + an optional `filters` JSON string (legacy
  // shape) carrying an optional date range. `userId`/`staffId` are NOT consumed.
  static listQuery = z
    .object({
      page: pageNum,
      limit: limitNum,
      filters: z.string().optional(),
    })
    .passthrough();

  // POST mark-read — no body needed; the subject is the authenticated user. `.strict()`
  // rejects any attempt to smuggle a target userId in the body (mass-assignment defense).
  static markRead = z.object({}).strict();
}
