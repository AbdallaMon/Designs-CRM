// calendar module message CODES. SCREAMING_SNAKE_CASE, key === value (the string
// IS the code). Carried in the API envelope `message` field; the client resolves
// (translationKey: calendarMessages, code) → displayed string. Language-neutral —
// never put Arabic/English prose here.
//
// Covers the staff availability/slots surface, the meeting/call month-views, the
// Google Calendar OAuth integration, and the PUBLIC client booking surface. The
// heavy legacy services (slot generation, Google API, notifications/email) are
// invoked via lazy adapters and may still throw plain Errors — those are surfaced
// by the generic error handler; the codes here cover the v2-owned success/failure
// outcomes.
export const calendarMessagesCodes = {
  // ── reads ──────────────────────────────────────────────────────────────────────
  AVAILABLE_DAYS_FETCHED: "AVAILABLE_DAYS_FETCHED",
  SLOTS_FETCHED: "SLOTS_FETCHED",
  SLOT_DETAILS_FETCHED: "SLOT_DETAILS_FETCHED",
  CALENDAR_MONTH_FETCHED: "CALENDAR_MONTH_FETCHED",
  REMINDERS_FETCHED: "REMINDERS_FETCHED",
  MEETING_DATA_FETCHED: "MEETING_DATA_FETCHED",
  TIMEZONES_FETCHED: "TIMEZONES_FETCHED",

  // ── availability mutations ───────────────────────────────────────────────────────
  AVAILABLE_DAY_SAVED: "AVAILABLE_DAY_SAVED",
  AVAILABLE_DAYS_SAVED: "AVAILABLE_DAYS_SAVED",
  AVAILABLE_DAY_DELETED: "AVAILABLE_DAY_DELETED",
  SLOT_DELETED: "SLOT_DELETED",

  // ── client booking ───────────────────────────────────────────────────────────────
  MEETING_BOOKED: "MEETING_BOOKED",

  // ── google integration ───────────────────────────────────────────────────────────
  GOOGLE_AUTH_URL_GENERATED: "GOOGLE_AUTH_URL_GENERATED",
  GOOGLE_STATUS_FETCHED: "GOOGLE_STATUS_FETCHED",
  GOOGLE_DISCONNECTED: "GOOGLE_DISCONNECTED",

  // ── errors / domain rules ─────────────────────────────────────────────────────────
  GOOGLE_ALREADY_CONNECTED: "GOOGLE_ALREADY_CONNECTED",
  GOOGLE_CALLBACK_INVALID: "GOOGLE_CALLBACK_INVALID", // missing code/state on OAuth callback
  CALENDAR_ACCESS_DENIED: "CALENDAR_ACCESS_DENIED",
};
