// command-center Zod schemas. `validate(schema, "query")` returns 422 + details on failure.
// The overview is a READ-only composite — the only input is an OPTIONAL date range
// (`from`/`to`); when omitted the usecase defaults to month-to-now. `.passthrough()`
// tolerates unknown query params (never consumed by the usecase).
import { z } from "zod";

export class CommandCenterValidation {
  // GET /v2/command-center/overview — optional { from, to } date range.
  static overviewQuery = z
    .object({
      from: z.coerce.date().optional(),
      to: z.coerce.date().optional(),
    })
    .passthrough();
}
