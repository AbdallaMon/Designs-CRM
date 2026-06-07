// client-portal/languages controller — thin. PUBLIC. Responds via the shared envelope with a
// language-neutral code (legacy returned a bare `{ data }`).
import { ok } from "../../../shared/http/response.js";
import { clientPortalMessagesCodes, messagesNames } from "@dms/shared";
import { languagesUsecase } from "./languages.usecase.js";

const C = clientPortalMessagesCodes;
const TK = messagesNames.clientPortalMessages;

export class LanguagesController {
  constructor(usecase) {
    this.usecase = usecase;
  }

  list = async (req, res) => {
    const data = await this.usecase.list({ notArchived: req.query.notArchived });
    return ok(res, data, C.LANGUAGES_FETCHED, TK);
  };
}

export const languagesController = new LanguagesController(languagesUsecase);
