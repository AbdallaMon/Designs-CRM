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
      leftAt: null,
    },
  });
  console.log(roomId, "roomId");
  console.log(userId, "userId");
  console.log(userIds, "userIds");

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

  await prisma.chatMember.createMany({
    data: memberData,
    skipDuplicates: true,
  });

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

  // Notify new members
  try {
    const io = getIo();
    userIds.forEach((uid) => {
      io.to(`user:${uid}`).emit("room:added", room);
    });
    io.to(`room:${roomId}`).emit("members:added", {
      roomId: parseInt(roomId),
      userIds,
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
      leftAt: null,
    },
  });

  const memberToRemove = await prisma.chatMember.findUnique({
    where: { id: parseInt(memberId) },
  });

  if (!memberToRemove) {
    throw new Error("Member not found");
  }

  const isSelf = memberToRemove.userId === parseInt(userId);
  const isAdmin =
    requester && (requester.role === "ADMIN" || requester.role === "MODERATOR");

  if (!isSelf && !isAdmin) {
    throw new Error("You don't have permission to remove this member");
  }

  // Set leftAt instead of deleting
  await prisma.chatMember.update({
    where: { id: parseInt(memberId) },
    data: { leftAt: new Date() },
  });

  // Emit removal
  try {
    const io = getIo();
    io.to(`room:${roomId}`).emit("member:removed", {
      roomId: parseInt(roomId),
      memberId: parseInt(memberId),
      userId: memberToRemove.userId,
    });
    io.to(`user:${memberToRemove.userId}`).emit("room:removed", {
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
      leftAt: null,
    },
  });

  if (!member) {
    throw new Error("You don't have access to this room");
  }

  const members = await prisma.chatMember.findMany({
    where: {
      roomId: parseInt(roomId),
      leftAt: null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
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
