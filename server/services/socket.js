import { Server } from "socket.io";
import prisma from "../prisma/prisma.js";

let io;
const userSessions = new Map(); // Store last heartbeat timestamps

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.OLDORIGIN,
      credentials: true,
    },
  });

  io.on("connection", async (socket) => {
    const userId = Number(socket.handshake.query.userId);
    if (!userId) return;

    updateLastSeen(userId);
    // await ensureUserLogExists(userId);

    // Store user session start time
    userSessions.set(userId, Date.now());

    // const interval = setInterval(() => {
    //   console.log(userSessions, "userSessions");
    //   if (userSessions.has(userId)) {
    //     updateTotalMinutes(userId);
    //   }
    // }, 5 * 60 * 1000);

    socket.on("heartbeat", () => {
      updateLastSeen(userId);
      // updateTotalMinutes(userId);

      userSessions.set(userId, Date.now()); // Refresh last active time
    });

    socket.on("disconnect", () => {
      // updateTotalMinutes(userId);
      userSessions.delete(userId);
    });
  });
}

function updateLastSeen(userId) {
  prisma.user
    .update({
      where: { id: userId },
      data: { lastSeenAt: new Date() },
    })
    .catch(console.error);
}

// async function ensureUserLogExists(userId) {
//   const today = dayjs().startOf("day").toDate();

//   try {
//     const existingLog = await prisma.userLog.findFirst({
//       where: { userId, date: today },
//     });

//     if (!existingLog) {
//       await prisma.userLog.create({
//         data: { userId, date: today, totalMinutes: 0 },
//       });
//     }
//   } catch (error) {
//     console.error("Error ensuring user log:", error);
//   }
// }

// ✅ Only update `totalMinutes` if the user was active for 5 minutes
// async function updateTotalMinutes(userId) {
//   const lastActive = userSessions.get(userId);
//   if (!lastActive || Date.now() - lastActive < 5 * 60 * 1000) return; // Skip if less than 5 minutes

//   const todayStart = dayjs().startOf("day").toDate();
//   const tomorrowStart = dayjs().add(1, "day").startOf("day").toDate();

//   try {
//     await prisma.userLog.updateMany({
//       where: {
//         userId,
//         date: { gte: todayStart, lt: tomorrowStart },
//       },
//       data: { totalMinutes: { increment: 5 } },
//     });
//   } catch (error) {
//     console.error("Error updating total minutes:", error);
//   }
// }

export function getIo() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}
