// accounting/note repository — Prisma I/O ONLY. Relocated verbatim from the legacy
// accountant service (getNotes / addNote). The notes endpoints are generic: getNotes reads
// the notes attached to the owner named by `idKey`; addNote attaches a note to that owner.
// The acting user's id is supplied by the usecase from the authenticated session.
import prisma from "../../../infra/prisma/prisma.js";

class NoteRepository {
  getNotes({ idKey, id }) {
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

  async addNote({ attachment, userId, content, idKey, id }) {
    const data = {
      content,
      userId: Number(userId),
      attachment,
    };
    if (idKey && id) {
      data[idKey] = Number(id);
    }
    const note = await prisma.note.create({
      data,
    });

    return { data: note, message: "Note created successfully" };
  }
}

export const noteRepository = new NoteRepository();
export { NoteRepository };
