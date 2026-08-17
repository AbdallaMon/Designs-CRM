import { LEAD_STATUSES } from "@dms/shared";
import { getTeleClient } from "../connect-to-telegram.js";
import prisma from "../../prisma/prisma.js";
import { telegramChannelQueue } from "../../queues/telegram-channel.queue.js";
import {
  getChannelEntityFromInviteLink,
  createTeleChannelRecord,
} from "./telegram-channels.js";
import {
  newFileUploaded,
  newNoteNotification,
} from "./telegram-notification-dispatch.js";

export async function getLeadsWithOutChannel() {
  const clientLeads = await prisma.clientLead.findMany({
    where: {
      status: { in: [LEAD_STATUSES.FINALIZED, "ARCHIVED"] },
      OR: [{ telegramChannel: null }, { telegramLink: null }],
    },
  });
  for (const lead of clientLeads) {
    if (lead.telegramLink) {
      const teleChat = await getChannelEntityFromInviteLink({
        inviteLink: lead.telegramLink,
      });

      if (!teleChat) continue;

      await createTeleChannelRecord({
        clientLead: lead,
        accessHash: teleChat.accessHash,
        channelId: teleChat.id,
        inviteLink: lead.telegramLink,
      });

      const lastMessage = await getTeleClient().getMessages(teleChat, {
        limit: 1,
      });

      const findLastMessage = await prisma.fetchedTelegramMessage.findFirst({
        where: {
          clientLeadId: Number(lead.id),
        },
        orderBy: {
          id: "desc",
        },
      });

      if (findLastMessage) {
        await prisma.fetchedTelegramMessage.update({
          where: {
            id: findLastMessage.id,
          },
          data: {
            messageId: lastMessage[0].id,
            clientLeadId: Number(lead.id),
          },
        });
      } else {
        await prisma.fetchedTelegramMessage.create({
          data: {
            messageId: lastMessage[0].id,
            clientLeadId: Number(lead.id),
          },
        });
      }
    } else {
      const existingJob = await telegramChannelQueue.getJob(
        `create-${lead.id}`,
      );
      if (existingJob) return;
      await telegramChannelQueue.add(
        "create-channel",
        { clientLeadId: lead.id },
        {
          attempts: 10,
          backoff: {
            type: "fixed",
            delay: 30000,
          },
          jobId: `create-${lead.id}`, // optional: deduplicate
          removeOnComplete: true,
          removeOnFail: 10,
        },
      );
    }
  }
}

export async function createFile({
  clientLeadId,
  url,
  name,
  description,
  userId,
}) {
  if (!url || !name) {
    throw new Error("Fill all the fields please");
  }
  const data = {
    name,
    clientLeadId,
    url,
    description,
  };
  if (userId) {
    data.userId = Number(userId);
  }
  const file = await prisma.file.create({
    data,
    select: {
      id: true,
      createdAt: true,
      clientLeadId: true,
      description: true,
      url: true,
      name: true,
      isUserFile: true,
      user: {
        select: {
          name: true,
          id: true,
          email: true,
          telegramUsername: true,
        },
      },
    },
  });

  if (userId !== null) {
    await newFileUploaded(clientLeadId, data, userId);
  }
  await updateLead(clientLeadId);
  return { ...file, name, url, description, isUserFile: userId !== null };
}

export async function createNote({ clientLeadId, userId, content }) {
  if (!content.trim()) {
    throw new Error("Note content cannot be empty.");
  }

  const newNote = await prisma.note.create({
    data: {
      content,
      clientLeadId,
      userId,
    },
    select: {
      id: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  await updateLead(clientLeadId);
  newNote.content = content;
  await newNoteNotification(clientLeadId, content, newNote.user.id);
  return newNote;
}

export async function updateLead(clientLeadId) {
  await prisma.clientLead.update({
    where: { id: Number(clientLeadId) },
    data: {},
  });
}
