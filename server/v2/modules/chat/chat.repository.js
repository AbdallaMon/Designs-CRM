import { v4 as uuidv4 } from "uuid";
import prisma from "../../infra/prisma.js";
import { AppError } from "../../shared/errors/AppError.js";

// ── Shared select shapes ─────────────────────────────────────────────────────

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  lastSeenAt: true,
  profilePicture: true,
};

const clientSelect = { id: true, name: true, email: true, lastSeenAt: true };

const memberSelect = {
  id: true,
  userId: true,
  clientId: true,
  role: true,
  leftAt: true,
  lastReadAt: true,
  isDeleted: true,
  isArchived: true,
  isMuted: true,
  createdAt: true,
  user: { select: userSelect },
  client: { select: clientSelect },
};

const senderSelect = {
  id: true,
  name: true,
  email: true,
  profilePicture: true,
};

const messageInclude = {
  sender: { select: senderSelect },
  client: { select: { id: true, name: true, email: true } },
  replyTo: {
    select: {
      id: true,
      content: true,
      sender: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
    },
  },
  pinnedIn: { select: { id: true, messageId: true } },
  reactions: {
    include: {
      user: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
    },
  },
  attachments: true,
  mentions: { include: { user: { select: { id: true, name: true } } } },
};

function buildRoomInclude(userId) {
  return {
    createdBy: { select: { id: true, name: true, email: true, role: true } },
    project: { select: { id: true, groupTitle: true, groupId: true } },
    clientLead: {
      select: {
        id: true,
        code: true,
        client: { select: { id: true, name: true, email: true } },
      },
    },
    members: {
      where: {
        isDeleted: false,
        OR: [
          { room: { type: "STAFF_TO_STAFF" } },
          ...(userId ? [{ userId: Number(userId) }] : []),
        ],
      },
      select: memberSelect,
    },
    multiProjectRooms: {
      include: { project: { select: { id: true, groupTitle: true } } },
    },
    messages: {
      take: 1,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        content: true,
        type: true,
        createdAt: true,
        sender: { select: { id: true, name: true } },
      },
    },
  };
}

// ── File type filter ─────────────────────────────────────────────────────────

const FILE_TYPE_MAP = {
  image: {
    fileMimeType: {
      in: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    },
  },
  video: {
    fileMimeType: { in: ["video/mp4", "video/webm", "video/quicktime"] },
  },
  audio: {
    fileMimeType: {
      in: [
        "audio/mpeg",
        "audio/wav",
        "audio/ogg",
        "audio/webm",
        "audio/webm;codecs=opus",
      ],
    },
  },
  document: {
    fileMimeType: {
      in: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain",
        "application/rtf",
        "application/zip",
        "application/x-rar-compressed",
      ],
    },
  },
};

export class ChatRepository {
  // ── Rooms ──────────────────────────────────────────────────────────────────

  async getRooms({
    userId,
    category,
    projectId,
    clientLeadId,
    page = 0,
    limit = 25,
    search = "",
    chatType,
  }) {
    const parsedUserId = Number(userId);
    const skip = Number(page) * Number(limit);

    const where = {
      members: {
        some: { userId: parsedUserId, isDeleted: false, isArchived: false },
      },
    };

    if (chatType === "DIRECT") where.type = "STAFF_TO_STAFF";
    else if (chatType === "GROUP") where.type = "GROUP";
    else if (chatType === "PROJECT")
      where.type = { in: ["PROJECT_GROUP", "MULTI_PROJECT"] };
    else if (chatType === "CLIENT_LEADS") where.type = "CLIENT_TO_STAFF";
    else if (chatType === "ARCHIVED") {
      where.members.some = {
        userId: parsedUserId,
        isDeleted: false,
        isArchived: true,
      };
    } else if (chatType === "UNREAD") {
      where.messages = {
        some: {
          readReceipts: { none: { member: { userId: parsedUserId } } },
          senderId: { not: parsedUserId },
        },
      };
    }

    if (category === "ARCHIVED") {
      where.members.some = {
        userId: parsedUserId,
        isDeleted: false,
        isArchived: true,
      };
    } else if (category === "DIRECT") {
      where.type = "STAFF_TO_STAFF";
    } else if (category === "PROJECT") {
      where.type = { in: ["PROJECT_GROUP", "MULTI_PROJECT"] };
    }

    if (search) {
      where.OR = [
        {
          type: "STAFF_TO_STAFF",
          members: {
            some: { isDeleted: false, user: { name: { contains: search } } },
          },
        },
        { name: { contains: search } },
      ];
    }

    if (projectId) where.projectId = Number(projectId);

    if (clientLeadId) {
      const id = Number(clientLeadId);
      where.OR = where.OR || [];
      where.OR.push({ clientLeadId: id });
      where.OR.push({
        multiProjectRooms: { some: { project: { clientLeadId: id } } },
      });
    }

    const [rooms, total] = await Promise.all([
      prisma.chatRoom.findMany({
        where,
        skip,
        take: Number(limit),
        include: buildRoomInclude(parsedUserId),
        orderBy: { updatedAt: "desc" },
      }),
      prisma.chatRoom.count({ where }),
    ]);

    return { rooms, total };
  }

