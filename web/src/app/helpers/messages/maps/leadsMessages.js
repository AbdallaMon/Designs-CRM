// Single-language (Arabic) resolution for backend message CODES emitted by the leads
// API ({ success, message: CODE, translationKey: "leadsMessages" }). The backend stays
// language-neutral (packages/shared/messages-codes/leads/leads.js); this is the FE
// lookup. Every code the leads module can emit has an entry here; unknown codes fall
// back to a generic string rather than leaking the raw code to end users.

export const leadsMessages = {
  // ── reads / generic ──────────────────────────────────────────────────────────
  LEADS_FETCHED: "Leads fetched",
  LEAD_FETCHED: "Lead data fetched",
  DEALS_FETCHED: "Deals fetched",
  COLUMNS_FETCHED: "Columns fetched",
  CALLS_FETCHED: "Calls fetched",
  MEETINGS_FETCHED: "Meetings fetched",
  MEETING_REMINDERS_FETCHED: "Meeting reminders fetched",
  MEETING_REMINDER_FETCHED: "Meeting reminder fetched",
  LEAD_COCKPIT_FETCHED: "Cockpit loaded",
  COUNTRY_CHECK_DONE: "Country checked",

  // ── success / mutations ────────────────────────────────────────────────────────
  LEAD_UPDATED: "Lead updated",
  LEAD_ASSIGNED: "Lead assigned to you",
  LEAD_CONVERTED: "Lead converted",
  LEADS_BULK_CONVERTED: "Selected leads converted",
  LEAD_MOVED_TO_CONVERTED: "Lead moved to converted",
  LEAD_STATUS_CHANGED: "Lead status changed",
  LEAD_PRICE_UPDATED: "Price updated",
  CALL_REMINDER_CREATED: "Call reminder created",
  CALL_REMINDER_UPDATED: "Call result updated",
  MEETING_REMINDER_CREATED: "Meeting reminder created",
  MEETING_REMINDER_UPDATED: "Meeting result updated",
  PRICE_OFFER_CREATED: "Price offer created",
  PRICE_OFFER_STATUS_CHANGED: "Price offer status updated",
  PAYMENTS_ADDED: "Payments added",
  FILE_SAVED: "File saved",
  NOTE_ADDED: "Note added",
  REMINDER_SENT: "Reminder sent",

  // ── errors / scope / guards ────────────────────────────────────────────────────
  LEAD_NOT_FOUND: "Lead not found",
  LEAD_ACCESS_DENIED: "You do not have access to this lead",
  LEAD_CLAIM_REQUIRED: "This lead is new — claim it as a deal to open it",
  LEAD_MUTATE_DENIED: "You do not have permission to edit this lead",
  CALL_REMINDER_NOT_FOUND: "Call reminder not found",
  MEETING_REMINDER_NOT_FOUND: "Meeting reminder not found",
  PRICE_OFFER_NOT_FOUND: "Price offer not found",
  LEAD_STATUS_TRANSITION_FORBIDDEN: "Cannot change the status from the current status",
  LEAD_ALREADY_ASSIGNED: "This lead has already been assigned",
  LEAD_COUNTRY_NOT_ALLOWED: "This country is not allowed for you",
  LEAD_MAX_ACTIVE_REACHED: "You have reached the maximum number of active leads",
  LEAD_MAX_PER_DAY_REACHED: "You have reached the daily maximum number of leads",
  MEETING_NOT_ALLOWED_FOR_ROLE: "This role cannot create/edit meetings",
  REMINDER_TIME_IN_PAST: "The reminder time is in the past",
  NO_AVAILABLE_SLOT: "No available slot",
  PRICE_OFFER_RANGE_INVALID: "Invalid price range",
  NOTE_CONTENT_EMPTY: "Note content is empty",
  FILE_FIELDS_REQUIRED: "File fields are required",
  BULK_CONVERT_FORBIDDEN: "You do not have permission for bulk conversion",

  // ── generic envelope codes (shared) ────────────────────────────────────────────
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
export function resolveLeadMessage(code, { fallback } = {}) {
  if (code && leadsMessages[code]) return leadsMessages[code];
  return fallback ?? "Operation completed";
}
