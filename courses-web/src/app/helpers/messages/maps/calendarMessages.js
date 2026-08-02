// Single-language (Arabic) resolution for backend message CODES emitted by the calendar
// domain API ({ success, message: CODE, translationKey: "calendarMessages" }). The backend
// stays language-neutral (packages/shared/messages-codes/calendar/calendar.js); this is the
// FE lookup. Every code the calendar surface can emit has an entry here; unknown codes fall
// back to a generic string. Mirrors features/accounting/config/accountingMessages.js.

export const calendarMessages = {
  // ── reads ──────────────────────────────────────────────────────────────────────
  AVAILABLE_DAYS_FETCHED: "Available days fetched",
  SLOTS_FETCHED: "Slots fetched",
  SLOT_DETAILS_FETCHED: "Slot details fetched",
  CALENDAR_MONTH_FETCHED: "Calendar fetched",
  REMINDERS_FETCHED: "Appointments and calls fetched",
  MEETING_DATA_FETCHED: "Booking data fetched",
  TIMEZONES_FETCHED: "Timezones fetched",

  // ── availability mutations ───────────────────────────────────────────────────────
  AVAILABLE_DAY_SAVED: "Available day saved",
  AVAILABLE_DAYS_SAVED: "Available days saved",
  AVAILABLE_DAY_DELETED: "Day deleted",
  SLOT_DELETED: "Slot deleted",
  CUSTOM_SLOT_ADDED: "Custom slot added",

  // ── client booking ───────────────────────────────────────────────────────────────
  MEETING_BOOKED: "Booking confirmed successfully",

  // ── google integration ───────────────────────────────────────────────────────────
  GOOGLE_AUTH_URL_GENERATED: "Connection link created",
  GOOGLE_STATUS_FETCHED: "Connection status fetched",
  GOOGLE_DISCONNECTED: "Google account disconnected",

  // ── errors / domain rules ─────────────────────────────────────────────────────────
  GOOGLE_ALREADY_CONNECTED: "Google account is already connected",
  GOOGLE_CALLBACK_INVALID: "Invalid connection link",
  CALENDAR_ACCESS_DENIED: "You do not have access to the calendar",
  ADMIN_ID_REQUIRED: "An administrator is required",
  AVAILABLE_DAY_HAS_BOOKINGS: "This day contains booked slots and cannot be deleted",
  RELATED_MEETINGS_EXIST: "This date has related meetings and cannot be changed",
  SLOT_NOT_FOUND: "The selected slot was not found",
  SLOT_ALREADY_BOOKED: "The selected slot is already booked",
  AVAILABLE_DAY_NOT_FOUND: "The available day was not found",
  SLOT_FIELDS_REQUIRED: "Start time, end time, and day are required",
  SLOT_CONFLICT: "This time conflicts with an existing slot",
  BOOKING_TOKEN_REQUIRED: "A valid booking token is required",
  CALENDAR_FETCH_FAILED: "Calendar data could not be loaded",

  // ── generic envelope codes (shared) ──────────────────────────────────────────────
  OK: "Operation completed successfully",
  CREATED: "Created successfully",
  UPDATED: "Updated successfully",
  DELETED: "Deleted successfully",
  FORBIDDEN: "You do not have permission to perform this action",
  ACCESS_DENIED: "You do not have access",
  VALIDATION_ERROR: "Invalid data",
};

/**
 * Resolve a backend message CODE to an Arabic display string.
 * @param {string} code
 * @param {{ fallback?: string }} [opts]
 */
export function resolveCalendarMessage(code, { fallback } = {}) {
  if (code && calendarMessages[code]) return calendarMessages[code];
  return fallback ?? "Operation completed";
}
