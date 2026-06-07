// client-portal/notes controller — thin. PUBLIC client notes. Responds via the shared
// envelope with language-neutral codes (legacy returned `{ data }` on GET and the raw service
// `{ data, message }` prose on POST).
import { ok, created } from "../../../shared/http/response.js";
import { clientPortalMessagesCodes, messagesNames } from "@dms/shared";
import { notesUsecase } from "./notes.usecase.js";

const C = clientPortalMessagesCodes;
const TK = messagesNames.clientPortalMessages;

export class NotesController {
  constructor(usecase) {
    this.usecase = usecase;
  }

  list = async (req, res) => {
    const data = await this.usecase.list({
      idKey: req.query.idKey,
      id: req.query.id,
    });
    return ok(res, data, C.NOTES_FETCHED, TK);
  };

  create = async (req, res) => {
    const data = await this.usecase.create(req.body);
    return created(res, data, C.NOTE_CREATED, TK);
  };
}

export const notesController = new NotesController(notesUsecase);
