// accounting/rent routes — rents (legacy `/accountant/rents*`). Mounted under
// `/v2/accounting/rents`. Auth once at the parent router. The renew (PUT /:rentId)
// carries an existence guard so a forged id 404s before the renew + outcome writes.
//
// The legacy `PUT /rents/:rentId` (renew) keeps PUT semantics here: it is a field-style
// renewal that appends a RentPeriod, not a status/workflow transition, so it does not
// become a `/:id/actions/*` route.
import { Router } from "express";
import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { PERMISSIONS } from "@dms/shared";
import { rentController } from "./rent.controller.js";
import { RentValidation } from "./rent.validation.js";

const P = PERMISSIONS.ACCOUNTING;
const router = Router();

router.get("/", AuthMiddleware.requirePermissions([P.RENT_LIST]), asyncHandler(rentController.list));
router.post(
  "/",
  AuthMiddleware.requirePermissions([P.RENT_CREATE]),
  validate(RentValidation.create),
  asyncHandler(rentController.create),
);
router.put(
  "/:rentId",
  AuthMiddleware.requirePermissions([P.RENT_RENEW]),
  validate(RentValidation.rentIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(rentController.checkRentExists),
  validate(RentValidation.renew),
  asyncHandler(rentController.renew),
);

export { router as rentRouter };