  async getRoomById(roomId, userId, clientId) {
    const room = await prisma.chatRoom.findUnique({
      where: { id: Number(roomId) },
      include: buildRoomInclude(userId),
    });
    return room;
  }

  async checkRoomExists({ userId, otherUserId }) {
    return prisma.chatRoom.findFirst({
      where: {
        type: "STAFF_TO_STAFF",
        AND: [
          { members: { some: { userId: Number(userId), isDeleted: false } } },
          {
            members: {
              some: { userId: Number(otherUserId), isDeleted: false },
            },
          },
        ],
      },
      include: buildRoomInclude(userId),
    });
  }

  async createRoom({
    name,
    type,
    projectId,
    clientLeadId,
    userIds = [],
    createdById,
    allowFiles = true,
    allowCalls = true,
    isChatEnabled = true,
    chatAccessToken = null,
  }) {
    const room = await prisma.chatRoom.create({
      data: {
        name,
        type,
        projectId: projectId ? Number(projectId) : null,
        clientLeadId: clientLeadId ? Number(clientLeadId) : null,
        createdById: Number(createdById),
        allowFiles,
        allowCalls,
        isChatEnabled,
        chatAccessToken,
      },
    });
    return room;
  }

  async addRoomProjects(roomId, projectIds) {
    await prisma.chatRoomProject.createMany({
      data: projectIds.map((pid) => ({
        roomId: Number(roomId),
        projectId: Number(pid),
      })),
    });
  }

  async addRoomMembers(memberDataArray) {
    for (const m of memberDataArray) {
      const existing = await prisma.chatMember.findFirst({
        where: {
          roomId: m.roomId,
          ...(m.userId ? { userId: m.userId } : { clientId: m.clientId }),
        },
      });
      if (existing) {
        await prisma.chatMember.update({
          where: { id: existing.id },
          data: { isDeleted: false, leftAt: null },
        });
      } else {
        await prisma.chatMember.create({ data: m });
      }
    }
  }

