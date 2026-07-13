// client-portal/notes controller — thin. PUBLIC client notes. Responds via the shared
// envelope with language-neutral codes (legacy returned `{ data }` on GET and the raw service
// `{ data, message }` prose on POST).
import { ok, created } from "../../../shared/http/response.js";
import { clientPortalMessagesCodes, messagesNames } from "@dms/shared";
import { notesUsecase } from "./notes.usecase.js";

const TK = messagesNames.clientPortalMessages;

class NotesController {
  async getNotes(req, res) {
    const data = await notesUsecase.listNotes({
      idKey: req.query.idKey,
      id: req.query.id,
      token: req.query.token,
    });
    return ok(res, data, clientPortalMessagesCodes.NOTES_FETCHED, TK);
  }

  async createNote(req, res) {
    const data = await notesUsecase.createNote(req.body);
    return created(res, data, clientPortalMessagesCodes.NOTE_CREATED, TK);
  }
}

export const notesController = new NotesController();
export { NotesController };
