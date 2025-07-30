import { Api } from "telegram";
import dotenv from "dotenv";
import {
  connectToTelegram,
  teleClient,
  io as serverIo,
} from "./connectToTelegram.js";
import prisma from "../../prisma/prisma.js";
import { dealsLink, userLink } from "../links.js";
import { sendEmail } from "../sendMail.js";
import { telegramUploadQueue } from "../queues/telegramUploadQueue.js";
import { telegramMessageQueue } from "../queues/telegram-message-queue.js";
import { telegramChannelQueue } from "../queues/telegramChannelQueue.js";
import { telegramAddUserQueue } from "../queues/telegramAddUserQueue.js";

dotenv.config();

export async function createChannelAndAddUsers({ clientLeadId }) {
  const isUserAuthorized = await teleClient.checkAuthorization();

  if (!isUserAuthorized) {
    console.warn(
      "❌ Telegram client not authenticated. Aborting channel creation."
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
    const { chats } = await teleClient.invoke(
      new Api.channels.CreateChannel({
        title: formattedId,
        about: clientLead.client.name,
        megagroup: true,
      })
    );
    channel = chats[0];

    const adminUsers = await prisma.user.findMany({
      where: {
        role: { in: ["ADMIN", "SUPER_ADMIN"] },
        isActive: true,
      },
      select: { telegramUsername: true },
    });

    const self = await teleClient.getMe();
    const adminUsersToBeAdded = [];

    for (const user of adminUsers) {
      const entity = await getUserEntitiy(user);
      if (!entity || entity?.id?.value === self?.id?.value) continue;
      adminUsersToBeAdded.push(entity);
    }
    if (adminUsersToBeAdded && adminUsersToBeAdded.length > 0) {
      await addUsersToATeleChannel({ channel, usersList: adminUsersToBeAdded });
      for (const user of adminUsersToBeAdded) {
        await teleClient.invoke(
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
          })
        );
      }
    }

    const channelId = channel.id;
    const accessHash = channel.accessHash;

    const exportedInvite = await teleClient.invoke(
      new Api.messages.ExportChatInvite({ peer: channel })
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
      `upload-${clientLeadId}`
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
        }
      );
    }
    return { channel, inviteLink };
  } catch (err) {
    console.error(
      `❌ Error occurred during channel setup for ${clientLeadId}:`,
      err.message
    );

    if (channel) {
      try {
        console.warn("🧹 Attempting to delete incomplete channel...");
        await teleClient.invoke(new Api.channels.DeleteChannel({ channel }));
        console.log("🗑️ Incomplete channel deleted.");
      } catch (cleanupErr) {
        console.error(
          "⚠️ Failed to delete incomplete channel:",
          cleanupErr.message
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
export async function getUserEntitiy(user) {
  if (!user.telegramUsername) {
    console.warn("⚠️ No telegramUsername for user:", user);
    return null;
  }

  try {
    return await teleClient.getEntity(user.telegramUsername);
  } catch (err) {
    console.error(
      `❌ Failed to get entity for ${user.telegramUsername}:`,
      err.message
    );
    return null;
  }
}

export async function addUsersToATeleChannel({ channel, usersList }) {
  for (const user of usersList) {
    try {
      await delay(200);
      await teleClient.invoke(
        new Api.channels.EditAdmin({
          channel,
          userId: user.id,
          adminRights: new Api.ChatAdminRights({
            changeInfo: false,
            postMessages: true,
            editMessages: true,
            deleteMessages: true,
            banUsers: false,
            inviteUsers: false,
            pinMessages: false,
            addAdmins: false,
            manageCall: false,
          }),
          rank: "Admin",
        })
      );

      console.log(`✅ Invited @${user.username || user.id.value}`);
    } catch (e) {
      console.warn(
        `❌ Failed to invite @${user.username || user.id.value}: ${e.message}`
      );
    }
  }
}

export async function addUsersToATeleChannelUsingQueue({
  clientLeadId,
  usersList,
}) {
  const existingJob = await telegramAddUserQueue.getJob(
    `lead-${clientLeadId}-${userLink.length}`
  );
  if (existingJob)
    throw new Error("We are added them to a queue and they will be added soon");
  await telegramAddUserQueue.add(
    "add-user-channel",
    { clientLeadId, usersList },
    {
      attempts: 10,
      backoff: {
        type: "fixed",
        delay: 30000,
      },
      jobId: `lead-${clientLeadId}-${userLink.length}`,
      removeOnComplete: true,
      removeOnFail: 10,
    }
  );
}

export async function addUserListToAChnnelUsingQueue({
  clientLeadId,
  usersList,
}) {
  const channel = await getChannelEntitiyByTeleRecordAndLeadId({
    clientLeadId: Number(clientLeadId),
  });
  if (!channel) return;
  for (const user of usersList) {
    try {
      await delay(1000);
      const userInpt = await getUserEntitiy(user);
      await teleClient.invoke(
        new Api.channels.EditAdmin({
          channel,
          userId: userInpt.id,
          adminRights: new Api.ChatAdminRights({
            changeInfo: false,
            postMessages: true,
            editMessages: true,
            deleteMessages: true,
            banUsers: false,
            inviteUsers: false,
            pinMessages: false,
            addAdmins: false,
            manageCall: false,
          }),
          rank: "Admin",
        })
      );
      console.log(`✅ Invited @${userInpt.username || userInpt.id.value}`);
    } catch (e) {
      console.warn(
        `❌ Failed to invite @${userInpt.username || userInpt.id.value}: ${
          e.message
        }`
      );
    }
  }
}

export async function handleProjectReminder({
  notifiedKey,
  timeLeft,
  projectId,
  clientLeadId,
  type,
}) {
  try {
    // ✅ Do your action here (e.g., send notification)
    console.log(
      `Sending ${timeLeft}-day reminder to clientLeadId: ${clientLeadId}`
    );
    const note = {
      id: `${projectId}-${clientLeadId}-${notifiedKey}`,
      clientLeadId: Number(clientLeadId),
      content: `⏳ Project ${type} delivery time : ` + timeLeft,
      binMessage: true,
      update: {
        where: {
          id: Number(projectId),
        },
        key: "project",
        data: {
          [notifiedKey]: true,
        },
      },
    };
    await uploadANote(note);
  } catch (error) {
    console.error(
      `❌ Failed to handle reminder for project ${projectId}:`,
      error
    );
  }
}
export async function getChannelEntityFromInviteLink({ inviteLink }) {
  try {
    console.log("🔗 Processing invite link:", inviteLink);
    const isUserAuthorized = await teleClient.checkAuthorization();
    console.log(isUserAuthorized, "isUserAuthorized");

    const lastPart = inviteLink.trim().split("/").pop();
    if (!lastPart) throw new Error("❌ Invalid invite link format");

    // Case 1: Regular public username (no +)
    if (!lastPart.startsWith("+")) {
      console.log("🔍 Resolving entity via username:", lastPart);
      return await teleClient.getEntity(lastPart);
    }

    // Case 2: Invite link hash (starts with +)
    const hash = lastPart.replace("+", "");

    try {
      console.log("🕵️ Checking chat invite hash:", hash);
      const result = await teleClient.invoke(
        new Api.messages.CheckChatInvite({ hash })
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
      error.message
    );
    return null;
  }
}

export async function getLeadsWithOutChannel() {
  const clientLeads = await prisma.clientLead.findMany({
    where: {
      status: { in: ["FINALIZED", "ARCHIVED"] },
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

      const lastMessage = await teleClient.getMessages(teleChat, { limit: 1 });

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
        `create-${lead.id}`
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
        }
      );
    }
  }
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

  const lastMessage = await teleClient.getMessages(channel, { limit: 1 });

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
  const channel = await teleClient.getEntity(
    new Api.InputPeerChannel({
      channelId,
      accessHash,
    })
  );
  return channel;
}
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function uploadANote(note, channel) {
  await delay(2000);
  const existingJob = await telegramMessageQueue.getJob(`note-${note.id}`);
  console.log(existingJob, "existingJob");
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
      attempts: 10,
      backoff: {
        type: "fixed",
        delay: 10000,
      },
      jobId: `note-${note.id}`,
      removeOnComplete: true,
      removeOnFail: 10,
    }
  );
}

export async function uploadAnAttachment(file, channel) {
  await delay(2000);
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
      jobId: `file-${file.id}`,
      removeOnComplete: true,
      removeOnFail: 10,
    }
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
    message += `\n\n📎 [Attachment Link](${note.attachment})`;
  }

  const sent = await teleClient.sendMessage(channel, {
    message,
    parseMode: "markdown",
  });
  // if (note.binMessage) {
  //   await teleClient.invoke(
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
    console.log(
      `Updated succssfully for key:${note.update.key} , where:${note.update.where}`
    );
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

  message += `\n\n🔗 [Open File](${file.url})`;

  await teleClient.sendMessage(channel, {
    message,
    parseMode: "markdown",
  });
}

