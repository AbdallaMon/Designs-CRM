// client-portal/notes usecase — the PUBLIC client note surface (legacy
// `routes/client/notes.js`). The note read/create + all its side effects (resolve the ADMIN
// author when `client:true`, refresh the parent lead, mirror to Telegram) live in the frozen
// `services/main/shared/noteServices.js` and are invoked via lazy adapters — never
// duplicated. The usecase enforces (a) the client allow-list and (b) — for the image-session
// note targets — a per-session TOKEN object-scope check so a caller can only read/write notes
// on the session (and the selected image within it) their token actually owns. This closes the
// IDOR that an unauthenticated public endpoint would otherwise expose (anyone POSTing a
// `selectedImageId`/`imageSessionId` would be accepted).
import { AppError } from "../../../shared/errors/AppError.js";
import { clientPortalMessagesCodes } from "@dms/shared";
import { CLIENT_NOTE_ID_KEYS } from "./notes.validation.js";
import { clientNotesRepository } from "./notes.repo.js";
import { getNotes, addNote } from "../../notes/note.usecase.js";

// The note targets that belong to an image session and MUST be authorized by the session token.
const TOKEN_SCOPED_KEYS = ["imageSessionId", "selectedImageId"];

export class NotesUsecase {
  #assertAllowedKey(idKey) {
    if (!CLIENT_NOTE_ID_KEYS.includes(idKey)) {
      throw new AppError({ code: clientPortalMessagesCodes.NOTE_TARGET_INVALID, statusCode: 422 });
    }
  }

  // For image-session targets the caller must present the owning session's token, and the
  // target must resolve to THAT session. Non-image-session targets (clientLeadId/updateId) keep
  // their existing public behavior. Throws 403 on any ownership failure.
  async #assertTokenScope({ idKey, id, token }) {
    if (!TOKEN_SCOPED_KEYS.includes(idKey)) return;

    const session = await clientNotesRepository.findSessionIdByToken(token);
    if (!session) throw new AppError({ code: clientPortalMessagesCodes.NOTE_NOT_AUTHORIZED, statusCode: 403 });

    if (idKey === "imageSessionId") {
      if (Number(id) !== session.id) {
        throw new AppError({ code: clientPortalMessagesCodes.NOTE_NOT_AUTHORIZED, statusCode: 403 });
      }
      return;
    }

    // selectedImageId — the image must belong to the token's session.
    const owner = await clientNotesRepository.findSelectedImageOwnerSessionId(id);
    if (!owner || owner.imageSessionId !== session.id) {
      throw new AppError({ code: clientPortalMessagesCodes.NOTE_NOT_AUTHORIZED, statusCode: 403 });
    }
  }

  async listNotes({ idKey, id, token }) {
    this.#assertAllowedKey(idKey);
    await this.#assertTokenScope({ idKey, id, token });
    return getNotes({ idKey, id });
  }

  async createNote({ idKey, id, content, attachment, token }) {
    this.#assertAllowedKey(idKey);
    await this.#assertTokenScope({ idKey, id, token });
    // `client:true` → the service forces the author to the ADMIN user and applies the
    // client content-length guard. We NEVER forward a client-supplied userId/isAdmin.
    const result = await addNote({
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
