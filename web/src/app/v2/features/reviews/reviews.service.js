// Reviews data-access service — the ONLY place that talks to the reviews API. Wraps the
// canonical apiFetch (config.apiUrl === /v2). Components/hooks call these helpers, never
// fetch/apiFetch directly. All responses share the { success, message, data, translationKey }
// envelope; helpers return the parsed envelope.
//
// One AUTHED studio-wide surface (apiFetch.* — credentialed, cookie auth) at /v2/reviews. NO
// object scope — the REVIEW.* CODE is the gate. Two FE-callable READS (REVIEW.VIEW). The OAuth
// callback (`/oauth2callback`) is a BROWSER REDIRECT target Google hits with `?code=`; it is
// NOT a normal FE data call, so there is intentionally NO service helper that GETs it from the
// FE (the connect flow is a full-page navigation to Google's consent screen, which then
// redirects the browser to the callback). See config/constant.js for the frozen-quirk note.

import apiFetch from "@/app/v2/lib/api/ApiFetch";
import { LOCATIONS_URL, REVIEWS_URL } from "./config/constant.js";

// Build a query string with top-level params (skips empty/null/undefined). apiFetch.get
// ignores a params arg, so query MUST be embedded in the path.
function buildQuery(base, params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `${base}?${s}` : base;
}

export const reviewsService = {
  // GET /locations?code= → list Google Business locations   [review.view]
  getLocations: (params = {}) => apiFetch.get(buildQuery(LOCATIONS_URL, params)),
  // GET /reviews?accountId=&locationId= → list reviews for a location   [review.view]
  getReviews: (params = {}) => apiFetch.get(buildQuery(REVIEWS_URL, params)),
};

export default reviewsService;
