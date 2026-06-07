import { z } from "zod";

// admin-residual/staff validation. The latest-calls list accepts an optional `staffId`
// for backward compatibility with old clients, but the usecase IGNORES it and FORCES the
// scope to req.auth.id (FIX 2 — IDOR hardening; see staff.usecase.js). Anything else is
// stripped (`.strip()`).
export class StaffValidation {
  static latestCallsQuery = z
    .object({
      staffId: z.coerce.number().int().positive().optional(),
    })
    .strip();
}
