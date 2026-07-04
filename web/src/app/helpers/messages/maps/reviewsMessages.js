// Single-language (Arabic) resolution for backend message CODES emitted by the reviews domain
// API ({ success, message: CODE, translationKey: "reviewsMessages" }). The backend stays
// language-neutral (packages/shared/messages-codes/reviews/reviews.js); this is the FE lookup.
// Every code the reviews surface can emit has an entry here; unknown codes fall back to a
// generic string. Mirrors features/calendar/config/calendarMessages.js.

export const reviewsMessages = {
  // ── reads ──────────────────────────────────────────────────────────────────────
  REVIEW_LOCATIONS_FETCHED: "Locations fetched",
  REVIEWS_FETCHED: "Reviews fetched",

  // ── oauth ─────────────────────────────────────────────────────────────────────────
  REVIEW_AUTH_URL_GENERATED: "Connection link created",
  REVIEW_OAUTH_CONNECTED: "Google Business account connected",

  // ── errors / domain rules ─────────────────────────────────────────────────────────
  REVIEW_OAUTH_MISSING_CODE: "Connection code missing",
  REVIEW_INTEGRATION_ERROR: "Could not connect to Google Reviews service",

  // ── generic envelope codes (shared) ──────────────────────────────────────────────
  OK: "Operation completed successfully",
  FORBIDDEN: "You do not have permission to perform this action",
  ACCESS_DENIED: "You do not have access",
  VALIDATION_ERROR: "Invalid data",
  NOT_FOUND: "Item not found",
};

/**
 * Resolve a backend message CODE to an Arabic display string.
 * @param {string} code
 * @param {{ fallback?: string }} [opts]
 */
export function resolveReviewsMessage(code, { fallback } = {}) {
  if (code && reviewsMessages[code]) return reviewsMessages[code];
  return fallback ?? "Operation completed";
}
