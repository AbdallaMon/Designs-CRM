// projects/project routes — the authenticated projects-management surface (legacy
// `/shared/projects`). Mounted under `/v2/projects` (legacy router stays mounted in
// parallel during the strangler window). Auth once at the router; each route declares
// its permission code(s); every object-scoped route ALSO carries the object-scope
// checker (requireSpecialChecker) — the IDOR fix the legacy routes lacked. Status
// changes move to `POST /:.../actions/<kebab>` per the workflow convention.
//
// ROUTE ORDER: literal paths are declared BEFORE the `/:id` catch-all so they are not
// shadowed (Express matches in declaration order).
import { Router } from "express";
import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { PERMISSIONS } from "@dms/shared";
import { projectController } from "./project.controller.js";
import { ProjectValidation } from "./project.validation.js";

const P = PERMISSIONS.PROJECT;
const router = Router();

router.use(AuthMiddleware.requireAuth);

// ── designer board lists (collection reads; narrowed by role/self, no object checker) ──
router.get("/designers", AuthMiddleware.requirePermissions([P.LIST]), asyncHandler(projectController.designers));
router.get("/designers/columns", AuthMiddleware.requirePermissions([P.LIST]), asyncHandler(projectController.designerColumns));

// ── designer-board project status change → workflow action (was PUT /designers/:leadId/status).
//    Object scope keys off the PROJECT id in the BODY (body.id), not :leadId. Declared
//    before /designers/:id so the literal `actions` segment is unambiguous. ──
router.post(
  "/designers/:leadId/actions/change-status",
  AuthMiddleware.requirePermissions([P.MANAGE]),
  validate(ProjectValidation.leadIdParams, "params"),
  validate(ProjectValidation.changeStatus),
  AuthMiddleware.requireSpecialChecker(projectController.checkIfUserCanMutateProjectFromBody),
  asyncHandler(projectController.changeDesignerStatus),
);

// ── lead-by-project detail (object-scoped READ) ──────────────────────────────────
router.get(
  "/designers/:id",
  AuthMiddleware.requirePermissions([P.VIEW]),
  validate(ProjectValidation.idParams, "params"),
  AuthMiddleware.requireSpecialChecker(projectController.checkIfUserCanAccessProject),
  asyncHandler(projectController.designerLeadDetail),
);

// ── other literal list surfaces (before /:id) ─────────────────────────────────────
router.get("/archived", AuthMiddleware.requirePermissions([P.LIST]), asyncHandler(projectController.archived));
router.get(
  "/user-profile/:userId",
  AuthMiddleware.requirePermissions([P.LIST]),
  validate(ProjectValidation.userIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(projectController.checkIfUserCanAccessUserProfile),
  asyncHandler(projectController.userProjects),
);

// ── projects list by clientLead (?clientLeadId) — object-scoped on the lead ───────
router.get(
  "/",
  AuthMiddleware.requirePermissions([P.LIST]),
  validate(ProjectValidation.listQuery, "query"),
  AuthMiddleware.requireSpecialChecker(projectController.checkIfUserCanAccessLeadProjects),
  asyncHandler(projectController.listByClientLead),
);

// ── unique project groups for a lead (object-scoped on the lead) ──────────────────
router.get(
  "/:leadId/groups",
  AuthMiddleware.requirePermissions([P.LIST]),
  validate(ProjectValidation.leadIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(projectController.checkIfUserCanAccessLeadProjects),
  asyncHandler(projectController.groups),
);

// ── project detail (object-scoped READ) ──────────────────────────────────────────
router.get(
  "/:id",
  AuthMiddleware.requirePermissions([P.VIEW]),
  validate(ProjectValidation.idParams, "params"),
  AuthMiddleware.requireSpecialChecker(projectController.checkIfUserCanAccessProject),
  asyncHandler(projectController.getById),
);

// ── plain field/status edit (object-scoped MUTATE) ───────────────────────────────
router.put(
  "/:id",
  AuthMiddleware.requirePermissions([P.EDIT]),
  validate(ProjectValidation.idParams, "params"),
  AuthMiddleware.requireSpecialChecker(projectController.checkIfUserCanMutateProject),
  validate(ProjectValidation.updateProject),
  asyncHandler(projectController.updateProject),
);

// ── assign / unassign a designer → workflow action (was PUT /:id/assign-designer) ──
router.post(
  "/:id/actions/assign-designer",
  AuthMiddleware.requirePermissions([P.MANAGE]),
  validate(ProjectValidation.idParams, "params"),
  AuthMiddleware.requireSpecialChecker(projectController.checkIfUserCanMutateProject),
  validate(ProjectValidation.assignDesigner),
  asyncHandler(projectController.assignDesigner),
);

export { router as projectRouter };
