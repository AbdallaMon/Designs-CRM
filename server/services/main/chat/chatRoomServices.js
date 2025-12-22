import { th } from "@faker-js/faker";
import prisma from "../../../prisma/prisma.js";
import { getIo } from "../../socket.js";
import { emitToAllUsersRelatedToARoom } from "./chatMessageServices.js";

/**
 * Get chat rooms for a user with filters
 */
export async function getChatRooms({
  userId,
  category,
  projectId,
  clientLeadId,
  page = 0,
  limit = 20,
  search = "",
  chatType,
}) {
  const parsedUserId = parseInt(userId);
  const pageNumber = Number.isFinite(parseInt(page)) ? parseInt(page) : 0;
  const pageSize = Number.isFinite(parseInt(limit)) ? parseInt(limit) : 20;
  const skip = pageNumber * pageSize;

  const where = {
    members: {
      some: {
        userId: parsedUserId,
        isDeleted: false,
      },
    },
  };

  if (chatType) {
    if (chatType === "DIRECT") {
      where.type = "STAFF_TO_STAFF";
    } else if (chatType === "GROUP") {
      where.type = "GROUP";
    } else if (chatType === "PROJECT") {
      where.type = { in: ["PROJECT_GROUP", "MULTI_PROJECT"] };
    } else if (chatType === "CLIENT_LEADS") {
      where.type = "CLIENT_TO_STAFF";
    } else if (chatType === "ARCHIVED") {
      where.members.some = {
        ...where.members.some,
        isArchived: true,
      };
    } else if (chatType === "UNREAD") {
      where.messages = {
        some: {
          readReceipts: {
            none: {
              member: {
                userId: parsedUserId,
              },
            },
          },
          senderId: { not: parsedUserId },
        },
      };
    }
  }
  if (!chatType || chatType !== "ARCHIVED") {
    // where.isArchived = false;
    where.members.some = {
      ...where.members.some,
      isArchived: false,
    };
  }
  if (category === "ARCHIVED") {
    where.members.some = {
      ...where.members.some,
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
          isDeleted: false,
          some: {
            user: {
              name: {
                contains: search,
              },
            },
          },
        },
      },
      {
        name: {
          contains: search,
        },
      },
    ];
  }
  if (projectId) {
    where.projectId = parseInt(projectId);
  }

  if (clientLeadId) {
    where.clientLeadId = parseInt(clientLeadId);
  }

  const [rooms, total] = await Promise.all([
    prisma.chatRoom.findMany({
      where,
      skip,
      take: pageSize,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        project: {
          select: { id: true, groupTitle: true },
        },
        clientLead: {
          select: { id: true, code: true },
        },
        members: {
          where: {
            isDeleted: false,
            room: {
              type: "STAFF_TO_STAFF",
            },
          },
          select: {
            id: true,
            userId: true,
            role: true,
            leftAt: true,
            lastReadAt: true,
            isDeleted: true,
            isArchived: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                lastSeenAt: true,
                profilePicture: true,
              },
            },
            client: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        multiProjectRooms: {
          include: {
            project: {
              select: { id: true, groupTitle: true },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            content: true,
            type: true,
            createdAt: true,
            sender: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.chatRoom.count({ where }),
  ]);
  // Compute unread counts per room for this user
  const unreadCounts = {};
  let totalUnread = 0;

  const roomWithMeta = await Promise.all(
    rooms.map(async (room) => {
      const selfMember = await prisma.chatMember.findFirst({
        where: {
          roomId: room.id,
          userId: parsedUserId,
          isDeleted: false,
        },
      });
      const otherMembers = room.members.filter(
        (m) => m.userId !== parsedUserId
      );

      const unreadCount = await prisma.chatMessage.count({
        where: {
          roomId: room.id,
          senderId: { not: parsedUserId },
          readReceipts: {
            none: { memberId: selfMember.id },
          },
        },
      });

      const lastMessage = room.messages?.[0] || null;
      unreadCounts[room.id] = unreadCount;
      totalUnread += unreadCount;

      return {
        ...room,
        unreadCount,
        lastMessage,
        otherMembers,
        lastSeenAt:
          otherMembers?.length > 0 ? otherMembers[0].user.lastSeenAt : null,
      };
    })
  );

  return {
    data: roomWithMeta,
    total,
    totalPages: Math.ceil(total / pageSize),
    totalUnread,
    unreadCounts,
  };
}

/**
 * Create a new chat room
 */
export async function checkIfChatAlreadyExists({ userId, otherUserId }) {
  const type = "STAFF_TO_STAFF";
  const existingRoom = await prisma.chatRoom.findFirst({
    where: {
      type,
      members: {
        every: {
          OR: [{ userId: parseInt(userId) }, { userId: parseInt(otherUserId) }],
          isDeleted: false,
        },
      },
    },
  });
  return existingRoom;
}
export async function createChatRoom({
  name,
  type,
  projectId,
  clientLeadId,
  projectIds,
  userIds = [],
  createdById,
  allowFiles = true,
  allowCalls = true,
  isChatEnabled = true,
  allowChatForMembers = true,
  allowMeetings = true,
}) {
  // Create room
  const room = await prisma.chatRoom.create({
    data: {
      name,
      type,
      projectId: projectId ? parseInt(projectId) : null,
      clientLeadId: clientLeadId ? parseInt(clientLeadId) : null,
      createdById: parseInt(createdById),
      allowFiles,
      allowCalls,
      isChatEnabled,
      allowChatForMembers,
      allowMeetings,
    },
  });

  // Add multi-project associations if MULTI_PROJECT type
  if (type === "MULTI_PROJECT" && projectIds && projectIds.length > 0) {
    await prisma.chatRoomProject.createMany({
      data: projectIds.map((pid) => ({
        roomId: room.id,
        projectId: parseInt(pid),
      })),
    });
  }

  // Add members
  const memberData = [];

  // Add creator as admin
  memberData.push({
    roomId: room.id,
    userId: parseInt(createdById),
    role: "ADMIN",
  });

  const filteredUserIds = userIds?.filter((id) => id !== createdById) || [];
  for (const uid of filteredUserIds) {
    memberData.push({
      roomId: room.id,
      userId: parseInt(uid),
      role: "MEMBER",
    });
  }

  await prisma.chatMember.createMany({
    data: memberData,
  });

  // Fetch complete room with members
  const completeRoom = await prisma.chatRoom.findUnique({
    where: { id: room.id },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      members: {
        where: { leftAt: null },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      },
      multiProjectRooms: {
        include: {
          project: { select: { id: true, groupTitle: true } },
        },
      },
    },
  });

  // Emit Socket.IO event to notify members
  try {
    const io = getIo();
    // memberData.forEach((member) => {
    //   // io.to(`user:${member.userId}`).emit("room:created", completeRoom);
    // });
    await emitToAllUsersRelatedToARoom({
      roomId: room.id,
      userId: createdById,
      content: {
        roomId: parseInt(room.id),
      },
      type: "notification:room_created",
    });
  } catch (error) {
    console.error("Socket.IO emit error:", error);
  }

  return completeRoom;
}

/**
 * Update chat room
 */
export async function updateChatRoom(roomId, userId, updates) {
  // Check if user is member and has permission
  const member = await prisma.chatMember.findFirst({
    where: {
      roomId: parseInt(roomId),
      userId: parseInt(userId),
      isDeleted: false,
    },
  });

  if (!member || (member.role !== "ADMIN" && member.role !== "MODERATOR")) {
    throw new Error("You don't have permission to update this room");
  }

  const update = await prisma.chatMember.update({
    where: { id: member.id },
    data: updates,
  });

  return update;
}

/**
 * Delete chat room
 */
export async function deleteChatRoom(roomId, userId) {
  // Check if user is admin of room
  const member = await prisma.chatMember.findFirst({
    where: {
      roomId: parseInt(roomId),
      userId: parseInt(userId),
      role: "ADMIN",
      isDeleted: false,
    },
  });
  const room = await prisma.chatRoom.findUnique({
    where: { id: parseInt(roomId) },
  });
  if (!member) {
    throw new Error("You don't have permission to delete this room");
  }
  if (room.type === "STAFF_TO_STAFF" || room.type === "PROJECT_GROUP") {
    throw new Error("Direct chat rooms cannot be deleted");
  }

  await prisma.chatRoom.delete({
    where: { id: parseInt(roomId) },
  });

  // Emit deletion to all members
  await emitToAllUsersRelatedToARoom({
    roomId,
    userId,
    content: {
      roomId: parseInt(roomId),
    },
    type: "notification:room_deleted",
  });

  return { message: "Chat room deleted successfully" };
}

/**
 * Get single room details
 */
export async function getChatRoomById(roomId, userId) {
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

  const room = await prisma.chatRoom.findUnique({
    where: { id: parseInt(roomId) },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      project: {
        select: { id: true, groupTitle: true },
      },
      clientLead: {
        select: { id: true, code: true },
      },

      multiProjectRooms: {
        include: {
          project: { select: { id: true, groupTitle: true } },
        },
      },
    },
  });

  return room;
}
