// client-portal/languages usecase — the PUBLIC languages lookup (legacy
// `routes/client/languages.js`). Pure read; the frozen `getLanguages` service
// (`services/main/client/clientServices.js`) also ensures the seed rows exist, so it is
// reused directly rather than duplicated.
import { getLanguages } from "../../image-sessions/services/languages.js";

export class LanguagesUsecase {
  listLanguages({ notArchived }) {
    return getLanguages({ notArchived });
  }
}

export const languagesUsecase = new LanguagesUsecase();
