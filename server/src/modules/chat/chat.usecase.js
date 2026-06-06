import { AppError } from "../../shared/errors/AppError.js";
import { getIo } from "../../infra/socket/index.js";
import { addDayGrouping, addMonthGrouping } from "./chat.helpers.js";
import { computeRoomCapabilities } from "./chat.dto.js";
import { chatMessagesCodes } from "@dms/shared";

export class ChatUsecase {
  /** @param {import("./chat.repository.js").ChatRepository} repository */
  constructor(repository) {
    this.repository = repository;
  }

  // ── Object-scope checker (REFERENCE EXAMPLE for module agents) ───────────────
  // Pattern: `checkIfUserCanAccessX` — load the scoped relation (here: room
  // membership via the ChatMember FK), THROW AppError(403, ACCESS_DENIED) when the
  // record is outside the user's scope, and RETURN the loaded row on success.
  // CRITICAL: it must THROW on denial — returning false/undefined would let the
  // request through (`requireSpecialChecker` only catches thrown errors). Copy
  // this shape for read scope; pair a stricter `checkIfUserCanMutateX` for writes.
  async checkIfUserCanAccessRoom({ roomId, authUserId, clientId = null }) {
    const member = await this.repository.getMember({
      roomId,
      userId: authUserId,
      clientId,
    });
    if (!member) {
      throw new AppError(chatMessagesCodes.ROOM_ACCESS_DENIED, 403);
    }
    return member;
  }

  // ── Socket emit helpers ────────────────────────────────────────────────────

  async emitToAllMembersExcluding({
    roomId,
    userId,
    clientId,
    event,
    content,
  }) {
    const io = getIo();
    const members = await this.repository.getActiveMembersExcluding({
      roomId,
      userId,
      clientId,
    });
    for (const m of members) {
      if (m.userId) io.to(`user:${m.userId}`).emit(event, content);
      else if (m.clientId) io.to(`client:${m.clientId}`).emit(event, content);
    }
  }

  async emitToAllMembers({ roomId, event, content }) {
    const io = getIo();
    const members = await this.repository.getActiveMembers(roomId);
    for (const m of members) {
      if (m.userId) io.to(`user:${m.userId}`).emit(event, content);
      else if (m.clientId) io.to(`client:${m.clientId}`).emit(event, content);
    }
  }

  // ── Presence ───────────────────────────────────────────────────────────────

  updateUserLastSeen(userId) {
    this.repository.updateUserLastSeen(userId);
  }

  async updateClientLastSeen(clientId) {
    await this.repository.updateClientLastSeen(clientId);
  }

  // ── Rooms ──────────────────────────────────────────────────────────────────

  async getRooms(authUser, query) {
    const userId = authUser.id;
    const permissions = authUser.permissions || [];
    const {
      category,
      projectId,
      clientLeadId,
      page,
      limit,
      searchKey,
      chatType,
    } = query;
    const parsedPage = page ? Number(page) : 0;
    const pageSize = limit ? Number(limit) : 25;
    const { rooms, total } = await this.repository.getRooms({
      userId,
      category,
      projectId,
      clientLeadId,
      page: parsedPage,
      limit: pageSize,
      search: searchKey || "",
      chatType: chatType || null,
    });

    const roomsWithMeta = await Promise.all(
      rooms.map(async (room) => {
        const selfMember = room.members?.find(
          (m) => m.userId === Number(userId),
        );
        const otherMembers =
          room.members?.filter((m) => m.userId !== Number(userId)) || [];
        const unreadCount = selfMember
          ? await this.repository.countUnreadMessages({
              roomId: room.id,
              memberId: selfMember.id,
              userId: Number(userId),
            })
          : 0;
        return {
          ...room,
          unreadCount,
          lastMessage: room.messages?.[0] || null,
          otherMembers,
          lastSeenAt:
            otherMembers.length > 0 ? otherMembers[0]?.user?.lastSeenAt : null,
          capabilities: computeRoomCapabilities(room, {
            permissions,
            authUserId: userId,
            selfMember,
          }),
        };
      }),
    );

    const totalUnread = roomsWithMeta.reduce(
      (sum, r) => sum + (r.unreadCount || 0),
      0,
    );

    return {
      items: roomsWithMeta,
      total,
      page: parsedPage,
      pageSize,
      totalUnread,
    };
  }

