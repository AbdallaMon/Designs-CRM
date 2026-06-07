// calendar/client Zod schemas — the PUBLIC booking surface. `validate(schema, where)`
// returns 422 + details on failure. The token (query param) is the client's credential; the
// reminderId/clientLeadId/adminId are taken from the VERIFIED token inside the usecase, never
// from the body — so the booking body only legitimately carries the chosen slot + timezone.
//
// The /book body uses `.strict()` (mass-assignment defense): it accepts ONLY the fields the
// frozen bookAMeeting service consumes from the request body (`selectedSlot`,
// `selectedTimezone`). reminderId/clientLeadId are NOT accepted from the body (they come from
// the token), closing the door on a client overriding which reminder/lead is booked.
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
  // POST /book — only the slot + timezone come from the body; the rest from the token.
  static book = z
    .object({
      selectedSlot: selectedSlotSchema,
      selectedTimezone: z.string().min(1).optional(),
    })
    .strict();
}
