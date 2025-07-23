import { Server } from "socket.io";
import prisma from "../prisma/prisma.js";
import { allowedOrigins } from "../index.js";

let io;
const userSessions = new Map();

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  io.on("connection", async (socket) => {
    const userId = Number(socket.handshake.query.userId);
    if (!userId) return;

    updateLastSeen(userId);
    userSessions.set(userId, Date.now());

    socket.on("heartbeat", () => {
      updateLastSeen(userId);

      userSessions.set(userId, Date.now()); // Refresh last active time
    });

    socket.on("disconnect", () => {
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

export function getIo() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}