  async getRoomById(roomId, authUser, clientId) {
    const userId = authUser.id;
    const permissions = authUser.permissions || [];
    const selfMember = await this.repository.getMember({
      roomId,
      userId,
      clientId,
    });
    if (!selfMember)
      throw new AppError(chatMessagesCodes.ROOM_ACCESS_DENIED, 403);

    const room = await this.repository.getRoomById(roomId, userId, clientId);
    if (!room) throw new AppError(chatMessagesCodes.ROOM_NOT_FOUND, 404);

    const otherMembers =
      room.members?.filter((m) => m.userId !== Number(userId)) || [];
    return {
      ...room,
      otherMembers,
      lastSeenAt:
        otherMembers.length > 0 ? otherMembers[0]?.user?.lastSeenAt : null,
      selfMember,
      capabilities: computeRoomCapabilities(room, {
        permissions,
        authUserId: userId,
        selfMember,
      }),
    };
  }

  async createRoom(userId, body) {
    const {
      name,
      type,
      projectId,
      clientLeadId,
      projectIds,
      userIds,
      allowFiles,
      allowCalls,
      isChatEnabled,
    } = body;

    const room = await this.repository.createRoom({
      name,
      type,
      projectId,
      clientLeadId,
      userIds,
      createdById: userId,
      allowFiles,
      allowCalls,
      isChatEnabled,
    });

    if (type === "MULTI_PROJECT" && projectIds?.length) {
      await this.repository.addRoomProjects(room.id, projectIds);
    }

    const memberData = [
      { roomId: room.id, userId: Number(userId), role: "ADMIN" },
    ];
    const filteredUserIds = [
      ...new Set((userIds || []).filter((id) => Number(id) !== Number(userId))),
    ];
    for (const uid of filteredUserIds) {
      memberData.push({ roomId: room.id, userId: Number(uid), role: "MEMBER" });
    }
    await this.repository.addRoomMembers(memberData);

    const completeRoom = await this.repository.getFullRoom(room.id);

    await this.emitToAllMembersExcluding({
      roomId: room.id,
      userId,
      event: "notification:room_created",
      content: { roomId: room.id },
    }).catch(console.error);

    return completeRoom;
  }

  async createDirectChat(userId, participantId) {
    const existing = await this.repository.checkRoomExists({
      userId,
      otherUserId: participantId,
    });
    if (existing) return existing;

    return this.createRoom(userId, {
      name: "Staff to Staff Chat",
      type: "STAFF_TO_STAFF",
      userIds: [participantId],
      allowFiles: true,
      allowCalls: true,
      isChatEnabled: true,
    });
  }

