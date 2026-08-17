import { getIo } from "../../infra/socket/io-registry.js";
import { AppError } from "../../shared/errors/AppError.js";
import { computeRoomCapabilities } from "./chat.dto.js";
import { CHAT_MEMBER_ROLES, CHAT_ROOM_TYPES, chatMessagesCodes } from "@dms/shared";
import { chatRepository } from "./chat.repo.js";


/**
 * Rooms concern of ChatUsecase — scope check, room CRUD, membership resolution.
 * Prototype-composed onto {@link ChatUsecase} (see chat.usecase.js); moved
 * verbatim, behavior-preserving only.
 */
export const roomMethods = {
  // ── Object-scope checker (REFERENCE EXAMPLE for module agents) ───────────────
  // Pattern: `checkIfUserCanAccessX` — load the scoped relation (here: room
  // membership via the ChatMember FK), THROW AppError(403, ACCESS_DENIED) when the
  // record is outside the user's scope, and RETURN the loaded row on success.
  // CRITICAL: it must THROW on denial — returning false/undefined would let the
  // request through (`requireSpecialChecker` only catches thrown errors). Copy
  // this shape for read scope; pair a stricter `checkIfUserCanMutateX` for writes.
  async checkIfUserCanAccessRoom({ roomId, authUserId, clientId = null }) {
    const member = await chatRepository.getMember({
      roomId,
      userId: authUserId,
      clientId,
    });
    if (!member) {
      throw new AppError({ code: chatMessagesCodes.ROOM_ACCESS_DENIED, statusCode: 403 });
    }
    return member;
  },

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
    const { rooms, total } = await chatRepository.getRooms({
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
          ? await chatRepository.countUnreadMessages({
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
  },

  async getRoomById(roomId, authUser, clientId) {
    const userId = authUser.id;
    const permissions = authUser.permissions || [];
    const selfMember = await chatRepository.getMember({
      roomId,
      userId,
      clientId,
    });
    if (!selfMember)
      throw new AppError({ code: chatMessagesCodes.ROOM_ACCESS_DENIED, statusCode: 403 });

    const room = await chatRepository.getRoomById(roomId, userId, clientId);
    if (!room) throw new AppError({ code: chatMessagesCodes.ROOM_NOT_FOUND, statusCode: 404 });

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
  },

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

    const room = await chatRepository.createRoom({
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

    if (type === CHAT_ROOM_TYPES.STAFF_GROUP && projectIds?.length) {
      await chatRepository.addRoomProjects(room.id, projectIds);
    }

    const memberData = [
      { roomId: room.id, userId: Number(userId), role: CHAT_MEMBER_ROLES.ADMIN },
    ];
    const filteredUserIds = [
      ...new Set((userIds || []).filter((id) => Number(id) !== Number(userId))),
    ];
    for (const uid of filteredUserIds) {
      memberData.push({ roomId: room.id, userId: Number(uid), role: CHAT_MEMBER_ROLES.MEMBER });
    }
    await chatRepository.addRoomMembers(memberData);

    const completeRoom = await chatRepository.getFullRoom(room.id);

    await this.emitToAllMembersExcluding({
      roomId: room.id,
      userId,
      event: "notification:room_created",
      content: { roomId: room.id },
    }).catch(console.error);

    return completeRoom;
  },

  async createDirectChat(userId, participantId) {
    const existing = await chatRepository.checkRoomExists({
      userId,
      otherUserId: participantId,
    });
    if (existing) return existing;

    return this.createRoom(userId, {
      name: "Staff to Staff Chat",
      type: CHAT_ROOM_TYPES.STAFF_TO_STAFF,
      userIds: [participantId],
      allowFiles: true,
      allowCalls: true,
      isChatEnabled: true,
    });
  },

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
      groupType === CHAT_ROOM_TYPES.STAFF_GROUP
        ? {
            type: { in: selectedProjectsTypes || [] },
            groupId: { in: (projectGroupIds || []).map(Number) },
          }
        : {};

    const clientLead = await chatRepository.getClientLeadWithProjects(
      clientLeadId,
      projectWhere,
    );
    if (!clientLead) throw new AppError({ code: chatMessagesCodes.CLIENT_LEAD_NOT_FOUND, statusCode: 404 });

    let autoName = `${groupType === CHAT_ROOM_TYPES.CLIENT_TO_STAFF ? "Lead" : "Projects"} ${clientLead.client.name} #(${clientLead.code})`;
    const count = await chatRepository.countRoomsForLead(
      clientLeadId,
      groupType,
    );
    autoName += ` #${count + 1}`;

    const token = await chatRepository.generateChatToken();

    const room = await chatRepository.createRoom({
      name: name || autoName,
      type: groupType,
      clientLeadId,
      createdById: userId,
      chatAccessToken: token,
    });

    if (groupType === CHAT_ROOM_TYPES.STAFF_GROUP) {
      const pIds = clientLead.projects.map((p) => p.id);
      if (!pIds.length)
        throw new AppError({ code: chatMessagesCodes.NO_PROJECTS_FOR_CRITERIA, statusCode: 400 });
      await chatRepository.addRoomProjects(room.id, pIds);
    }

    const assignments =
      clientLead.projects?.flatMap((p) => p.assignments) || [];
    let userIds = [];

    if (
      groupType === CHAT_ROOM_TYPES.CLIENT_TO_STAFF &&
      addRelatedSalesStaff &&
      clientLead.assignedTo
    ) {
      userIds.push(String(clientLead.assignedTo.id));
    }
    if (
      (groupType === CHAT_ROOM_TYPES.CLIENT_TO_STAFF && addRelatedDesigners) ||
      groupType === CHAT_ROOM_TYPES.STAFF_GROUP
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
      { roomId: room.id, userId: Number(userId), role: CHAT_MEMBER_ROLES.ADMIN },
    ];
    if (groupType === CHAT_ROOM_TYPES.CLIENT_TO_STAFF && addClient && clientLead.clientId) {
      memberData.push({
        roomId: room.id,
        clientId: clientLead.clientId,
        role: CHAT_MEMBER_ROLES.MEMBER,
      });
    }
    const uniqueUserIds = [
      ...new Set(userIds.filter((id) => id !== String(userId))),
    ];
    for (const uid of uniqueUserIds) {
      memberData.push({ roomId: room.id, userId: Number(uid), role: CHAT_MEMBER_ROLES.MEMBER });
    }
    await chatRepository.addRoomMembers(memberData);

    const completeRoom = await chatRepository.getFullRoom(room.id);

    await this.emitToAllMembersExcluding({
      roomId: room.id,
      userId,
      event: "notification:room_created",
      content: { roomId: room.id },
    }).catch(console.error);

    return completeRoom;
  },

  async updateRoom(roomId, userId, updates) {
    const member = await chatRepository.getMember({ roomId, userId });
    if (!member) throw new AppError({ code: chatMessagesCodes.ROOM_ACCESS_DENIED, statusCode: 403 });

    const room = await chatRepository.findRoomBasic(roomId);
    if (!room) throw new AppError({ code: chatMessagesCodes.ROOM_NOT_FOUND, statusCode: 404 });

    const isAdminOrMod = member.role === CHAT_MEMBER_ROLES.ADMIN || member.role === CHAT_MEMBER_ROLES.MODERATOR;
    if (!isAdminOrMod && room.type !== CHAT_ROOM_TYPES.STAFF_TO_STAFF) {
      throw new AppError({ code: chatMessagesCodes.ROOM_FORBIDDEN_ACTION, statusCode: 403 });
    }

    // Sanitise — remove empty values
    const sanitized = Object.fromEntries(
      Object.entries(updates).filter(
        ([, v]) => v !== undefined && v !== null && v !== "",
      ),
    );

    const isMemberField = "isMuted" in sanitized || "isArchived" in sanitized;

    const result = isMemberField
      ? await chatRepository.updateMemberSelf(member.id, sanitized)
      : await chatRepository.updateRoom(roomId, sanitized);

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
  },

  async deleteRoom(roomId, userId) {
    const member = await chatRepository.getMember({ roomId, userId });
    if (!member || member.role !== CHAT_MEMBER_ROLES.ADMIN)
      throw new AppError({ code: chatMessagesCodes.ROOM_FORBIDDEN_ACTION, statusCode: 403 });

    const room = await chatRepository.findRoomBasic(roomId);
    if (!room) throw new AppError({ code: chatMessagesCodes.ROOM_NOT_FOUND, statusCode: 404 });
    if (room.type === CHAT_ROOM_TYPES.STAFF_TO_STAFF || room.type === CHAT_ROOM_TYPES.PROJECT_GROUP) {
      throw new AppError({ code: chatMessagesCodes.ROOM_NOT_DELETABLE, statusCode: 400 });
    }

    await this.emitToAllMembersExcluding({
      roomId,
      userId,
      event: "notification:room_deleted",
      content: { roomId: Number(roomId) },
    }).catch(console.error);

    await chatRepository.deleteRoom(roomId);
    return { code: chatMessagesCodes.ROOM_DELETED };
  },

  async manageClient(roomId, userId, action) {
    const member = await chatRepository.getMember({ roomId, userId });
    if (!member) throw new AppError({ code: chatMessagesCodes.ROOM_ACCESS_DENIED, statusCode: 403 });

    const isAdminOrMod = member.role === CHAT_MEMBER_ROLES.ADMIN || member.role === CHAT_MEMBER_ROLES.MODERATOR;
    if (!isAdminOrMod)
      throw new AppError({ code: chatMessagesCodes.ROOM_FORBIDDEN_ACTION, statusCode: 403 });

    const room = await chatRepository.findRoomBasic(roomId);
    if (!room?.clientLead)
      throw new AppError({ code: chatMessagesCodes.NO_CLIENT_LEAD_ON_ROOM, statusCode: 400 });

    const clientId = room.clientLead.clientId;

    if (action === "addClient") {
      await chatRepository.addRoomMembers([
        { roomId: Number(roomId), clientId, role: CHAT_MEMBER_ROLES.MEMBER },
      ]);
      const token = await chatRepository.generateChatToken();
      await chatRepository.updateRoom(roomId, { chatAccessToken: token });
      return { code: chatMessagesCodes.CLIENT_ADDED };
    }

    if (action === "removeClient") {
      const clientMember = await chatRepository.getMember({
        roomId,
        clientId: String(clientId),
      });
      if (clientMember) {
        await chatRepository.removeMember(clientMember.id);
      }
      await chatRepository.updateRoom(roomId, { chatAccessToken: null });
      return { code: chatMessagesCodes.CLIENT_REMOVED };
    }

    throw new AppError({ code: chatMessagesCodes.INVALID_MANAGE_CLIENT_ACTION, statusCode: 400 });
  },

  async regenerateToken(roomId, userId) {
    const member = await chatRepository.getMember({ roomId, userId });
    const isAdminOrMod =
      member?.role === CHAT_MEMBER_ROLES.ADMIN || member?.role === CHAT_MEMBER_ROLES.MODERATOR;
    if (!isAdminOrMod)
      throw new AppError({ code: chatMessagesCodes.ROOM_FORBIDDEN_ACTION, statusCode: 403 });

    const token = await chatRepository.generateChatToken();
    const room = await chatRepository.updateRoom(roomId, {
      chatAccessToken: token,
    });
    return room;
  },

  // ── Room access check (for socket join) ───────────────────────────────────

  async getRoomMembership({ roomId, userId, clientId }) {
    return chatRepository.getMember({ roomId, userId, clientId });
  },
};
