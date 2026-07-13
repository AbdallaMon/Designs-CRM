// notes controller — thin. The AUTHENTICATED generic note surface (legacy `shared/notes`),
// reached by the shared `NotesComponent` (slug="shared") for every note owner that has no
// dedicated module endpoint (task, delivery, commission, lead-update, sales-stage, …). The
// read/create + all side effects live in the shared `note.usecase` module fns (getNotes /
// addNote); the controller only shapes the request and emits language-neutral codes.
import { ok, created } from "../../shared/http/response.js";
import { projectsMessagesCodes, messagesNames } from "@dms/shared";
import { getNotes, addNote } from "./note.usecase.js";

const TK = messagesNames.projectsMessages;

class NoteController {
  // GET /notes?idKey=<owner>&id=<n>
  async getNotes(req, res) {
    const data = await getNotes({ idKey: req.query.idKey, id: req.query.id });
    return ok(res, data, projectsMessagesCodes.NOTES_FETCHED, TK);
  }

  // POST /notes — author forced to the acting user; a client-supplied userId is NEVER honored.
  async createNote(req, res) {
    const isAdmin = req.auth?.role === "ADMIN" || req.auth?.role === "SUPER_ADMIN";
    const data = await addNote({ ...req.body, userId: req.auth.id, isAdmin });
    return created(res, data, projectsMessagesCodes.NOTE_ADDED, TK);
  }
}

export const noteController = new NoteController();
export { NoteController };
