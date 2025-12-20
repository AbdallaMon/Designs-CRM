import prisma from "../../../prisma/prisma.js";
import { getIo } from "../../socket.js";

/**
 * Add members to a chat room
 */
export async function addMembersToRoom({ roomId, userId, userIds }) {
  // Verify requester is admin/moderator
  const requester = await prisma.chatMember.findFirst({
    where: {
      roomId: parseInt(roomId),
      userId: parseInt(userId),
      isDeleted: false,
    },
  });

  if (
    !requester ||
    (requester.role !== "ADMIN" && requester.role !== "MODERATOR")
  ) {
    throw new Error("You don't have permission to add members");
  }

  // Add members
  const memberData = userIds.map((uid) => ({
    roomId: parseInt(roomId),
    userId: parseInt(uid),
    role: "MEMBER",
  }));
  for (const member of memberData) {
    const checkIfExist = await prisma.chatMember.findFirst({
      where: {
        roomId: member.roomId,
        userId: member.userId,
      },
    });
    if (checkIfExist) {
      await prisma.chatMember.update({
        where: { id: checkIfExist.id },
        data: { isDeleted: false, leftAt: null },
      });
    } else {
      await prisma.chatMember.createMany({
        data: member,
        skipDuplicates: true,
      });
    }
  }

  // Fetch room with updated members
  const room = await prisma.chatRoom.findUnique({
    where: { id: parseInt(roomId) },
    include: {
      members: {
        where: { leftAt: null },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
  const newMembers = await prisma.chatMember.findMany({
    where: {
      roomId: parseInt(roomId),
      userId: { in: userIds.map((id) => parseInt(id)) },
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      client: { select: { id: true, name: true, email: true } },
    },
  });

  // Notify new members
  try {
    const io = getIo();
    userIds.forEach((uid) => {
      io.to(`user:${uid}`).emit("notification:room_created", {
        roomId: parseInt(roomId),
        userId: parseInt(userId),
      });
    });
    io.to(`room:${roomId}`).emit("members:added", {
      roomId: parseInt(roomId),
      newMembers,
    });
  } catch (error) {
    console.error("Socket.IO emit error:", error);
  }

  return room;
}

/**
 * Remove member from room
 */
export async function removeMemberFromRoom({ roomId, userId, memberId }) {
  // Verify requester is admin/moderator or removing themselves
  const requester = await prisma.chatMember.findFirst({
    where: {
      roomId: parseInt(roomId),
      userId: parseInt(userId),
      isDeleted: false,
    },
  });

  const memberToRemove = await prisma.chatMember.findUnique({
    where: { id: parseInt(memberId) },
  });

  const isSelf = memberToRemove.userId === parseInt(userId);
  const isAdmin =
    requester && (requester.role === "ADMIN" || requester.role === "MODERATOR");

  if (!isSelf && !isAdmin) {
    throw new Error("You don't have permission to remove this member");
  }

  // Set leftAt instead of deleting
  await prisma.chatMember.update({
    where: { id: parseInt(memberId) },
    data: { isDeleted: true },
  });

  // Emit removal
  try {
    const io = getIo();
    io.to(`room:${roomId}`).emit("member:removed", {
      roomId: parseInt(roomId),
      memberId: parseInt(memberId),
      userId: memberToRemove.userId,
    });
    io.to(`user:${memberToRemove.userId}`).emit("notification:room_removed", {
      roomId: parseInt(roomId),
    });
  } catch (error) {
    console.error("Socket.IO emit error:", error);
  }

  return { message: "Member removed successfully" };
}

/**
 * Update member role
 */
export async function updateMemberRole({ roomId, userId, memberId, role }) {
  // Verify requester is admin
  const requester = await prisma.chatMember.findFirst({
    where: {
      roomId: parseInt(roomId),
      userId: parseInt(userId),
      role: "ADMIN",
      leftAt: null,
    },
  });

  if (!requester) {
    throw new Error("You don't have permission to update member roles");
  }

  const validRoles = ["ADMIN", "MODERATOR", "MEMBER"];
  if (!validRoles.includes(role)) {
    throw new Error("Invalid role");
  }

  const updatedMember = await prisma.chatMember.update({
    where: { id: parseInt(memberId) },
    data: { role },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  // Emit update
  try {
    const io = getIo();
    io.to(`room:${roomId}`).emit("member:role_updated", {
      roomId: parseInt(roomId),
      memberId: parseInt(memberId),
      role,
    });
  } catch (error) {
    console.error("Socket.IO emit error:", error);
  }

  return updatedMember;
}

/**
 * Get room members
 */
export async function getRoomMembers({ roomId, userId }) {
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

  const members = await prisma.chatMember.findMany({
    where: {
      roomId: parseInt(roomId),
      isDeleted: false,
    },
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
        select: { id: true, name: true, email: true },
      },
    },
  });

  return members;
}

export async function emitOnlineForAllRelatedMembers(userId) {
  const memberships = await prisma.chatMember.findMany({
    where: {
      room: {
        type: "STAFF_TO_STAFF",
        members: {
          some: {
            userId: parseInt(userId),
            isDeleted: false,
          },
        },
      },
    },
    select: {
      userId: true,
      roomId: true,
    },
  });
  const io = getIo();
  for (const membership of memberships) {
    io.to(`user:${membership.userId}`).emit("notification:user_online", {
      userId: parseInt(userId),
      roomId: membership.roomId,
    });
  }
}

export async function emitOfflineForAllRelatedMembers(userId) {
  const memberships = await prisma.chatMember.findMany({
    where: {
      chatRoom: {
        type: "STAFF_TO_STAFF",
        members: {
          some: {
            userId: parseInt(userId),
            isDeleted: false,
          },
        },
      },
    },
    select: {
      userId: true,
      roomId: true,
    },
  });
  const io = getIo();
  for (const membership of memberships) {
    io.to(`user:${membership.userId}`).emit("notification:user_offline", {
      userId: parseInt(userId),
      roomId: membership.roomId,
    });
  }
}
