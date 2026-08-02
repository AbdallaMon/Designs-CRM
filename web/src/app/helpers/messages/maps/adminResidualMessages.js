// Single-language (Arabic) resolution for backend message CODES emitted by the admin-residual
// domain API ({ success, message: CODE, translationKey: "adminResidualMessages" }). The backend
// stays language-neutral (packages/shared/messages-codes/admin-residual/admin-residual.js); this
// is the FE lookup. Every code the admin-residual surface can emit has an entry here; unknown
// codes fall back to a generic string. Mirrors features/calendar/config/calendarMessages.js.

export const adminResidualMessages = {
  // ── reports (🔒 frozen generators own the response body) ─────────────────────────
  LEAD_REPORT_GENERATED: "Leads report generated",
  STAFF_REPORT_GENERATED: "Staff report generated",

  // ── admin leads (import / create / update / delete) ──────────────────────────────
  LEADS_IMPORTED: "Leads imported",
  ADMIN_LEAD_CREATED: "Lead created",
  ADMIN_LEAD_UPDATED: "Lead updated",
  ADMIN_LEAD_DELETED: "Lead deleted",
  ADMIN_CLIENT_UPDATED: "Client details updated",

  // ── telegram (lead-scoped) ───────────────────────────────────────────────────────
  TELEGRAM_CHANNEL_CREATED: "Telegram channel created",
  TELEGRAM_USERS_QUEUED: "Adding users to Telegram scheduled",
  TELEGRAM_AUTH_FETCHED: "Telegram authentication status loaded",
  TELEGRAM_AUTH_INITIATED: "Telegram authentication started",
  TELEGRAM_CODE_VERIFIED: "Telegram code verified",
  TELEGRAM_PASSWORD_VERIFIED: "Telegram authentication completed",
  TELEGRAM_PASSWORD_REQUIRED: "Enter your Telegram two-factor password",
  TELEGRAM_SESSION_UNAUTHORIZED: "The Telegram session is not authorized",
  TELEGRAM_CONNECTION_FAILED: "Telegram connection failed",
  TELEGRAM_AUTH_RATE_LIMITED:
    "Too many Telegram authentication attempts. Please try again later",
  TELEGRAM_CODE_INCORRECT: "The Telegram verification code is incorrect",
  TELEGRAM_CODE_EXPIRED:
    "The Telegram verification code expired. Request a new code",
  TELEGRAM_PASSWORD_INCORRECT: "Incorrect Telegram password. Please try again.",
  TELEGRAM_AUTH_INIT_FAILED: "Telegram authentication could not be started",
  TELEGRAM_CODE_VERIFICATION_FAILED:
    "Telegram code verification failed",
  TELEGRAM_PASSWORD_VERIFICATION_FAILED:
    "Telegram password verification failed",
  TELEGRAM_CONFIG_MISSING: "Telegram configuration is incomplete",
  TELEGRAM_CLIENT_NOT_INITIALIZED: "Telegram client is not initialized",

  // ── fixed-data writes ────────────────────────────────────────────────────────────
  FIXED_DATA_CREATED: "Fixed data added",
  FIXED_DATA_UPDATED: "Fixed data updated",
  FIXED_DATA_DELETED: "Fixed data deleted",

  // ── commissions ──────────────────────────────────────────────────────────────────
  COMMISSIONS_FETCHED: "Commissions fetched",
  COMMISSION_CREATED: "Commission added",
  COMMISSION_UPDATED: "Commission updated",

  // ── admin projects ───────────────────────────────────────────────────────────────
  ADMIN_PROJECTS_FETCHED: "Projects fetched",
  PROJECT_GROUP_CREATED: "Project group created",

  // ── model archive (allow-listed) ─────────────────────────────────────────────────
  MODEL_ARCHIVE_UPDATED: "Archive status updated",

  // ── staff (the staff-tier residual read — included for completeness) ──────────────
  LATEST_CALLS_FETCHED: "Latest calls fetched",

  // ── errors / domain rules ────────────────────────────────────────────────────────
  MODEL_NOT_ALLOWED: "This model is not allowed to be archived",
  COMMISSION_AMOUNT_INVALID: "Invalid commission amount",
  COMMISSION_REASON_REQUIRED: "Commission reason is required",
  COMMISSION_NOT_FOUND: "Commission not found",
  COMMISSION_PAYMENT_EXCEEDS_REMAINING: "The payment exceeds the remaining commission balance",
  COMMISSION_LEAD_MISMATCH: "The lead was not found for this user",
  TELEGRAM_CHANNEL_NOT_FOUND: "No Telegram channel is linked to this lead",
  CLIENT_EMAIL_IMMUTABLE: "A client email cannot be changed from this field",

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
export function resolveAdminResidualMessage(code, { fallback } = {}) {
  if (code && adminResidualMessages[code]) return adminResidualMessages[code];
  return fallback ?? "Operation completed";
}
