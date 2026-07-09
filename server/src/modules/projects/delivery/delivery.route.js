// projects/delivery routes — the authenticated delivery-schedule surface (legacy
// `/shared/delivery`). Mounted under `/v2/delivery`. Auth once; per-route permission;
// every object-scoped route resolves the parent project and runs the SHARED project
// scope checker (the IDOR fix the legacy `/:deliveryId/*` and `/:projectId/schedules`
// routes lacked). The link-meeting action moves to `POST /:deliveryId/actions/link-meeting`.
import { Router } from "express";
import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { PERMISSIONS } from "@dms/shared";
import { deliveryController } from "./delivery.controller.js";
import { DeliveryValidation } from "./delivery.validation.js";

const P = PERMISSIONS.DELIVERY;
const router = Router();

router.use(AuthMiddleware.requireAuth);

// ── create delivery schedule (project id in body — object-scoped on it) ──────────
router.post(
  "/",
  AuthMiddleware.requirePermissions([P.CREATE]),
  validate(DeliveryValidation.create),
  AuthMiddleware.requireSpecialChecker(deliveryController.checkIfUserCanMutateProjectFromBody),
  asyncHandler(deliveryController.create),
);

// ── delivery schedules of a project (object-scoped READ) ─────────────────────────
router.get(
  "/:projectId/schedules",
  AuthMiddleware.requirePermissions([P.LIST]),
  validate(DeliveryValidation.projectIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(deliveryController.checkIfUserCanAccessProject),
  asyncHandler(deliveryController.schedules),
);

// ── link a delivery to a meeting → workflow action (was POST /:deliveryId/link-meeting) ──
router.post(
  "/:deliveryId/actions/link-meeting",
  AuthMiddleware.requirePermissions([P.LINK_MEETING]),
  validate(DeliveryValidation.deliveryIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(deliveryController.checkIfUserCanMutateDelivery),
  validate(DeliveryValidation.linkMeeting),
  asyncHandler(deliveryController.linkMeeting),
);

// ── delete a delivery schedule (object-scoped MUTATE via parent project) ─────────
router.delete(
  "/:deliveryId",
  AuthMiddleware.requirePermissions([P.DELETE]),
  validate(DeliveryValidation.deliveryIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(deliveryController.checkIfUserCanMutateDelivery),
  asyncHandler(deliveryController.remove),
);

export { router as deliveryRouter };