  async createLeadsRoom(userId, body) {
    const {
      name,
      groupType,
      clientLeadId,
      projectIds,
      projectGroupIds,
      selectedProjectsTypes,
      addClient,
      addRelatedSalesStaff,
      addRelatedDesigners,
      chatPasswordHash,
    } = body;

    const projectWhere =
      groupType === "MULTI_PROJECT"
        ? {
            type: { in: selectedProjectsTypes || [] },
            groupId: { in: (projectGroupIds || []).map(Number) },
          }
        : {};

    const clientLead = await this.repository.getClientLeadWithProjects(
      clientLeadId,
      projectWhere,
    );
    if (!clientLead) throw new AppError(chatMessagesCodes.CLIENT_LEAD_NOT_FOUND, 404);

    let autoName = `${groupType === "CLIENT_TO_STAFF" ? "Lead" : "Projects"} ${clientLead.client.name} #(${clientLead.code})`;
    const count = await this.repository.countRoomsForLead(
      clientLeadId,
      groupType,
    );
    autoName += ` #${count + 1}`;

    const token = await this.repository.generateChatToken();

    const room = await this.repository.createRoom({
      name: name || autoName,
      type: groupType,
      clientLeadId,
      createdById: userId,
      chatAccessToken: token,
    });

    if (groupType === "MULTI_PROJECT") {
      const pIds = clientLead.projects.map((p) => p.id);
      if (!pIds.length)
        throw new AppError(chatMessagesCodes.NO_PROJECTS_FOR_CRITERIA, 400);
      await this.repository.addRoomProjects(room.id, pIds);
    }

    const assignments =
      clientLead.projects?.flatMap((p) => p.assignments) || [];
    let userIds = [];

    if (
      groupType === "CLIENT_TO_STAFF" &&
      addRelatedSalesStaff &&
      clientLead.assignedTo
    ) {
      userIds.push(String(clientLead.assignedTo.id));
    }
    if (
      (groupType === "CLIENT_TO_STAFF" && addRelatedDesigners) ||
      groupType === "MULTI_PROJECT"
    ) {
      const staffIds = [
        ...new Set(
          assignments
            .map((a) => String(a.userId))
            .filter((id) => id !== String(userId)),
        ),
      ];
      userIds = userIds.concat(staffIds);
    }

    const memberData = [
      { roomId: room.id, userId: Number(userId), role: "ADMIN" },
    ];
    if (groupType === "CLIENT_TO_STAFF" && addClient && clientLead.clientId) {
      memberData.push({
        roomId: room.id,
        clientId: clientLead.clientId,
        role: "MEMBER",
      });
    }
    const uniqueUserIds = [
      ...new Set(userIds.filter((id) => id !== String(userId))),
    ];
    for (const uid of uniqueUserIds) {
      memberData.push({ roomId: room.id, userId: Number(uid), role: "MEMBER" });
    }
    await this.repository.addRoomMembers(memberData);

    const completeRoom = await this.repository.getFullRoom(room.id);

    await this.emitToAllMembersExcluding({
      roomId: room.id,
      userId,
      event: "notification:room_created",
      content: { roomId: room.id },
    }).catch(console.error);

    return completeRoom;
  }

  async updateRoom(roomId, userId, updates) {
    const member = await this.repository.getMember({ roomId, userId });
    if (!member) throw new AppError(chatMessagesCodes.ROOM_ACCESS_DENIED, 403);

    const room = await this.repository.findRoomBasic(roomId);
    if (!room) throw new AppError(chatMessagesCodes.ROOM_NOT_FOUND, 404);

    const isAdminOrMod = member.role === "ADMIN" || member.role === "MODERATOR";
    if (!isAdminOrMod && room.type !== "STAFF_TO_STAFF") {
      throw new AppError(chatMessagesCodes.ROOM_FORBIDDEN_ACTION, 403);
    }

    // Sanitise — remove empty values
    const sanitized = Object.fromEntries(
      Object.entries(updates).filter(
        ([, v]) => v !== undefined && v !== null && v !== "",
      ),
    );

    const isMemberField = "isMuted" in sanitized || "isArchived" in sanitized;

    const result = isMemberField
      ? await this.repository.updateMemberSelf(member.id, sanitized)
      : await this.repository.updateRoom(roomId, sanitized);

    const io = getIo();
    io.to(`room:${roomId}`).emit("room:updated", {
      roomId: Number(roomId),
      updates: sanitized,
    });

    await this.emitToAllMembersExcluding({
      roomId,
      userId,
      event: "notification:room_updated",
      content: { roomId: Number(roomId), updates: sanitized },
    }).catch(console.error);

    return result;
  }

