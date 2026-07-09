// admin-residual/commissions routes — legacy `/admin/commissions*` (ADMIN gate). Mounted
// under `/v2/admin/commissions`. Auth once at the parent aggregate router; every route
// gated by ADMIN_RESIDUAL.COMMISSION_* (granted to ADMIN/SUPER_ADMIN base + isSuperSales).
//
// Endpoint map (legacy → v2, paths 1:1):
//   GET  /commissions      → GET  /v2/admin/commissions        (COMMISSION_VIEW)
//   POST /commissions      → POST /v2/admin/commissions        (COMMISSION_MANAGE)
//   PUT  /commissions/:id  → PUT  /v2/admin/commissions/:id    (COMMISSION_MANAGE)
import { Router } from "express";
import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { PERMISSIONS } from "@dms/shared";
import { commissionsController } from "./commissions.controller.js";
import { CommissionsValidation as V } from "./commissions.validation.js";

const P = PERMISSIONS.ADMIN_RESIDUAL;
const router = Router();

router.get(
  "/",
  AuthMiddleware.requirePermissions([P.COMMISSION_VIEW]),
  validate(V.listQuery, "query"),
  asyncHandler(commissionsController.list),
);
router.post(
  "/",
  AuthMiddleware.requirePermissions([P.COMMISSION_MANAGE]),
  validate(V.createBody),
  asyncHandler(commissionsController.create),
);
router.put(
  "/:id",
  AuthMiddleware.requirePermissions([P.COMMISSION_MANAGE]),
  validate(V.idParam, "params"),
  validate(V.updateBody),
  asyncHandler(commissionsController.update),
);

export { router as commissionsRouter };