  async getFullRoom(roomId) {
    return prisma.chatRoom.findUnique({
      where: { id: Number(roomId) },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        members: {
          where: { leftAt: null },
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
            client: { select: { id: true, name: true, email: true } },
          },
        },
        multiProjectRooms: {
          include: { project: { select: { id: true, groupTitle: true } } },
        },
      },
    });
  }

  async updateRoom(roomId, data) {
    return prisma.chatRoom.update({ where: { id: Number(roomId) }, data });
  }

  async updateMemberSelf(memberId, data) {
    return prisma.chatMember.update({ where: { id: Number(memberId) }, data });
  }

  async deleteRoom(roomId) {
    return prisma.chatRoom.delete({ where: { id: Number(roomId) } });
  }

  async findRoomBasic(roomId) {
    return prisma.chatRoom.findUnique({
      where: { id: Number(roomId) },
      select: {
        id: true,
        type: true,
        createdById: true,
        clientLeadId: true,
        isChatEnabled: true,
        allowFiles: true,
        chatAccessToken: true,
        clientLead: { select: { id: true, clientId: true } },
      },
    });
  }

  async generateChatToken() {
    return uuidv4();
  }

  async getClientLeadWithProjects(clientLeadId, projectWhere = {}) {
    return prisma.clientLead.findUnique({
      where: { id: Number(clientLeadId) },
      include: {
        client: true,
        assignedTo: true,
        projects: { where: projectWhere, include: { assignments: true } },
      },
    });
  }

  async countRoomsForLead(clientLeadId, type) {
    return prisma.chatRoom.count({
      where: { clientLeadId: Number(clientLeadId), type },
    });
  }

  // ── Members ────────────────────────────────────────────────────────────────

  async getMember({ roomId, userId, clientId }) {
    const where = { roomId: Number(roomId), isDeleted: false };
    if (userId) where.userId = Number(userId);
    if (clientId) where.clientId = Number(clientId);
    return prisma.chatMember.findFirst({ where });
  }

  async getMemberById(memberId) {
    return prisma.chatMember.findUnique({ where: { id: Number(memberId) } });
  }

  async getAdminOrModeratorMember({ roomId, userId }) {
    return prisma.chatMember.findFirst({
      where: {
        roomId: Number(roomId),
        userId: Number(userId),
        role: { in: ["ADMIN", "MODERATOR"] },
        isDeleted: false,
      },
    });
  }

  async getMembers(roomId) {
    return prisma.chatMember.findMany({
      where: { roomId: Number(roomId), isDeleted: false },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
            role: true,
            lastSeenAt: true,
          },
        },
        client: {
          select: { id: true, name: true, email: true, lastSeenAt: true },
        },
      },
    });
  }

  async getActiveMembersExcluding({ roomId, userId, clientId }) {
    return prisma.chatMember.findMany({
      where: {
        roomId: Number(roomId),
        isDeleted: false,
        ...(userId ? { NOT: { userId: Number(userId) } } : {}),
        ...(clientId ? { NOT: { clientId: Number(clientId) } } : {}),
      },
      select: { userId: true, clientId: true },
    });
  }

  async getActiveMembers(roomId) {
    return prisma.chatMember.findMany({
      where: { roomId: Number(roomId), isDeleted: false },
      select: { userId: true, clientId: true },
    });
  }

  async removeMember(memberId) {
    return prisma.chatMember.update({
      where: { id: Number(memberId) },
      data: { isDeleted: true },
    });
  }

  async updateMemberRole(memberId, role) {
    return prisma.chatMember.update({
      where: { id: Number(memberId) },
      data: { role },
    });
  }

  async findMembersByUserIds(roomId, userIds) {
    return prisma.chatMember.findMany({
      where: { roomId: Number(roomId), userId: { in: userIds.map(Number) } },
      include: {
        user: { select: { id: true, name: true, email: true } },
        client: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async getUserMemberships(userId) {
    return prisma.chatMember.findMany({
      where: { userId: Number(userId), leftAt: null },
      select: { roomId: true },
    });
  }

  async updateManyMembersReadAt({ userId, roomIds }) {
    return prisma.chatMember.updateMany({
      where: { userId: Number(userId), roomId: { in: roomIds } },
      data: { lastReadAt: new Date() },
    });
  }

  async updateMemberReadAt(memberId) {
    return prisma.chatMember.update({
      where: { id: Number(memberId) },
      data: { lastReadAt: new Date() },
    });
  }

  async getStaffToStaffMemberships(userId) {
    return prisma.chatMember.findMany({
      where: {
        userId: Number(userId),
        isDeleted: false,
        room: {
          type: "STAFF_TO_STAFF",
          members: { some: { userId: Number(userId), isDeleted: false } },
        },
      },
      select: { userId: true, roomId: true },
    });
  }

  // ── Messages ───────────────────────────────────────────────────────────────

  async getMessagesWithReceipts({ roomId, memberId, skip, limit }) {
    return prisma.chatMessage.findMany({
      where: { roomId: Number(roomId) },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        ...messageInclude,
        readReceipts: { where: { memberId }, select: { id: true } },
      },
    });
  }

  async countMessages(roomId) {
    return prisma.chatMessage.count({ where: { roomId: Number(roomId) } });
  }

  async countUnreadMessages({ roomId, memberId, userId, clientId }) {
    const where = {
      roomId: Number(roomId),
      readReceipts: { none: { memberId } },
    };
    if (userId) where.senderId = { not: Number(userId) };
    if (clientId) where.senderClient = { not: Number(clientId) };
    return prisma.chatMessage.count({ where });
  }

  async getMessageById(messageId) {
    return prisma.chatMessage.findUnique({
      where: { id: Number(messageId) },
      select: {
        id: true,
        createdAt: true,
        roomId: true,
        senderId: true,
        senderClient: true,
        content: true,
        type: true,
      },
    });
  }

  async getMessageIndexInRoom(messageId, limit = 50) {
    const message = await prisma.chatMessage.findUnique({
      where: { id: Number(messageId) },
      select: { createdAt: true, id: true, roomId: true },
    });
    if (!message) throw new AppError("Message not found", 404);

    const index = await prisma.chatMessage.count({
      where: {
        OR: [
          { roomId: message.roomId, createdAt: { gt: message.createdAt } },
          {
            roomId: message.roomId,
            createdAt: message.createdAt,
            id: { gt: message.id },
          },
        ],
      },
    });

    return {
      messageId: Number(messageId),
      page: Math.floor(index / limit),
      limit,
    };
  }

  async createMessage({
    roomId,
    senderId,
    senderClient,
    content,
    type = "TEXT",
    attachments = [],
    replyToId,
    memberId,
  }) {
    const message = await prisma.chatMessage.create({
      data: {
        roomId: Number(roomId),
        senderId: senderId ? Number(senderId) : null,
        senderClient: senderClient ? Number(senderClient) : null,
        content,
        type,
        replyToId: replyToId ? Number(replyToId) : null,
        attachments:
          attachments && attachments.length
            ? {
                create: attachments.map((a) => ({
                  fileUrl: a.fileUrl,
                  fileName: a.fileName,
                  fileSize: a.fileSize ? Number(a.fileSize) : null,
                  fileMimeType: a.fileMimeType || null,
                  thumbnailUrl: a.thumbnailUrl || null,
                })),
              }
            : undefined,
      },
      include: {
        ...messageInclude,
        ...(memberId
          ? { readReceipts: { where: { memberId }, select: { id: true } } }
          : {}),
      },
    });

    await prisma.chatRoom.update({
      where: { id: Number(roomId) },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async updateMessage(messageId, data) {
    return prisma.chatMessage.update({
      where: { id: Number(messageId) },
      data,
      include: {
        sender: { select: { id: true, name: true, email: true } },
        client: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async softDeleteMessage(messageId) {
    return prisma.chatMessage.update({
      where: { id: Number(messageId) },
      data: { isDeleted: true },
    });
  }

  async getUnreadMessages({ roomId, memberId, userId, clientId }) {
    const where = {
      roomId: Number(roomId),
      readReceipts: { none: { memberId } },
    };
    if (userId) where.senderId = { not: Number(userId) };
    if (clientId) where.senderClient = { not: Number(clientId) };
    return prisma.chatMessage.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });
  }

  async findReadReceipt({ memberId, messageId }) {
    return prisma.chatReadReceipt.findFirst({
      where: { memberId, messageId: Number(messageId) },
    });
  }

  async createReadReceipt(data) {
    return prisma.chatReadReceipt.create({ data });
  }

  async upsertReadReceipt({ messageId, memberId }) {
    return prisma.chatReadReceipt.upsert({
      where: { messageId_memberId: { messageId: Number(messageId), memberId } },
      update: { readAt: new Date() },
      create: { messageId: Number(messageId), memberId },
    });
  }

  async bulkMarkMessagesRead({ memberId, messageIds }) {
    for (const messageId of messageIds) {
      const exists = await this.findReadReceipt({ memberId, messageId });
      if (!exists) {
        await this.createReadReceipt({
          memberId,
          messageId: Number(messageId),
        });
      }
    }
  }

  async getMessagesForForward(messageIds) {
    return prisma.chatMessage.findMany({
      where: { id: { in: messageIds.map(Number) } },
      include: { attachments: true },
    });
  }

  // ── Pins ───────────────────────────────────────────────────────────────────

  async getPinnedMessages(roomId) {
    return prisma.chatPinnedMessage.findMany({
      where: { roomId: Number(roomId), message: { isDeleted: false } },
      orderBy: { message: { id: "desc" } },
      include: {
        message: {
          include: {
            sender: { select: senderSelect },
            client: { select: { id: true, name: true, email: true } },
            replyTo: {
              select: {
                id: true,
                content: true,
                sender: { select: { id: true, name: true } },
                client: { select: { id: true, name: true } },
              },
            },
          },
        },
        pinnedBy: { select: { id: true, name: true } },
      },
    });
  }

  async createPin({ roomId, messageId, pinnedById }) {
    return prisma.chatPinnedMessage.create({
      data: {
        roomId: Number(roomId),
        messageId: Number(messageId),
        pinnedById: Number(pinnedById),
      },
    });
  }

  async deletePins({ roomId, messageId }) {
    return prisma.chatPinnedMessage.deleteMany({
      where: { roomId: Number(roomId), messageId: Number(messageId) },
    });
  }

  // ── Reactions ──────────────────────────────────────────────────────────────

  async upsertReaction({ messageId, userId, emoji }) {
    return prisma.chatReaction.upsert({
      where: {
        messageId_userId_emoji: {
          messageId: Number(messageId),
          userId: Number(userId),
          emoji,
        },
      },
      update: {},
      create: { messageId: Number(messageId), userId: Number(userId), emoji },
      include: {
        user: { select: { id: true, name: true } },
        message: { select: { roomId: true } },
      },
    });
  }

  async findReaction({ messageId, userId, emoji }) {
    return prisma.chatReaction.findFirst({
      where: { messageId: Number(messageId), userId: Number(userId), emoji },
      include: { message: { select: { roomId: true } } },
    });
  }

  async deleteReaction(id) {
    return prisma.chatReaction.delete({ where: { id } });
  }

  // ── Files ──────────────────────────────────────────────────────────────────

  static buildTypeFilter(type) {
    return type ? FILE_TYPE_MAP[type.toLowerCase()] || {} : {};
  }

  async getFiles({
    roomId,
    page = 0,
    limit = 20,
    sort = "newest",
    type = null,
    search = "",
    from = null,
    to = null,
  }) {
    const parsedRoomId = Number(roomId);
    const skip = Number(page) * Number(limit);
    const typeFilter = ChatRepository.buildTypeFilter(type);

    const searchFilter =
      search && search !== "undefined" && search.trim().length > 0
        ? {
            OR: [
              { fileName: { contains: search } },
              { content: { contains: search } },
            ],
          }
        : {};

    const dateFilter = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    const where = {
      message: {
        roomId: parsedRoomId,
        isDeleted: false,
        ...searchFilter,
        ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
      },
      ...typeFilter,
    };

    const [attachments, total] = await Promise.all([
      prisma.chatAttachment.findMany({
        where,
        orderBy: { message: { createdAt: sort === "newest" ? "desc" : "asc" } },
        skip,
        take: Number(limit),
        select: {
          id: true,
          fileUrl: true,
          fileName: true,
          fileMimeType: true,
          fileSize: true,
          thumbnailUrl: true,
          content: true,
          message: {
            select: {
              id: true,
              roomId: true,
              type: true,
              fileName: true,
              fileUrl: true,
              fileMimeType: true,
              fileSize: true,
              content: true,
              createdAt: true,
              senderId: true,
              sender: {
                select: { id: true, name: true, profilePicture: true },
              },
              client: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.chatAttachment.count({ where }),
    ]);

    return { attachments, total, limit: Number(limit), page: Number(page) };
  }

  async getFileStats(roomId) {
    const parsedRoomId = Number(roomId);
    const baseWhere = { message: { roomId: parsedRoomId, isDeleted: false } };

    const [total, images, videos, documents, audio] = await Promise.all([
      prisma.chatAttachment.count({ where: baseWhere }),
      prisma.chatAttachment.count({
        where: { ...baseWhere, ...FILE_TYPE_MAP.image },
      }),
      prisma.chatAttachment.count({
        where: { ...baseWhere, ...FILE_TYPE_MAP.video },
      }),
      prisma.chatAttachment.count({
        where: { ...baseWhere, ...FILE_TYPE_MAP.document },
      }),
      prisma.chatAttachment.count({
        where: { ...baseWhere, ...FILE_TYPE_MAP.audio },
      }),
    ]);

    return { total, images, videos, documents, audio };
  }

  // ── Calls ──────────────────────────────────────────────────────────────────

  async createCall({ roomId, initiatorId, type }) {
    return prisma.call.create({
      data: {
        roomId: Number(roomId),
        initiatorId: Number(initiatorId),
        type,
        status: "RINGING",
      },
    });
  }

  async updateCall(callId, data) {
    return prisma.call.update({ where: { id: Number(callId) }, data });
  }

  async addCallParticipant({ callId, userId }) {
    return prisma.callParticipant.create({
      data: { callId: Number(callId), userId: Number(userId) },
    });
  }

  // ── Presence ───────────────────────────────────────────────────────────────

  updateUserLastSeen(userId) {
    prisma.user
      .update({
        where: { id: Number(userId) },
        data: { lastSeenAt: new Date() },
      })
      .catch(console.error);
  }

  async updateClientLastSeen(clientId) {
    const member = await prisma.chatMember.findFirst({
      where: { clientId: Number(clientId) },
      select: { clientId: true },
    });
    if (member) {
      prisma.client
        .update({
          where: { id: Number(clientId) },
          data: { lastSeenAt: new Date() },
        })
        .catch(console.error);
    }
  }
}