  async deleteRoom(roomId, userId) {
    const member = await this.repository.getMember({ roomId, userId });
    if (!member || member.role !== "ADMIN")
      throw new AppError(chatMessagesCodes.ROOM_FORBIDDEN_ACTION, 403);

    const room = await this.repository.findRoomBasic(roomId);
    if (!room) throw new AppError(chatMessagesCodes.ROOM_NOT_FOUND, 404);
    if (room.type === "STAFF_TO_STAFF" || room.type === "PROJECT_GROUP") {
      throw new AppError(chatMessagesCodes.ROOM_NOT_DELETABLE, 400);
    }

    await this.emitToAllMembersExcluding({
      roomId,
      userId,
      event: "notification:room_deleted",
      content: { roomId: Number(roomId) },
    }).catch(console.error);

    await this.repository.deleteRoom(roomId);
    return { code: chatMessagesCodes.ROOM_DELETED };
  }

  async manageClient(roomId, userId, action) {
    const member = await this.repository.getMember({ roomId, userId });
    if (!member) throw new AppError(chatMessagesCodes.ROOM_ACCESS_DENIED, 403);

    const isAdminOrMod = member.role === "ADMIN" || member.role === "MODERATOR";
    if (!isAdminOrMod)
      throw new AppError(chatMessagesCodes.ROOM_FORBIDDEN_ACTION, 403);

    const room = await this.repository.findRoomBasic(roomId);
    if (!room?.clientLead)
      throw new AppError(chatMessagesCodes.NO_CLIENT_LEAD_ON_ROOM, 400);

    const clientId = room.clientLead.clientId;

    if (action === "addClient") {
      await this.repository.addRoomMembers([
        { roomId: Number(roomId), clientId, role: "MEMBER" },
      ]);
      const token = await this.repository.generateChatToken();
      await this.repository.updateRoom(roomId, { chatAccessToken: token });
      return { code: chatMessagesCodes.CLIENT_ADDED };
    }

    if (action === "removeClient") {
      const clientMember = await this.repository.getMember({
        roomId,
        clientId: String(clientId),
      });
      if (clientMember) {
        await this.repository.removeMember(clientMember.id);
      }
      await this.repository.updateRoom(roomId, { chatAccessToken: null });
      return { code: chatMessagesCodes.CLIENT_REMOVED };
    }

    throw new AppError(chatMessagesCodes.INVALID_MANAGE_CLIENT_ACTION, 400);
  }

