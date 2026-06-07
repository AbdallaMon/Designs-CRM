// client-portal/languages usecase — the PUBLIC languages lookup (legacy
// `routes/client/languages.js`). Pure read; the frozen `getLanguages` service
// (`services/main/client/clientServices.js`) also ensures the seed rows exist, so it is
// wrapped via a lazy adapter rather than duplicated.
const legacyDefaults = {
  getLanguages: (args) =>
    import("../../../../services/main/client/clientServices.js").then((m) =>
      m.getLanguages(args),
    ),
};

export class LanguagesUsecase {
  constructor(legacy = {}) {
    this.legacy = { ...legacyDefaults, ...legacy };
  }

  list({ notArchived }) {
    return this.legacy.getLanguages({ notArchived });
  }
}

export const languagesUsecase = new LanguagesUsecase();
