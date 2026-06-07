// calendar/availability Zod schemas. `validate(schema, where)` returns 422 + details on
// failure. Mutating bodies use `.strict()` (mass-assignment defense) — every field below
// is consumed by the legacy availability service (new-calendar.js
// createOrUpdateAvailableDay / createOrUpdateMultipleDays); no consumed field is omitted.
//
// READ query schemas are intentionally permissive (legacy read arbitrary query params,
// defaulting type/timezone/adminId in the handler) so observable behavior is unchanged.
import { z } from "zod";

const idParam = z.coerce.number().int().positive();

// Slot generation knobs. duration/breakMinutes drive the slot loop (minutes); coerce +
// finite + non-negative (duration must be > 0 to make progress; legacy would loop-stall
// on <= 0, so we reject it at the edge without changing valid-input behavior).
const positiveMinutes = z.coerce
  .number()
  .refine((n) => Number.isFinite(n) && n > 0, { message: "must be a positive number" });
const nonNegativeMinutes = z.coerce
  .number()
  .refine((n) => Number.isFinite(n) && n >= 0, { message: "must be a non-negative number" });

// "HH:mm" (optionally with AM/PM, matching the legacy buildUtcDateTime parser which dayjs
// accepts). Keep it a non-empty string; the service does the precise tz parsing.
const timeStr = z.string().min(1);

export class AvailabilityValidation {
  // ── params ───────────────────────────────────────────────────────────────────────
  static idParams = z.object({ id: idParam });

  // ── bodies ─────────────────────────────────────────────────────────────────────────
  // POST available-days (single day)
  static createDay = z
    .object({
      date: z.string().min(1),
      fromHour: timeStr,
      toHour: timeStr,
      duration: positiveMinutes,
      breakMinutes: nonNegativeMinutes,
    })
    .strict();

  // POST available-days/multiple
  static createMultipleDays = z
    .object({
      days: z.array(z.string().min(1)).min(1),
      fromHour: timeStr,
      toHour: timeStr,
      duration: positiveMinutes,
      breakMinutes: nonNegativeMinutes,
    })
    .strict();
}
