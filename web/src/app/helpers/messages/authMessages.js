// Single-language (Arabic) resolution for the AUTH surface and the common GENERIC
// envelope codes that the backend can emit on ANY endpoint. The backend stays
// language-neutral:
//   - auth codes:    packages/shared/messages-codes/auth/auth.js   (translationKey: authMessages)
//   - generic codes: packages/shared/messages-codes/core/general.js (shared envelope)
// This is the FE lookup. It mirrors the per-feature *Messages.js shape so the central
// resolver (lib/messages/resolveMessage.js) can fold it in alongside the feature maps.
// Authored here because, unlike every feature, the auth flow had NO message map and the
// generic data layer (handleRequestSubmit / getData / useRequest) surfaced the RAW code.

export const authMessages = {
  // ── auth: authentication errors ───────────────────────────────────────────────
  UNAUTHORIZED: "You must sign in to continue",
  INVALID_TOKEN: "Your session has expired, please sign in again",
  TOKEN_EXPIRED: "Your session has expired, please sign in again",
  INVALID_CREDENTIALS: "Incorrect email or password",
  ACCOUNT_BLOCKED: "This account has been suspended, please contact the administration",
  REFRESH_TOKEN_MISSING: "Your session has expired, please sign in again",
  RESET_TOKEN_MISSING: "The reset link is invalid or has expired",
  PASSWORD_MUST_DIFFER: "The new password must be different from the previous one",
  RATE_LIMIT_EXCEEDED: "Too many attempts, please try again later",

  // ── auth: authorization errors ────────────────────────────────────────────────
  FORBIDDEN: "You do not have permission to perform this action",
  PERMISSION_DENIED: "You do not have permission to perform this action",
  ACCESS_DENIED: "You do not have access to this item",

  // ── profiles (DB-relational permissions) ──────────────────────────────────────
  PROFILE_NOT_ASSIGNED: "This job profile is not assigned to you",
  PROFILE_NOT_FOUND: "Job profile not found",
  PROFILE_SWITCHED: "Job profile switched",
  PROFILES_UPDATED: "Job profiles updated",

  // ── auth: success ─────────────────────────────────────────────────────────────
  LOGIN_SUCCESS: "Signed in successfully",
  LOGOUT_SUCCESS: "Signed out successfully",
  TOKENS_REFRESHED: "Session refreshed",
  PASSWORD_RESET_REQUESTED: "A password reset link has been sent to your email",
  PASSWORD_RESET_REQUEST: "A password reset link has been sent to your email",
  PASSWORD_CHANGED: "Password changed successfully",
  PASSWORD_RESET_SUCCESS: "Password changed successfully",
  CURRENT_USER_RETRIEVED: "User data fetched",

  // ── generic envelope codes (shared core: messages-codes/core/general.js) ───────
  OK: "Operation completed successfully",
  SUCCESS: "Operation completed successfully",
  OPERATION_SUCCESS: "Operation completed successfully",
  CREATED: "Created successfully",
  UPDATED: "Updated successfully",
  DELETED: "Deleted successfully",
  NOT_FOUND: "The requested item was not found",
  BAD_REQUEST: "Invalid request",
  VALIDATION_ERROR: "Invalid data, please review the fields",
  CONFLICT: "Data conflict",
  TOO_MANY_REQUESTS: "Too many requests, please try again later",
  SERVICE_UNAVAILABLE: "The service is currently unavailable, please try again later",
  INTERNAL_ERROR: "A server error occurred, please try again later",
  INTERNAL_SERVER_ERROR: "A server error occurred, please try again later",
  UNEXPECTED_ERROR: "An unexpected error occurred, please try again later",

  // ── file upload (shared core) ─────────────────────────────────────────────────
  FILE_UPLOAD_ERROR: "File upload failed, please try again",
  FILE_TOO_LARGE: "The file is too large",
  TOO_MANY_FILES: "Too many files",
  UNEXPECTED_FILE_FIELD: "Unexpected file field",
};

/** Neutral Arabic fallback when a code is unknown and no explicit fallback is given. */
export const DEFAULT_FALLBACK_MESSAGE = "Something went wrong, please try again";

/**
 * Resolve an AUTH or GENERIC backend message CODE to an Arabic display string.
 * @param {string} code
 * @param {{ fallback?: string }} [opts]
 * @returns {string}
 */
export function resolveAuthMessage(code, { fallback } = {}) {
  if (code && authMessages[code]) return authMessages[code];
  return fallback ?? DEFAULT_FALLBACK_MESSAGE;
}
