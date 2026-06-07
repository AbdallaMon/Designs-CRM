// projects/task routes — the authenticated tasks surface (legacy `/shared/tasks`).
// Mounted under `/v2/tasks`. Auth once; per-route permission; object-scoped routes
// (GET /:id, PUT /:taskId, DELETE /:id) carry the parent-project scope checker.
//
// ROUTE ORDER: the literal `/notes` paths are declared BEFORE `/:id` so they are not
// shadowed by the param route.
import { Router } from "express";
import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { PERMISSIONS } from "@dms/shared";
import { taskController } from "./task.controller.js";
import { TaskValidation } from "./task.validation.js";

const P = PERMISSIONS.TASK;
const router = Router();

router.use(AuthMiddleware.requireAuth);

// ── notes (literal — before /:id) ────────────────────────────────────────────────
router.get("/notes", AuthMiddleware.requirePermissions([P.LIST]), asyncHandler(taskController.notes));
router.post(
  "/notes",
  AuthMiddleware.requirePermissions([P.NOTE_MANAGE]),
  validate(TaskValidation.addNote),
  asyncHandler(taskController.addNote),
);

// ── tasks list / create (collection; no object checker) ───────────────────────────
router.get("/", AuthMiddleware.requirePermissions([P.LIST]), asyncHandler(taskController.list));
router.post(
  "/",
  AuthMiddleware.requirePermissions([P.CREATE]),
  validate(TaskValidation.createTask),
  asyncHandler(taskController.create),
);

// ── task detail (object-scoped READ via parent project) ──────────────────────────
router.get(
  "/:id",
  AuthMiddleware.requirePermissions([P.VIEW]),
  validate(TaskValidation.idParams, "params"),
  AuthMiddleware.requireSpecialChecker(taskController.checkIfUserCanAccessTask),
  asyncHandler(taskController.getById),
);

// ── task update (object-scoped MUTATE via parent project) — param is :taskId ──────
router.put(
  "/:taskId",
  AuthMiddleware.requirePermissions([P.EDIT]),
  validate(TaskValidation.taskIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(taskController.checkIfUserCanMutateTask),
  validate(TaskValidation.updateTask),
  asyncHandler(taskController.update),
);

// ── generic delete (object-scoped MUTATE when model === "Task") — param is :id ────
router.delete(
  "/:id",
  AuthMiddleware.requirePermissions([P.DELETE]),
  validate(TaskValidation.idParams, "params"),
  validate(TaskValidation.remove),
  asyncHandler(taskController.remove),
);

export { router as taskRouter };
