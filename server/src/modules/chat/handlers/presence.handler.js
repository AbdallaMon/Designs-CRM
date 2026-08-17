/**
 * Presence handlers: online/offline status and last-seen tracking.
 *
 * @param {import("socket.io").Socket} socket
 * @param {{ io: import("socket.io").Server, ctx: object, usecase: import("../chat.usecase.js").ChatUsecase }} deps
 */
export function registerPresenceHandlers(socket, { io, ctx, usecase }) {
  socket.on("online", () => {
    io.emit("user:online", {
      userId: ctx.userId,
      clientId: ctx.clientId,
      socketId: socket.id,
      timestamp: new Date(),
      user: ctx.kind === "staff" ? ctx.actor : null,
    });
  });

  socket.on("user:online", () => {
    if (ctx.userId) usecase.updateUserLastSeen(ctx.userId);
  });

  socket.on("client:online", async () => {
    if (ctx.clientId) await usecase.updateClientLastSeen(ctx.clientId);
  });

  socket.on("disconnect", () => {
    io.emit("user:offline", {
      userId: ctx.userId,
      clientId: ctx.clientId,
      timestamp: new Date(),
    });
  });
}
