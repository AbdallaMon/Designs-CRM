// accounting/note routes — generic accountant notes (legacy `/accountant/notes`). Mounted
// under `/v2/accounting/notes`. Auth once at the parent router.
import { Router } from "express";
import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { PERMISSIONS } from "@dms/shared";
import { noteController } from "./note.controller.js";
import { NoteValidation } from "./note.validation.js";

const P = PERMISSIONS.ACCOUNTING;
const router = Router();

router.get("/", AuthMiddleware.requirePermissions([P.NOTE_LIST]), asyncHandler(noteController.list));
router.post(
  "/",
  AuthMiddleware.requirePermissions([P.NOTE_CREATE]),
  validate(NoteValidation.create),
  asyncHandler(noteController.create),
);

export { router as noteRouter };