export async function inviteUserToAChannel({ channel, user }) {
  const entity = await getUserEntitiy(user);
  if (!entity) return;
  await addUsersToATeleChannel({ channel, usersList: [entity] });
}

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
  const fetchedMessages = await teleClient.getMessages(channel, options);
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
        messageId
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
  console.log("file created?");
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

export async function newFileUploaded(leadId, file, userId) {
  const notificationHtml = `<div>
       <strong>New File</strong> was added to Lead <a href="${
         dealsLink + leadId
       }" >#${leadId}</a> 
       <div class="sub-text">
       <a href="${file.url}">
    File name: ${file.name} 
</a>
</div>
     <div class="sub-text">
    File description: ${file.description} 
</div>
    </div>`;
  await createNotification(
    null,
    true,
    notificationHtml,
    null,
    "NEW_FILE",
    "New file upload",
    true,
    "HTML",
    null,
    Number(userId)
  );
}
export async function newNoteNotification(leadId, content, userId) {
  const notificationHtml = `<div>
       <strong>Note</strong> was added to Lead <a href="${
         dealsLink + leadId
       }" >#${leadId}</a> 
       <q>${content}<q/>
    </div>
`;
  await createNotification(
    null,
    true,
    notificationHtml,
    null,
    "NEW_NOTE",
    "New note",
    true,
    "HTML",
    null,
    userId
  );
}
export async function createNotification(
  userId,
  isAdmin,
  content,
  href,
  type,
  emailSubject,
  withEmail,
  contentType = "TEXT",
  clientLeadId,
  staffId,
  role = ["STAFF"],
  specifiRole
) {
  let subAdmins = [];
  const forAll = !userId && !isAdmin && !staffId;
  if (specifiRole) {
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { role: { in: role } }, // Search in the main role
          { subRoles: { some: { subRole: { in: role } } } }, // Search in subRoles
        ],
      },
      select: {
        id: true,
      },
    });
    users?.map(async (user) => {
      await sendNotification(
        user.id,
        content,
        href,
        type,
        emailSubject,
        withEmail,
        contentType,
        clientLeadId
      );
    });
  } else if (forAll) {
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: ["STAFF", "ADMIN", "SUPER_ADMIN"] },
      },
      select: {
        id: true,
      },
    });
    users?.map(async (user) => {
      await sendNotification(
        user.id,
        content,
        href,
        type,
        emailSubject,
        withEmail,
        contentType,
        clientLeadId
      );
    });
  } else {
    if (isAdmin) {
      const admin = await prisma.user.findFirst({
        where: {
          role: "ADMIN",
        },
        select: {
          id: true,
        },
      });
      subAdmins = await prisma.user.findMany({
        where: {
          role: "SUPER_ADMIN",
        },
        select: {
          id: true,
        },
      });

      userId = admin.id;
    }

    await sendNotification(
      userId,
      content,
      href,
      type,
      emailSubject,
      withEmail,
      contentType,
      clientLeadId,
      staffId
    );
    if (subAdmins?.length > 0) {
      subAdmins.forEach(async (admin) => {
        await sendNotification(
          admin.id,
          content,
          href,
          type,
          emailSubject,
          withEmail,
          contentType,
          clientLeadId,
          staffId
        );
      });
    }
  }
}

