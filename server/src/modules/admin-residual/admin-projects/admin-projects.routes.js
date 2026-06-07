// admin-residual/admin-projects routes — legacy `/admin/projects` + `/admin/projects/
// create-group` (ADMIN gate). Mounted under `/v2/admin/projects`. Auth once at the parent
// aggregate router.
//
// OVERLAP: neither endpoint exists in the v2 projects module (the projects `GET /` is
// clientLead-scoped; this is a global leads-with-projects aggregation) — see the usecase.
//
// Endpoint map (legacy → v2, paths 1:1):
//   GET  /projects               → GET  /v2/admin/projects               (PROJECT_VIEW)
//   POST /projects/create-group  → POST /v2/admin/projects/create-group  (PROJECT_GROUP_CREATE,
//                                   + lead-scope checker on body.clientLeadId)
import { Router } from "express";
import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { PERMISSIONS } from "@dms/shared";
import { adminProjectsController } from "./admin-projects.controller.js";
import { AdminProjectsValidation as V } from "./admin-projects.validation.js";

const P = PERMISSIONS.ADMIN_RESIDUAL;
const router = Router();

// literal /create-group before the bare / list (both distinct methods, but keep order clear)
router.post(
  "/create-group",
  AuthMiddleware.requirePermissions([P.PROJECT_GROUP_CREATE]),
  validate(V.createGroupBody),
  AuthMiddleware.requireSpecialChecker(adminProjectsController.checkIfUserCanMutateLeadFromBody),
  asyncHandler(adminProjectsController.createGroup),
);
router.get(
  "/",
  AuthMiddleware.requirePermissions([P.PROJECT_VIEW]),
  validate(V.listQuery, "query"),
  asyncHandler(adminProjectsController.list),
);

export { router as adminProjectsRouter };
