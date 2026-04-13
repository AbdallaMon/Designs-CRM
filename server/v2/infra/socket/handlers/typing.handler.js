import { emitToAllUsersRelatedToARoom } from "../../../../services/main/chat/chatMessageServices.js";

/**
 * Handles typing indicator socket events:
 *   user:typing, user:stop_typing
 *
 * @param {import("socket.io").Socket} socket
 * @param {{ ctx: { userId: number|null, clientId: string|null }, typingTimeouts: Map<string, NodeJS.Timeout> }} options
 */
export function registerTypingHandlers(socket, { ctx, typingTimeouts }) {
  socket.on("user:typing", async (data) => {
    const { roomId, user, client } = data;
    if (!roomId) return;

    const timeoutKey = ctx.clientId
      ? `${ctx.clientId}_${roomId}_client`
      : `${ctx.userId}-${roomId}`;

    if (typingTimeouts.has(timeoutKey)) {
      clearTimeout(typingTimeouts.get(timeoutKey));
    }

    const message = `${user?.name || client?.name || "Someone"} is typing`;

    socket.to(`room:${roomId}`).emit("user:typing", {
      userId: ctx.userId,
      clientId: ctx.clientId,
      roomId,
      message,
    });

    await emitToAllUsersRelatedToARoom({
      roomId,
      userId: ctx.userId,
      clientId: ctx.clientId,
      content: { user, client, roomId, message },
      type: "notification:user_typing",
    });

    const timeout = setTimeout(async () => {
      socket.to(`room:${roomId}`).emit("user:stop_typing", {
        userId: ctx.userId,
        clientId: ctx.clientId,
        roomId,
      });

      await emitToAllUsersRelatedToARoom({
        roomId,
        userId: ctx.userId,
        clientId: ctx.clientId,
        content: { user, client, roomId, message: "" },
        type: "notification:user_stopped_typing",
      });

      typingTimeouts.delete(timeoutKey);
    }, 3000);

    typingTimeouts.set(timeoutKey, timeout);
  });

  socket.on("user:stop_typing", (data) => {
    const { roomId } = data;
    if (!roomId) return;

    const timeoutKey = `${ctx.userId}-${roomId}`;
    if (typingTimeouts.has(timeoutKey)) {
      clearTimeout(typingTimeouts.get(timeoutKey));
      typingTimeouts.delete(timeoutKey);
    }

    socket.to(`room:${roomId}`).emit("user:stop_typing", {
      userId: ctx.userId,
      roomId,
    });
  });
}
