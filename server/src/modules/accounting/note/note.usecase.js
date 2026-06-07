// accounting/note usecase — orchestration only (no Prisma). The legacy accountant notes
// endpoints are generic: getNotes reads `{ idKey, id }` and returns the notes attached to
// that owner; addNote attaches a note to the owner named by `idKey`. Behavior is ported
// 1:1 via lazy adapters to the accountant service. The acting user's id is taken from the
// authenticated session (req.auth.id), exactly as legacy did (req.user.id) — never trusted
// from the client body.
const legacyDefaults = {
  getNotes: (a) =>
    import("../../../../services/main/accountant/accountantServices.js").then((m) => m.getNotes(a)),
  addNote: (a) =>
    import("../../../../services/main/accountant/accountantServices.js").then((m) => m.addNote(a)),
};

export class NoteUsecase {
  constructor(legacy = {}) {
    this.legacy = { ...legacyDefaults, ...legacy };
  }

  list({ query }) {
    return this.legacy.getNotes(query);
  }

  create({ body, authUser }) {
    return this.legacy.addNote({ ...body, userId: authUser.id });
  }
}

export const noteUsecase = new NoteUsecase();
