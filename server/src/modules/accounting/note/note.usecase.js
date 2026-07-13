// accounting/note usecase — orchestration only (no Prisma). The generic notes endpoints
// (getNotes reads `{ idKey, id }` and returns the notes attached to that owner; addNote
// attaches a note to the owner named by `idKey`) are delegated to note.repo.js. The acting
// user's id is taken from the authenticated session (req.auth.id), exactly as legacy did
// (req.user.id) — never trusted from the client body.
//
// The `legacy` constructor param remains a dependency-injection seam; its defaults now
// point at the note repo instead of the deleted accountant service.
import { noteRepository } from "./note.repo.js";

class NoteUsecase {
  listNotes({ query }) {
    return noteRepository.getNotes(query);
  }

  createNote({ body, authUser }) {
    return noteRepository.addNote({ ...body, userId: authUser.id });
  }
}

export const noteUsecase = new NoteUsecase();
export { NoteUsecase };
