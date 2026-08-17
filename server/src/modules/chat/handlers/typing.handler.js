import { socketErrorEnvelope } from "./socket-error.js";
import { requireSocketRoom } from "./socket-room-access.js";

/**
 * Typing indicator handlers.
 *
 * @param {import("socket.io").Socket} socket
 * @param {{ ctx: object, typingTimeouts: Map<string, NodeJS.Timeout>, usecase: import("../chat.usecase.js").ChatUsecase }} deps
 */
export function registerTypingHandlers(
  socket,
  { ctx, typingTimeouts, usecase },
) {
  socket.on("user:typing", async (data) => {
    const { roomId } = data;
    if (!roomId) return;
    if (!requireSocketRoom(socket, ctx, roomId)) return;

    const timeoutKey = ctx.clientId
      ? `${ctx.clientId}_${roomId}_client`
      : `${ctx.userId}-${roomId}`;

    if (typingTimeouts.has(timeoutKey)) {
      clearTimeout(typingTimeouts.get(timeoutKey));
    }

    try {
      await usecase.emitTyping({
        socket,
        roomId,
        userId: ctx.userId,
        clientId: ctx.clientId,
        user: ctx.kind === "staff" ? ctx.actor : null,
        client: ctx.kind === "client" ? ctx.actor : null,
      });
    } catch (error) {
      socket.emit("error", socketErrorEnvelope(error));
      return;
    }

    const timeout = setTimeout(async () => {
      await usecase
        .emitStopTyping({
          socket,
          roomId,
          userId: ctx.userId,
          clientId: ctx.clientId,
          user: ctx.kind === "staff" ? ctx.actor : null,
          client: ctx.kind === "client" ? ctx.actor : null,
        })
        .catch(console.error);
      typingTimeouts.delete(timeoutKey);
    }, 3000);

    typingTimeouts.set(timeoutKey, timeout);
  });

  socket.on("user:stop_typing", async (data) => {
    const { roomId } = data;
    if (!roomId) return;
    if (!requireSocketRoom(socket, ctx, roomId)) return;

    const timeoutKey = ctx.clientId
      ? `${ctx.clientId}_${roomId}_client`
      : `${ctx.userId}-${roomId}`;

    if (typingTimeouts.has(timeoutKey)) {
      clearTimeout(typingTimeouts.get(timeoutKey));
      typingTimeouts.delete(timeoutKey);
    }

    try {
      await usecase.emitStopTyping({
        socket,
        roomId,
        userId: ctx.userId,
        clientId: ctx.clientId,
        user: ctx.kind === "staff" ? ctx.actor : null,
        client: ctx.kind === "client" ? ctx.actor : null,
      });
    } catch (error) {
      socket.emit("error", socketErrorEnvelope(error));
    }
  });
}
