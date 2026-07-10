// command-center routes — the ADMIN/SUPER_ADMIN-only operational cockpit. Mounted under
// `/v2/command-center`. Authentication is mounted ONCE here; the single composite read is
// gated by the `command_center.view` permission code (granted to ADMIN + SUPER_ADMIN only,
// mirroring `audit.log.view`). Every aggregation is global (no per-record owner), so there is
// no object-scope checker — the code IS the gate. Read-only: no mutations on this surface.
import { Router } from "express";
import { AuthMiddleware } from "../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { PERMISSIONS } from "@dms/shared";
import { commandCenterController } from "./command-center.controller.js";
import { CommandCenterValidation } from "./command-center.validation.js";

const P = PERMISSIONS.COMMAND_CENTER;
const router = Router();

router.use(AuthMiddleware.requireAuth);

router.get(
  "/overview",
  AuthMiddleware.requirePermissions([P.VIEW]),
  validate(CommandCenterValidation.overviewQuery, "query"),
  asyncHandler(commandCenterController.overview),
);

export { router as commandCenterRouter };
