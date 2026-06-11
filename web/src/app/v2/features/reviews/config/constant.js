// Reviews domain — API contract surface. All paths are RELATIVE to the v2 API base
// (apiFetch is configured with config.apiUrl === /v2; do NOT prefix with /v2 here). One
// place to edit if a backend path changes (reconciliation point vs
// server/src/modules/reviews/reviews.route.js).
//
// SCOPE: the thin Google Business Profile OAuth review integration (legacy `/shared/reviews/*`,
// now `/v2/reviews/*`). A STUDIO-WIDE integration owned by the behavior-frozen
// `services/reviews.js` (single shared oauth2Client, no per-user state). NO object scope — the
// REVIEW.* CODE is the gate. Tokens are NEVER returned or logged by the BE.
//
// OAuth note (PORTED QUIRK — flagged, not changed): the Google redirect URI configured in the
// frozen `services/reviews.js` is a stale dev placeholder
// (`http://localhost:4000/shared/oauth2callback`) with EMPTY client id/secret — the flow is
// effectively NON-FUNCTIONAL in its current form. To preserve observable behavior 1:1 the
// callback stays AUTHED (REVIEW.CONNECT). There is NO `state` param in this flow. The OAuth
// callback (`/oauth2callback`) is a BROWSER REDIRECT target Google hits with `?code=` — it is
// NOT meant to be invoked by the FE as a normal data call (Google redirects the browser to
// it). The FE-callable surface is the two READS below (REVIEW.VIEW).
//
// Backend contract (confirmed against reviews.route.js / reviews.validation.js):
//   GET /oauth2callback?code=   → OAuth completion (BROWSER REDIRECT; not a FE data call)   [review.connect]
//   GET /locations?code=        → list Google Business locations                            [review.view]
//   GET /reviews?accountId=&locationId=  → list reviews for a location                      [review.view]

export const REVIEWS_BASE = "reviews";

export const OAUTH_CALLBACK_URL = `${REVIEWS_BASE}/oauth2callback`;
export const LOCATIONS_URL = `${REVIEWS_BASE}/locations`;
export const REVIEWS_URL = `${REVIEWS_BASE}/reviews`;
