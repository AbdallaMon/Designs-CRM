import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import weekday from "dayjs/plugin/weekday";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(weekday);
dayjs.extend(customParseFormat);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.locale("en");

/**
 * Build the month-grid the calendar renders from the backend's FLAT list of
 * available days (`[{ id, date, slots:[{startTime,...}], fullyBooked, ... }]`).
 *
 * Historically the backend service returned this flat array and the (old) client
 * built the grid; the migrated availability endpoint still returns the flat array,
 * so we rebuild the `{ month, weeks: [[cell,...7], ...] }` shape here. Logic is
 * ported 1:1 from the previous client implementation (Old-cal.jsx) so behaviour
 * (Sunday week start, tz-correct matching, isPast/isCurrentMonth) is unchanged.
 *
 * Resilient: if the backend ever returns a pre-built grid, pass it straight through.
 */
export function buildMonthGrid(payload, displayMonth, userTimezone) {
  // Already a grid? use it as-is.
  if (payload && !Array.isArray(payload) && Array.isArray(payload.weeks)) {
    return payload;
  }
  const availableDays = Array.isArray(payload) ? payload : [];

  const startOfMonth = displayMonth.tz(userTimezone).locale("en").startOf("month");
  const endOfMonth = displayMonth.tz(userTimezone).locale("en").endOf("month");
  const startDate = startOfMonth.startOf("week");
  const endDate = endOfMonth.endOf("week");

  const todayInTz = dayjs().tz(userTimezone).startOf("day");

  const cells = [];
  let current = startDate.clone().locale("en").tz(userTimezone);
  while (current.isBefore(endDate) || current.isSame(endDate, "day")) {
    const dayStr = current.format("YYYY-MM-DD");

    // Match the stored (GMT) day to this calendar cell by its slots, in the user's tz.
    const availableDay = availableDays.find((d) =>
      (d.slots || []).some(
        (slot) =>
          dayjs.utc(slot.startTime).tz(userTimezone).format("YYYY-MM-DD") ===
          dayStr
      )
    );

    cells.push({
      isoDate: dayStr,
      label: current.date(),
      isCurrentMonth: current.month() === displayMonth.tz(userTimezone).month(),
      isPast: current.tz(userTimezone).startOf("day").isBefore(todayInTz),
      hasAvailableSlots: !!availableDay,
      fullyBooked: !!availableDay && !!availableDay.fullyBooked,
      availableDay: availableDay || null,
    });

    current = current.add(1, "day").locale("en");
  }

  // Chunk into weeks of 7.
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return { month: startOfMonth.format("YYYY-MM"), weeks };
}
