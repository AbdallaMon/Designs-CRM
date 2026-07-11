// calendar/client Zod schemas — the PUBLIC booking surface. `validate(schema, where)`
// returns 422 + details on failure. The token (query param) is the client's credential; the
// reminderId/clientLeadId/adminId are taken from the VERIFIED token inside the usecase, never
// from the body — so the booking body only legitimately carries the chosen slot + timezone.
//
// The /book body validates the slot shape but STRIPS (does not reject) unknown keys — the FE
// posts its whole booking session object (selectedDate, dayId, token, echoed slot fields, ...),
// exactly as master did (master had no /book validation at all: `bookAMeeting({ ...req.body,
// ...tokenData })`). Using `.strict()` here 422'd the real client flow; the mass-assignment
// defense does NOT depend on it. reminderId/clientLeadId can never be set from the body: the
// usecase spreads `...tokenData` AFTER `...body`, so the verified-token ids always win, and
// the default strip drops those keys from req.body before they ever reach the usecase.
import { z } from "zod";

// The selected slot is an object the FE echoes back (it carries startTime + id + type). The
// service reads selectedSlot.startTime / .id / .type; validate the shape loosely but require
// the consumed fields. `type === "MOCK"` is a sentinel the service branches on.
const selectedSlotSchema = z
  .object({
    id: z.coerce.number().int().positive().optional(),
    startTime: z.union([z.string().min(1), z.date()]),
    type: z.string().optional(),
  })
  .passthrough(); // the FE may echo extra slot fields (endTime, userTimezone, ...) — harmless

export class ClientCalendarValidation {
  // POST /book — only the slot + timezone are consumed from the body; the rest come from the
  // token. Unknown keys are STRIPPED (default), not rejected, so the FE can post its whole
  // session object without a 422 (parity with master, which had no /book validation).
  static book = z.object({
    selectedSlot: selectedSlotSchema,
    selectedTimezone: z.string().min(1).optional(),
  });
}
