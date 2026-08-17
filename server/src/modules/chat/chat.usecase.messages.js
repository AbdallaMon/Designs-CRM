import { getIo } from "../../infra/socket/io-registry.js";
import { AppError } from "../../shared/errors/AppError.js";
import { addDayGrouping } from "./chat.helpers.js";
import { CHAT_MEMBER_ROLES, CHAT_ROOM_TYPES, chatMessagesCodes } from "@dms/shared";
import { chatRepository } from "./chat.repo.js";
import { exposeAssetReferences } from "../../infra/upload/asset-access.js";
import { canonicalizeAssetReferences } from "../../infra/upload/upload-reference.js";

async function requireRoomMember({ roomId, userId, clientId }) {
  const member = await chatRepository.getMember({ roomId, userId, clientId });
  if (!member) {
    throw new AppError({
      code: chatMessagesCodes.ROOM_ACCESS_DENIED,
      statusCode: 403,
    });
  }
  return member;
}

async function requireMessageInRoom(messageId, roomId = null) {
  const message = await chatRepository.getMessageById(messageId);
  if (
    !message ||
    (roomId != null && Number(message.roomId) !== Number(roomId))
  ) {
    throw new AppError({
      code: chatMessagesCodes.MESSAGE_NOT_FOUND,
      statusCode: 404,
    });
  }
  return message;
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

    const member = await chatRepository.getMember({
      roomId,
      userId,
      clientId,
    });
    if (!member)
      throw new AppError({ code: chatMessagesCodes.ROOM_ACCESS_DENIED, statusCode: 403 });

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

  async getMessagePage(roomId, messageId, userId, clientId, limit = 50) {
    await requireRoomMember({ roomId, userId, clientId });
    await requireMessageInRoom(messageId, roomId);
    return chatRepository.getMessageIndexInRoom(messageId, limit);
  },

  async getPinnedMessages(roomId, userId, clientId) {
    const member = await chatRepository.getMember({
      roomId,
      userId,
      clientId,
    });
    if (!member)
      throw new AppError({ code: chatMessagesCodes.ROOM_ACCESS_DENIED, statusCode: 403 });

    const pins = await chatRepository.getPinnedMessages(roomId);
    return pins.map((p) => p.message);
  },

  async markRoomRead(roomId, userId, clientId) {
    const member = await requireRoomMember({ roomId, userId, clientId });

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
    const member = await requireRoomMember({ roomId, userId, clientId });
    if (messageId) await requireMessageInRoom(messageId, roomId);

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

  async addReaction({ messageId, roomId = null, userId, clientId, emoji }) {
    const message = await requireMessageInRoom(messageId, roomId);
    await requireRoomMember({
      roomId: message.roomId,
      userId,
      clientId,
    });
    const reaction = await chatRepository.upsertReaction({
      messageId,
      userId,
      clientId,
      emoji,
    });
    const io = getIo();
    io.to(`room:${reaction.message.roomId}`).emit("reaction:added", {
      messageId: Number(messageId),
      userId: userId ? Number(userId) : null,
      clientId: clientId ? Number(clientId) : null,
      emoji,
    });
    return reaction;
  },

  async removeReaction({ messageId, roomId = null, userId, clientId, emoji }) {
    const message = await requireMessageInRoom(messageId, roomId);
    await requireRoomMember({
      roomId: message.roomId,
      userId,
      clientId,
    });
    const reaction = await chatRepository.findReaction({
      messageId,
      userId,
      clientId,
      emoji,
    });
    if (!reaction) throw new AppError({ code: chatMessagesCodes.REACTION_NOT_FOUND, statusCode: 404 });
    await chatRepository.deleteReaction(reaction.id);
    const io = getIo();
    io.to(`room:${reaction.message.roomId}`).emit("reaction:removed", {
      messageId: Number(messageId),
      userId: userId ? Number(userId) : null,
      clientId: clientId ? Number(clientId) : null,
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
    const member = await requireRoomMember({ roomId, userId, clientId });

    const room = await chatRepository.findRoomBasic(roomId);
    if (!room?.isChatEnabled)
      throw new AppError({ code: chatMessagesCodes.CHAT_DISABLED, statusCode: 400 });
    if ((type === "FILE" || attachments?.length) && !room.allowFiles) {
      throw new AppError({ code: chatMessagesCodes.FILES_DISABLED, statusCode: 400 });
    }
    if (replyToId) await requireMessageInRoom(replyToId, roomId);

    const canonicalAttachments = canonicalizeAssetReferences(attachments || []);
    const message = await chatRepository.createMessage({
      roomId,
      senderId: userId,
      senderClient: clientId,
      content,
      type,
      attachments: canonicalAttachments,
      replyToId,
      memberId: member.id,
    });

    const io = getIo();
    const exposedMessage = exposeAssetReferences(message);
    io.to(`room:${roomId}`).emit("message:created", {
      ...exposedMessage,
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
        message: exposedMessage,
        roomId: Number(roomId),
        isMuted: member.isMuted,
        clientId,
      },
    }).catch(console.error);

    return message;
  },

  async editMessage({ roomId, messageId, userId, clientId, content }) {
    const message = await requireMessageInRoom(messageId, roomId);
    await requireRoomMember({ roomId: message.roomId, userId, clientId });

    const isOwner =
      (userId && message.senderId === Number(userId)) ||
      (clientId && message.senderClient === Number(clientId));

    if (!isOwner)
      throw new AppError({ code: chatMessagesCodes.MESSAGE_FORBIDDEN, statusCode: 403 });

    const updated = await chatRepository.updateMessage(messageId, {
      content,
      isEdited: true,
    });

    const io = getIo();
    io.to(`room:${message.roomId}`).emit("message:edited", updated);

    return updated;
  },

  async deleteMessage({ roomId, messageId, userId, clientId }) {
    const message = await requireMessageInRoom(messageId, roomId);

    const member = await requireRoomMember({
      roomId: message.roomId,
      userId,
      clientId,
    });
    const isOwner =
      (userId && message.senderId === Number(userId)) ||
      (clientId && message.senderClient === Number(clientId));
    const isAdmin = member?.role === CHAT_MEMBER_ROLES.ADMIN || member?.role === CHAT_MEMBER_ROLES.MODERATOR;

    if (!isOwner && !isAdmin)
      throw new AppError({ code: chatMessagesCodes.MESSAGE_FORBIDDEN, statusCode: 403 });

    await chatRepository.softDeleteMessage(messageId);

    const io = getIo();
    io.to(`room:${message.roomId}`).emit("message:deleted", {
      messageId: Number(messageId),
      roomId: message.roomId,
    });

    return { code: chatMessagesCodes.MESSAGE_DELETED };
  },

  async pinMessage({ roomId, messageId, userId, clientId }) {
    const member = await requireRoomMember({ roomId, userId, clientId });
    await requireMessageInRoom(messageId, roomId);

    const room = await chatRepository.findRoomBasic(roomId);
    if (
      !userId ||
      !room ||
      (room.type !== CHAT_ROOM_TYPES.STAFF_TO_STAFF &&
        member.role !== CHAT_MEMBER_ROLES.ADMIN &&
        member.role !== CHAT_MEMBER_ROLES.MODERATOR)
    ) {
      throw new AppError({ code: chatMessagesCodes.ROOM_FORBIDDEN_ACTION, statusCode: 403 });
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
    const member = await requireRoomMember({ roomId, userId, clientId });
    await requireMessageInRoom(messageId, roomId);

    const room = await chatRepository.findRoomBasic(roomId);
    if (
      !userId ||
      !room ||
      (room.type !== CHAT_ROOM_TYPES.STAFF_TO_STAFF &&
        member.role !== CHAT_MEMBER_ROLES.ADMIN &&
        member.role !== CHAT_MEMBER_ROLES.MODERATOR)
    ) {
      throw new AppError({ code: chatMessagesCodes.ROOM_FORBIDDEN_ACTION, statusCode: 403 });
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

  async forwardMessages({
    roomsIds,
    messageIds,
    userId,
    clientId,
    allowedRoomId = null,
  }) {
    const sourceIds = [...new Set(messageIds.map(Number))];
    const destinationIds = [...new Set(roomsIds.map(Number))];
    const messages = await chatRepository.getMessagesForForward(sourceIds);
    if (messages.length !== sourceIds.length) {
      throw new AppError({
        code: chatMessagesCodes.MESSAGE_NOT_FOUND,
        statusCode: 404,
      });
    }
    for (const message of messages) {
      if (
        allowedRoomId != null &&
        Number(message.roomId) !== Number(allowedRoomId)
      ) {
        throw new AppError({
          code: chatMessagesCodes.ROOM_ACCESS_DENIED,
          statusCode: 403,
        });
      }
      await requireRoomMember({
        roomId: message.roomId,
        userId,
        clientId,
      });
    }
    for (const roomId of destinationIds) {
      if (
        allowedRoomId != null &&
        Number(roomId) !== Number(allowedRoomId)
      ) {
        throw new AppError({
          code: chatMessagesCodes.ROOM_ACCESS_DENIED,
          statusCode: 403,
        });
      }
      await requireRoomMember({ roomId, userId, clientId });
      for (const msg of messages) {
        await this.sendMessage({
          roomId,
          userId,
          clientId,
          content: msg.content,
          type: msg.type,
          attachments: msg.attachments || [],
        });
      }
    }
  },
};
