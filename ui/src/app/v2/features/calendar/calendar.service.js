// Calendar data-access service — the ONLY place that talks to the calendar API. Wraps the
// canonical apiFetch (config.apiUrl === /v2). Components/hooks call these helpers, never
// fetch/apiFetch directly. All responses share the { success, message, data, translationKey }
// envelope; helpers return the parsed envelope.
//
// Two surfaces:
//  • AUTHED staff surface (apiFetch.* — credentialed, cookie auth). Points at /v2/calendar
//    consistently (the BE double-mounts at /v2/calendar AND /v2/calendar-management).
//  • PUBLIC client booking surface (apiFetch.public.* — token-based, NO session, _skipRefresh
//    so a 401 never triggers a refresh/redirect). Points at /v2/client/calendar.
//
// §5c deltas baked in here:
//  • All paths target /v2/calendar/* (NOT legacy /shared/calendar*) and /v2/client/calendar/*.
//  • Availability writes go through the create/delete endpoints the BE exposes (create day,
//    create multiple days, delete day, delete slot). The legacy "add custom slot" endpoint
//    (/calendar-management/add-custom/:dayId) does NOT exist in v2 and is intentionally omitted.
//  • The PUBLIC /book body carries ONLY { selectedSlot, selectedTimezone } — reminderId/
//    clientLeadId/adminId are derived from the verified token server-side and are NEVER sent
//    (the BE .strict() schema would 422 on them).
//  • Mutating bodies are built to match the BE .strict() schemas exactly (no extra keys).

import apiFetch from "@/app/v2/lib/api/ApiFetch";
import {
  AVAILABLE_DAYS_URL,
  AVAILABLE_DAYS_MULTIPLE_URL,
  SLOTS_URL,
  dayDeleteUrl,
  slotDeleteUrl,
  DATES_MONTH_URL,
  DATES_DAY_URL,
  GOOGLE_CONNECT_URL,
  GOOGLE_STATUS_URL,
  GOOGLE_DISCONNECT_URL,
  CLIENT_MEETING_DATA_URL,
  CLIENT_AVAILABLE_DAYS_URL,
  CLIENT_SLOTS_URL,
  CLIENT_SLOT_DETAILS_URL,
  CLIENT_TIMEZONES_URL,
  CLIENT_BOOK_URL,
} from "./config/constant.js";

// Build a query string with top-level params (skips empty/null/undefined).
function buildQuery(base, params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `${base}?${s}` : base;
}

// Pick only the whitelisted keys (the BE .strict() schemas reject extra keys).
function pick(obj, keys) {
  const out = {};
  keys.forEach((k) => {
    if (obj != null && obj[k] !== undefined && obj[k] !== null && obj[k] !== "") out[k] = obj[k];
  });
  return out;
}

export const calendarService = {
  // ── authed: availability reads (slots returns an ARRAY; month returns an object) ────
  // GET /available-days?month=&adminId=&timezone=&type=
  getAvailableDays: (params = {}) => apiFetch.get(buildQuery(AVAILABLE_DAYS_URL, params)),
  // GET /slots?date=&adminId=&dayId=&timezone=&type=  → data is an ARRAY of slots
  getSlots: (params = {}) => apiFetch.get(buildQuery(SLOTS_URL, params)),

  // ── authed: availability writes (timezone in the query; body matches .strict()) ─────
  // POST /available-days?timezone= — body { date, fromHour, toHour, duration, breakMinutes }
  createDay: (body, { timezone } = {}) =>
    apiFetch.post(
      buildQuery(AVAILABLE_DAYS_URL, { timezone }),
      pick(body, ["date", "fromHour", "toHour", "duration", "breakMinutes"]),
    ),
  // POST /available-days/multiple?timezone= — body { days[], fromHour, toHour, duration, breakMinutes }
  createMultipleDays: (body, { timezone } = {}) =>
    apiFetch.post(buildQuery(AVAILABLE_DAYS_MULTIPLE_URL, { timezone }), {
      days: Array.isArray(body?.days) ? body.days : [],
      ...pick(body, ["fromHour", "toHour", "duration", "breakMinutes"]),
    }),
  // DELETE /days/:id
  deleteDay: (id) => apiFetch.delete(dayDeleteUrl(id)),
  // DELETE /slots/:id
  deleteSlot: (id) => apiFetch.delete(slotDeleteUrl(id)),

  // ── authed: meeting/call month-views ───────────────────────────────────────────────
  // GET /dates/month?year=&month=&isAdmin=
  getCalendarMonth: (params = {}) => apiFetch.get(buildQuery(DATES_MONTH_URL, params)),
  // GET /dates/day?date=&isAdmin=
  getRemindersForDay: (params = {}) => apiFetch.get(buildQuery(DATES_DAY_URL, params)),

  // ── authed: Google Calendar integration (self-scoped to the caller) ─────────────────
  // GET /google/connect → { isConnected:false, authUrl }   (calendar.google.view)
  getGoogleConnect: () => apiFetch.get(GOOGLE_CONNECT_URL),
  // GET /google/status → { isConnected, ... }              (calendar.google.view)
  getGoogleStatus: () => apiFetch.get(GOOGLE_STATUS_URL),
  // POST /google/connect → { isConnected:false, redirectUrl } (calendar.google.manage)
  connectGoogle: () => apiFetch.post(GOOGLE_CONNECT_URL),
  // POST /google/disconnect → 200 deleted                  (calendar.google.manage)
  disconnectGoogle: () => apiFetch.post(GOOGLE_DISCONNECT_URL),

  // ── PUBLIC client booking surface (token-based; apiFetch.public, NO session) ─────────
  // GET /meeting-data?token=&timezone=
  getMeetingData: ({ token, timezone } = {}) =>
    apiFetch.public.get(buildQuery(CLIENT_MEETING_DATA_URL, { token, timezone })),
  // GET /available-days?token=&month=&timezone=
  getClientAvailableDays: ({ token, month, timezone } = {}) =>
    apiFetch.public.get(buildQuery(CLIENT_AVAILABLE_DAYS_URL, { token, month, timezone })),
  // GET /slots?token=&date=&dayId=&timezone=  → data is an ARRAY of slots
  getClientSlots: ({ token, date, dayId, timezone } = {}) =>
    apiFetch.public.get(buildQuery(CLIENT_SLOTS_URL, { token, date, dayId, timezone })),
  // GET /slots/details?token=&slotId=&timezone=
  getClientSlotDetails: ({ token, slotId, timezone } = {}) =>
    apiFetch.public.get(buildQuery(CLIENT_SLOT_DETAILS_URL, { token, slotId, timezone })),
  // GET /timezones → grouped IANA list (ARRAY)
  getTimezones: () => apiFetch.public.get(CLIENT_TIMEZONES_URL),
  // POST /book?token=&timezone= — body STRICTLY { selectedSlot, selectedTimezone }.
  // reminderId/clientLeadId/adminId come from the verified token server-side — NEVER sent.
  book: ({ token, timezone, selectedSlot, selectedTimezone }) =>
    apiFetch.public.post(buildQuery(CLIENT_BOOK_URL, { token, timezone }), {
      selectedSlot,
      ...(selectedTimezone ? { selectedTimezone } : {}),
    }),
};

export default calendarService;
