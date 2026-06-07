// reviews usecase — orchestration ONLY. The Google Business Profile OAuth/review flow is
// owned by the legacy `services/reviews.js` and is BEHAVIOR-FROZEN: this usecase only
// invokes it via lazy adapters; it never duplicates the OAuth token exchange and NEVER
// logs or returns access/refresh tokens or the client secret.
//
// SCOPE: this is a studio-wide integration (a single shared oauth2Client with in-memory
// credentials — there is NO per-user state in the legacy flow). There is therefore no
// per-record object scope; the permission CODE is the gate (matching legacy, which had
// only the SHARED router gate). The acting user is irrelevant to the flow and is never
// taken from the request body.
//
// TOKEN-EXPOSURE FIX: the legacy OAuth callback returned the raw `tokens` object in the
// JSON body. v2 still completes the exchange (the frozen service sets the credentials on
// the shared client) but returns ONLY a connected flag — no token leaves the server.
import { AppError } from "../../shared/errors/AppError.js";
import { reviewsMessagesCodes as C } from "@dms/shared";

const legacyDefaults = {
  handleOAuthCallback: (code) =>
    import("../../../services/reviews.js").then((m) => m.handleOAuthCallback(code)),
  getLocations: (code) =>
    import("../../../services/reviews.js").then((m) => m.getLocations(code)),
  getReviews: (accountId, locationId) =>
    import("../../../services/reviews.js").then((m) => m.getReviews(accountId, locationId)),
  createAuthUrl: () =>
    import("../../../services/reviews.js").then((m) => m.createAuthUrl()),
};

export class ReviewsUsecase {
  constructor(legacy = {}) {
    this.legacy = { ...legacyDefaults, ...legacy };
  }

  // ── GET /oauth2callback ────────────────────────────────────────────────────────
  // Complete the OAuth exchange. The frozen service sets the credentials on the shared
  // client and returns the raw tokens — we DISCARD them and return only a connected flag
  // (the legacy token-exposure fix). NEVER log code/tokens.
  async handleOAuthCallback({ code }) {
    if (!code) {
      throw new AppError(C.REVIEW_OAUTH_MISSING_CODE, 400);
    }
    await this.legacy.handleOAuthCallback(code);
    return { connected: true };
  }

  // ── GET /locations ─────────────────────────────────────────────────────────────
  // Returns { accountId, locations } from the Google Business API (no tokens). Legacy
  // passed req.query.code through unused; preserved for 1:1 compat.
  async getLocations({ code } = {}) {
    return this.legacy.getLocations(code);
  }

  // ── GET /reviews ───────────────────────────────────────────────────────────────
  async getReviews({ accountId, locationId }) {
    return this.legacy.getReviews(accountId, locationId);
  }
}

export const reviewsUsecase = new ReviewsUsecase();
