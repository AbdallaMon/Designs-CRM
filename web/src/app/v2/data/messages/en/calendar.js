// English mirror of the CALENDAR message CODES (namespace "calendarMessages").
// CODE → English. Mirrors keys 1:1 with ../calendar.js (the Arabic map). Bilingual Phase 1.

export const calendarMessagesEn = {
  // ── reads ──────────────────────────────────────────────────────────────────────
  AVAILABLE_DAYS_FETCHED: "Available days retrieved",
  SLOTS_FETCHED: "Slots retrieved",
  SLOT_DETAILS_FETCHED: "Slot details retrieved",
  CALENDAR_MONTH_FETCHED: "Calendar retrieved",
  REMINDERS_FETCHED: "Meetings and calls retrieved",
  MEETING_DATA_FETCHED: "Booking data retrieved",
  TIMEZONES_FETCHED: "Time zones retrieved",

  // ── availability mutations ───────────────────────────────────────────────────────
  AVAILABLE_DAY_SAVED: "Available day saved",
  AVAILABLE_DAYS_SAVED: "Available days saved",
  AVAILABLE_DAY_DELETED: "Day deleted",
  SLOT_DELETED: "Slot deleted",

  // ── client booking ───────────────────────────────────────────────────────────────
  MEETING_BOOKED: "Booking confirmed successfully",

  // ── google integration ───────────────────────────────────────────────────────────
  GOOGLE_AUTH_URL_GENERATED: "Connection link generated",
  GOOGLE_STATUS_FETCHED: "Connection status retrieved",
  GOOGLE_DISCONNECTED: "Google account disconnected",

  // ── errors / domain rules ─────────────────────────────────────────────────────────
  GOOGLE_ALREADY_CONNECTED: "Google account is already connected",
  GOOGLE_CALLBACK_INVALID: "Invalid connection link",
  CALENDAR_ACCESS_DENIED: "You don't have permission to access the calendar",
};
