// accounting/note controller — thin. Reads validated input, delegates, responds.
import { ok, created } from "../../../shared/http/response.js";
import { accountingMessagesCodes, messagesNames } from "@dms/shared";
import { noteUsecase } from "./note.usecase.js";

const TK = messagesNames.accountingMessages;

class NoteController {
  async getNotes(req, res) {
    const items = await noteUsecase.listNotes({ query: req.query });
    return ok(res, { items }, accountingMessagesCodes.NOTES_FETCHED, TK);
  }

  async createNote(req, res) {
    const result = await noteUsecase.createNote({ body: req.body, authUser: req.auth });
    return created(res, result.data ?? result, accountingMessagesCodes.NOTE_CREATED, TK);
  }
}

export const noteController = new NoteController();
export { NoteController };
