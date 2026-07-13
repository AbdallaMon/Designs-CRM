// audit routes — the ADMIN-ONLY action-audit viewer. Mounted under `/v2/audit-logs`.
// Authentication is mounted ONCE here; the single read route is gated by the
// `audit.log.view` permission code (granted to ADMIN + SUPER_ADMIN only). Every row is
// global (no per-record owner), so there is no object-scope checker — the code IS the
// gate. Read-only: the trail is append-only, written from usecases via recordAction.
import { Router } from "express";
import { AuthMiddleware } from "../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { PERMISSIONS } from "@dms/shared";
import { auditController } from "./audit.controller.js";
import { AuditValidation } from "./audit.validation.js";

const P = PERMISSIONS.AUDIT;
const router = Router();

router.use(AuthMiddleware.requireAuth);

router.get(
  "/",
  AuthMiddleware.requirePermissions([P.LOG_VIEW]),
  validate(AuditValidation.listQuery, "query"),
  asyncHandler(auditController.getAuditLogs),
);

export { router as auditRouter };
