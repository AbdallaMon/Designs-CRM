// utilities routes — the lookup/pick-list helper surface. Mounted under `/v2/utilities`.
// Authentication is mounted ONCE here; each route declares its UTILITY.* permission code
// (granted to EVERY authed role via SHARED_AUTHED — exactly reproducing the legacy gates:
// `/shared/utilities/*` = the SHARED router gate = all 9 authed roles; `/utility/search` =
// verifyTokenUsingReq = any logged-in user).
//
// These are generic reads with no per-record owner to scope-check (legacy applied no
// object scope), so the permission CODE is the gate — matching legacy. The generic-model
// reads (`/` and `/ids`) ADD a model allow-list + fixed server-side projection in the
// usecase/repo (the mass-read + select/include hardening). The user-log routes are
// self-scoped to the authenticated user in the usecase (the IDOR hardening) — no client
// `userId` is accepted.
//
// Endpoint map (legacy → v2), all paths preserved 1:1 except the prefix:
//   GET  /shared/utilities/fixed-data       → GET  /v2/utilities/fixed-data
//   GET  /shared/utilities/user-logs        → GET  /v2/utilities/user-logs
//   POST /shared/utilities/user-logs        → POST /v2/utilities/user-logs
//   GET  /shared/utilities/users/role/:userId → GET /v2/utilities/users/role/:userId
//   GET  /shared/utilities/users/admins     → GET  /v2/utilities/users/admins
//   GET  /shared/utilities/roles            → GET  /v2/utilities/roles
//   GET  /shared/utilities/images           → GET  /v2/utilities/images
//   GET  /shared/utilities/ids              → GET  /v2/utilities/ids
//   GET  /shared/utilities/                 → GET  /v2/utilities/        (generic model read)
//   GET  /utility/search                    → GET  /v2/utilities/search
// NOTE: notifications (legacy `/shared/utilities/notifications`) move to the dedicated
// `/v2/notifications` module (self-scoped); they are NOT served here.
import { Router } from "express";
import { AuthMiddleware } from "../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { PERMISSIONS } from "@dms/shared";
import { utilityController } from "./utility.controller.js";
import { UtilityValidation } from "./utility.validation.js";

const P = PERMISSIONS.UTILITY;
const router = Router();

// Authentication mounted once for the whole utilities surface.
router.use(AuthMiddleware.requireAuth);

// ── fixed data ───────────────────────────────────────────────────────────────────────
router.get(
  "/fixed-data",
  AuthMiddleware.requirePermissions([P.FIXED_DATA_LIST]),
  asyncHandler(utilityController.listFixedData),
);

// ── user logs ─────────────────────────────────────────────────────────────────────────
router.get(
  "/user-logs",
  AuthMiddleware.requirePermissions([P.USER_LOG_VIEW]),
  validate(UtilityValidation.userLogQuery, "query"),
  asyncHandler(utilityController.checkUserLog),
);
router.post(
  "/user-logs",
  AuthMiddleware.requirePermissions([P.USER_LOG_SUBMIT]),
  validate(UtilityValidation.submitUserLog),
  asyncHandler(utilityController.submitUserLog),
);

// ── users / admins / roles ────────────────────────────────────────────────────────────
router.get(
  "/users/role/:userId",
  AuthMiddleware.requirePermissions([P.USER_ROLE_VIEW]),
  validate(UtilityValidation.userIdParams, "params"),
  asyncHandler(utilityController.getUserRole),
);
router.get(
  "/users/admins",
  AuthMiddleware.requirePermissions([P.ADMIN_LIST]),
  asyncHandler(utilityController.getAdmins),
);
router.get(
  "/roles",
  AuthMiddleware.requirePermissions([P.USER_ROLE_VIEW]),
  asyncHandler(utilityController.getRoles),
);

// ── images ────────────────────────────────────────────────────────────────────────────
router.get(
  "/images",
  AuthMiddleware.requirePermissions([P.IMAGE_LIST]),
  validate(UtilityValidation.imagesQuery, "query"),
  asyncHandler(utilityController.getImages),
);

// ── cross-model search (legacy `/utility/search`) ──────────────────────────────────────
router.get(
  "/search",
  AuthMiddleware.requirePermissions([P.SEARCH]),
  asyncHandler(utilityController.search),
);

// ── generic model reads (allow-listed) ─────────────────────────────────────────────────
router.get(
  "/ids",
  AuthMiddleware.requirePermissions([P.MODEL_READ]),
  validate(UtilityValidation.modelQuery, "query"),
  asyncHandler(utilityController.getModelIds),
);
// Bare root model read — declared LAST (exact-match path; the literal routes above win).
router.get(
  "/",
  AuthMiddleware.requirePermissions([P.MODEL_READ]),
  validate(UtilityValidation.modelQuery, "query"),
  asyncHandler(utilityController.getModelData),
);

export { router as utilityRouter };
