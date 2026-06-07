// reviews routes — the thin Google Business Profile OAuth review integration (legacy
// `routes/shared/reviews.js`, mounted `/shared/reviews` behind the SHARED gate = all 9
// authed roles). Mounted here under `/v2/reviews`. Authentication is mounted ONCE; every
// route declares its REVIEW.* code (granted to every authed role via SHARED_AUTHED —
// reproducing the legacy SHARED gate exactly).
//
// SCOPE: a studio-wide integration owned by the frozen `services/reviews.js` (single
// shared oauth2Client, no per-user state). No object scope — the code is the gate. The
// OAuth token flow is behavior-frozen; tokens are NEVER returned or logged.
//
// PORTED QUIRK (flagged, not changed): in legacy the OAuth callback inherited the SHARED
// authentication gate (it is a sub-route of the SHARED router). The Google redirect URI
// configured in `services/reviews.js` is a stale dev placeholder
// (`http://localhost:4000/shared/oauth2callback`) with an EMPTY client id/secret — the
// flow is effectively non-functional in its current form. To preserve observable behavior
// 1:1 the callback stays AUTHED here (gated REVIEW.CONNECT). There is NO `state` param in
// this flow at all (unlike the calendar module), so there is no unsigned-state quirk to
// note — the callback derives nothing from the request beyond `code`.
//
// Endpoint map (legacy → v2):
//   GET /oauth2callback   → GET /oauth2callback   (REVIEW.CONNECT)
//   GET /locations        → GET /locations        (REVIEW.VIEW)
//   GET /reviews          → GET /reviews          (REVIEW.VIEW)
import { Router } from "express";
import { AuthMiddleware } from "../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { PERMISSIONS } from "@dms/shared";
import { reviewsController } from "./reviews.controller.js";
import { ReviewsValidation } from "./reviews.validation.js";

const P = PERMISSIONS.REVIEW;
const router = Router();

router.use(AuthMiddleware.requireAuth);

router.get(
  "/oauth2callback",
  AuthMiddleware.requirePermissions([P.CONNECT]),
  validate(ReviewsValidation.oauthCallbackQuery, "query"),
  asyncHandler(reviewsController.oauthCallback),
);

router.get(
  "/locations",
  AuthMiddleware.requirePermissions([P.VIEW]),
  validate(ReviewsValidation.locationsQuery, "query"),
  asyncHandler(reviewsController.getLocations),
);

router.get(
  "/reviews",
  AuthMiddleware.requirePermissions([P.VIEW]),
  validate(ReviewsValidation.reviewsQuery, "query"),
  asyncHandler(reviewsController.getReviews),
);

export { router as reviewsRouter };
