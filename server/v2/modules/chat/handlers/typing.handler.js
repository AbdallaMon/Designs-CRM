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
    const { roomId, user, client } = data;
    if (!roomId) return;

    const timeoutKey = ctx.clientId
      ? `${ctx.clientId}_${roomId}_client`
      : `${ctx.userId}-${roomId}`;

    if (typingTimeouts.has(timeoutKey)) {
      clearTimeout(typingTimeouts.get(timeoutKey));
    }

    await usecase
      .emitTyping({
        socket,
        roomId,
        userId: ctx.userId,
        clientId: ctx.clientId,
        user,
        client,
      })
      .catch(console.error);

    const timeout = setTimeout(async () => {
      await usecase
        .emitStopTyping({
          socket,
          roomId,
          userId: ctx.userId,
          clientId: ctx.clientId,
          user,
          client,
        })
        .catch(console.error);
      typingTimeouts.delete(timeoutKey);
    }, 3000);

    typingTimeouts.set(timeoutKey, timeout);
  });

  socket.on("user:stop_typing", (data) => {
    const { roomId } = data;
    if (!roomId) return;

    const timeoutKey = ctx.clientId
      ? `${ctx.clientId}_${roomId}_client`
      : `${ctx.userId}-${roomId}`;

    if (typingTimeouts.has(timeoutKey)) {
      clearTimeout(typingTimeouts.get(timeoutKey));
      typingTimeouts.delete(timeoutKey);
    }

    socket.to(`room:${roomId}`).emit("user:stop_typing", {
      userId: ctx.userId,
      clientId: ctx.clientId,
      roomId,
    });
  });
}
