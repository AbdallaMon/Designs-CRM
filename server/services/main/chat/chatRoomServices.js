import prisma from "../../../prisma/prisma.js";
import { getIo } from "../../socket.js";

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
}) {
  const parsedUserId = parseInt(userId);
  const pageNumber = Number.isFinite(parseInt(page)) ? parseInt(page) : 0;
  const pageSize = Number.isFinite(parseInt(limit)) ? parseInt(limit) : 20;
  const skip = pageNumber * pageSize;

  const where = {
    members: {
      some: {
        userId: parsedUserId,
        leftAt: null,
      },
    },
  };

  // Apply filters
  if (category === "ARCHIVED") {
    where.isArchived = true;
  } else if (category === "DIRECT") {
    where.type = "STAFF_TO_STAFF";
  } else if (category === "PROJECT") {
    where.type = { in: ["PROJECT_GROUP", "MULTI_PROJECT"] };
  }
  if (search) {
    where.OR = [
      {
        members: {
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
            leftAt: null,
          },
          select: {
            id: true,
            userId: true,
            role: true,
            leftAt: true,
            lastReadAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
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
  const roomWithMeta = await Promise.all(
    rooms.map(async (room) => {
      const selfMember = room.members.find((m) => m.userId === parsedUserId);
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

      return {
        ...room,
        unreadCount,
        lastMessage,
        otherMembers,
      };
    })
  );
  return {
    data: roomWithMeta,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Create a new chat room
 */
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
}) {
  // Validate room type
  const validTypes = [
    "STAFF_TO_STAFF",
    "PROJECT_GROUP",
    "CLIENT_TO_STAFF",
    "MULTI_PROJECT",
  ];
  if (!validTypes.includes(type)) {
    throw new Error("Invalid room type");
  }
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

  // Add other users
  if (userIds && userIds.length > 0) {
    userIds
      .filter((id) => id !== createdById)
      .forEach((uid) => {
        memberData.push({
          roomId: room.id,
          userId: parseInt(uid),
          role: "MEMBER",
        });
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
    memberData.forEach((member) => {
      io.to(`user:${member.userId}`).emit("room:created", completeRoom);
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
      leftAt: null,
    },
  });

  if (!member || (member.role !== "ADMIN" && member.role !== "MODERATOR")) {
    throw new Error("You don't have permission to update this room");
  }

  const room = await prisma.chatRoom.update({
    where: { id: parseInt(roomId) },
    data: updates,
    include: {
      members: {
        where: { leftAt: null },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  // Emit update to all members
  try {
    const io = getIo();
    io.to(`room:${roomId}`).emit("room:updated", room);
  } catch (error) {
    console.error("Socket.IO emit error:", error);
  }

  return room;
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
      leftAt: null,
    },
  });

  if (!member) {
    throw new Error("You don't have permission to delete this room");
  }

  await prisma.chatRoom.delete({
    where: { id: parseInt(roomId) },
  });

  // Emit deletion to all members
  try {
    const io = getIo();
    io.to(`room:${roomId}`).emit("room:deleted", { roomId });
  } catch (error) {
    console.error("Socket.IO emit error:", error);
  }

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
      leftAt: null,
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
      members: {
        where: { leftAt: null },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
          client: {
            select: { id: true, name: true, email: true },
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

  return room;
}
