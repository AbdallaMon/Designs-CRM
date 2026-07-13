// client-portal/notes route — PUBLIC client notes. Legacy `routes/client/notes.js`
// (`GET /notes`, `POST /notes`), mounted PATHLESS under `/client`. Mounted under v2 at
// `/v2/client/notes`. PUBLIC BY DESIGN — the client portal has no login session; the note
// author is forced to ADMIN by the frozen service. `idKey` is constrained to a lead-related
// allow-list in validation (dynamic-key / mass-assignment hardening — IDOR-class close vs the
// legacy raw `req.body`/`req.query` pass-through). Bodies are `.strict()`.
import { Router } from "express";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { notesController } from "./notes.controller.js";
import { NotesValidation } from "./notes.validation.js";
import {
  clientNotesReadLimiter,
  clientNotesWriteLimiter,
} from "./notes.rate-limiter.js";

const router = Router();

// PUBLIC surface → per-IP rate limiting (abuse hardening) in addition to the per-session token
// object-scope check enforced in the usecase.
router.get(
  "/",
  clientNotesReadLimiter,
  validate(NotesValidation.listQuery, "query"),
  asyncHandler(notesController.getNotes),
);
router.post(
  "/",
  clientNotesWriteLimiter,
  validate(NotesValidation.create),
  asyncHandler(notesController.createNote),
);

export { router as clientNotesRouter };
