// dashboard Zod schemas. `validate(schema, "query")` returns 422 + details on failure.
// These are all GET aggregations, so we coerce/validate QUERY params only (no bodies).
//
// CRITICAL (the IDOR-class fix): the schemas accept an OPTIONAL client `staffId`, but the
// usecase only HONORS it for the admin-tier union; for every other role the scope identity
// is forced to req.auth.id. A `?role=` query param is NOT modelled and is never consumed —
// the role used for branching always comes from req.auth (the token). `userId` is NOT
// accepted on recent-activities (legacy read it as a second cross-user selector — closed).
import { z } from "zod";

// Optional ISO-ish date strings (dayjs parses them downstream). Kept permissive (legacy
// accepted any parseable date) but typed as string so a non-string can't slip through.
const optionalDate = z.string().trim().min(1).optional();

// Optional positive-int staffId selector (admin-tier only honors it). Coerced from the
// query string; rejected if non-positive so a bogus value can't reach the aggregation.
const optionalStaffId = z.coerce.number().int().positive().optional();

export class DashboardValidation {
  // Most endpoints share the same query surface: optional date range + optional staffId
  // selector (+ a passthrough `profile` flag the FE sends, which the legacy service reads
  // harmlessly). `.passthrough()` keeps any extra FE query keys from 422-ing, but the
  // usecase only ever reads the fields it explicitly picks.
  static metricsQuery = z
    .object({
      startDate: optionalDate,
      endDate: optionalDate,
      staffId: optionalStaffId,
      profile: z.string().optional(),
    })
    .passthrough();

  // latest-leads takes NO args in legacy — accept (and ignore) anything.
  static emptyQuery = z.object({}).passthrough();
}
