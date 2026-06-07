// Calendar domain — API contract surface. All paths are relative to the v2 API base
// (apiFetch is configured with config.apiUrl === /v2). One place to edit if a backend path
// changes (reconciliation point vs server/src/modules/calendar/*/*.route.js).
//
// Backend contract (confirmed against the v2 route files):
//   AUTHED staff surface (double-mounted at /v2/calendar AND /v2/calendar-management; we
//   use /v2/calendar consistently). Auth mounted once at the aggregate router; each route
//   declares its CALENDAR.* permission code (granted to every authed role).
//   /v2/calendar:
//     GET    /available-days?month=&adminId=&timezone=&type=   → month grid (object {month,weeks})   [calendar.view]
//     GET    /slots?date=&adminId=&dayId=&timezone=&type=      → slots for a date (ARRAY)             [calendar.view]
//     GET    /dates/month?year=&month=&isAdmin=                → meeting/call month map (object)      [calendar.view]
//     GET    /dates/day?date=&isAdmin=                         → day's meetings+calls (object)        [calendar.view]
//     POST   /available-days?timezone=                         → create/update one day                [calendar.manage]
//                                              body (.strict): { date, fromHour, toHour, duration, breakMinutes }
//     POST   /available-days/multiple?timezone=                → create/update many days              [calendar.manage]
//                                              body (.strict): { days[], fromHour, toHour, duration, breakMinutes }
//     DELETE /days/:id                                         → delete a day (+ its slots)           [calendar.manage]
//     DELETE /slots/:id                                        → delete one slot                      [calendar.manage]
//   /v2/calendar/google (self-scoped to the caller):
//     GET    /connect      → { isConnected:false, authUrl }                                           [calendar.google.view]
//     POST   /connect      → { isConnected:false, redirectUrl }                                       [calendar.google.manage]
//     GET    /callback     → OAuth redirect (browser-only; not called by FE)                          [calendar.google.view]
//     GET    /status       → { connected, calendarId, tokenExpired }                                  [calendar.google.view]
//     POST   /disconnect   → 200 deleted                                                              [calendar.google.manage]
//
//   PUBLIC client booking surface (UNGATED — the per-meeting token IS the auth). Mounted at
//   /v2/client/calendar. reminderId/clientLeadId/adminId are derived from the VERIFIED token
//   inside the usecase — NEVER sent from the FE.
//   /v2/client/calendar:
//     GET  /meeting-data?token=&timezone=     → booking context (object)
//     GET  /available-days?token=&month=&timezone=  → month grid (object {month,weeks})
//     GET  /slots?token=&date=&dayId=&timezone=     → slots for a date (ARRAY)
//     GET  /slots/details?token=&slotId=&timezone=  → confirm one slot (object)
//     GET  /timezones                          → grouped IANA timezone list (ARRAY)
//     POST /book?token=&timezone=              → book the meeting
//                                  body (.strict): { selectedSlot, selectedTimezone }  ← NO reminderId/clientLeadId

// ── authed staff surface (consistently /v2/calendar) ─────────────────────────────────
export const CALENDAR_BASE = "calendar";

export const AVAILABLE_DAYS_URL = `${CALENDAR_BASE}/available-days`;
export const AVAILABLE_DAYS_MULTIPLE_URL = `${CALENDAR_BASE}/available-days/multiple`;
export const SLOTS_URL = `${CALENDAR_BASE}/slots`;
export const dayDeleteUrl = (id) => `${CALENDAR_BASE}/days/${id}`;
export const slotDeleteUrl = (id) => `${CALENDAR_BASE}/slots/${id}`;

// meeting/call month-views
export const DATES_MONTH_URL = `${CALENDAR_BASE}/dates/month`;
export const DATES_DAY_URL = `${CALENDAR_BASE}/dates/day`;

// ── Google Calendar integration (self-scoped to the caller) ──────────────────────────
export const GOOGLE_BASE = `${CALENDAR_BASE}/google`;
export const GOOGLE_CONNECT_URL = `${GOOGLE_BASE}/connect`;
export const GOOGLE_STATUS_URL = `${GOOGLE_BASE}/status`;
export const GOOGLE_DISCONNECT_URL = `${GOOGLE_BASE}/disconnect`;

// ── PUBLIC client booking surface (ungated, token-based) ─────────────────────────────
export const CLIENT_CALENDAR_BASE = "client/calendar";
export const CLIENT_MEETING_DATA_URL = `${CLIENT_CALENDAR_BASE}/meeting-data`;
export const CLIENT_AVAILABLE_DAYS_URL = `${CLIENT_CALENDAR_BASE}/available-days`;
export const CLIENT_SLOTS_URL = `${CLIENT_CALENDAR_BASE}/slots`;
export const CLIENT_SLOT_DETAILS_URL = `${CLIENT_CALENDAR_BASE}/slots/details`;
export const CLIENT_TIMEZONES_URL = `${CLIENT_CALENDAR_BASE}/timezones`;
export const CLIENT_BOOK_URL = `${CLIENT_CALENDAR_BASE}/book`;
