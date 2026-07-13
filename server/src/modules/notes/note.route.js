// notes route — the AUTHENTICATED generic note surface. Restores master's `shared/index.js`
// `GET /notes` + `POST /notes` (a single polymorphic endpoint keyed by `idKey`) that the
// migration decomposed into the shared `note.usecase` module fns but never re-mounted. The
// frontend `NotesComponent` (slug="shared") maps `shared/notes` → `notes` via apiPathMap, so
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

const router = Router();

router.use(AuthMiddleware.requireAuth);

router.get("/", validate(NoteValidation.listQuery, "query"), asyncHandler(noteController.getNotes));
router.post("/", validate(NoteValidation.addNote), asyncHandler(noteController.createNote));

export { router as noteRouter };
