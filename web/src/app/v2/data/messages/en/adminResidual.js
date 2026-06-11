// English mirror of the ADMIN-RESIDUAL message CODES (namespace "adminResidualMessages").
// CODE → English. Mirrors keys 1:1 with ../adminResidual.js (the Arabic map). Bilingual Phase 1.

export const adminResidualMessagesEn = {
  // ── reports (🔒 frozen generators own the response body) ─────────────────────────
  LEAD_REPORT_GENERATED: "Leads report generated",
  STAFF_REPORT_GENERATED: "Staff report generated",

  // ── admin leads (import / create / update / delete) ──────────────────────────────
  LEADS_IMPORTED: "Leads imported",
  ADMIN_LEAD_CREATED: "Lead created",
  ADMIN_LEAD_UPDATED: "Lead updated",
  ADMIN_LEAD_DELETED: "Lead deleted",
  ADMIN_CLIENT_UPDATED: "Client data updated",

  // ── telegram (lead-scoped) ───────────────────────────────────────────────────────
  TELEGRAM_CHANNEL_CREATED: "Telegram channel created",
  TELEGRAM_USERS_QUEUED: "Adding users to Telegram has been queued",

  // ── fixed-data writes ────────────────────────────────────────────────────────────
  FIXED_DATA_CREATED: "Fixed data item added",
  FIXED_DATA_UPDATED: "Fixed data item updated",
  FIXED_DATA_DELETED: "Fixed data item deleted",

  // ── commissions ──────────────────────────────────────────────────────────────────
  COMMISSIONS_FETCHED: "Commissions retrieved",
  COMMISSION_CREATED: "Commission added",
  COMMISSION_UPDATED: "Commission updated",

  // ── admin projects ───────────────────────────────────────────────────────────────
  ADMIN_PROJECTS_FETCHED: "Projects retrieved",
  PROJECT_GROUP_CREATED: "Project group created",

  // ── model archive (allow-listed) ─────────────────────────────────────────────────
  MODEL_ARCHIVE_UPDATED: "Archive status updated",

  // ── staff ────────────────────────────────────────────────────────────────────────
  LATEST_CALLS_FETCHED: "Latest calls retrieved",

  // ── errors / domain rules ────────────────────────────────────────────────────────
  MODEL_NOT_ALLOWED: "This model can't be archived",
  COMMISSION_AMOUNT_INVALID: "Invalid commission amount",
  COMMISSION_REASON_REQUIRED: "A commission reason is required",
};
