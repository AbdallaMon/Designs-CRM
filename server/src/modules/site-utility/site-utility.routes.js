import { Router } from "express";
import { AuthMiddleware } from "../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { PERMISSIONS } from "@dms/shared";
import { siteUtilityController } from "./site-utility.controller.js";
import { SiteUtilityValidation } from "./site-utility.validation.js";

const P = PERMISSIONS.SITE_UTILITY;

const siteUtilityRouter = Router();

// SECURITY FIX vs legacy: the legacy `/site-utilities` routes were behind SHARED
// authentication only (any logged-in role). These are global admin config, so we
// require auth + the per-action site_utility permission code (granted to ADMIN /
// SUPER_ADMIN only in ROLE_PERMISSIONS). No object-scope checker is needed — these
// are singleton/global records, not per-owner objects.
siteUtilityRouter.use(AuthMiddleware.requireAuth);

// ── PDF config (singleton) ─────────────────────────────────────────────────────
siteUtilityRouter.get(
  "/pdf-utility",
  AuthMiddleware.requirePermissions([P.PDF_CONFIG_VIEW]),
  asyncHandler(siteUtilityController.getPdfConfig),
);
siteUtilityRouter.post(
  "/pdf-utility",
  AuthMiddleware.requirePermissions([P.PDF_CONFIG_EDIT]),
  validate(SiteUtilityValidation.updatePdfConfigSchema),
  asyncHandler(siteUtilityController.updatePdfConfig),
);

// ── Contract payment conditions ────────────────────────────────────────────────
siteUtilityRouter.get(
  "/contract-payment-conditions",
  AuthMiddleware.requirePermissions([P.PAYMENT_CONDITION_LIST]),
  asyncHandler(siteUtilityController.listPaymentConditions),
);
siteUtilityRouter.post(
  "/contract-payment-conditions",
  AuthMiddleware.requirePermissions([P.PAYMENT_CONDITION_CREATE]),
  validate(SiteUtilityValidation.createPaymentConditionSchema),
  asyncHandler(siteUtilityController.createPaymentCondition),
);
siteUtilityRouter.put(
  "/contract-payment-conditions/:id",
  AuthMiddleware.requirePermissions([P.PAYMENT_CONDITION_EDIT]),
  validate(SiteUtilityValidation.idParams, "params"),
  validate(SiteUtilityValidation.updatePaymentConditionSchema),
  asyncHandler(siteUtilityController.updatePaymentCondition),
);
siteUtilityRouter.delete(
  "/contract-payment-conditions/:id",
  AuthMiddleware.requirePermissions([P.PAYMENT_CONDITION_DELETE]),
  validate(SiteUtilityValidation.idParams, "params"),
  asyncHandler(siteUtilityController.deletePaymentCondition),
);

export { siteUtilityRouter };
