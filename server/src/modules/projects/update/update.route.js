// projects/update routes — the authenticated updates/approvals surface (legacy
// `/shared/updates`). Mounted under `/v2/updates`. Auth once; per-route permission;
// every object-scoped route resolves the parent clientLead and runs the SHARED
// project-lead scope checker (the IDOR fix the legacy `/:updateId/*` routes lacked).
// Status/state changes move to `POST /.../actions/<kebab>` per the workflow convention.
//
// ROUTE ORDER: literal-prefixed paths (`/shared-settings/...`, `/shared-updates/...`)
// are declared BEFORE the `/:clientLeadId` and `/:updateId` param routes so they are
// not shadowed.
import { Router } from "express";
import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { PERMISSIONS } from "@dms/shared";
import { updateController } from "./update.controller.js";
import { UpdateValidation } from "./update.validation.js";

const P = PERMISSIONS.UPDATE;
const router = Router();

router.use(AuthMiddleware.requireAuth);

// ── shared-settings read (literal — before /:clientLeadId) ────────────────────────
router.get(
  "/shared-settings/:updateId",
  AuthMiddleware.requirePermissions([P.LIST]),
  validate(UpdateValidation.updateIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(updateController.checkIfUserCanAccessUpdate),
  asyncHandler(updateController.sharedSettings),
);

// ── shared-update archive → workflow action (was PUT /shared-updates/:sharedUpdateId/archive) ──
router.post(
  "/shared-updates/:sharedUpdateId/actions/archive",
  AuthMiddleware.requirePermissions([P.ARCHIVE]),
  validate(UpdateValidation.sharedUpdateIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(updateController.checkIfUserCanAccessSharedUpdate),
  validate(UpdateValidation.archive),
  asyncHandler(updateController.archiveShared),
);

// ── update workflow actions (literal `actions` segment; before bare /:clientLeadId) ──
router.post(
  "/:updateId/actions/authorize",
  AuthMiddleware.requirePermissions([P.AUTHORIZE]),
  validate(UpdateValidation.updateIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(updateController.checkIfUserCanAccessUpdate),
  validate(UpdateValidation.authorize),
  asyncHandler(updateController.authorize),
);
router.post(
  "/:updateId/actions/authorize-shared",
  AuthMiddleware.requirePermissions([P.AUTHORIZE]),
  validate(UpdateValidation.updateIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(updateController.checkIfUserCanAccessUpdate),
  validate(UpdateValidation.authorize),
  asyncHandler(updateController.authorizeShared),
);
router.post(
  "/:updateId/actions/archive",
  AuthMiddleware.requirePermissions([P.ARCHIVE]),
  validate(UpdateValidation.updateIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(updateController.checkIfUserCanAccessUpdate),
  validate(UpdateValidation.archive),
  asyncHandler(updateController.archive),
);
router.post(
  "/:updateId/actions/mark-done",
  AuthMiddleware.requirePermissions([P.MARK_DONE]),
  validate(UpdateValidation.updateIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(updateController.checkIfUserCanAccessUpdate),
  validate(UpdateValidation.markDone),
  asyncHandler(updateController.markDone),
);

// ── list / create updates for a lead (object-scoped on the lead) ──────────────────
router.get(
  "/:clientLeadId",
  AuthMiddleware.requirePermissions([P.LIST]),
  validate(UpdateValidation.clientLeadIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(updateController.checkIfUserCanAccessLead),
  asyncHandler(updateController.list),
);
router.post(
  "/:clientLeadId",
  AuthMiddleware.requirePermissions([P.CREATE]),
  validate(UpdateValidation.clientLeadIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(updateController.checkIfUserCanAccessLead),
  validate(UpdateValidation.createUpdate),
  asyncHandler(updateController.create),
);

export { router as updateRouter };
