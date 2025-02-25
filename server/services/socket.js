import { Server } from "socket.io";

let io;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.ORIGIN,
      credentials: true,
    },
  });
  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) {
      updateLastSeen(userId); // Update user activity on connect
    }

    // Update lastSeenAt every 10 minutes

    // socket.on('join-admin-room', ({userId}) => {
    //     socket.join(userId.toString());
    // });
    socket.on("join-room", ({ userId }) => {
      socket.join(userId.toString());
    });
    socket.on("heartbeat", ({ userId }) => {
      if (userId) {
        updateLastSeen(userId);
      }
    });

    socket.on("disconnect", (s) => {
      if (userId) {
        updateLastSeen(userId); // Optional: mark user as inactive on disconnect
      }
    });
  });
}
function updateLastSeen(userId) {
  prisma.user
    .update({
      where: { id: Number(userId) },
      data: { lastSeenAt: new Date() },
    })
    .catch(console.error);
}

export function getIo() {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}
