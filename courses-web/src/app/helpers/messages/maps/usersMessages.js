// Single-language (Arabic) resolution for backend message CODES emitted by the users
// surface ({ success, message: CODE, translationKey: "usersMessages" }) AND the staff
// residual read (translationKey: "adminResidualMessages"). The backend stays language-
// neutral (packages/shared/messages-codes/users/users.js + .../admin-residual/admin-residual.js);
// this is the FE lookup. Every code the users/staff surface can emit has an entry here;
// unknown codes fall back to a generic string. Mirrors features/calendar/config/calendarMessages.js.

export const usersMessages = {
  // ── users: reads ─────────────────────────────────────────────────────────────────
  USERS_FETCHED: "Users fetched",
  ALL_USERS_FETCHED: "Users list fetched",
  USERS_DIRECTORY_FETCHED: "Users directory fetched",
  USER_PROFILE_FETCHED: "Profile fetched",
  USER_LOGS_FETCHED: "Logs fetched",
  USER_LAST_SEEN_FETCHED: "Last activity fetched",
  RESTRICTED_COUNTRIES_FETCHED: "Restricted countries fetched",
  AUTO_ASSIGNMENTS_FETCHED: "Auto assignments fetched",

  // ── users: mutations ───────────────────────────────────────────────────────────────
  USER_CREATED: "User created",
  USER_UPDATED: "User updated",
  USER_STATUS_TOGGLED: "User status changed",
  USER_PROFILE_UPDATED: "Profile updated",
  USER_PROFILES_UPDATED: "User job profiles updated",
  USER_PROFILES_FETCHED: "Job profiles fetched",
  RESTRICTED_COUNTRIES_UPDATED: "Restricted countries updated",
  AUTO_ASSIGNMENTS_UPDATED: "Auto assignments updated",
  USER_MAX_LEADS_UPDATED: "Maximum leads updated",
  USER_MAX_LEADS_PER_DAY_UPDATED: "Daily maximum leads updated",

  // ── users: errors / scope / guards ────────────────────────────────────────────────
  USER_NOT_FOUND: "User not found",
  USER_PROFILE_NOT_FOUND: "Profile not found",
  USER_PROFILE_ACCESS_DENIED: "You do not have access to this profile",
  USER_PROFILE_MUTATE_DENIED: "You do not have permission to edit this profile",
  EMAIL_ALREADY_REGISTERED: "The email is already registered",
  USER_NO_DATA_SENT: "No data was sent",
  USER_PROFILE_NOT_ALLOWED: "This profile is not allowed",
  USER_SALES_TIER_EXCLUSIVE:
    "Only one sales level (Sales, Primary sales, or Super sales) can be assigned to a user.",

  // ── staff residual read (adminResidualMessages) ────────────────────────────────────
  LATEST_CALLS_FETCHED: "Latest calls fetched",

  // ── generic envelope codes (shared core) ──────────────────────────────────────────
  OK: "Operation completed successfully",
  CREATED: "Created successfully",
  UPDATED: "Updated successfully",
  DELETED: "Deleted successfully",
  NOT_FOUND: "Not found",
  FORBIDDEN: "You do not have permission to perform this action",
  UNAUTHORIZED: "You must sign in",
  VALIDATION_ERROR: "Invalid data",
  CONFLICT: "Data conflict",
  INTERNAL_SERVER_ERROR: "A server error occurred",
  UNEXPECTED_ERROR: "An unexpected error occurred",
};

/**
 * Resolve a backend message CODE to an Arabic display string.
 * @param {string} code
 * @param {{ fallback?: string }} [opts]
 */
export function resolveUsersMessage(code, { fallback } = {}) {
  if (code && usersMessages[code]) return usersMessages[code];
  return fallback ?? "Operation completed";
}
