// notes repository — Prisma I/O ONLY (no business rules, no side effects). Relocated
// verbatim from the legacy `shared/legacy/note-services.js` Prisma calls. This is the shared
// notes home reached by the client-portal notes surface and the projects/task notes helpers
// through the note usecase's module functions. Selects/filters are preserved 1:1.
import prisma from "../../infra/prisma/prisma.js";

class NoteRepository {
  // Notes attached to the owner named by `idKey` (legacy getNotes select).
  findNotesByOwner({ idKey, id }) {
    return prisma.note.findMany({
      where: {
        [idKey]: Number(id),
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        attachment: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  // First ADMIN user (legacy addNote `client:true` author resolution).
  findAdminUser() {
    return prisma.user.findFirst({
      where: {
        role: "ADMIN",
      },
      select: {
        id: true,
      },
    });
  }

  createNote({ data }) {
    return prisma.note.create({ data });
  }

  // Re-read the created note with its user (legacy addNote post-create fetch).
  findNoteWithUser({ id }) {
    return prisma.note.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        user: true,
      },
    });
  }

  // Owning clientLeadId of an update (legacy addNote updateId branch).
  findUpdateLeadId({ updateId }) {
    return prisma.clientLeadUpdate.findUnique({
      where: {
        id: Number(updateId),
      },
      select: {
        clientLeadId: true,
      },
    });
  }

  // Note createdAt (legacy deleteNote guard read).
  findNoteCreatedAt({ id }) {
    return prisma.note.findUnique({
      where: {
        id: Number(id),
      },
      select: {
        createdAt: true,
      },
    });
  }

  deleteNote({ id }) {
    return prisma.note.delete({
      where: {
        id: Number(id),
      },
    });
  }
}

export const noteRepository = new NoteRepository();
export { NoteRepository };
