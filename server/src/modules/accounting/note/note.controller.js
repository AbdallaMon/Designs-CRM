// accounting/note controller — thin. Reads validated input, delegates, responds.
import { ok, created } from "../../../shared/http/response.js";
import { accountingMessagesCodes, messagesNames } from "@dms/shared";
import { noteUsecase } from "./note.usecase.js";

const C = accountingMessagesCodes;
const TK = messagesNames.accountingMessages;

export class NoteController {
  constructor(usecase) {
    this.usecase = usecase;
  }

  list = async (req, res) => {
    const items = await this.usecase.list({ query: req.query });
    return ok(res, { items }, C.NOTES_FETCHED, TK);
  };

  create = async (req, res) => {
    const result = await this.usecase.create({ body: req.body, authUser: req.auth });
    return created(res, result.data ?? result, C.NOTE_CREATED, TK);
  };
}

export const noteController = new NoteController(noteUsecase);
