// Leads / sales feature — API contract surface. All paths are relative to the v2 API
// base (apiFetch is configured with config.apiUrl === /v2). Keeping them in one place
// makes a backend path change a one-line edit (reconciliation point vs the leads module
// server/src/modules/leads/lead/lead.routes.js).
//
// Backend contract (all under /v2/leads), confirmed against lead.routes.js:
//   GET  /                                  → list (paginated { items, total, page, pageSize })
//   GET  /deals                             → deals aggregator (Kanban — DEFERRED on FE)
//   GET  /columns                           → column/status aggregator (Kanban — DEFERRED)
//   GET  /calls                             → calls list (paginated)
//   GET  /meetings                          → meetings list (paginated)
//   GET  /:id                               → lead detail (+ capabilities.*)
//   PUT  /                                  → assign-self / assign-other (collection-level)
//   PUT  /convert                           → move to converted list
//   PUT  /bulk-convert                      → bulk convert (admin-tier)
//   PUT  /update/:id                        → field edit
//   POST /:id/actions/change-status         → status / price change (was PUT /:id/status)
//   POST /:id/call-reminders                → create call
//   PUT  /call-reminders/:id                → update call result
//   GET  /:clientLeadId/meeting-reminders   → meeting reminders for a lead
//   POST /:id/meeting-reminders             → create meeting
//   PUT  /meeting-reminders/:id             → update meeting result
//   POST /:id/price-offers                  → create price offer
//   POST /price-offers/change-status        → accept/reject a price offer
//   POST /:id/payments                      → add payment(s)
//   POST /:id/files                         → save an uploaded file ref
//   POST /:id/notes                         → add a note
//   POST /:clientLeadId/payment-reminder    → send payment reminder
//   POST /:clientLeadId/complete-register   → send complete-register reminder

export const LEADS_BASE = "leads";

// ── collection ─────────────────────────────────────────────────────────────────
export const LEADS_URL = `${LEADS_BASE}`;
export const LEADS_DEALS_URL = `${LEADS_BASE}/deals`;
export const LEADS_COLUMNS_URL = `${LEADS_BASE}/columns`;
export const LEADS_CALLS_URL = `${LEADS_BASE}/calls`;
export const LEADS_MEETINGS_URL = `${LEADS_BASE}/meetings`;

// ── single lead ──────────────────────────────────────────────────────────────────
export const leadUrl = (id) => `${LEADS_BASE}/${id}`;
export const leadChangeStatusUrl = (id) => `${LEADS_BASE}/${id}/actions/change-status`;
export const leadFieldUpdateUrl = (id) => `${LEADS_BASE}/update/${id}`;

// ── assign / convert (collection-level mutations) ──────────────────────────────────
export const LEADS_ASSIGN_URL = `${LEADS_BASE}`; // PUT
export const LEADS_CONVERT_URL = `${LEADS_BASE}/convert`; // PUT
export const LEADS_BULK_CONVERT_URL = `${LEADS_BASE}/bulk-convert`; // PUT

// ── sub-resources ──────────────────────────────────────────────────────────────────
export const leadCallRemindersUrl = (id) => `${LEADS_BASE}/${id}/call-reminders`;
export const callReminderUrl = (reminderId) => `${LEADS_BASE}/call-reminders/${reminderId}`;
export const leadMeetingRemindersUrl = (id) => `${LEADS_BASE}/${id}/meeting-reminders`;
export const meetingReminderUrl = (reminderId) => `${LEADS_BASE}/meeting-reminders/${reminderId}`;
export const leadPriceOffersUrl = (id) => `${LEADS_BASE}/${id}/price-offers`;
export const PRICE_OFFER_CHANGE_STATUS_URL = `${LEADS_BASE}/price-offers/change-status`;
export const leadPaymentsUrl = (id) => `${LEADS_BASE}/${id}/payments`;
export const leadFilesUrl = (id) => `${LEADS_BASE}/${id}/files`;
export const leadNotesUrl = (id) => `${LEADS_BASE}/${id}/notes`;
export const leadPaymentReminderUrl = (id) => `${LEADS_BASE}/${id}/payment-reminder`;
export const leadCompleteRegisterUrl = (id) => `${LEADS_BASE}/${id}/complete-register`;
