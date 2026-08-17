import { chatMessagesCodes } from "@dms/shared";
import { socketErrorEnvelope } from "./socket-error.js";
import { requireSocketRoom } from "./socket-room-access.js";

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
    if (ctx.kind !== "staff") {
      socket.emit(
        "error",
        socketErrorEnvelope(
          null,
          chatMessagesCodes.ROOM_ACCESS_DENIED,
        ),
      );
      return;
    }
    try {
      await usecase.checkIfUserCanAccessRoom({
        roomId,
        authUserId: ctx.userId,
      });

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
    } catch (error) {
      socket.emit("error", socketErrorEnvelope(error));
    }
  });

  socket.on("join_room_client", async (data) => {
    const { roomId } = data;
    if (!roomId) return;
    if (ctx.kind !== "client" || !requireSocketRoom(socket, ctx, roomId)) return;
    try {
      await usecase.checkIfUserCanAccessRoom({
        roomId,
        authUserId: null,
        clientId: ctx.clientId,
      });

      socket.rooms.forEach((room) => {
        if (room !== socket.id && room !== `room:${ctx.allowedRoomId}`) {
          socket.leave(room);
        }
      });

      socket.join(`room:${roomId}`);
      socket.to(`room:${roomId}`).emit("member:joined", {
        roomId,
        clientId: ctx.clientId,
        timestamp: new Date(),
      });
    } catch (error) {
      socket.emit("error", socketErrorEnvelope(error));
    }
  });

  socket.on("leave_room", async (data) => {
    const { roomId } = data;
    if (!roomId) return;
    if (!requireSocketRoom(socket, ctx, roomId)) return;
    try {
      await usecase.checkIfUserCanAccessRoom({
        roomId,
        authUserId: ctx.userId,
        clientId: ctx.clientId,
      });
      socket.leave(`room:${roomId}`);
      socket.to(`room:${roomId}`).emit("member:left", {
        userId: ctx.userId,
        clientId: ctx.clientId,
        roomId,
        timestamp: new Date(),
      });
    } catch (error) {
      socket.emit("error", socketErrorEnvelope(error));
    }
  });
}
