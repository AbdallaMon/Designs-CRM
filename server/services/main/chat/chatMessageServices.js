import prisma from "../../../prisma/prisma.js";
import { getIo } from "../../socket.js";

/**
 * Get messages for a room with day grouping
 */
export async function getMessages({ roomId, userId, page = 0, limit = 50 }) {
  const skip = page * limit;

  // Verify user is member
  const member = await prisma.chatMember.findFirst({
    where: {
      roomId: parseInt(roomId),
      userId: parseInt(userId),
      isDeleted: false,
    },
  });

  if (!member) {
    throw new Error("You don't have access to this room");
  }

  const [messages, total, unreadCount] = await Promise.all([
    prisma.chatMessage.findMany({
      where: {
        roomId: parseInt(roomId),
        isDeleted: false,
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: { id: true, name: true, email: true, profilePicture: true },
        },
        client: {
          select: { id: true, name: true, email: true },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: { select: { id: true, name: true } },
          },
        },
        reactions: {
          include: {
            user: { select: { id: true, name: true } },
            client: { select: { id: true, name: true } },
          },
        },
        attachments: true,
        mentions: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        readReceipts: {
          where: { memberId: member.id },
          select: { id: true },
        },
      },
    }),
    prisma.chatMessage.count({
      where: {
        roomId: parseInt(roomId),
        isDeleted: false,
      },
    }),
    prisma.chatMessage.count({
      where: {
        roomId: parseInt(roomId),
        isDeleted: false,
        senderId: { not: parseInt(userId) },
        readReceipts: {
          none: { memberId: member.id },
        },
      },
    }),
  ]);

  // Convert to ascending chronological order
  const ascending = messages.reverse();

  // Add day grouping metadata with friendly label and unread marker
  const messagesWithGrouping = addDayGrouping(ascending, {
    userId: parseInt(userId),
    unreadCount,
  });

  await markMessagesAsRead({ roomId, userId });
  return {
    data: messagesWithGrouping,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
export async function getMessagePageByMessageId({ messageId, limit = 50 }) {
  const message = await prisma.chatMessage.findUnique({
    where: { id: messageId },
    select: { createdAt: true, id: true, roomId: true },
  });
  if (!message) throw new Error("Message not found");

  const { createdAt, id } = message;

  const index = await prisma.chatMessage.count({
    where: {
      OR: [
        { roomId: message.roomId, createdAt: { gt: createdAt } },
        { roomId: message.roomId, createdAt, id: { gt: id } },
      ],
    },
  });

  // 3) Compute page (1-based)
  const page = Math.floor(index / limit);

  return { messageId, page, limit };
}

/**
 * Add day grouping metadata to messages
 */
function addDayGrouping(messages, options = {}) {
  if (!messages || messages.length === 0) return [];

  const now = new Date();
  let previousDayGroup = null;
  let firstUnreadMarked = false;
  const { userId, unreadCount } = options;

  return messages.map((msg) => {
    const msgDate = new Date(msg.createdAt);
    const dayGroup = getDayGroup(msgDate, now);
    const dayLabel = getDayLabel(msgDate, now);
    const showDayDivider = dayGroup !== previousDayGroup;

    previousDayGroup = dayGroup;

    // Determine unread for current member (requires readReceipts for this member)
    const isUnreadForMember =
      typeof userId === "number" &&
      msg.senderId !== userId &&
      (!msg.readReceipts || msg.readReceipts.length === 0);

    const showUnreadCount =
      !firstUnreadMarked && isUnreadForMember ? true : false;
    const unreadCountValue = showUnreadCount ? unreadCount : undefined;
    if (showUnreadCount) firstUnreadMarked = true;

    return {
      ...msg,
      dayGroup,
      dayLabel,
      showDayDivider,
      // Unread marker on the first unread message in this page
      ...(showUnreadCount
        ? { showUnreadCount: true, unreadCount: unreadCountValue }
        : {}),
    };
  });
}

/**
 * Determine day group label for a message
 */
function getDayGroup(msgDate, now) {
  // Reset time to midnight for comparison
  const msgDay = new Date(
    msgDate.getFullYear(),
    msgDate.getMonth(),
    msgDate.getDate()
  );
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffTime = today.getTime() - msgDay.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "today";
  } else if (diffDays === 1) {
    return "yesterday";
  } else if (diffDays < 7) {
    // Return day name for current week
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[msgDate.getDay()];
  } else {
    // Return formatted date for older messages
    return msgDate.toISOString().split("T")[0]; // YYYY-MM-DD
  }
}

