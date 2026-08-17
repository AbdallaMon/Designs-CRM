import { chatMessagesCodes } from "@dms/shared";
import { socketErrorEnvelope } from "./socket-error.js";

export function socketCanAccessRoom(ctx, roomId) {
  return (
    ctx.kind === "staff" ||
    (ctx.kind === "client" &&
      Number(roomId) === Number(ctx.allowedRoomId))
  );
}

export function requireSocketRoom(socket, ctx, roomId) {
  if (socketCanAccessRoom(ctx, roomId)) return true;
  socket.emit(
    "error",
    socketErrorEnvelope(null, chatMessagesCodes.ROOM_ACCESS_DENIED),
  );
  return false;
}