  async regenerateToken(roomId, userId) {
    const member = await this.repository.getMember({ roomId, userId });
    const isAdminOrMod =
      member?.role === "ADMIN" || member?.role === "MODERATOR";
    if (!isAdminOrMod)
      throw new AppError(chatMessagesCodes.ROOM_FORBIDDEN_ACTION, 403);

    const token = await this.repository.generateChatToken();
    const room = await this.repository.updateRoom(roomId, {
      chatAccessToken: token,
    });
    return room;
  }

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
  }

  async getMessagePage(messageId, limit = 50) {
    return this.repository.getMessageIndexInRoom(messageId, limit);
  }

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
  }

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
  }

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

      const io = getIo();
      io.to(`room:${roomId}`).emit("message:read", {
        messageId: Number(messageId),
        userId: userId ? Number(userId) : null,
        clientId: clientId ? Number(clientId) : null,
        readAt: new Date(),
      });
    }

    return { success: true };
  }

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
  }

  async addReaction(messageId, userId, emoji) {
    const reaction = await this.repository.upsertReaction({
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
  }

  async removeReaction(messageId, userId, emoji) {
    const reaction = await this.repository.findReaction({
      messageId,
      userId,
      emoji,
    });
    if (!reaction) throw new AppError(chatMessagesCodes.REACTION_NOT_FOUND, 404);
    await this.repository.deleteReaction(reaction.id);
    const io = getIo();
    io.to(`room:${reaction.message.roomId}`).emit("reaction:removed", {
      messageId: Number(messageId),
      userId: Number(userId),
      emoji,
    });
    return { success: true };
  }

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
  }

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

    const io = getIo();
    io.to(`room:${message.roomId}`).emit("message:edited", updated);

    return updated;
  }

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

    const io = getIo();
    io.to(`room:${message.roomId}`).emit("message:deleted", {
      messageId: Number(messageId),
      roomId: message.roomId,
    });

    return { message: "Message deleted successfully" };
  }

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
  }

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
  }

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
  }

  // ── Members ────────────────────────────────────────────────────────────────

  async getMembers(roomId, userId, clientId) {
    const member = await this.repository.getMember({
      roomId,
      userId,
      clientId,
    });
    if (!member)
      throw new AppError(chatMessagesCodes.ROOM_ACCESS_DENIED, 403);
    const members = await this.repository.getMembers(roomId);
    // Members are not server-paginated (the room member set is small); we still
    // return the normalized list envelope so the FE treats every list endpoint
    // uniformly.
    return {
      items: members,
      total: members.length,
      page: 0,
      pageSize: members.length,
    };
  }

  async addMembers(roomId, userId, userIds) {
    const requester = await this.repository.getMember({ roomId, userId });
    if (
      !requester ||
      (requester.role !== "ADMIN" && requester.role !== "MODERATOR")
    ) {
      throw new AppError(chatMessagesCodes.ROOM_FORBIDDEN_ACTION, 403);
    }

    const memberData = userIds.map((uid) => ({
      roomId: Number(roomId),
      userId: Number(uid),
      role: "MEMBER",
    }));
    await this.repository.addRoomMembers(memberData);

    const newMembers = await this.repository.findMembersByUserIds(
      roomId,
      userIds,
    );

    const io = getIo();
    for (const uid of userIds) {
      io.to(`user:${uid}`).emit("notification:room_created", {
        roomId: Number(roomId),
        userId: Number(userId),
      });
    }
    io.to(`room:${roomId}`).emit("members:added", {
      roomId: Number(roomId),
      newMembers,
    });

    const room = await this.repository.getFullRoom(roomId);
    return room;
  }

  async removeMember(roomId, userId, memberId) {
    const requester = await this.repository.getMember({ roomId, userId });
    const memberToRemove = await this.repository.getMemberById(memberId);

    if (!memberToRemove) throw new AppError(chatMessagesCodes.MEMBER_NOT_FOUND, 404);

    const isSelf = memberToRemove.userId === Number(userId);
    const isAdmin =
      requester?.role === "ADMIN" || requester?.role === "MODERATOR";

    if (!isSelf && !isAdmin) {
      throw new AppError(chatMessagesCodes.ROOM_FORBIDDEN_ACTION, 403);
    }

    await this.repository.removeMember(memberId);

    const io = getIo();
    io.to(`room:${roomId}`).emit("member:removed", {
      roomId: Number(roomId),
      memberId: Number(memberId),
      userId: memberToRemove.userId,
    });

    if (memberToRemove.userId) {
      io.to(`user:${memberToRemove.userId}`).emit("notification:room_removed", {
        roomId: Number(roomId),
      });
    }

    return { code: chatMessagesCodes.MEMBER_REMOVED };
  }

  async updateMemberRole(roomId, userId, memberId, role) {
    const requester = await this.repository.getAdminOrModeratorMember({
      roomId,
      userId,
    });
    if (!requester)
      throw new AppError(chatMessagesCodes.ROOM_FORBIDDEN_ACTION, 403);

    const validRoles = ["ADMIN", "MODERATOR", "MEMBER"];
    if (!validRoles.includes(role)) throw new AppError(chatMessagesCodes.INVALID_MEMBER_ROLE, 400);

    const updated = await this.repository.updateMemberRole(memberId, role);

    const io = getIo();
    io.to(`room:${roomId}`).emit("member:role_updated", {
      roomId: Number(roomId),
      memberId: Number(memberId),
      role,
      userId: updated.userId,
    });

    return updated;
  }

  // ── Files ──────────────────────────────────────────────────────────────────

  async getFiles(roomId, userId, clientId, query) {
    const { page, limit, sort, type, search, from, to, uniqueMonths } = query;

    const member = await this.repository.getMember({
      roomId,
      userId,
      clientId,
    });
    if (!member)
      throw new AppError(chatMessagesCodes.ROOM_ACCESS_DENIED, 403);

    const parsedUniqueMonths = uniqueMonths ? JSON.parse(uniqueMonths) : {};

    const {
      attachments,
      total,
      limit: parsedLimit,
      page: parsedPage,
    } = await this.repository.getFiles({
      roomId,
      page: page ? Number(page) : 0,
      limit: limit ? Number(limit) : 20,
      sort: sort || "newest",
      type: type || null,
      search: search || "",
      from: from || null,
      to: to || null,
    });

    const formattedFiles = addMonthGrouping(attachments, parsedUniqueMonths);

    return {
      items: formattedFiles,
      total,
      page: parsedPage,
      pageSize: parsedLimit,
      // Domain-specific extra the FE file gallery needs (month dividers); kept
      // alongside the normalized list envelope.
      uniqueMonths: parsedUniqueMonths,
    };
  }

  async getFileStats(roomId, userId, clientId) {
    const member = await this.repository.getMember({
      roomId,
      userId,
      clientId,
    });
    if (!member)
      throw new AppError(chatMessagesCodes.ROOM_ACCESS_DENIED, 403);
    return this.repository.getFileStats(roomId);
  }

  // ── Calls (socket-triggered) ───────────────────────────────────────────────

  async initiateCall({ roomId, callType, userId }) {
    const call = await this.repository.createCall({
      roomId,
      initiatorId: userId,
      type: callType,
    });
    const io = getIo();
    io.to(`room:${roomId}`).emit("call:initiated", {
      callId: call.id,
      callType,
      initiatedBy: Number(userId),
      roomId: Number(roomId),
      timestamp: new Date(),
    });
    return call;
  }

  async answerCall({ callId, roomId, userId }) {
    await this.repository.updateCall(callId, { status: "ONGOING" });
    await this.repository.addCallParticipant({ callId, userId });
    const io = getIo();
    io.to(`room:${roomId}`).emit("call:answered", {
      callId: Number(callId),
      answeredBy: Number(userId),
      roomId: Number(roomId),
    });
  }

  async endCall({ callId, roomId, userId }) {
    const call = await this.repository.updateCall(callId, {
      status: "ENDED",
      endedAt: new Date(),
    });
    if (call.startedAt) {
      const duration = Math.floor((new Date() - call.startedAt) / 1000);
      await this.repository.updateCall(callId, { duration });
    }
    const io = getIo();
    io.to(`room:${roomId}`).emit("call:ended", {
      callId: Number(callId),
      endedBy: Number(userId),
      roomId: Number(roomId),
    });
  }

  // ── Typing indicator ───────────────────────────────────────────────────────

  async emitTyping({ socket, roomId, userId, clientId, user, client }) {
    const message = `${user?.name || client?.name || "Someone"} is typing`;

    socket.to(`room:${roomId}`).emit("user:typing", {
      userId,
      clientId,
      roomId,
      message,
    });

    await this.emitToAllMembersExcluding({
      roomId,
      userId,
      clientId,
      event: "notification:user_typing",
      content: { user, client, roomId, message },
    }).catch(console.error);

    return message;
  }

  async emitStopTyping({ socket, roomId, userId, clientId, user, client }) {
    socket
      .to(`room:${roomId}`)
      .emit("user:stop_typing", { userId, clientId, roomId });

    await this.emitToAllMembersExcluding({
      roomId,
      userId,
      clientId,
      event: "notification:user_stopped_typing",
      content: { user, client, roomId, message: "" },
    }).catch(console.error);
  }

  // ── Room access check (for socket join) ───────────────────────────────────

  async getRoomMembership({ roomId, userId, clientId }) {
    return this.repository.getMember({ roomId, userId, clientId });
  }
}
