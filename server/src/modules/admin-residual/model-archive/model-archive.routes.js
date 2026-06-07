// admin-residual/model-archive routes — legacy PATCH `/admin/model/archived/:id?model=<x>`
// (ADMIN gate). Mounted under `/v2/admin/model/archived`. Auth once at the parent aggregate
// router; gated by ADMIN_RESIDUAL.MODEL_ARCHIVE (granted to ADMIN/SUPER_ADMIN base +
// isSuperSales). The `model` query is allow-listed (validation + usecase) — the hardening.
//
// Endpoint map (legacy → v2, path 1:1):
//   PATCH /model/archived/:id?model=<x> → PATCH /v2/admin/model/archived/:id?model=<x>
import { Router } from "express";
import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { PERMISSIONS } from "@dms/shared";
import { modelArchiveController } from "./model-archive.controller.js";
import { ModelArchiveValidation as V } from "./model-archive.validation.js";

const P = PERMISSIONS.ADMIN_RESIDUAL;
const router = Router();

router.patch(
  "/archived/:id",
  AuthMiddleware.requirePermissions([P.MODEL_ARCHIVE]),
  validate(V.idParam, "params"),
  validate(V.query, "query"),
  validate(V.body),
  asyncHandler(modelArchiveController.archive),
);

export { router as modelArchiveRouter };
