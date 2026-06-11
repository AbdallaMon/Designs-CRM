// Leads data-access service — the ONLY place that talks to the leads API. Wraps the
// canonical apiFetch (config.apiUrl === /v2). Components/hooks call these helpers, never
// fetch/apiFetch directly. All responses share the { success, message, data,
// translationKey } envelope; helpers return the parsed envelope. The list helper builds
// the legacy-compatible paginated query (page/limit/filters/search) the BE list expects.

import apiFetch from "@/app/v2/lib/api/ApiFetch";
import {
  LEADS_URL,
  LEADS_COLUMNS_URL,
  LEADS_CALLS_URL,
  LEADS_MEETINGS_URL,
  LEADS_ASSIGN_URL,
  LEADS_CONVERT_URL,
  LEADS_BULK_CONVERT_URL,
  leadUrl,
  leadChangeStatusUrl,
  leadFieldUpdateUrl,
  leadCallRemindersUrl,
  callReminderUrl,
  leadMeetingRemindersUrl,
  meetingReminderUrl,
  leadPriceOffersUrl,
  PRICE_OFFER_CHANGE_STATUS_URL,
  leadPaymentsUrl,
  leadFilesUrl,
  leadNotesUrl,
  leadPaymentReminderUrl,
  leadCompleteRegisterUrl,
} from "./config/constant.js";

// Build the BE list query string. The leads list expects page/limit + a JSON `filters`
// string + `search` (it tolerates extra keys via .passthrough()). `extra` carries the
// list-mode flags (isNew, status, staffId) the legacy route surfaced.
function buildListQuery(base, { page = 1, limit = 10, filters = {}, search = "", extra = {} } = {}) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  params.set("filters", JSON.stringify(filters ?? {}));
  if (search) params.set("search", String(search));
  Object.entries(extra).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  });
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export const leadsService = {
  // ── list surfaces ─────────────────────────────────────────────────────────────
  listLeads: (opts = {}) => apiFetch.get(buildListQuery(LEADS_URL, opts)),
  listCalls: (opts = {}) => apiFetch.get(buildListQuery(LEADS_CALLS_URL, opts)),
  listMeetings: (opts = {}) => apiFetch.get(buildListQuery(LEADS_MEETINGS_URL, opts)),

  // ── kanban / board ───────────────────────────────────────────────────────────
  // GET /columns is a PER-STATUS aggregator: it returns the leads for a SINGLE column
  // (the legacy KanbanLeadsStatus board fetched one request per status). The BE reads
  // `status` off the top level and `filters` as a JSON string. Envelope shape:
  //   data: { data: [...leads(+capabilities.*)], totalValue, totalLeads }.
  // The Kanban board fires one call per visible column.
  listColumns: ({ status, filters = {}, search = "", extra = {} } = {}) =>
    apiFetch.get(
      buildListQuery(LEADS_COLUMNS_URL, {
        // columns endpoint has no page/limit; only status + filters + extra are read.
        filters,
        search,
        extra: { status, ...extra },
      }),
    ),

  // ── detail ──────────────────────────────────────────────────────────────────────
  getLead: (id) => apiFetch.get(leadUrl(id)),

  // ── assign / convert (collection-level) ──────────────────────────────────────────
  // PUT / — { id } claims for self; { id, userId } assigns to another (admin-tier).
  assignLead: (body) => apiFetch.put(LEADS_ASSIGN_URL, body),
  convertLead: (body) => apiFetch.put(LEADS_CONVERT_URL, body),
  bulkConvertLeads: (body) => apiFetch.put(LEADS_BULK_CONVERT_URL, body),

  // ── status / field edit ───────────────────────────────────────────────────────
  // §5c: status change is POST /:id/actions/change-status and no longer accepts a
  // client-supplied oldStatus — the server derives it. Send only the target status (+
  // optional price fields when updatePrice).
  changeStatus: (id, body) => apiFetch.post(leadChangeStatusUrl(id), body),
  updateField: (id, body) => apiFetch.put(leadFieldUpdateUrl(id), body),

  // ── calls ─────────────────────────────────────────────────────────────────────
  createCall: (id, body) => apiFetch.post(leadCallRemindersUrl(id), body),
  updateCall: (reminderId, body) => apiFetch.put(callReminderUrl(reminderId), body),

  // ── meetings ─────────────────────────────────────────────────────────────────
  getMeetingReminders: (clientLeadId) =>
    apiFetch.get(leadMeetingRemindersUrl(clientLeadId)),
  createMeeting: (id, body) => apiFetch.post(leadMeetingRemindersUrl(id), body),
  updateMeeting: (reminderId, body) => apiFetch.put(meetingReminderUrl(reminderId), body),

  // ── price offers / payments / files / notes ──────────────────────────────────────
  createPriceOffer: (id, body) => apiFetch.post(leadPriceOffersUrl(id), body),
  changePriceOfferStatus: (body) => apiFetch.post(PRICE_OFFER_CHANGE_STATUS_URL, body),
  makePayments: (id, body) => apiFetch.post(leadPaymentsUrl(id), body),
  createFile: (id, body) => apiFetch.post(leadFilesUrl(id), body),
  createNote: (id, body) => apiFetch.post(leadNotesUrl(id), body),

  // ── reminders ─────────────────────────────────────────────────────────────────
  sendPaymentReminder: (id) => apiFetch.post(leadPaymentReminderUrl(id)),
  sendCompleteRegister: (id) => apiFetch.post(leadCompleteRegisterUrl(id)),
};

export default leadsService;
