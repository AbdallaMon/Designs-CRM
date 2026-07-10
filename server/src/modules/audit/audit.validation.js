// audit viewer Zod schemas. `validate(schema, "query")` returns 422 + details on
// failure. All filters are OPTIONAL and safe-parsed; pagination is coerced + clamped.
// This is a READ-only surface — there are no mutating bodies.
import { z } from "zod";

const pageNum = z.coerce.number().int().positive().default(1);
const pageSizeNum = z.coerce.number().int().positive().max(100).default(20);
const optionalId = z.coerce.number().int().positive().optional();
const optionalStr = z.string().trim().min(1).max(64).optional();

export class AuditValidation {
  // GET /v2/audit-logs — pagination + optional actor/module/action/entity/deal/date
  // filters. `.passthrough()` tolerates unknown query params (never consumed by the
  // usecase — only the known filters below build the Prisma where).
  static listQuery = z
    .object({
      page: pageNum,
      pageSize: pageSizeNum,
      actorUserId: optionalId,
      module: optionalStr,
      action: optionalStr,
      entityType: optionalStr,
      entityId: optionalId,
      clientLeadId: optionalId,
      from: z.coerce.date().optional(),
      to: z.coerce.date().optional(),
    })
    .passthrough();
}