async function sendNotification(
  userId,
  content,
  href,
  type,
  emailSubject,
  withEmail,
  contentType = "TEXT",
  clientLeadId,
  staffId
) {
  let io = serverIo;
  const link = href
    ? `<a href="${process.env.OLDORIGIN}${href}" style="color: #1a73e8; text-decoration: none;">See details from here</a>`
    : "";
  const emailContent = `
        <div style=" color: #333; direction: ltr; text-align: left;">
            <h2 style="color: #444; margin-bottom: 16px;">${emailSubject}</h2>
            <p style="font-size: 16px; line-height: 1.5;">${content}</p>
            ${link ? `<p>${link}</p>` : ""}
        </div>
    `;
  let notification = await prisma.notification.create({
    data: {
      userId: userId,
      content: content,
      type,
      link: href,
      contentType,
      clientLeadId: clientLeadId && Number(clientLeadId),
      staffId: staffId && Number(staffId),
    },
  });
  if (!io) {
    io = await connectToTelegram(true);
  }
  io.to(userId.toString()).emit("notification", notification);
  if (withEmail) {
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: { email: true },
    });
    if (user && user.email) {
      const email = `
<div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
    <div>
        ${emailContent}
    </div>
    <div style="margin-top: 10px;">
        <a href="${process.env.OLDORIGIN}/dashboard/notifications" style="color: #007bff; text-decoration: none;">
            Go to notifications?
        </a>
    </div>
</div>
`;

      setImmediate(() => {
        sendEmail(user.email, emailSubject, email).catch((error) => {
          console.error(`Failed to send email to user ${userId}:`, error);
        });
      });
    }
  }
}
