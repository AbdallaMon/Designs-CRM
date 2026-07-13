import { getIo } from "../../infra/socket/io-registry.js";
import { AppError } from "../../shared/errors/AppError.js";
import { addDayGrouping } from "./chat.helpers.js";
import { chatMessagesCodes } from "@dms/shared";
import { chatRepository } from "./chat.repo.js";


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

    const member = await chatRepository.getMember({
      roomId,
      userId,
      clientId,
    });
    if (!member)
      throw new AppError(chatMessagesCodes.ROOM_ACCESS_DENIED, 403);

    const [messages, total, unreadCount] = await Promise.all([
      chatRepository.getMessagesWithReceipts({
        roomId,
        memberId: member.id,
        skip,
        limit: parsedLimit,
      }),
      chatRepository.countMessages(roomId),
      chatRepository.countUnreadMessages({
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
      items: messagesWithGrouping,
      total,
      totalPages: Math.ceil(total / parsedLimit),
    };
  },

  async getMessagePage(messageId, limit = 50) {
    return chatRepository.getMessageIndexInRoom(messageId, limit);
  },

  async getPinnedMessages(roomId, userId, clientId) {
    const member = await chatRepository.getMember({
      roomId,
      userId,
      clientId,
    });
    if (!member)
      throw new AppError(chatMessagesCodes.ROOM_ACCESS_DENIED, 403);

    const pins = await chatRepository.getPinnedMessages(roomId);
    return pins.map((p) => p.message);
  },

  async markRoomRead(roomId, userId, clientId) {
    const member = await chatRepository.getMember({
      roomId,
      userId,
      clientId,
    });
    if (!member) return;

    const unreadMessages = await chatRepository.getUnreadMessages({
      roomId,
      memberId: member.id,
      userId,
      clientId,
    });

    await chatRepository.bulkMarkMessagesRead({
      memberId: member.id,
      messageIds: unreadMessages.map((m) => m.id),
    });

    await chatRepository.updateMemberReadAt(member.id);

    if (unreadMessages.length > 0) {
      const io = getIo();
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
    const member = await chatRepository.getMember({
      roomId,
      userId,
      clientId,
    });
    if (!member)
      throw new AppError(chatMessagesCodes.ROOM_ACCESS_DENIED, 403);

    await chatRepository.updateMemberReadAt(member.id);

    if (messageId) {
      await chatRepository.upsertReadReceipt({
        messageId,
        memberId: member.id,
      });

      const io = getIo();
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
      const memberships = await chatRepository.getUserMemberships(userId);
      resolvedRoomIds = memberships.map((m) => m.roomId);
    }
    await chatRepository.updateManyMembersReadAt({
      userId,
      roomIds: resolvedRoomIds.map(Number),
    });
    return { code: chatMessagesCodes.ALL_ROOMS_MARKED_READ };
  },

  async addReaction(messageId, userId, emoji) {
    const reaction = await chatRepository.upsertReaction({
      messageId,
      userId,
      emoji,
    });
    const io = getIo();
    io.to(`room:${reaction.message.roomId}`).emit("reaction:added", {
      messageId: Number(messageId),
      userId: Number(userId),
      emoji,
    });
    return reaction;
  },

  async removeReaction(messageId, userId, emoji) {
    const reaction = await chatRepository.findReaction({
      messageId,
      userId,
      emoji,
    });
    if (!reaction) throw new AppError(chatMessagesCodes.REACTION_NOT_FOUND, 404);
    await chatRepository.deleteReaction(reaction.id);
    const io = getIo();
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
    const member = await chatRepository.getMember({
      roomId,
      userId,
      clientId,
    });
    if (!member)
      throw new AppError(chatMessagesCodes.ROOM_ACCESS_DENIED, 403);

    const room = await chatRepository.findRoomBasic(roomId);
    if (!room?.isChatEnabled)
      throw new AppError(chatMessagesCodes.CHAT_DISABLED, 400);
    if ((type === "FILE" || attachments?.length) && !room.allowFiles) {
      throw new AppError(chatMessagesCodes.FILES_DISABLED, 400);
    }

    const message = await chatRepository.createMessage({
      roomId,
      senderId: userId,
      senderClient: clientId,
      content,
      type,
      attachments: attachments || [],
      replyToId,
      memberId: member.id,
    });

    const io = getIo();
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
    const message = await chatRepository.getMessageById(messageId);
    if (!message) throw new AppError(chatMessagesCodes.MESSAGE_NOT_FOUND, 404);

    const isOwner =
      (userId && message.senderId === Number(userId)) ||
      (clientId && message.senderClient === Number(clientId));

    if (!isOwner)
      throw new AppError(chatMessagesCodes.MESSAGE_FORBIDDEN, 403);

    const updated = await chatRepository.updateMessage(messageId, {
      content,
      isEdited: true,
    });

    const io = getIo();
    io.to(`room:${message.roomId}`).emit("message:edited", updated);

    return updated;
  },

  async deleteMessage({ messageId, userId, clientId }) {
    const message = await chatRepository.getMessageById(messageId);
    if (!message) throw new AppError(chatMessagesCodes.MESSAGE_NOT_FOUND, 404);

    const member = await chatRepository.getMember({
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

    await chatRepository.softDeleteMessage(messageId);

    const io = getIo();
    io.to(`room:${message.roomId}`).emit("message:deleted", {
      messageId: Number(messageId),
      roomId: message.roomId,
    });

    return { message: "Message deleted successfully" };
  },

  async pinMessage({ roomId, messageId, userId, clientId }) {
    const member = await chatRepository.getMember({
      roomId,
      userId,
      clientId,
    });
    if (!member) throw new AppError(chatMessagesCodes.ROOM_ACCESS_DENIED, 403);

    const room = await chatRepository.findRoomBasic(roomId);
    if (
      room.type !== "STAFF_TO_STAFF" &&
      member.role !== "ADMIN" &&
      member.role !== "MODERATOR"
    ) {
      throw new AppError(chatMessagesCodes.ROOM_FORBIDDEN_ACTION, 403);
    }

    const pinned = await chatRepository.createPin({
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
    const member = await chatRepository.getMember({
      roomId,
      userId,
      clientId,
    });
    if (!member) throw new AppError(chatMessagesCodes.ROOM_ACCESS_DENIED, 403);

    const room = await chatRepository.findRoomBasic(roomId);
    if (
      room.type !== "STAFF_TO_STAFF" &&
      member.role !== "ADMIN" &&
      member.role !== "MODERATOR"
    ) {
      throw new AppError(chatMessagesCodes.ROOM_FORBIDDEN_ACTION, 403);
    }

    const result = await chatRepository.deletePins({ roomId, messageId });

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
    const messages = await chatRepository.getMessagesForForward(messageIds);
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
