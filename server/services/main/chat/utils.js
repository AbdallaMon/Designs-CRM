import { getIo } from "../../socket.js";

/**
 * Determine day group label for a message
 */
export function getDayGroup(msgDate, now) {
  // Reset time to midnight for comparison
  const msgDay = new Date(
    msgDate.getFullYear(),
    msgDate.getMonth(),
    msgDate.getDate()
  );
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffTime = today.getTime() - msgDay.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "today";
  } else if (diffDays === 1) {
    return "yesterday";
  } else if (diffDays < 7) {
    // Return day name for current week
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[msgDate.getDay()];
  } else {
    // Return formatted date for older messages
    return msgDate.toISOString().split("T")[0]; // YYYY-MM-DD
  }
}

/**
 * Friendly day label for UI
 */
export function getDayLabel(msgDate, now) {
  const msgDay = new Date(
    msgDate.getFullYear(),
    msgDate.getMonth(),
    msgDate.getDate()
  );
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffTime = today.getTime() - msgDay.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[msgDate.getDay()];
  }
  // e.g., Jan 5, 2025
  return msgDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getMonthGroup(date) {
  return date.getFullYear() * 100 + (date.getMonth() + 1);
}
export function getMonthGroupLabel(date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}
export async function checkIfUserAllowedToDoAdminActions(roomId, userId) {
  // Fetch room details
  const room = await prisma.chatRoom.findUnique({
    where: { id: parseInt(roomId, 10) },
    select: {
      createdById: true,
      type: true,
    },
  });
  if (!room) {
    throw new Error("Chat room not found");
  }
  const currentMember = await prisma.chatMember.findFirst({
    where: {
      roomId: parseInt(roomId, 10),
      userId: userId,
      isDeleted: false,
    },
  });
  // Check if user is room creator, project manager, client lead, or a member with admin rights
  if (!currentMember) {
    throw new Error("You do not have access to manage this chat room");
  }
  if (
    currentMember.role !== "ADMIN" &&
    currentMember.role !== "MODERATOR" &&
    currentMember.userId !== room.createdById &&
    room.type !== "STAFF_TO_STAFF"
  ) {
    throw new Error("You do not have access to manage this chat room");
  }
}

export async function checkIfUserIsRoomMember(roomId, userId, clientId) {
  if (userId) userId = parseInt(userId, 10);
  console.log(userId, "userId in checkIfUserIsRoomMember");
  const where = {};
  if (userId) {
    where.userId = userId;
  }
  if (clientId) {
    where.clientId = clientId;
  }
  const member = await prisma.chatMember.findFirst({
    where: {
      roomId: parseInt(roomId, 10),
      isDeleted: false,
      ...where,
    },
  });
  if (!member) {
    throw new Error("You do not have access to this chat room");
  }
  return member;
}

export async function emitError({ roomId, message }) {
  const io = getIo();
  io.to(`room:${roomId}`).emit("chat:error", { message });
}