/**
 * Friendly day label for UI
 */
function getDayLabel(msgDate, now) {
  const msgDay = new Date(
    msgDate.getFullYear(),
    msgDate.getMonth(),
    msgDate.getDate()
  );
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffTime = today.getTime() - msgDay.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[msgDate.getDay()];
  }
  // e.g., Jan 5, 2025
  return msgDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export async function emitToAllUsersRelatedToARoom({
  roomId,
  userId,
  content,
  type,
}) {
  const members = await prisma.chatMember.findMany({
    where: {
      roomId: parseInt(roomId),
      isDeleted: false,
      userId: { not: parseInt(userId) },
    },
    select: { userId: true },
  });
  try {
    const io = getIo();
    for (const member of members) {
      io.to(`user:${member.userId}`).emit(type, {
        ...content,
      });
    }
  } catch (e) {}
}
export async function emitToAllUsersIncludingSame({
  roomId,
  userId,
  content,
  type,
}) {
  const members = await prisma.chatMember.findMany({
    where: {
      roomId: parseInt(roomId),
      isDeleted: false,
    },
    select: { userId: true },
  });
  try {
    const io = getIo();
    for (const member of members) {
      io.to(`user:${member.userId}`).emit(type, {
        ...content,
      });
    }
  } catch (e) {}
}
/**
 * Send a message
 */
export async function sendMessage({
  roomId,
  userId,
  content,
  type = "TEXT",
  fileUrl,
  fileName,
  fileSize,
  fileMimeType,
  replyToId,
}) {
  // Verify user is member
  const member = await prisma.chatMember.findFirst({
    where: {
      roomId: parseInt(roomId),
      userId: parseInt(userId),
      isDeleted: false,
    },
  });

  if (!member) {
    throw new Error("You don't have access to this room");
  }

  // Check if room allows files
  if (type === "FILE" || fileUrl) {
    const room = await prisma.chatRoom.findUnique({
      where: { id: parseInt(roomId) },
      select: { allowFiles: true },
    });

    if (!room.allowFiles) {
      throw new Error("File sharing is disabled in this room");
    }
  }
  const room = await prisma.chatRoom.findUnique({
    where: { id: parseInt(roomId) },
    select: { isChatEnabled: true, allowFiles: true },
  });
  if (!room.isChatEnabled) {
    throw new Error("Chat is disabled in this room");
  }
  if ((type === "FILE" || fileUrl) && !room.allowFiles) {
    throw new Error("File sharing is disabled in this room");
  }

  // Create message
  const message = await prisma.chatMessage.create({
    data: {
      roomId: parseInt(roomId),
      senderId: parseInt(userId),
      content,
      type,
      fileUrl,
      fileName,
      fileSize: fileSize ? parseInt(fileSize) : null,
      fileMimeType,
      replyToId: replyToId ? parseInt(replyToId) : null,
    },
    include: {
      sender: {
        select: { id: true, name: true, email: true },
      },
      replyTo: {
        select: {
          id: true,
          content: true,
          sender: { select: { id: true, name: true } },
        },
      },
    },
  });

  // Update room's updatedAt

  // Emit to all room members for live chat
  try {
    const io = getIo();
    io.to(`room:${roomId}`).emit("message:created", {
      ...message,
      roomId: parseInt(roomId),
    });

    io.to(`room:${roomId}`).emit("user:stop_typing", {
      userId,
      roomId,
    });
    await emitToAllUsersRelatedToARoom({
      roomId,
      userId,
      content: {
        message,
        roomId: parseInt(roomId),
        isMuted: member.isMuted,
      },
      type: "notification:new_message",
    });
  } catch (error) {
    console.error("Socket.IO emit error:", error);
  }

  return message;
}

/**
 * Edit a message
 */
