// calendar — pure DTO / shaping helpers (NO Prisma, NO side effects). These hold the
// time/ISO shaping and token→booking-context shaping that previously lived inline in the
// legacy calendar services. Logic is ported verbatim.
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(timezone);
dayjs.extend(utc);

// Month-grid activity shaping: given a meeting/call row and its already-computed dayjs time
// (in the view timezone), return the row with an ISO `time` + `HH:mm` `formattedTime`.
// (Ported from getCalendarDataForMonth's per-item mapping.)
export function shapeMonthActivity(item, activityTime) {
  return {
    ...item,
    time: activityTime.toISOString(), // Return in ISO format
    formattedTime: activityTime.format("HH:mm"), // Formatted time for display
  };
}

// Client booking token shaping: expand the token row into the reminder/lead booking context.
// (Ported verbatim from verifyAndExtractCalendarToken's returnData assembly.)
export function shapeCalendarTokenData(tokenData) {
  const returnData = {
    reminderId: tokenData.id,
    userId: tokenData.userId,
    clientLeadId: tokenData.clientLeadId,
    adminId: tokenData.adminId,
    ...tokenData,
  };
  if (tokenData.availableSlot) {
    returnData.selectedSlot = tokenData.availableSlot;
    if (tokenData.availableSlot.userTimezone) {
      returnData.selectedTimezone = tokenData.availableSlot.userTimezone;
    }
  }
  if (tokenData.time) {
    returnData.selectedDate = dayjs(tokenData.time).utc().toDate();
  }
  if (tokenData.userTimezone) {
    returnData.selectedTimezone = tokenData.userTimezone;
  }
  return returnData;
}
