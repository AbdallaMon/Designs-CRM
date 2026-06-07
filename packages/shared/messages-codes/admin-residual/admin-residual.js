// admin-residual module message CODES. SCREAMING_SNAKE_CASE, key === value (the
// string IS the code). Carried in the API envelope `message` field; the client
// resolves (translationKey: adminResidualMessages, code) → displayed string.
// Language-neutral — never put Arabic/English prose here.
//
// This module is the residual sweep of the legacy `/admin` (ADMIN gate) and
// `/staff` (STAFF gate) routers NOT covered by an earlier migrated module:
// lead/staff reports (🔒 pdfkit frozen — only wrapped), admin lead import/
// create/update/delete + telegram, client field update, fixed-data writes,
// commissions, admin projects aggregation + project-group create, generic
// model-archive (allow-listed), and the STAFF latest-calls reminder list.
export const adminResidualMessagesCodes = {
  // ── reports (data / excel / pdf — the frozen fns own the response body) ────────
  LEAD_REPORT_GENERATED: "LEAD_REPORT_GENERATED",
  STAFF_REPORT_GENERATED: "STAFF_REPORT_GENERATED",

  // ── admin leads (import / create / update / delete) ────────────────────────────
  LEADS_IMPORTED: "LEADS_IMPORTED",
  LEAD_CREATED: "ADMIN_LEAD_CREATED",
  LEAD_UPDATED: "ADMIN_LEAD_UPDATED",
  LEAD_DELETED: "ADMIN_LEAD_DELETED",
  CLIENT_UPDATED: "ADMIN_CLIENT_UPDATED",

  // ── telegram (lead-scoped) ─────────────────────────────────────────────────────
  TELEGRAM_CHANNEL_CREATED: "TELEGRAM_CHANNEL_CREATED",
  TELEGRAM_USERS_QUEUED: "TELEGRAM_USERS_QUEUED",

  // ── fixed-data writes ──────────────────────────────────────────────────────────
  FIXED_DATA_CREATED: "FIXED_DATA_CREATED",
  FIXED_DATA_UPDATED: "FIXED_DATA_UPDATED",
  FIXED_DATA_DELETED: "FIXED_DATA_DELETED",

  // ── commissions ────────────────────────────────────────────────────────────────
  COMMISSIONS_FETCHED: "COMMISSIONS_FETCHED",
  COMMISSION_CREATED: "COMMISSION_CREATED",
  COMMISSION_UPDATED: "COMMISSION_UPDATED",

  // ── admin projects ─────────────────────────────────────────────────────────────
  ADMIN_PROJECTS_FETCHED: "ADMIN_PROJECTS_FETCHED",
  PROJECT_GROUP_CREATED: "PROJECT_GROUP_CREATED",

  // ── model archive (allow-listed) ──────────────────────────────────────────────
  MODEL_ARCHIVE_UPDATED: "MODEL_ARCHIVE_UPDATED",

  // ── staff ──────────────────────────────────────────────────────────────────────
  LATEST_CALLS_FETCHED: "LATEST_CALLS_FETCHED",

  // ── errors / domain rules ──────────────────────────────────────────────────────
  MODEL_NOT_ALLOWED: "MODEL_NOT_ALLOWED", // model not in the archive allow-list
  COMMISSION_AMOUNT_INVALID: "COMMISSION_AMOUNT_INVALID",
  COMMISSION_REASON_REQUIRED: "COMMISSION_REASON_REQUIRED",
};
