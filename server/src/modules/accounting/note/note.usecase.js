// accounting/note usecase — orchestration only (no Prisma). The generic notes endpoints
// (getNotes reads `{ idKey, id }` and returns the notes attached to that owner; addNote
// attaches a note to the owner named by `idKey`) are delegated to note.repo.js. The acting
// user's id is taken from the authenticated session (req.auth.id), exactly as legacy did
// (req.user.id) — never trusted from the client body.
//
// The `legacy` constructor param remains a dependency-injection seam; its defaults now
// point at the note repo instead of the deleted accountant service.
import { noteRepository } from "./note.repo.js";

const legacyDefaults = {
  getNotes: (a) => noteRepository.getNotes(a),
  addNote: (a) => noteRepository.addNote(a),
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
