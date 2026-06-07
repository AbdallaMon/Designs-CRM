// client-portal/notes route — PUBLIC client notes. Legacy `routes/client/notes.js`
// (`GET /notes`, `POST /notes`), mounted PATHLESS under `/client`. Mounted under v2 at
// `/v2/client/notes`. PUBLIC BY DESIGN — the client portal has no login session; the note
// author is forced to ADMIN by the frozen service. `idKey` is constrained to a lead-related
// allow-list in validation (dynamic-key / mass-assignment hardening — IDOR-class close vs the
// legacy raw `req.body`/`req.query` pass-through). Bodies are `.strict()`.
import { Router } from "express";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { notesController as c } from "./notes.controller.js";
import { NotesValidation as V } from "./notes.validation.js";

const router = Router();

router.get("/", validate(V.listQuery, "query"), asyncHandler(c.list));
router.post("/", validate(V.create), asyncHandler(c.create));

export { router as clientNotesRouter };
