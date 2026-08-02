import { Api } from "telegram";
import { getTeleClient } from "../connect-to-telegram.js";
import prisma from "../../prisma/prisma.js";
import { telegramUploadQueue } from "../../queues/telegram-upload.queue.js";
import {
  getUserEntitiy,
  addUsersToATeleChannel,
  inviteUserToAChannel,
} from "./telegram-members.js";
import { getLeadsWithOutChannel } from "./telegram-lead-data.js";

export async function createChannelAndAddUsers({ clientLeadId }) {
  const isUserAuthorized = await getTeleClient().checkAuthorization();

  if (!isUserAuthorized) {
    console.warn(
      "❌ Telegram client not authenticated. Aborting channel creation.",
    );
    return;
  }

  const clientLead = await prisma.clientLead.findUnique({
    where: { id: Number(clientLeadId) },
    select: {
      id: true,
      client: { select: { name: true } },
      assignedTo: {
        select: {
          telegramUsername: true,
        },
      },
    },
  });

  const formattedId = `${clientLead.id.toString().padStart(7, "0")}`;

  let channel = null;

  try {
    const { chats } = await getTeleClient().invoke(
      new Api.channels.CreateChannel({
        title: formattedId,
        about: clientLead.client.name,
        megagroup: true,
      }),
    );
    channel = chats[0];

    const adminUsers = await prisma.user.findMany({
      where: {
        currentProfile: { isAdminTier: true },
        isActive: true,
      },
      select: { telegramUsername: true },
    });

    const self = await getTeleClient().getMe();
    const adminUsersToBeAdded = [];

    for (const user of adminUsers) {
      const entity = await getUserEntitiy(user);
      if (!entity || entity?.id?.value === self?.id?.value) continue;
      adminUsersToBeAdded.push(entity);
    }
    if (adminUsersToBeAdded && adminUsersToBeAdded.length > 0) {
      await addUsersToATeleChannel({ channel, usersList: adminUsersToBeAdded });
      for (const user of adminUsersToBeAdded) {
        await getTeleClient().invoke(
          new Api.channels.EditAdmin({
            channel,
            userId: user,
            adminRights: new Api.ChatAdminRights({
              changeInfo: true,
              postMessages: true,
              editMessages: true,
              deleteMessages: true,
              banUsers: true,
              inviteUsers: true,
              pinMessages: true,
              addAdmins: true,
              manageCall: true,
            }),
            rank: "Admin",
          }),
        );
      }
    }

    const channelId = channel.id;
    const accessHash = channel.accessHash;

    const exportedInvite = await getTeleClient().invoke(
      new Api.messages.ExportChatInvite({ peer: channel }),
    );

    const inviteLink = exportedInvite.link;
    await createTeleChannelRecord({
      clientLead,
      accessHash,
      channelId,
      inviteLink,
      forceNew: true,
    });
    const telegramUser = clientLead.assignedTo;
    if (telegramUser && telegramUser.telegramUsername) {
      await inviteUserToAChannel({ channel, user: telegramUser });
    }

    const existingJob = await telegramUploadQueue.getJob(
      `upload-${clientLeadId}`,
    );
    if (!existingJob) {
      await telegramUploadQueue.add(
        "upload",
        {
          clientLeadId: Number(clientLeadId),
        },
        {
          attempts: 10,
          backoff: {
            type: "fixed",
            delay: 30000,
          },
          jobId: `upload-${clientLeadId}`,
          removeOnComplete: true,
          removeOnFail: 10,
        },
      );
    }
    return { channel, inviteLink };
  } catch (err) {
    console.error(
      `❌ Error occurred during channel setup for ${clientLeadId}:`,
      err.message,
    );

    if (channel) {
      try {
        console.warn("🧹 Attempting to delete incomplete channel...");
        await getTeleClient().invoke(
          new Api.channels.DeleteChannel({ channel }),
        );
        console.log("🗑️ Incomplete channel deleted.");
      } catch (cleanupErr) {
        console.error(
          "⚠️ Failed to delete incomplete channel:",
          cleanupErr.message,
        );
      }
    }

    throw err; // Re-throw to let BullMQ handle retry/failure logic
  }
}

