import dayjs from "dayjs";
import {
  getChannelEntitiyByTeleRecordAndLeadId,
  uploadANote,
} from "../../telegram/telegram-functions.js";
import prisma from "../../../prisma/prisma.js";

export async function getNotes({ idKey, id }) {
  const notes = await prisma.note.findMany({
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
  return notes;
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
    const admin = await prisma.user.findFirst({
      where: {
        role: "ADMIN",
      },
      select: {
        id: true,
      },
    });
    data.userId = admin.id;
  }
  if (idKey && id) {
    data[idKey] = Number(id);
  }
  const note = await prisma.note.create({
    data,
  });
  const actualNote = await prisma.note.findUnique({
    where: {
      id: Number(note.id),
    },
    include: {
      user: true,
    },
  });
  if (actualNote.clientLeadId) {
    const { updateALead } = await import("./utilityServices.js");
    await updateALead(actualNote.clientLeadId);
    const teleChannel = await getChannelEntitiyByTeleRecordAndLeadId({
      clientLeadId: Number(actualNote.clientLeadId),
    });
    if (teleChannel) {
      await uploadANote(note, teleChannel);
    }
  }
  if (actualNote.updateId) {
    const { updateAClientLeadUpdate, updateALead } = await import(
      "./utilityServices.js"
    );
    await updateAClientLeadUpdate(actualNote.updateId);
    const update = await prisma.clientLeadUpdate.findUnique({
      where: {
        id: Number(actualNote.updateId),
      },
      select: {
        clientLeadId: true,
      },
    });
    await updateALead(update.clientLeadId);
  }
  if (actualNote.taskId) {
    const { updateTask } = await import("./taskServices.js");
    await updateTask({ data: {}, taskId: actualNote.taskId, isAdmin, userId });
  }

  return { data: note, message: "Note created successfully" };
}

export async function deleteNote({ id, isAdmin }) {
  const note = await prisma.note.findUnique({
    where: {
      id: Number(id),
    },
    select: {
      createdAt: true,
    },
  });
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
  await prisma.note.delete({
    where: {
      id: Number(id),
    },
  });
  return { data: note, message: "Note deleted successfully" };
}

export async function deleteAModel({ id, isAdmin, data, isSuperSales }) {
  const model = data.model;
  const item = await prisma[model].findUnique({
    where: {
      id: Number(id),
    },
    select: {
      createdAt: true,
    },
  });
  if (!item) {
    throw new Error(`${data.model} not found`);
  }

  if (!isAdmin) {
    const now = dayjs();
    const createdAt = dayjs(item.createdAt);
    const diffInMinutes = now.diff(createdAt, "minute");
    if (isSuperSales) {
      const timeNotExceedTwoDays =
        dayjs().diff(dayjs(item.createdAt), "day") < 2;
      if (!timeNotExceedTwoDays) {
        throw new Error(
          `Super Sales can only delete ${data.model} within 2 days of creation`
        );
      }
    } else if (diffInMinutes > 5) {
      throw new Error(`Cannot delete ${data.model} older than 5 minutes`);
    }
  }
  if (data.deleteModelesBeforeMain) {
    for (const mod of data.deleteModelesBeforeMain) {
      await prisma[mod.name].deleteMany({
        where: {
          [mod.key]: Number(id),
        },
      });
    }
  }

  if (model === "MeetingReminder") {
    const meeting = await prisma.meetingReminder.findUnique({
      where: {
        id: Number(id),
      },
      select: {
        availableSlotId: true,
      },
    });
    if (meeting && meeting.availableSlotId) {
      await prisma.availableSlot.update({
        where: {
          id: meeting.availableSlotId,
        },
        data: {
          isBooked: false,
          meetingReminderId: null,
        },
      });
    }
  }
  await prisma[model].delete({
    where: {
      id: Number(id),
    },
  });
  return { data: item, message: `${data.model} deleted successfully` };
}
