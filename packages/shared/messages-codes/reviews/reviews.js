// reviews module message CODES. SCREAMING_SNAKE_CASE, key === value (the string
// IS the code). Carried in the API envelope `message` field; the client resolves
// (translationKey: reviewsMessages, code) → displayed string. Language-neutral —
// never put Arabic/English prose here.
//
// Covers the thin Google Business Profile OAuth review integration (legacy
// `/shared/reviews/*`). The OAuth token flow is behavior-frozen and owned by the legacy
// `services/reviews.js`; the v2 module NEVER returns or logs access/refresh tokens or
// the client secret. The legacy callback returned the raw token object — the v2 module
// closes that exposure (returns only a connected flag).
export const reviewsMessagesCodes = {
  // ── reads ──────────────────────────────────────────────────────────────────────
  REVIEW_LOCATIONS_FETCHED: "REVIEW_LOCATIONS_FETCHED",
  REVIEWS_FETCHED: "REVIEWS_FETCHED",

  // ── oauth ─────────────────────────────────────────────────────────────────────────
  REVIEW_AUTH_URL_GENERATED: "REVIEW_AUTH_URL_GENERATED",
  REVIEW_OAUTH_CONNECTED: "REVIEW_OAUTH_CONNECTED",

  // ── errors / domain rules ─────────────────────────────────────────────────────────
  REVIEW_OAUTH_MISSING_CODE: "REVIEW_OAUTH_MISSING_CODE",
  REVIEW_INTEGRATION_ERROR: "REVIEW_INTEGRATION_ERROR",
};
