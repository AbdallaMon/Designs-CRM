// Single-language (Arabic) resolution for backend message CODES emitted by the utilities
// domain API ({ success, message: CODE, translationKey: "utilitiesMessages" }). The backend
// stays language-neutral (packages/shared/messages-codes/utilities/utilities.js); this is the
// FE lookup. Every code the utilities surface can emit has an entry here; unknown codes fall
// back to a generic string. Mirrors features/calendar/config/calendarMessages.js.

export const utilitiesMessages = {
  // ── reads ──────────────────────────────────────────────────────────────────────
  FIXED_DATA_FETCHED: "Fixed data fetched",
  USER_LOG_FETCHED: "Work log fetched",
  USER_ROLE_FETCHED: "User role fetched",
  ROLES_FETCHED: "Roles fetched",
  ADMINS_FETCHED: "Admins fetched",
  IMAGES_FETCHED: "Images fetched",
  MODEL_FETCHED: "Data fetched",
  MODEL_IDS_FETCHED: "List fetched",
  SEARCH_RESULTS_FETCHED: "Search results fetched",

  // ── writes ─────────────────────────────────────────────────────────────────────
  USER_LOG_SUBMITTED: "Work log recorded",
  // Fixed-data writes are served by the admin-residual module (translationKey
  // `adminResidualMessages`); the resolver keys on the CODE string, so we mirror them here.
  FIXED_DATA_CREATED: "Fixed data added",
  FIXED_DATA_UPDATED: "Fixed data updated",
  FIXED_DATA_DELETED: "Fixed data deleted",

  // ── errors / domain rules ─────────────────────────────────────────────────────────
  MODEL_NOT_ALLOWED: "The requested model is not allowed",

  // ── generic envelope codes (shared) ──────────────────────────────────────────────
  OK: "Operation completed successfully",
  CREATED: "Created successfully",
  FORBIDDEN: "You do not have permission to perform this action",
  ACCESS_DENIED: "You do not have access",
  VALIDATION_ERROR: "Invalid data",
};

/**
 * Resolve a backend message CODE to an Arabic display string.
 * @param {string} code
 * @param {{ fallback?: string }} [opts]
 */
export function resolveUtilitiesMessage(code, { fallback } = {}) {
  if (code && utilitiesMessages[code]) return utilitiesMessages[code];
  return fallback ?? "Operation completed";
}
