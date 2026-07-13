// admin-residual/fixed-data routes — legacy `/admin/fixed-data*` WRITES (ADMIN gate).
// Mounted under `/v2/admin/fixed-data`. The GET read lives in the utilities module. Auth
// once at the parent aggregate router; gated by ADMIN_RESIDUAL.FIXED_DATA_MANAGE (granted
// to ADMIN/SUPER_ADMIN base + isSuperSales).
//
// Endpoint map (legacy → v2, paths 1:1):
//   POST   /fixed-data       → POST   /v2/admin/fixed-data
//   PUT    /fixed-data/:id    → PUT    /v2/admin/fixed-data/:id
//   DELETE /fixed-data/:id    → DELETE /v2/admin/fixed-data/:id
import { Router } from "express";
import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { PERMISSIONS } from "@dms/shared";
import { fixedDataController } from "./fixed-data.controller.js";
import { FixedDataValidation } from "./fixed-data.validation.js";

const P = PERMISSIONS.ADMIN_RESIDUAL;
const router = Router();

router.post(
  "/",
  AuthMiddleware.requirePermissions([P.FIXED_DATA_MANAGE]),
  validate(FixedDataValidation.createBody),
  asyncHandler(fixedDataController.createFixedData),
);
router.put(
  "/:id",
  AuthMiddleware.requirePermissions([P.FIXED_DATA_MANAGE]),
  validate(FixedDataValidation.idParam, "params"),
  validate(FixedDataValidation.updateBody),
  asyncHandler(fixedDataController.updateFixedData),
);
router.delete(
  "/:id",
  AuthMiddleware.requirePermissions([P.FIXED_DATA_MANAGE]),
  validate(FixedDataValidation.idParam, "params"),
  asyncHandler(fixedDataController.deleteFixedData),
);

export { router as fixedDataRouter };
