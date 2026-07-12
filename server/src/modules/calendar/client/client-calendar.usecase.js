// calendar/client usecase — the PUBLIC client booking surface (legacy
// routes/calendar/client-calendar.js, mounted at /client/calendar with NO auth gate). Every
// action authenticates the CLIENT via a per-meeting token (MeetingReminder.token) that the
// `verifyAndExtractCalendarToken` impl validates and (via calendar.dto) expands into the
// reminderId/userId/clientLeadId/adminId context — exactly as the booking funnel and
// /files/client/* are public. There is NO permission code and NO session here, by design.
//
// The booking logic (token verification, slot availability, booking + notification + email +
// Google sync) now lives HERE as the `*Impl` functions (formerly legacy/client-calendar-
// service.js); Prisma → clientCalendarRepository; token shaping → calendar.dto; the side
// effects call their infra homes (notifications, mail, google client). The slot/day reads
// reuse the same availability impls the staff surface uses.
//
// The `this.legacy` seam is retained so tests can inject stubs; production defaults to the
// relocated impls below.
import { newMeetingNotification } from "../../../infra/notifications/index.js";
import { sendReminderCreatedToClient } from "../../../infra/mail/email-templates.js";
import { createCalendarEvent } from "../../../infra/google/google-calendar.client.js";
import { clientCalendarRepository } from "./client-calendar.repo.js";
import { shapeCalendarTokenData } from "../calendar.dto.js";
import {
  getAvailableDaysImpl,
  getAvailableSlotsForDayImpl,
} from "../availability/availability.usecase.js";

const DEFAULT_TZ = "Asia/Dubai";

// ════════════════════════════════════════════════════════════════════════════
//  Relocated booking logic (formerly legacy/client-calendar-service.js). Prisma →
//  clientCalendarRepository; shaping → calendar.dto; side effects → infra. Verbatim.
// ════════════════════════════════════════════════════════════════════════════

export async function bookAMeeting({
  reminderId,
  clientLeadId,
  selectedSlot,
  selectedTimezone = "Asia/Dubai",
}) {
  const time = selectedSlot.startTime;
  const reminder = await clientCalendarRepository.updateMeetingReminderTime({
    reminderId,
    time,
    userTimezone: selectedTimezone,
  });
  if (selectedSlot.type !== "MOCK") {
    await assignSlotToMeeting({
      slotId: selectedSlot.id,
      meetingReminderId: reminderId,
      userTimezone: selectedTimezone,
    });
  }
  const reminderData = await clientCalendarRepository.findReminderForBooking(reminderId);
  await newMeetingNotification(Number(clientLeadId), reminder);
  await sendReminderCreatedToClient({
    clientEmail: reminderData.clientLead.client.email,
    clientName: reminderData.clientLead.client.name,
    reminderTime: reminderData.time,
    reminderTitle: "Booked succssfully",
    userTimezone: reminderData.userTimezone,
  });
  return true;
}

export async function verifySlotIsAvailableAndNotBooked({ slotId }) {
  const slotData = await clientCalendarRepository.findSlotById(slotId);
  if (!slotData) {
    throw new Error("Slot not found,please select another slot");
  }
  if (slotData.isBooked) {
    throw new Error("Slot is already booked, please select another slot");
  }
  return slotData;
}

export async function verifyAndExtractCalendarToken(token) {
  if (!token) throw new Error("No token provided");

  const tokenData = await clientCalendarRepository.findReminderByToken(token);
  return shapeCalendarTokenData(tokenData);
}

export async function assignSlotToMeeting({
  slotId,
  meetingReminderId,
  userTimezone,
}) {
  slotId = Number(slotId);
  meetingReminderId = Number(meetingReminderId);
  const slot = await clientCalendarRepository.findSlotForAssign(slotId);

  if (!slot || slot.isBooked)
    throw new Error("Time already booked book another");

  const reminder = await clientCalendarRepository.assignSlotToReminder({
    meetingReminderId,
    slotId,
  });

  const availableSlot = await clientCalendarRepository.markSlotBooked({
    slotId,
    meetingReminderId,
    userTimezone,
  });
  await createCalendarEvent(reminder);
  return availableSlot;
}

const legacyDefaults = {
  verifyAndExtractCalendarToken: (token) => verifyAndExtractCalendarToken(token),
  verifySlotIsAvailableAndNotBooked: (a) => verifySlotIsAvailableAndNotBooked(a),
  bookAMeeting: (a) => bookAMeeting(a),
  getAvailableDays: (a) => getAvailableDaysImpl(a),
  getAvailableSlotsForDay: (a) => getAvailableSlotsForDayImpl(a),
};

export class ClientCalendarUsecase {
  constructor(legacy = {}) {
    this.legacy = { ...legacyDefaults, ...legacy };
  }

  // GET /meeting-data — expand the token into the booking context (legacy returned the raw
  // tokenData). The frozen service selects only booking-relevant fields (no secrets).
  meetingData({ token }) {
    return this.legacy.verifyAndExtractCalendarToken(token);
  }

  // GET /available-days — month grid for the meeting's admin (type CLIENT filters to
  // future, unbooked slots). adminId/userId come from the token, not the client.
  async availableDays({ token, month, timezone }) {
    const tokenData = await this.legacy.verifyAndExtractCalendarToken(token);
    return this.legacy.getAvailableDays({
      month,
      ...tokenData,
      type: "CLIENT",
      timezone,
    });
  }

  // GET /slots — slots for a date for the meeting's admin (type CLIENT).
  async slots({ token, date, dayId, timezone }) {
    const tokenData = await this.legacy.verifyAndExtractCalendarToken(token);
    return this.legacy.getAvailableSlotsForDay({
      date,
      dayId,
      ...tokenData,
      timezone,
      type: "CLIENT",
    });
  }

  // GET /slots/details — confirm a slot is still available + not booked (legacy verified
  // the token first, then checked the slot by id). Returns the slot row.
  async slotDetails({ token, slotId, timezone }) {
    await this.legacy.verifyAndExtractCalendarToken(token);
    return this.legacy.verifySlotIsAvailableAndNotBooked({ slotId: Number(slotId), timezone });
  }

  // POST /book — book the meeting. Legacy merged the request body (selectedSlot,
  // selectedTimezone) with the token context (reminderId, clientLeadId, ...) and called
  // bookAMeeting. The reminderId/clientLeadId ALWAYS come from the verified token — never
  // from the client body — which is why the public surface is safe without a session.
  async book({ token, body }) {
    const tokenData = await this.legacy.verifyAndExtractCalendarToken(token);
    return this.legacy.bookAMeeting({ ...body, ...tokenData });
  }

  // GET /timezones — static grouped IANA timezone list (no token; pure data, as legacy).
  timezones() {
    return Intl.supportedValuesOf("timeZone")
      .map((tz) => {
        const [region = "Other"] = tz.split("/");
        const label = tz.replace("_", " ");
        const currentTime = new Date().toLocaleTimeString("en-US", {
          timeZone: tz,
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        return { group: region, label: `${label} (${currentTime})`, value: tz };
      })
      .sort(
        (a, b) => a.group.localeCompare(b.group) || a.label.localeCompare(b.label),
      );
  }
}

export { DEFAULT_TZ };
export const clientCalendarUsecase = new ClientCalendarUsecase();
