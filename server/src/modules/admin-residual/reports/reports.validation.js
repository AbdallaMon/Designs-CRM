import { z } from "zod";

// admin-residual/reports validation. 🔒 The report generators are LOGIC-FROZEN and read
// a RICH, nested payload straight from `req.body`:
//   - the *data* generators read filter keys (startDate/endDate/emirates/statuses/
//     userIds/clientIds/reportType) and query Prisma themselves;
//   - the *excel*/*pdf* generators read a prepared `data` OBJECT (e.g. `data.leads`,
//     `data.summary`, `data.staffStats`, `data.dateRange`) and write it to the file.
//
// These are READ-ONLY generation endpoints (POST only because the filter/data payload is
// large), NOT state mutations — so the `.strict()` mass-assignment rule does not apply.
// Stripping or rejecting unknown keys would DROP fields the frozen generators read and
// change their output (a frozen-behavior violation). We therefore validate only that the
// body is an OBJECT and type the known top-level filter keys, while `.passthrough()`
// preserves the full nested payload verbatim for the frozen generator.
// NOTE: fields are `.nullish()` (optional AND nullable), not `.optional()`. The frontend
// report forms initialise every unset filter to `null` (unpicked dates → `null`, cleared
// selects → `null`), and legacy master had NO validation so those nulls passed straight to
// the frozen generators, which treat them as falsy (`filters.startDate && filters.endDate`,
// `filters.emirates?.length`). Using `.optional()` here would REJECT those nulls with a 422
// and break parity — the forms could never generate a report without every filter set.
const reportBody = z
  .object({
    startDate: z.string().nullish(),
    endDate: z.string().nullish(),
    emirates: z.array(z.string()).nullish(),
    statuses: z.array(z.string()).nullish(),
    userIds: z.array(z.union([z.coerce.number().int(), z.string()])).nullish(),
    clientIds: z.array(z.union([z.coerce.number().int(), z.string()])).nullish(),
    reportType: z.string().nullish(),
    // prepared payload the excel/pdf generators write verbatim (object, not array)
    data: z.any().optional(),
  })
  .passthrough();

export class ReportsValidation {
  static leadReportBody = reportBody;
  static staffReportBody = reportBody;
}
