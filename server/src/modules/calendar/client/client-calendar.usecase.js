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
// The usecase methods call the relocated impls below (and the reused availability impls)
// directly — no constructor injection.
import { newMeetingNotification } from "../../../infra/notifications/index.js";
import { sendReminderCreatedToClient } from "../../../infra/mail/email-templates.js";
import { createCalendarEvent } from "../../../infra/google/google-calendar.client.js";
import { clientCalendarRepository } from "./client-calendar.repo.js";
import { shapeCalendarTokenData } from "../calendar.dto.js";
import { AppError } from "../../../shared/errors/AppError.js";
import {
  CALENDAR_SLOT_TYPES,
  CALENDAR_VIEW_TYPES,
  calendarMessagesCodes,
  leadsMessagesCodes,
} from "@dms/shared";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import {
  getAvailableDaysImpl,
  getAvailableSlotsForDayImpl,
} from "../availability/availability.usecase.js";

const DEFAULT_TZ = "Asia/Dubai";
dayjs.extend(utc);
dayjs.extend(timezone);

function bookingDateRange(selectedDate, selectedTimezone) {
  const requestedDate = dayjs(selectedDate).tz(selectedTimezone || DEFAULT_TZ);
  if (!requestedDate.isValid()) {
    throw new AppError({ code: calendarMessagesCodes.SLOT_NOT_FOUND, statusCode: 404 });
  }
  return {
    requestedDateStart: requestedDate.startOf("day").utc().toDate(),
    requestedDateEnd: requestedDate.add(1, "day").startOf("day").utc().toDate(),
  };
}

async function runBookingSideEffects({ clientLeadId, reminder }) {
  const client = reminder?.clientLead?.client;
  const sideEffects = [
    ["notification", () => newMeetingNotification(Number(clientLeadId), reminder)],
    [
      "email",
      () =>
        sendReminderCreatedToClient({
          clientEmail: client?.email,
          clientName: client?.name,
          reminderTime: reminder?.time,
          reminderTitle: "Booked succssfully",
          userTimezone: reminder?.userTimezone,
        }),
    ],
    ["google-calendar", () => createCalendarEvent(reminder)],
  ];

  const results = await Promise.allSettled(
    sideEffects.map(([, effect]) => Promise.resolve().then(effect)),
  );
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(`Calendar booking ${sideEffects[index][0]} side effect failed`, result.reason);
    }
  });
}

// ════════════════════════════════════════════════════════════════════════════
//  Relocated booking logic (formerly legacy/client-calendar-service.js). Prisma →
//  clientCalendarRepository; shaping → calendar.dto; side effects → infra. Verbatim.
// ════════════════════════════════════════════════════════════════════════════

export async function bookAMeeting({
  reminderId,
  clientLeadId,
  selectedSlot,
  selectedDate,
  adminId,
  userId,
  selectedTimezone = "Asia/Dubai",
}) {
  if (!selectedSlot?.id || selectedSlot.type === CALENDAR_SLOT_TYPES.MOCK) {
    throw new AppError({ code: calendarMessagesCodes.SLOT_NOT_FOUND, statusCode: 404 });
  }

  const ownerId = adminId || userId;
  const dateRange = bookingDateRange(selectedDate, selectedTimezone);
  const reservation = await clientCalendarRepository.reserveSlotAndUpdateReminder({
    slotId: selectedSlot.id,
    meetingReminderId: reminderId,
    expectedOwnerId: ownerId,
    ...dateRange,
    userTimezone: selectedTimezone,
  });

  if (reservation.outcome === "not-found") {
    throw new AppError({ code: calendarMessagesCodes.SLOT_NOT_FOUND, statusCode: 404 });
  }
  if (reservation.outcome !== "booked") {
    throw new AppError({ code: calendarMessagesCodes.SLOT_ALREADY_BOOKED, statusCode: 409 });
  }

  await runBookingSideEffects({ clientLeadId, reminder: reservation.reminder });
  return true;
}

export async function verifySlotIsAvailableAndNotBooked({ slotId }) {
  const slotData = await clientCalendarRepository.findSlotById(slotId);
  if (!slotData) {
    throw new AppError({ code: calendarMessagesCodes.SLOT_NOT_FOUND, statusCode: 404 });
  }
  if (slotData.isBooked) {
    throw new AppError({ code: calendarMessagesCodes.SLOT_ALREADY_BOOKED, statusCode: 409 });
  }
  return slotData;
}

export async function verifyAndExtractCalendarToken(token) {
  if (!token) throw new AppError({ code: calendarMessagesCodes.BOOKING_TOKEN_REQUIRED, statusCode: 401 });

  const tokenData = await clientCalendarRepository.findReminderByToken(token);
  if (!tokenData) {
    throw new AppError({ code: leadsMessagesCodes.MEETING_REMINDER_NOT_FOUND, statusCode: 404 });
  }
  return shapeCalendarTokenData(tokenData);
}

class ClientCalendarUsecase {
  // GET /meeting-data — expand the token into the booking context (legacy returned the raw
  // tokenData). The frozen service selects only booking-relevant fields (no secrets).
  getMeetingData({ token }) {
    return verifyAndExtractCalendarToken(token);
  }

  // GET /available-days — month grid for the meeting's admin (type CLIENT filters to
  // future, unbooked slots). adminId/userId come from the token, not the client.
  async getAvailableDays({ token, month, timezone }) {
    const tokenData = await verifyAndExtractCalendarToken(token);
    return getAvailableDaysImpl({
      month,
      ...tokenData,
      type: CALENDAR_VIEW_TYPES.CLIENT,
      timezone,
    });
  }

  // GET /slots — slots for a date for the meeting's admin (type CLIENT).
  async getSlots({ token, date, dayId, timezone }) {
    const tokenData = await verifyAndExtractCalendarToken(token);
    return getAvailableSlotsForDayImpl({
      date,
      dayId,
      ...tokenData,
      timezone,
      type: CALENDAR_VIEW_TYPES.CLIENT,
    });
  }

  // GET /slots/details — confirm a slot is still available + not booked (legacy verified
  // the token first, then checked the slot by id). Returns the slot row.
  async getSlotDetails({ token, slotId, timezone }) {
    const tokenData = await verifyAndExtractCalendarToken(token);
    const slot = await verifySlotIsAvailableAndNotBooked({ slotId: Number(slotId), timezone });
    if (Number(slot.availableDay?.userId) !== Number(tokenData.adminId || tokenData.userId)) {
      throw new AppError({ code: calendarMessagesCodes.SLOT_NOT_FOUND, statusCode: 404 });
    }
    return slot;
  }

  // POST /book — book the meeting. Legacy merged the request body (selectedSlot,
  // selectedTimezone) with the token context (reminderId, clientLeadId, ...) and called
  // bookAMeeting. The reminderId/clientLeadId ALWAYS come from the verified token — never
  // from the client body — which is why the public surface is safe without a session.
  async bookMeeting({ token, body }) {
    const tokenData = await verifyAndExtractCalendarToken(token);
    return bookAMeeting({ ...body, ...tokenData });
  }

  // GET /timezones — static grouped IANA timezone list (no token; pure data, as legacy).
  getTimezones() {
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
export { ClientCalendarUsecase };