export async function createTeleChannelRecord({
  clientLead,
  accessHash,
  channelId,
  inviteLink,
  forceNew,
}) {
  const checkIfPresent = await prisma.telegramChannel.findFirst({
    where: {
      clientLeadId: clientLead.id,
    },
  });

  if (checkIfPresent && !forceNew) return;
  if (checkIfPresent && forceNew) {
    await prisma.telegramChannel.update({
      where: { id: Number(checkIfPresent.id) },
      data: {
        accessHash,
        channelId,
        channelLink: inviteLink,
      },
    });
  } else {
    await prisma.telegramChannel.create({
      data: {
        clientLeadId: clientLead.id,
        accessHash,
        channelId,
        channelLink: inviteLink,
      },
    });
  }
  return await prisma.clientLead.update({
    where: {
      id: Number(clientLead.id),
    },
    data: {
      telegramLink: inviteLink,
    },
  });
}

export async function getChannelEntityFromInviteLink({ inviteLink }) {
  try {
    console.log("🔗 Processing invite link:", inviteLink);
    const isUserAuthorized = await getTeleClient().checkAuthorization();
    console.log(isUserAuthorized, "isUserAuthorized");

    const lastPart = inviteLink.trim().split("/").pop();
    if (!lastPart) throw new Error("❌ Invalid invite link format");

    // Case 1: Regular public username (no +)
    if (!lastPart.startsWith("+")) {
      console.log("🔍 Resolving entity via username:", lastPart);
      return await getTeleClient().getEntity(lastPart);
    }

    // Case 2: Invite link hash (starts with +)
    const hash = lastPart.replace("+", "");

    try {
      console.log("🕵️ Checking chat invite hash:", hash);
      const result = await getTeleClient().invoke(
        new Api.messages.CheckChatInvite({ hash }),
      );

      if (result instanceof Api.ChatInviteAlready) {
        console.log("✅ Already joined. Returning chat info.");
        return result.chat;
      } else {
        throw new Error("🚫 Not a member of the invite link.");
      }
    } catch (error) {
      console.log(error.message, "error in first");
      if (error.errorMessage?.startsWith("FLOOD_WAIT_")) {
        const waitSeconds = parseInt(error.errorMessage.split("_")[2], 10);
        console.warn(`⏳ FLOOD_WAIT: Waiting ${waitSeconds} seconds...`);
        await new Promise((res) => setTimeout(res, waitSeconds * 1000));
        // Retry after wait
        console.log("🔁 Retrying after wait...");
        return await getChannelEntityFromInviteLink({ inviteLink });
      }

      if (error.errorMessage === "INVITE_HASH_EXPIRED") {
        console.error("🚫 Invite hash expired");
      }

      throw error;
    }
  } catch (error) {
    console.log(error.message, "error in second");

    console.error(
      "❌ Failed to get channel entity from invite link:",
      error.message,
    );
    return null;
  }
}

export async function getChannelEntitiyByTeleRecordAndLeadId({ clientLeadId }) {
  let teleRecord = await prisma.telegramChannel.findFirst({
    where: { clientLeadId: Number(clientLeadId) },
  });

  if (!teleRecord) {
    await getLeadsWithOutChannel(); // Fallback logic you already use
    teleRecord = await prisma.telegramChannel.findFirst({
      where: { clientLeadId: Number(clientLeadId) },
    });
  }

  if (!teleRecord) return;
  const channel = await getChannelEntitiy({
    channelId: teleRecord.channelId,
    accessHash: teleRecord.accessHash,
  });
  return channel;
}

export async function getChannelEntitiy({ channelId, accessHash }) {
  const channel = await getTeleClient().getEntity(
    new Api.InputPeerChannel({
      channelId,
      accessHash,
    }),
  );
  return channel;
}
