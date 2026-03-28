import { Server } from "socket.io";

/** @type {import("socket.io").Server} */
let io;

/**
 * Initializes Socket.IO on the HTTP server.
 * @param {import("http").Server} httpServer
 * @returns {import("socket.io").Server}
 */
export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) {
      socket.join(`user:${userId}`);
    }

    socket.on("disconnect", () => {});
  });

  return io;
}

/**
 * Returns the initialized Socket.IO instance.
 * Call initSocket() first in server.js.
 * @returns {import("socket.io").Server}
 */
export function getIO() {
  if (!io)
    throw new Error("Socket.IO not initialized — call initSocket() first");
  return io;
}
