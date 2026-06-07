// client-portal/notes usecase — the PUBLIC client note surface (legacy
// `routes/client/notes.js`). The note read/create + all its side effects (resolve the ADMIN
// author when `client:true`, refresh the parent lead, mirror to Telegram) live in the frozen
// `services/main/shared/noteServices.js` and are invoked via lazy adapters — never
// duplicated. The usecase only enforces the client allow-list (validation already constrained
// `idKey`; this is the belt-and-braces guard) and passes `client:true` so the service forces
// the author to ADMIN and never trusts a client userId.
import { AppError } from "../../../shared/errors/AppError.js";
import { clientPortalMessagesCodes } from "@dms/shared";
import { CLIENT_NOTE_ID_KEYS } from "./notes.validation.js";

const C = clientPortalMessagesCodes;

const legacyDefaults = {
  getNotes: (args) =>
    import("../../../../services/main/shared/noteServices.js").then((m) =>
      m.getNotes(args),
    ),
  addNote: (args) =>
    import("../../../../services/main/shared/noteServices.js").then((m) =>
      m.addNote(args),
    ),
};

export class NotesUsecase {
  constructor(legacy = {}) {
    this.legacy = { ...legacyDefaults, ...legacy };
  }

  #assertAllowedKey(idKey) {
    if (!CLIENT_NOTE_ID_KEYS.includes(idKey)) {
      throw new AppError(C.NOTE_TARGET_INVALID, 422);
    }
  }

  async list({ idKey, id }) {
    this.#assertAllowedKey(idKey);
    return this.legacy.getNotes({ idKey, id });
  }

  async create({ idKey, id, content, attachment }) {
    this.#assertAllowedKey(idKey);
    // `client:true` → the service forces the author to the ADMIN user and applies the
    // client content-length guard. We NEVER forward a client-supplied userId/isAdmin.
    const result = await this.legacy.addNote({
      idKey,
      id,
      content,
      attachment,
      client: true,
    });
    // The frozen service returns `{ data, message }` (prose message) — we drop the prose and
    // return only `data` (the controller emits a language-neutral code).
    return result?.data ?? result;
  }
}

export const notesUsecase = new NotesUsecase();
