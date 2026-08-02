// Authenticated lookup, upload-adjacent metadata, and scoped search endpoints.
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

// ── users / admins / profiles ─────────────────────────────────────────────────────────
router.get(
  "/users/:userId/current-profile",
  AuthMiddleware.requirePermissions([P.USER_PROFILE_VIEW]),
  validate(UtilityValidation.userIdParams, "params"),
  asyncHandler(utilityController.getUserCurrentProfile),
);
router.get(
  "/users/admins",
  AuthMiddleware.requirePermissions([P.ADMIN_LIST]),
  asyncHandler(utilityController.getAdmins),
);
// ── images ────────────────────────────────────────────────────────────────────────────
router.get(
  "/images",
  AuthMiddleware.requirePermissions([P.IMAGE_LIST]),
  validate(UtilityValidation.imagesQuery, "query"),
  asyncHandler(utilityController.getImages),
);

// ── scoped cross-resource search ────────────────────────────────────────────────────────
router.get(
  "/search",
  AuthMiddleware.requirePermissions([P.SEARCH]),
  validate(UtilityValidation.searchQuery, "query"),
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
