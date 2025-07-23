import { Api } from "telegram";
import dotenv from "dotenv";
import { teleClient } from "./connectToTelegram.js";
import prisma from "../../prisma/prisma.js";
import { dealsLink } from "../links.js";
import { io as clientIO } from "socket.io-client";
import { Server } from "socket.io";
import { createServer } from "http";
import { sendEmail } from "../sendMail.js";

dotenv.config();

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: [
      process.env.ORIGIN,
      process.env.OLDORIGIN,
      process.env.COURSESORIGIN,
    ],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) {
    console.log(`User connected to socket: ${userId}`);
    socket.join(userId.toString());
  }

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const PORT = 4020;
httpServer.listen(PORT, () => {
  console.log(`🔌 Socket.IO server running on port ${PORT}`);
});

export async function createChannelAndAddUsers({ clientLeadId }) {
  const isUserAuthorized = await teleClient.checkAuthorization();

  if (!isUserAuthorized) {
    console.warn(
      "❌ Telegram client not authenticated. Aborting channel creation."
    );
    return; // Do nothing if not authenticated
  }
  const clientLead = await prisma.clientLead.findUnique({
    where: {
      id: Number(clientLeadId),
    },
    select: {
      id: true,
      client: {
        select: {
          name: true,
        },
      },
    },
  });

  const formattedId = `${clientLead.id.toString().padStart(7, "0")}`;

  const { chats } = await teleClient.invoke(
    new Api.channels.CreateChannel({
      title: formattedId,
      about: clientLead.client.name,
      megagroup: false,
    })
  );
  const channel = chats[0];

  let adminUsersToBeAdded = [];

  const adminUsers = await prisma.user.findMany({
    where: {
      role: {
        in: ["ADMIN", "SUPER_ADMIN"],
      },
      isActive: true,
    },
    select: {
      telegramUsername: true,
    },
  });

  const self = await teleClient.getMe();

  adminUsers.forEach(async (user) => {
    const entity = await getUserEntitiy(user);
    if (!entity || entity.id === self.id) return;
    adminUsersToBeAdded.push(entity);
  });

  if (adminUsersToBeAdded && adminUsersToBeAdded.length > 0) {
    await addUsersToATeleChannel({ channel, usersList: adminUsersToBeAdded });
    adminUsersToBeAdded.forEach(async (user) => {
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
    });
  }

  const channelId = channel.id;
  const accessHash = channel.accessHash;
  const exportedInvite = await teleClient.invoke(
    new Api.messages.ExportChatInvite({
      peer: channel,
    })
  );

  const inviteLink = exportedInvite.link;

  await createTeleChannelRecord({
    clientLead,
    accessHash,
    channelId,
    inviteLink,
  });
  await uploadItemsToTele({ clientLeadId: Number(clientLeadId) });
  console.log("✅ Admin privileges assigned.");
  return channel;
}

export async function createTeleChannelRecord({
  clientLead,
  accessHash,
  channelId,
  inviteLink,
}) {
  const checkIfPresent = await prisma.telegramChannel.findFirst({
    where: {
      accessHash,
      channelId,
      clientLeadId: clientLead.id,
      channelLink: inviteLink,
    },
  });
  if (checkIfPresent) return;
  await prisma.telegramChannel.create({
    data: {
      clientLeadId: clientLead.id,
      accessHash,
      channelId,
      channelLink: inviteLink,
    },
  });
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
  await teleClient.invoke(
    new Api.channels.InviteToChannel({
      channel,
      users: [...usersList],
    })
  );
}

export async function getChannelEntityFromInviteLink({ inviteLink }) {
  try {
    const lastPart = inviteLink.trim().split("/").pop();

    if (!lastPart) throw new Error("Invalid invite link");

    if (!lastPart.startsWith("+")) {
      return await teleClient.getEntity(lastPart);
    }

    const hash = lastPart.replace("+", "");

    const result = await teleClient.invoke(
      new Api.messages.CheckChatInvite({ hash })
    );

    if (result instanceof Api.ChatInviteAlready) {
      return result.chat;
    } else {
      throw new Error("Not a member or invalid invite");
    }
  } catch (error) {
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

  clientLeads.forEach(async (lead) => {
    if (lead.telegramLink) {
      const teleChat = await getChannelEntityFromInviteLink({
        inviteLink: lead.telegramLink,
      });
      if (!teleChat) return;
      await createTeleChannelRecord({
        clientLead: lead,
        accessHash: teleChat.accessHash,
        channelId: teleChat.id,
        inviteLink: lead.telegramLink,
      });
    } else {
      await createChannelAndAddUsers({
        clientLeadId: lead.id,
      });
    }
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

  console.log("✅ All notes and files uploaded to Telegram channel.");
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

export async function uploadANote(note, channel) {
  const mention = note.user?.telegramUsername
    ? `${note.user.telegramUsername}`
    : note.user?.name || "Unknown";

  let message = `📝 *Note from ${mention}*`;

  if (note.content) {
    message += `\n\n${note.content}`;
  }

  if (note.attachment) {
    message += `\n\n📎 [Attachment Link](${note.attachment})`;
  }

  await teleClient.sendMessage(channel, {
    message,
    parseMode: "markdown",
  });
}

export async function uploadAnAttachment(file, channel) {
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
  const lastFetchedMessage = await getLastFetchedTeleMessage({ clientLeadId });
  const channel = await getChannelEntitiyByTeleRecordAndLeadId({
    clientLeadId,
  });
  const options = {
    limit: 20,
  };

  if (lastFetchedMessage) {
    // Get messages *before* this message ID, then filter manually for newer ones
    options.minId = Number(lastFetchedMessage.messageId);
  }
  const fetchedMessages = await teleClient.getMessages(channel, options);
  let messages = fetchedMessages.sort((a, b) => a.id - b.id);

  return await filterTaggedMessages({ clientLeadId, messages, channel });
}

export async function getLastFetchedTeleMessage({ clientLeadId }) {
  return await prisma.fetchedTelegramMessage.findFirst({
    where: { clientLeadId },
    orderBy: { fetchedAt: "desc" },
  });
}

async function filterTaggedMessages({ clientLeadId, messages, channel }) {
  let lastMessage = null;
  clientLeadId = Number(clientLeadId);
  messages.forEach(async (msg) => {
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
    console.log(content);
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
    return null;
  });
  if (lastMessage) {
    const findLastMessage = await prisma.fetchedTelegramMessage.findFirst({
      where: {
        messageId: lastMessage.id,
        clientLeadId,
      },
    });
    if (findLastMessage) {
      return;
    }
    await prisma.fetchedTelegramMessage.create({
      data: {
        messageId: lastMessage.id,
        clientLeadId,
      },
    });
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
