/**
 * Room join/leave handlers.
 *
 * @param {import("socket.io").Socket} socket
 * @param {{ ctx: object, usecase: import("../chat.usecase.js").ChatUsecase }} deps
 */
export function registerRoomHandlers(socket, { ctx, usecase }) {
  socket.on("join_room", async (data) => {
    const { roomId } = data;
    if (!roomId) return;

    const member = await usecase.getRoomMembership({
      roomId,
      userId: ctx.userId,
    });
    if (!member) {
      socket.emit("error", { message: "Not a member of this room" });
      return;
    }

    // Leave all non-user rooms before joining the new one
    socket.rooms.forEach((room) => {
      if (room !== socket.id && !room.startsWith("user:")) {
        socket.leave(room);
      }
    });

    socket.join(`room:${roomId}`);
    socket.to(`room:${roomId}`).emit("member:joined", {
      userId: ctx.userId,
      roomId,
      timestamp: new Date(),
    });
  });

  socket.on("join_room_client", async (data) => {
    const { roomId } = data;
    if (!roomId) return;

    const member = await usecase.getRoomMembership({
      roomId,
      clientId: ctx.clientId,
    });
    if (!member) {
      socket.emit("error", { message: "Not a member of this room" });
      return;
    }

    socket.rooms.forEach((room) => {
      if (room !== socket.id && !room.startsWith("client:")) {
        socket.leave(room);
      }
    });

    socket.join(`room:${roomId}`);
    socket.to(`room:${roomId}`).emit("member:joined", {
      roomId,
      clientId: ctx.clientId,
      timestamp: new Date(),
    });
  });

  socket.on("leave_room", (data) => {
    const { roomId } = data;
    if (!roomId) return;

    socket.leave(`room:${roomId}`);
    socket.to(`room:${roomId}`).emit("member:left", {
      userId: ctx.userId,
      clientId: ctx.clientId,
      roomId,
      timestamp: new Date(),
    });
  });
}
