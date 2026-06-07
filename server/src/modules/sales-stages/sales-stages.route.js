// sales-stages routes — the per-lead sales-pipeline stage progression surface (legacy
// `routes/shared/sales-stages.js`, mounted `/shared/sales-stages` behind the SHARED gate
// = all 9 authed roles). Mounted here under `/v2/sales-stages`. Authentication is mounted
// ONCE; every route declares its SALES_STAGE.* code (granted to every authed role via
// SHARED_AUTHED — reproducing the legacy SHARED gate exactly).
//
// OBJECT SCOPE: SalesStage rows are lead-scoped; the usecase resolves+checks the parent
// lead via the leads-module checker before any read/write (the IDOR fix the legacy route
// was missing). No route-level requireSpecialChecker — the check is in the usecase.
//
// Endpoint map (legacy → v2):
//   GET  /:clientLeadId   → GET  /:clientLeadId               (lead-scoped read)
//   POST /:clientLeadId   → POST /:clientLeadId/actions/set-stage  (workflow action — RENAMED)
//
// RENAME: the legacy stage change was a `POST /:clientLeadId` that advanced/rolled-back a
// system-managed stage. v2 makes it a dedicated workflow action endpoint
// (`/:clientLeadId/actions/set-stage`) per the no-generic-mutation-on-status rule.
import { Router } from "express";
import { AuthMiddleware } from "../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { PERMISSIONS } from "@dms/shared";
import { salesStagesController } from "./sales-stages.controller.js";
import { SalesStagesValidation } from "./sales-stages.validation.js";

const P = PERMISSIONS.SALES_STAGE;
const router = Router();

router.use(AuthMiddleware.requireAuth);

router.get(
  "/:clientLeadId",
  AuthMiddleware.requirePermissions([P.VIEW]),
  validate(SalesStagesValidation.clientLeadIdParam, "params"),
  asyncHandler(salesStagesController.getStages),
);

router.post(
  "/:clientLeadId/actions/set-stage",
  AuthMiddleware.requirePermissions([P.MANAGE]),
  validate(SalesStagesValidation.clientLeadIdParam, "params"),
  validate(SalesStagesValidation.setStageBody),
  asyncHandler(salesStagesController.setStage),
);

export { router as salesStagesRouter };
