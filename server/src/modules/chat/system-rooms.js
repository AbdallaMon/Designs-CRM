import prisma from "../../infra/prisma/prisma.js";
import { getIo } from "../../infra/socket/index.js";

export async function addADesginerToAllRelatedProjectsRooms({
  clientLeadId,
  userId,
}) {
  const projectRooms = await prisma.chatRoom.findMany({
    where: {
      type: "STAFF_GROUP",
      clientLeadId: parseInt(clientLeadId),
      multiProjectRooms: {
        some: {
          project: {
            clientLeadId: parseInt(clientLeadId),
          },
        },
      },
    },
  });
  for (const room of projectRooms) {
    await addMemberToRoomBySystem({ roomId: room.id, userId });
  }
  return { message: "Designer added to all related project rooms" };
}
export async function addMemberToRoomBySystem({ roomId, userId }) {
  const checkIfExist = await prisma.chatMember.findFirst({
    where: {
      roomId: parseInt(roomId),
      userId: parseInt(userId),
    },
  });
  if (checkIfExist) {
    await prisma.chatMember.update({
      where: { id: checkIfExist.id },
      data: { isDeleted: false, leftAt: null },
    });
  } else {
    await prisma.chatMember.createMany({
      data: {
        roomId: parseInt(roomId),
        userId: parseInt(userId),
        role: "MEMBER",
      },
    });
  }

  // Notify new members
  try {
    const io = getIo();

    io.to(`user:${userId}`).emit("notification:room_created", {
      roomId: parseInt(roomId),
      userId: parseInt(userId),
    });

    io.to(`room:${roomId}`).emit("members:added", {
      roomId: parseInt(roomId),
      newMembers: [{ userId: parseInt(userId) }],
    });
  } catch (error) {
    console.error("Socket.IO emit error:", error);
  }

  return room;
}
