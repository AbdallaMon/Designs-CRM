import { AppError } from "../../shared/errors/AppError.js";
import { addDayGrouping } from "./chat.helpers.js";
import { chatMessagesCodes } from "@dms/shared";

// Lazily resolve the socket server at call time. A static `import { getIo }`
// here would recreate a load-order-fragile cycle:
// infra/socket/index.js → chat.socket.js → chat.usecase.js → this file →
// infra/socket/index.js. The dynamic import is cached by the module loader, so
// this only defers resolution; the io instance and emit behavior are unchanged.
async function getIo() {
  return (await import("../../infra/socket/index.js")).getIo();
}

/**
 * Messages concern of ChatUsecase — reads, read-receipts, reactions, and the
 * socket message operations (send/edit/delete/pin/forward). Prototype-composed
 * onto {@link ChatUsecase} (see chat.usecase.js); moved verbatim,
 * behavior-preserving only.
 */
export const messageMethods = {
  // ── Messages ───────────────────────────────────────────────────────────────

  async getMessages(roomId, userId, clientId, query) {
    const { page, limit } = query;
    const parsedPage = page ? Number(page) : 0;
    const parsedLimit = limit ? Number(limit) : 50;
    const skip = parsedPage * parsedLimit;

    const member = await this.repository.getMember({
      roomId,
      userId,
      clientId,
    });
    if (!member)
      throw new AppError(chatMessagesCodes.ROOM_ACCESS_DENIED, 403);

    const [messages, total, unreadCount] = await Promise.all([
      this.repository.getMessagesWithReceipts({
        roomId,
        memberId: member.id,
        skip,
        limit: parsedLimit,
      }),
      this.repository.countMessages(roomId),
      this.repository.countUnreadMessages({
        roomId,
        memberId: member.id,
        userId,
        clientId,
      }),
    ]);

    const ascending = messages.reverse();
    const messagesWithGrouping = addDayGrouping(ascending, {
      userId: userId ? Number(userId) : null,
      clientId: clientId ? Number(clientId) : null,
      memberId: member.id,
      unreadCount,
    });

    await this.markRoomRead(roomId, userId, clientId);

    return {
      data: messagesWithGrouping,
      total,
      totalPages: Math.ceil(total / parsedLimit),
    };
  },

  async getMessagePage(messageId, limit = 50) {
    return this.repository.getMessageIndexInRoom(messageId, limit);
  },

  async getPinnedMessages(roomId, userId, clientId) {
    const member = await this.repository.getMember({
      roomId,
      userId,
      clientId,
    });
    if (!member)
      throw new AppError(chatMessagesCodes.ROOM_ACCESS_DENIED, 403);

    const pins = await this.repository.getPinnedMessages(roomId);
    return pins.map((p) => p.message);
  },

  async markRoomRead(roomId, userId, clientId) {
    const member = await this.repository.getMember({
      roomId,
      userId,
      clientId,
    });
    if (!member) return;

    const unreadMessages = await this.repository.getUnreadMessages({
      roomId,
      memberId: member.id,
      userId,
      clientId,
    });

    await this.repository.bulkMarkMessagesRead({
      memberId: member.id,
      messageIds: unreadMessages.map((m) => m.id),
    });

    await this.repository.updateMemberReadAt(member.id);

    if (unreadMessages.length > 0) {
      const io = await getIo();
      if (userId) {
        io.to(`user:${userId}`).emit("notification:messages_read", {
          roomId: Number(roomId),
          userId: Number(userId),
          count: unreadMessages.length,
        });
      } else if (clientId) {
        io.to(`client:${clientId}`).emit("notification:messages_read", {
          roomId: Number(roomId),
          clientId: Number(clientId),
          count: unreadMessages.length,
        });
      }
    }

    return { success: true };
  },

  async markMessageRead(roomId, messageId, userId, clientId) {
    const member = await this.repository.getMember({
      roomId,
      userId,
      clientId,
    });
    if (!member)
      throw new AppError(chatMessagesCodes.ROOM_ACCESS_DENIED, 403);

    await this.repository.updateMemberReadAt(member.id);

    if (messageId) {
      await this.repository.upsertReadReceipt({
        messageId,
        memberId: member.id,
      });

      const io = await getIo();
      io.to(`room:${roomId}`).emit("message:read", {
        messageId: Number(messageId),
        userId: userId ? Number(userId) : null,
        clientId: clientId ? Number(clientId) : null,
        readAt: new Date(),
      });
    }

    return { success: true };
  },

  async markAllRead(userId, roomIds) {
    let resolvedRoomIds = roomIds;
    if (!resolvedRoomIds?.length) {
      const memberships = await this.repository.getUserMemberships(userId);
      resolvedRoomIds = memberships.map((m) => m.roomId);
    }
    await this.repository.updateManyMembersReadAt({
      userId,
      roomIds: resolvedRoomIds.map(Number),
    });
    return { code: chatMessagesCodes.ALL_ROOMS_MARKED_READ };
  },

  async addReaction(messageId, userId, emoji) {
    const reaction = await this.repository.upsertReaction({
      messageId,
      userId,
      emoji,
    });
    const io = await getIo();
    io.to(`room:${reaction.message.roomId}`).emit("reaction:added", {
      messageId: Number(messageId),
      userId: Number(userId),
      emoji,
    });
    return reaction;
  },

  async removeReaction(messageId, userId, emoji) {
    const reaction = await this.repository.findReaction({
      messageId,
      userId,
      emoji,
    });
    if (!reaction) throw new AppError(chatMessagesCodes.REACTION_NOT_FOUND, 404);
    await this.repository.deleteReaction(reaction.id);
    const io = await getIo();
    io.to(`room:${reaction.message.roomId}`).emit("reaction:removed", {
      messageId: Number(messageId),
      userId: Number(userId),
      emoji,
    });
    return { success: true };
  },

  // ── Socket message operations ──────────────────────────────────────────────

  async sendMessage({
    roomId,
    userId,
    clientId,
    content,
    type = "TEXT",
    attachments = [],
    replyToId,
  }) {
    const member = await this.repository.getMember({
      roomId,
      userId,
      clientId,
    });
    if (!member)
      throw new AppError(chatMessagesCodes.ROOM_ACCESS_DENIED, 403);

    const room = await this.repository.findRoomBasic(roomId);
    if (!room?.isChatEnabled)
      throw new AppError(chatMessagesCodes.CHAT_DISABLED, 400);
    if ((type === "FILE" || attachments?.length) && !room.allowFiles) {
      throw new AppError(chatMessagesCodes.FILES_DISABLED, 400);
    }

    const message = await this.repository.createMessage({
      roomId,
      senderId: userId,
      senderClient: clientId,
      content,
      type,
      attachments: attachments || [],
      replyToId,
      memberId: member.id,
    });

    const io = await getIo();
    io.to(`room:${roomId}`).emit("message:created", {
      ...message,
      roomId: Number(roomId),
    });
    io.to(`room:${roomId}`).emit("user:stop_typing", {
      userId,
      clientId,
      roomId,
    });

    await this.emitToAllMembersExcluding({
      roomId,
      userId,
      clientId,
      event: "notification:new_message",
      content: {
        message,
        roomId: Number(roomId),
        isMuted: member.isMuted,
        clientId,
      },
    }).catch(console.error);

    return message;
  },

  async editMessage({ messageId, userId, clientId, content }) {
    const message = await this.repository.getMessageById(messageId);
    if (!message) throw new AppError(chatMessagesCodes.MESSAGE_NOT_FOUND, 404);

    const isOwner =
      (userId && message.senderId === Number(userId)) ||
      (clientId && message.senderClient === Number(clientId));

    if (!isOwner)
      throw new AppError(chatMessagesCodes.MESSAGE_FORBIDDEN, 403);

    const updated = await this.repository.updateMessage(messageId, {
      content,
      isEdited: true,
    });

    const io = await getIo();
    io.to(`room:${message.roomId}`).emit("message:edited", updated);

    return updated;
  },

  async deleteMessage({ messageId, userId, clientId }) {
    const message = await this.repository.getMessageById(messageId);
    if (!message) throw new AppError(chatMessagesCodes.MESSAGE_NOT_FOUND, 404);

    const member = await this.repository.getMember({
      roomId: message.roomId,
      userId,
      clientId,
    });
    const isOwner =
      (userId && message.senderId === Number(userId)) ||
      (clientId && message.senderClient === Number(clientId));
    const isAdmin = member?.role === "ADMIN" || member?.role === "MODERATOR";

    if (!isOwner && !isAdmin)
      throw new AppError(chatMessagesCodes.MESSAGE_FORBIDDEN, 403);

    await this.repository.softDeleteMessage(messageId);

    const io = await getIo();
    io.to(`room:${message.roomId}`).emit("message:deleted", {
      messageId: Number(messageId),
      roomId: message.roomId,
    });

    return { message: "Message deleted successfully" };
  },

  async pinMessage({ roomId, messageId, userId, clientId }) {
    const member = await this.repository.getMember({
      roomId,
      userId,
      clientId,
    });
    if (!member) throw new AppError(chatMessagesCodes.ROOM_ACCESS_DENIED, 403);

    const room = await this.repository.findRoomBasic(roomId);
    if (
      room.type !== "STAFF_TO_STAFF" &&
      member.role !== "ADMIN" &&
      member.role !== "MODERATOR"
    ) {
      throw new AppError(chatMessagesCodes.ROOM_FORBIDDEN_ACTION, 403);
    }

    const pinned = await this.repository.createPin({
      roomId,
      messageId,
      pinnedById: userId || clientId,
    });

    await this.emitToAllMembers({
      roomId,
      event: "message:pinned",
      content: {
        messageId: Number(messageId),
        roomId: Number(roomId),
        pinnedById: userId ? Number(userId) : null,
      },
    }).catch(console.error);

    return pinned;
  },

  async unpinMessage({ roomId, messageId, userId, clientId }) {
    const member = await this.repository.getMember({
      roomId,
      userId,
      clientId,
    });
    if (!member) throw new AppError(chatMessagesCodes.ROOM_ACCESS_DENIED, 403);

    const room = await this.repository.findRoomBasic(roomId);
    if (
      room.type !== "STAFF_TO_STAFF" &&
      member.role !== "ADMIN" &&
      member.role !== "MODERATOR"
    ) {
      throw new AppError(chatMessagesCodes.ROOM_FORBIDDEN_ACTION, 403);
    }

    const result = await this.repository.deletePins({ roomId, messageId });

    await this.emitToAllMembers({
      roomId,
      event: "message:unpinned",
      content: {
        messageId: Number(messageId),
        roomId: Number(roomId),
        unpinnedById: userId ? Number(userId) : null,
      },
    }).catch(console.error);

    return result;
  },

  async forwardMessages({ roomsIds, messageIds, userId }) {
    const messages = await this.repository.getMessagesForForward(messageIds);
    for (const roomId of roomsIds) {
      for (const msg of messages) {
        await this.sendMessage({
          roomId,
          userId,
          content: msg.content,
          type: msg.type,
          attachments: msg.attachments || [],
        });
      }
    }
  },
};
