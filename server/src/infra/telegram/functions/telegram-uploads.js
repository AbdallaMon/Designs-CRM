import { getTeleClient } from "../connect-to-telegram.js";
import prisma from "../../prisma/prisma.js";
import { telegramMessageQueue } from "../../queues/telegram-message.queue.js";
import { getChannelEntitiyByTeleRecordAndLeadId } from "./telegram-channels.js";
import { buildAssetAccessUrl } from "../../upload/asset-access.js";
import { env } from "../../../config/env.js";

function telegramAssetUrl(reference) {
  return buildAssetAccessUrl(reference, {
    ttlSeconds: env.ASSET_EMAIL_URL_TTL_SECONDS,
  });
}

export async function uploadItemsToTele({ clientLeadId }) {
  const channel = await getChannelEntitiyByTeleRecordAndLeadId({
    clientLeadId,
  });

  const notes = await prisma.note.findMany({
    where: { clientLeadId: Number(clientLeadId) },
    include: { user: true },
  });

  for (const note of notes) {
    await uploadANote(note, channel);
  }

  // 4. Upload File links
  const files = await prisma.file.findMany({
    where: { clientLeadId: Number(clientLeadId) },
    include: { user: true },
  });

  for (const file of files) {
    await uploadAnAttachment(file, channel);
  }

  const lastMessage = await getTeleClient().getMessages(channel, { limit: 1 });

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
        messageId: lastMessage[0].id,
        clientLeadId: Number(clientLeadId),
      },
    });
  } else {
    await prisma.FetchedTelegramMessage.create({
      data: {
        messageId: lastMessage[0].id,
        clientLeadId: Number(clientLeadId),
      },
    });
  }
}

export async function uploadANote(note, channel) {
  const existingJob = await telegramMessageQueue.getJob(`note-${note.id}`);
  if (existingJob) return;

  await telegramMessageQueue.add(
    "send-note",
    {
      type: "note",
      payload: {
        clientLeadId: note.clientLeadId,
        note,
      },
    },
    {
      attempts: 2,
      backoff: {
        type: "fixed",
        delay: 10000,
      },
      delay: 2000,
      jobId: `note-${note.id}`,
      removeOnComplete: true,
      removeOnFail: 2,
    },
  );
}

export async function uploadAnAttachment(file, channel) {
  const existingJob = await telegramMessageQueue.getJob(`file-${file.id}`);
  if (existingJob) return;
  await telegramMessageQueue.add(
    "send-file",
    {
      type: "file",
      payload: {
        clientLeadId: file.clientLeadId,
        file,
      },
    },
    {
      attempts: 2,
      backoff: {
        type: "fixed",
        delay: 10000,
      },
      delay: 2000,
      jobId: `file-${file.id}`,
      removeOnComplete: true,
      removeOnFail: 2,
    },
  );
}

export async function uploadAQueueNote(note, channel) {
  const mention = note.user?.telegramUsername
    ? `${note.user.telegramUsername}`
    : note.user?.name || "Website";

  let message = `📝 *Note from ${mention}*`;

  if (note.content) {
    message += `\n\n${note.content}`;
  }

  if (note.attachment) {
    message += `\n\n📎 [Attachment Link](${telegramAssetUrl(note.attachment)})`;
  }

  const sent = await getTeleClient().sendMessage(channel, {
    message,
    parseMode: "",
  });
  // if (note.binMessage) {
  //   await getTeleClient().invoke(
  //     new Api.messages.UpdatePinnedMessage({
  //       peer: channel,
  //       id: sent.id,
  //       silent: false,
  //     })
  //   );
  // }

  if (note.update) {
    await prisma[note.update.key].update({
      where: note.update.where,
      data: note.update.data,
    });
  }
}

export async function uploadAQueueAttachment(file, channel) {
  let mention;

  if (file.isUserFile) {
    mention = file.user?.telegramUsername
      ? `${file.user.telegramUsername}`
      : file.user?.name || "Unknown";
  } else {
    mention = "the client";
  }

  let message = `📁 *File from ${mention}*\n📄 ${file.name}`;

  if (file.description) {
    message += `\n\n📝 ${file.description}`;
  }

  message += `\n\n🔗 [Open File](${telegramAssetUrl(file.url)})`;

  await getTeleClient().sendMessage(channel, {
    message,
    parseMode: "markdown",
  });
}
