// notes controller — thin. The AUTHENTICATED generic note surface (legacy `shared/notes`),
// reached by the shared `NotesComponent` (slug="shared") for every note owner that has no
// dedicated module endpoint (task, delivery, commission, lead-update, sales-stage, …). The
// read/create + all side effects live in the shared `note.usecase` module fns (getNotes /
// addNote); the controller only shapes the request and emits language-neutral codes.
import { ok, created } from "../../shared/http/response.js";
import { projectsMessagesCodes, messagesNames } from "@dms/shared";
import {
  addNote,
  checkNoteDeletionAccess,
  checkNoteTargetAccess,
  deleteNote,
  getNotes,
} from "./note.usecase.js";

const TK = messagesNames.projectsMessages;

class NoteController {
  checkIfUserCanReadTarget(req) {
    return checkNoteTargetAccess({
      idKey: req.query.idKey,
      id: req.query.id,
      authUser: req.auth,
      mode: "view",
    });
  }

  checkIfUserCanWriteTarget(req) {
    return checkNoteTargetAccess({
      idKey: req.body.idKey,
      id: req.body.id,
      authUser: req.auth,
      mode: "mutate",
    });
  }

  checkIfUserCanDeleteNote(req) {
    return checkNoteDeletionAccess({ id: req.params.id, authUser: req.auth });
  }

  // GET /notes?idKey=<owner>&id=<n>
  async getNotes(req, res) {
    const data = await getNotes({ idKey: req.query.idKey, id: req.query.id });
    return ok(res, data, projectsMessagesCodes.NOTES_FETCHED, TK);
  }

  // POST /notes — author forced to the acting user; a client-supplied userId is NEVER honored.
  async createNote(req, res) {
    const isAdmin = Boolean(req.auth?.isAdminTier);
    const data = await addNote({ ...req.body, userId: req.auth.id, isAdmin });
    return created(res, data, projectsMessagesCodes.NOTE_ADDED, TK);
  }

  async deleteNote(req, res) {
    const data = await deleteNote({
      id: req.params.id,
      isAdmin: Boolean(req.auth?.isAdminTier),
      scopedNote: req.scoped,
    });
    return ok(res, data, projectsMessagesCodes.NOTE_DELETED, TK);
  }
}

export const noteController = new NoteController();
export { NoteController };