export async function editMessage({ messageId, userId, content }) {
  // Get message and verify ownership
  const message = await prisma.chatMessage.findUnique({
    where: { id: parseInt(messageId) },
  });

  if (!message) {
    throw new Error("Message not found");
  }

  if (message.senderId !== parseInt(userId)) {
    throw new Error("You can only edit your own messages");
  }

  const updatedMessage = await prisma.chatMessage.update({
    where: { id: parseInt(messageId) },
    data: {
      content,
      isEdited: true,
    },
    include: {
      sender: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // Emit update
  try {
    const io = getIo();
    io.to(`room:${message.roomId}`).emit("message:edited", updatedMessage);
  } catch (error) {
    console.error("Socket.IO emit error:", error);
  }

  return updatedMessage;
}

/**
 * Delete a message
 */
export async function deleteMessage({ messageId, userId }) {
  // Get message and verify ownership
  console.log(messageId, userId, "messageId, userId delete message");
  const message = await prisma.chatMessage.findUnique({
    where: { id: parseInt(messageId) },
  });
  const member = await prisma.chatMember.findFirst({
    where: {
      roomId: message.roomId,
      userId: parseInt(userId),
      isDeleted: false,
    },
  });

  if (!message) {
    throw new Error("Message not found");
  }

  if (message.senderId !== parseInt(userId) && !member?.role === "ADMIN") {
    throw new Error("You can only delete your own messages");
  }

  await prisma.chatMessage.update({
    where: { id: parseInt(messageId) },
    data: { isDeleted: true },
  });
  const deletedMessage = await prisma.chatMessage.findUnique({
    where: { id: parseInt(messageId) },
  });
  // Emit deletion
  try {
    const io = getIo();
    io.to(`room:${message.roomId}`).emit("message:deleted", {
      messageId: parseInt(messageId),
      roomId: message.roomId,
    });
  } catch (error) {
    console.error("Socket.IO emit error:", error);
  }

  return { message: "Message deleted successfully" };
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead({ roomId, userId }) {
  // Get member
  const member = await prisma.chatMember.findFirst({
    where: {
      roomId: parseInt(roomId),
      userId: parseInt(userId),
      isDeleted: false,
    },
  });

  if (!member) {
    throw new Error("You don't have access to this room");
  }
  const unreadMessages = await prisma.chatMessage.findMany({
    where: {
      roomId: parseInt(roomId),
      senderId: { not: parseInt(userId) },
      readReceipts: {
        none: { memberId: member.id },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  for (const msg of await unreadMessages) {
    // check if already read
    const existingReceipt = await prisma.chatReadReceipt.findFirst({
      where: {
        memberId: member.id,
        messageId: msg.id,
      },
    });
    if (existingReceipt) continue;
    await prisma.chatReadReceipt.create({
      data: {
        memberId: member.id,
        messageId: msg.id,
      },
    });
  }

  // Update lastReadAt
  await prisma.chatMember.update({
    where: { id: member.id },
    data: { lastReadAt: new Date() },
  });
  const io = getIo();

  io.to(`user:${userId}`).emit("notification:messages_read", {
    roomId: parseInt(roomId),
    userId: parseInt(userId),
    count: unreadMessages.length,
  });

  return { success: true };
}

export async function markAMessageAsRead({ roomId, userId, messageId }) {
  // Get member
  const member = await prisma.chatMember.findFirst({
    where: {
      roomId: parseInt(roomId),
      userId: parseInt(userId),
      isDeleted: false,
    },
  });

  if (!member) {
    throw new Error("You don't have access to this room");
  }

  // Update lastReadAt
  await prisma.chatMember.update({
    where: { id: member.id },
    data: { lastReadAt: new Date() },
  });
  const io = getIo();

  // If specific message, create read receipt
  if (messageId) {
    await prisma.chatReadReceipt.upsert({
      where: {
        messageId_memberId: {
          messageId: parseInt(messageId),
          memberId: member.id,
        },
      },
      update: { readAt: new Date() },
      create: {
        messageId: parseInt(messageId),
        memberId: member.id,
      },
    });

    // Emit read receipt
    try {
      io.to(`room:${roomId}`).emit("message:read", {
        messageId: parseInt(messageId),
        userId: parseInt(userId),
        readAt: new Date(),
      });
      console.log("Emitted read receipt");
    } catch (error) {
      console.error("Socket.IO emit error:", error);
    }
  }
  io.to(`user:${userId}`).emit("notification:messages_read", {
    roomId: parseInt(roomId),
    userId: parseInt(userId),
  });

  return { success: true };
}
/**
 * Add reaction to message
 */
export async function addReaction({ messageId, userId, emoji }) {
  const reaction = await prisma.chatReaction.upsert({
    where: {
      messageId_userId_emoji: {
        messageId: parseInt(messageId),
        userId: parseInt(userId),
        emoji,
      },
    },
    update: {},
    create: {
      messageId: parseInt(messageId),
      userId: parseInt(userId),
      emoji,
    },
    include: {
      user: { select: { id: true, name: true } },
      message: { select: { roomId: true } },
    },
  });

  // Emit reaction
  try {
    const io = getIo();
    io.to(`room:${reaction.message.roomId}`).emit("reaction:added", {
      messageId: parseInt(messageId),
      userId: parseInt(userId),
      emoji,
    });
  } catch (error) {
    console.error("Socket.IO emit error:", error);
  }

  return reaction;
}

/**
 * Remove reaction from message
 */
export async function removeReaction({ messageId, userId, emoji }) {
  const reaction = await prisma.chatReaction.findFirst({
    where: {
      messageId: parseInt(messageId),
      userId: parseInt(userId),
      emoji,
    },
    include: {
      message: { select: { roomId: true } },
    },
  });

  if (!reaction) {
    throw new Error("Reaction not found");
  }

  await prisma.chatReaction.delete({
    where: { id: reaction.id },
  });

  // Emit reaction removal
  try {
    const io = getIo();
    io.to(`room:${reaction.message.roomId}`).emit("reaction:removed", {
      messageId: parseInt(messageId),
      userId: parseInt(userId),
      emoji,
    });
  } catch (error) {
    console.error("Socket.IO emit error:", error);
  }

  return { success: true };
}

/**
 * Get pinned messages for a room
 */
export async function getPinnedMessages({ roomId }) {
  const pins = await prisma.chatPinnedMessage.findMany({
    where: {
      roomId: parseInt(roomId),
      message: {
        isDeleted: false,
      },
    },
    orderBy: {
      message: {
        id: "desc",
      },
    },
    include: {
      message: {
        include: {
          sender: {
            select: { id: true, name: true, email: true, profilePicture: true },
          },
          client: { select: { id: true, name: true, email: true } },
          replyTo: {
            select: {
              id: true,
              content: true,
              sender: { select: { id: true, name: true } },
            },
          },
        },
      },
      pinnedBy: { select: { id: true, name: true } },
    },
  });

  // Return plain message objects for frontend convenience
  const messages = pins.map((p) => p.message);

  return messages;
}
export async function pinMessage({ roomId, messageId, userId }) {
  // Verify user is member
  const member = await prisma.chatMember.findFirst({
    where: {
      roomId: parseInt(roomId),
      userId: parseInt(userId),
      isDeleted: false,
    },
  });
  const room = await prisma.chatRoom.findUnique({
    where: { id: parseInt(roomId) },
  });
  if (!member) {
    throw new Error("You don't have access to this room");
  }
  // check if room is staff to staff or use is admin or moderator else throw error
  if (
    room.type === "STAFF_TO_STAFF" &&
    !(member.role === "ADMIN" || member.role === "MODERATOR")
  ) {
    throw new Error(
      "Only admins and moderators can pin messages in staff to staff rooms"
    );
  }

  const pinned = await prisma.chatPinnedMessage.create({
    data: {
      roomId: parseInt(roomId),
      messageId: parseInt(messageId),
      pinnedById: parseInt(userId),
    },
  });
  emitToAllUsersIncludingSame({
    roomId,
    userId,
    content: {
      messageId: parseInt(messageId),
      roomId: parseInt(roomId),
      pinnedById: parseInt(userId),
    },
    type: "message:pinned",
  });
  return pinned;
}

export async function unpinMessage({ roomId, messageId, userId }) {
  // Verify user is member
  const member = await prisma.chatMember.findFirst({
    where: {
      roomId: parseInt(roomId),
      userId: parseInt(userId),
      isDeleted: false,
    },
  });
  const room = await prisma.chatRoom.findUnique({
    where: { id: parseInt(roomId) },
  });
  if (!member) {
    throw new Error("You don't have access to this room");
  }
  // check if room is staff to staff or use is admin or moderator else throw error
  if (
    room.type === "STAFF_TO_STAFF" &&
    !(member.role === "ADMIN" || member.role === "MODERATOR")
  ) {
    throw new Error(
      "Only admins and moderators can unpin messages in staff to staff rooms"
    );
  }
  const pinned = await prisma.chatPinnedMessage.deleteMany({
    where: {
      roomId: parseInt(roomId),
      messageId: parseInt(messageId),
    },
  });
  emitToAllUsersIncludingSame({
    roomId,
    userId,
    content: {
      messageId: parseInt(messageId),
      roomId: parseInt(roomId),
      unpinnedById: parseInt(userId),
    },
    type: "message:unpinned",
  });
  return pinned;
}
