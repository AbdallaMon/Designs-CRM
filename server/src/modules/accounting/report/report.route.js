// accounting/report routes — outcome list (legacy `/accountant/outcome`) and the
// income/outcome summary (legacy `/accountant/summary`). Mounted under
// `/v2/accounting/outcome` and `/v2/accounting/summary`. Auth once at the parent router.
import { Router } from "express";
import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { PERMISSIONS } from "@dms/shared";
import { reportController } from "./report.controller.js";

const P = PERMISSIONS.ACCOUNTING;

const outcomeRouter = Router();
outcomeRouter.get("/", AuthMiddleware.requirePermissions([P.OUTCOME_LIST]), asyncHandler(reportController.outcomes));

const summaryRouter = Router();
summaryRouter.get("/", AuthMiddleware.requirePermissions([P.SUMMARY_VIEW]), asyncHandler(reportController.summary));

export { outcomeRouter, summaryRouter };
