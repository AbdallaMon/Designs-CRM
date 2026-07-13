// client-portal/languages controller — thin. PUBLIC. Responds via the shared envelope with a
// language-neutral code (legacy returned a bare `{ data }`).
import { ok } from "../../../shared/http/response.js";
import { clientPortalMessagesCodes, messagesNames } from "@dms/shared";
import { languagesUsecase } from "./languages.usecase.js";

const TK = messagesNames.clientPortalMessages;

class LanguagesController {
  async getLanguages(req, res) {
    const data = await languagesUsecase.listLanguages({
      notArchived: req.query.notArchived,
    });
    return ok(res, data, clientPortalMessagesCodes.LANGUAGES_FETCHED, TK);
  }
}

export const languagesController = new LanguagesController();
export { LanguagesController };
