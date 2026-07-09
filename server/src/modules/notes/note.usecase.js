// notes usecase — the shared notes home. Module-level `getNotes` / `addNote` / `deleteNote`
// are relocated 1:1 from the legacy `shared/legacy/note-services.js`. Prisma I/O is delegated
// to `noteRepository`; the cross-cluster side effects are invoked from their owners:
//   - the lead/update "touch" bumps go through leadRepository.touchLead /
//     updateRepository.touchClientLeadUpdate (formerly shared-utility updateALead /
//     updateAClientLeadUpdate),
//   - the Telegram mirror stays in its infra location (getChannelEntitiyByTeleRecordAndLeadId
//     / uploadANote),
//   - the task refresh stays a LAZY import of the task usecase's `updateTask` (preserving the
//     original lazy edge — both modules reference each other only lazily, so no import cycle).
// Behavior, error strings, and the 5-minute delete window are preserved verbatim. These
// functions replace the former shared/legacy barrel lazy-imports and are wired into the
// consumers' DI seams (client-portal notes, projects/task).
import dayjs from "dayjs";
import {
  getChannelEntitiyByTeleRecordAndLeadId,
  uploadANote,
} from "../../infra/telegram/telegram-functions.js";
import { noteRepository } from "./note.repo.js";
import { leadRepository } from "../leads/lead/lead.repo.js";
import { updateRepository } from "../projects/update/update.repo.js";

export async function getNotes({ idKey, id }) {
  return noteRepository.findNotesByOwner({ idKey, id });
}

export async function addNote({
  attachment,
  userId,
  content,
  idKey,
  id,
  isAdmin,
  client,
}) {
  const data = {
    content,
    attachment,
  };
  const MAX_LENGTH = 360;

  if (client && content && content.length > MAX_LENGTH) {
    throw new Error(
      `Note content is too long. Max length is ${MAX_LENGTH} characters current length is ${content.length}.`
    );
  }
  if (userId) {
    data.userId = Number(userId);
  }
  if (client) {
    const admin = await noteRepository.findAdminUser();
    data.userId = admin.id;
  }
  if (idKey && id) {
    data[idKey] = Number(id);
  }
  const note = await noteRepository.createNote({ data });
  const actualNote = await noteRepository.findNoteWithUser({ id: note.id });
  if (actualNote.clientLeadId) {
    await leadRepository.touchLead({ id: actualNote.clientLeadId });
    const teleChannel = await getChannelEntitiyByTeleRecordAndLeadId({
      clientLeadId: Number(actualNote.clientLeadId),
    });
    if (teleChannel) {
      await uploadANote(note, teleChannel);
    }
  }
  if (actualNote.updateId) {
    await updateRepository.touchClientLeadUpdate({ id: actualNote.updateId });
    const update = await noteRepository.findUpdateLeadId({
      updateId: actualNote.updateId,
    });
    await leadRepository.touchLead({ id: update.clientLeadId });
  }
  if (actualNote.taskId) {
    const { updateTask } = await import("../projects/task/task.usecase.js");
    await updateTask({ data: {}, taskId: actualNote.taskId, isAdmin, userId });
  }

  return { data: note, message: "Note created successfully" };
}

export async function deleteNote({ id, isAdmin }) {
  const note = await noteRepository.findNoteCreatedAt({ id });
  if (!note) {
    throw new Error("Note not found");
  }
  if (!isAdmin) {
    const now = dayjs();
    const createdAt = dayjs(note.createdAt);
    const diffInMinutes = now.diff(createdAt, "minute");

    if (diffInMinutes > 5) {
      throw new Error("Cannot delete note older than 5 minutes");
    }
  }
  await noteRepository.deleteNote({ id });
  return { data: note, message: "Note deleted successfully" };
}
