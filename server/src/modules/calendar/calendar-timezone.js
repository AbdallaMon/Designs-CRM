import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

import { calendarMessagesCodes } from "@dms/shared";
import { AppError } from "../../shared/errors/AppError.js";

dayjs.extend(utc);
dayjs.extend(timezone);

export const DEFAULT_CALENDAR_TIMEZONE = "Asia/Dubai";

export function normalizeCalendarTimezone(value) {
  const candidate =
    typeof value === "string" && value.trim()
      ? value.trim()
      : DEFAULT_CALENDAR_TIMEZONE;

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate }).format(
      new Date(0),
    );
  } catch {
    throw new AppError({
      code: calendarMessagesCodes.INVALID_TIMEZONE,
      statusCode: 400,
    });
  }

  return candidate;
}

function parseDateInTimezone(value, selectedTimezone) {
  if (value instanceof Date || typeof value === "number") {
    return dayjs(value).tz(selectedTimezone);
  }

  if (typeof value === "string") {
    const input = value.trim();
    const carriesOffset = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(input);
    return carriesOffset
      ? dayjs(input).tz(selectedTimezone)
      : dayjs.tz(input, selectedTimezone);
  }

  return dayjs(value).tz(selectedTimezone);
}

export function calendarDayUtcRange(value, timezoneValue) {
  const selectedTimezone = normalizeCalendarTimezone(timezoneValue);
  const selectedDate = parseDateInTimezone(value, selectedTimezone);
  if (!selectedDate.isValid()) {
    throw new AppError({
      code: calendarMessagesCodes.SLOT_NOT_FOUND,
      statusCode: 404,
    });
  }

  const dateKey = selectedDate.format("YYYY-MM-DD");
  const nextDateKey = dayjs(dateKey).add(1, "day").format("YYYY-MM-DD");
  const start = dayjs.tz(`${dateKey}T00:00:00`, selectedTimezone);
  const end = dayjs.tz(`${nextDateKey}T00:00:00`, selectedTimezone);

  return {
    selectedTimezone,
    startDate: start.utc().toDate(),
    endDate: end.utc().toDate(),
  };
}
