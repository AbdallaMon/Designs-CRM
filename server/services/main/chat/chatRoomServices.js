import { th } from "@faker-js/faker";
import prisma from "../../../prisma/prisma.js";
import { getIo } from "../../socket.js";
import { emitToAllUsersRelatedToARoom } from "./chatMessageServices.js";
import { v4 as uuidv4 } from "uuid";

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
          some: {
            isDeleted: false,
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
    const id = Number(clientLeadId);
    if (chatType === "CLIENT_LEADS") {
      where.clientLeadId = id;
    } else if (chatType === "PROJECT") {
      where.multiProjectRooms = {
        some: {
          project: {
            clientLeadId: id,
          },
        },
      };
    } else {
      where.OR = where.OR || [];
      where.OR.push({
        clientLeadId: id,
      });
      where.OR.push({
        multiProjectRooms: {
          some: {
            project: {
              clientLeadId: id,
            },
          },
        },
      });
    }
  }
  const [rooms, total] = await Promise.all([
    prisma.chatRoom.findMany({
      where,
      skip,
      take: pageSize,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        project: {
          select: { id: true, groupTitle: true, groupId: true },
        },
        clientLead: {
          select: {
            id: true,
            code: true,
            client: {
              select: { id: true, name: true, email: true },
            },
          },
        },

        members: {
          where: {
            isDeleted: false,
            OR: [
              {
                room: {
                  type: "STAFF_TO_STAFF",
                },
              },
              {
                userId: Number(userId),
              },
            ],
          },
          select: {
            id: true,
            userId: true,
            role: true,
            leftAt: true,
            lastReadAt: true,
            isDeleted: true,
            isArchived: true,
            isMuted: true,

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
      console.log(room.members, "room.members");

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
        select: { id: true, name: true, email: true, role: true },
      },
      project: {
        select: { id: true, groupTitle: true, groupId: true },
      },
      clientLead: {
        select: {
          id: true,
          code: true,
          client: {
            select: { id: true, name: true, email: true },
          },
        },
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
          isMuted: true,
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
  });
  const selfMember = await prisma.chatMember.findFirst({
    where: {
      roomId: room.id,
      userId: Number(userId),
      isDeleted: false,
    },
  });
  const otherMembers = room.members.filter((m) => m.userId !== Number(userId));
  return {
    ...room,
    otherMembers,
    lastSeenAt:
      otherMembers?.length > 0 ? otherMembers[0].user.lastSeenAt : null,
    selfMember,
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

export async function createLeadsChatRoom({
  groupType,
  clientLeadId,
  projectGroupIds,
  selectedProjectsTypes,
  addClient,
  addRelatedSalesStaff,
  addRelatedDesigners,
  createdById,
}) {
  const projectWhere = {};
  if (groupType === "MULTI_PROJECT") {
    projectWhere = {
      type: { in: selectedProjectsTypes || [] },
      groupId: { in: projectGroupIds?.map((id) => parseInt(id)) || [] },
    };
  }

  const clientLead = await prisma.clientLead.findUnique({
    where: { id: parseInt(clientLeadId) },
    include: {
      client: true,
      assignedTo: true,
      projects: {
        where: projectWhere,
        include: {
          assignments: true,
        },
      },
    },
  });
  let userIds = [];
  let name = `${groupType === "CLIENT_TO_STAFF" ? "Lead" : "Projects"}${
    clientLead.client.name
  } #(${clientLead.code})`;
  if (groupType === "CLIENT_TO_STAFF") {
    if (addRelatedSalesStaff && clientLead.assignedTo) {
      userIds.push(clientLead.assignedTo.id.toString());
    }
  }

  const type = groupType;
  const currentCountOfRooms = await prisma.chatRoom.count({
    where: {
      clientLeadId: parseInt(clientLeadId),
      type,
    },
  });
  name += ` #${currentCountOfRooms + 1}`;
  const token = await generateChatPassword();
  const room = await prisma.chatRoom.create({
    data: {
      name,
      type,
      clientLeadId: clientLeadId ? parseInt(clientLeadId) : null,
      createdById: parseInt(createdById),
      chatAccessToken: token,
    },
  });

  // Add multi-project associations if MULTI_PROJECT type
  if (type === "MULTI_PROJECT") {
    const projectIds = clientLead.projects.map((p) => p.id);
    if (!projectIds || projectIds.length === 0) {
      throw new Error("No projects found for the selected criteria");
    }
    await prisma.chatRoomProject.createMany({
      data: projectIds.map((pid) => ({
        roomId: room.id,
        projectId: parseInt(pid),
      })),
    });
  }
  const assignments = clientLead.projects?.flatMap((p) => p.assignments);
  if (assignments && assignments.length > 0) {
    if (
      (type === "CLIENT_TO_STAFF" && addRelatedDesigners) ||
      type === "MULTI_PROJECT"
    ) {
      const staffIds = [
        ...new Set(
          assignments
            .map((a) => a.userId.toString())
            .filter((id) => id !== createdById)
        ),
      ];
      userIds = userIds.concat(staffIds);
    }
  }

  // Add members
  const memberData = [];

  // Add creator as admin
  memberData.push({
    roomId: room.id,
    userId: parseInt(createdById),
    role: "ADMIN",
  });
  if (groupType === "CLIENT_TO_STAFF") {
    if (addClient) {
      memberData.push({
        roomId: room.id,
        clientId: clientLead.clientId,
        role: "MEMBER",
      });
      // check if we need to notify client about being added to chat
    }
  }

  let filteredUserIds = userIds?.filter((id) => id !== createdById) || [];
  // make them unique
  const uniqueUserIds = [...new Set(filteredUserIds)];
  filteredUserIds = uniqueUserIds;
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

  try {
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
export async function addClientToChatRoom(roomId) {
  const room = await prisma.chatRoom.findUnique({
    where: { id: parseInt(roomId) },
    select: {
      clientLeadId: true,
      clientLead: {
        select: {
          id: true,
          client: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  if (!room.clientLeadId) {
    throw new Error("This room is not associated with any client lead");
  }
  const clientMember = await prisma.chatMember.findFirst({
    where: {
      roomId: parseInt(roomId),
      clientId: room.clientLead.client.id,
      isDeleted: false,
    },
  });
  if (clientMember) {
    throw new Error("Client is already a member of this chat room");
  }
  const newMember = await prisma.chatMember.create({
    data: {
      roomId: parseInt(roomId),
      clientId: room.clientLead.client.id,
      role: "MEMBER",
    },
  });
  return newMember;
}
async function generateChatPassword() {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
  let password = "";
  for (let i = 0; i < 14; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  const token = uuidv4();

  return token;
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
  const room = await prisma.chatRoom.findUnique({
    where: { id: parseInt(roomId) },
  });

  if (
    !member ||
    (member.role !== "ADMIN" &&
      member.role !== "MODERATOR" &&
      room.type !== "STAFF_TO_STAFF")
  ) {
    throw new Error("You don't have permission to update this room");
  }
  let isMember = false;
  // check if empty update remove it
  for (const key in updates) {
    if (
      updates[key] === undefined ||
      updates[key] === null ||
      updates[key] === ""
    ) {
      delete updates[key];
    }
    if (key === "isMuted" || key === "isArchived") {
      isMember = true;
    }
  }
  console.log(updates, "updates in service");
  console.log(isMember, "isMember in isMember");

  const update = !isMember
    ? await prisma.chatRoom.update({
        where: { id: parseInt(roomId) },
        data: updates,
      })
    : await prisma.chatMember.update({
        where: {
          id: member.id,
        },
        data: updates,
      });

  // Emit update to all members
  await emitToAllUsersRelatedToARoom({
    roomId,
    userId,
    content: {
      roomId: parseInt(roomId),
      updates,
    },
    type: "notification:room_updated",
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
    throw new Error("Direct chat or project group rooms cannot be deleted");
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
