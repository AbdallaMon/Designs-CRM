import { getTeleClient } from "../connect-to-telegram.js";
import prisma from "../../prisma/prisma.js";
import { delay } from "./util.js";
import { getChannelEntitiyByTeleRecordAndLeadId } from "./telegram-channels.js";
import { createNote, createFile } from "./telegram-lead-data.js";

export async function getMeagsses({ clientLeadId }) {
  await delay(10000);
  const lastFetchedMessage = await getLastFetchedTeleMessage({ clientLeadId });
  const channel = await getChannelEntitiyByTeleRecordAndLeadId({
    clientLeadId,
  });
  const options = {
    limit: 20,
  };
  if (lastFetchedMessage) {
    options.minId = Number(lastFetchedMessage.messageId);
  }
  const fetchedMessages = await getTeleClient().getMessages(channel, options);
  let messages = fetchedMessages.sort((a, b) => a.id - b.id);
  const filterd = await filterTaggedMessages({
    clientLeadId,
    messages,
    channel,
  });
  return filterd;
}

export async function getLastFetchedTeleMessage({ clientLeadId }) {
  return await prisma.fetchedTelegramMessage.findFirst({
    where: { clientLeadId },
    orderBy: { id: "desc" },
  });
}

async function filterTaggedMessages({ clientLeadId, messages, channel }) {
  if (!channel) return;
  let lastMessage = null;
  clientLeadId = Number(clientLeadId);
  for (const msg of messages) {
    const sender = msg.from;
    lastMessage = msg;
    const senderName = sender?.username;
    const user = await prisma.user.findFirst({
      where: {
        telegramUsername: senderName,
      },
      select: {
        id: true,
      },
    });
    const content = msg.message?.trim() || "";
    const messageId = msg.id;
    if (content.startsWith("*note*")) {
      await createNote({
        clientLeadId,
        userId: user?.id,
        content: content.replace("*note*", "").trim(),
      });
    } else if (content.startsWith("*file*")) {
      const url = generateTelegramMessageLink(
        channel.id.toString().replace("-100", ""),
        messageId,
      );
      await createFile({
        clientLeadId,
        userId: user?.id,
        description: content.replace("*file*", "").trim(),
        name: "Telegram file",
        url,
      });
    }
  }
  if (lastMessage) {
    const findLastMessage = await prisma.fetchedTelegramMessage.findFirst({
      where: {
        clientLeadId: Number(clientLeadId),
      },
      orderBy: {
        id: "desc",
      },
    });
    if (findLastMessage) {
      await prisma.FetchedTelegramMessage.update({
        where: {
          id: findLastMessage.id,
        },
        data: {
          messageId: lastMessage.id,
          clientLeadId: Number(clientLeadId),
        },
      });
    } else {
      await prisma.FetchedTelegramMessage.create({
        data: {
          messageId: lastMessage.id,
          clientLeadId: Number(clientLeadId),
        },
      });
    }
  }
}

export function generateTelegramMessageLink(chatId, messageId) {
  return `https://t.me/c/${chatId}/${messageId}`;
}
