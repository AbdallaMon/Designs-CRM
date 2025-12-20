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
  const unreadMessages = prisma.chatMessage.findMany({
    where: {
      roomId: parseInt(roomId),
      senderId: { not: parseInt(userId) },
      // isDeleted: false,
      readReceipts: {
        none: { memberId: member.id },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  for (const msg of await unreadMessages) {
    await prisma.chatReadReceipt.create({
      data: {
        memberId: member.id,
        messageId: msg.id,
      },
    });
  }

  const [messages, total] = await Promise.all([
    prisma.chatMessage.findMany({
      where: {
        roomId: parseInt(roomId),
        // isDeleted: false,
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
      },
    }),
    prisma.chatMessage.count({
      where: {
        roomId: parseInt(roomId),
        // isDeleted: false,
      },
    }),
  ]);

  // Add day grouping metadata
  const messagesWithGrouping = addDayGrouping(messages.reverse());
  return {
    data: messagesWithGrouping,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Add day grouping metadata to messages
 */
function addDayGrouping(messages) {
  if (!messages || messages.length === 0) return [];

  const now = new Date();
  let previousDayGroup = null;

  return messages.map((msg) => {
    const msgDate = new Date(msg.createdAt);
    const dayGroup = getDayGroup(msgDate, now);
    const showDayDivider = dayGroup !== previousDayGroup;

    previousDayGroup = dayGroup;

    return {
      ...msg,
      dayGroup,
      showDayDivider,
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
export async function markMessagesAsRead({ roomId, userId, messageId }) {
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
