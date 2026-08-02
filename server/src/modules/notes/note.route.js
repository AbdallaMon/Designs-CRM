// notes route — the AUTHENTICATED generic note surface. Restores master's `shared/index.js`
// `GET /notes` + `POST /notes` (a single polymorphic endpoint keyed by `idKey`) that the
// migration decomposed into the shared `note.usecase` module fns but never re-mounted. The
// Frontend notes use this canonical module route.
// this mounts at `/v2/notes`. Owners without a dedicated scoped endpoint (delivery, commission,
// lead-update, sales-stage) rely on it.
//
// GATING: auth-only, reproducing master exactly (the legacy shared router gated on a valid
// session, not a per-owner permission code). `idKey` is constrained to the real Note owner
// columns in validation (mass-assignment / dynamic-key hardening — a clean 422 instead of a
// Prisma 500 on a bad key), which does not change behavior for any legitimate caller.
import { Router } from "express";
import { AuthMiddleware } from "../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { noteController } from "./note.controller.js";
import { NoteValidation } from "./note.validation.js";
import { PERMISSIONS } from "@dms/shared";

const router = Router();
const P = PERMISSIONS.NOTE;

router.use(AuthMiddleware.requireAuth);

router.get(
  "/",
  AuthMiddleware.requirePermissions([P.LIST]),
  validate(NoteValidation.listQuery, "query"),
  AuthMiddleware.requireSpecialChecker(noteController.checkIfUserCanReadTarget),
  asyncHandler(noteController.getNotes),
);
router.post(
  "/",
  AuthMiddleware.requirePermissions([P.CREATE]),
  validate(NoteValidation.addNote),
  AuthMiddleware.requireSpecialChecker(noteController.checkIfUserCanWriteTarget),
  asyncHandler(noteController.createNote),
);
router.delete(
  "/:id",
  AuthMiddleware.requirePermissions([P.DELETE]),
  validate(NoteValidation.deleteParams, "params"),
  AuthMiddleware.requireSpecialChecker(noteController.checkIfUserCanDeleteNote),
  asyncHandler(noteController.deleteNote),
);

export { router as noteRouter };
