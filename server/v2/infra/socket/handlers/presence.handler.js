import { updateLastSeen, updateLastSeenByClientId } from "../socket.helpers.js";

/**
 * Handles presence-related socket events:
 *   online, disconnect, user:online, client:online
 *
 * @param {import("socket.io").Socket} socket
 * @param {{ io: import("socket.io").Server, ctx: { userId: number|null, clientId: string|null } }} options
 */
export function registerPresenceHandlers(socket, { io, ctx }) {
  socket.on("online", (data) => {
    const { id, user } = data;
    ctx.userId = id;

    io.emit("user:online", {
      userId: id,
      socketId: socket.id,
      timestamp: new Date(),
      user,
    });
  });

  socket.on("user:online", () => {
    if (ctx.userId) updateLastSeen(ctx.userId);
  });

  socket.on("client:online", async () => {
    if (ctx.clientId) await updateLastSeenByClientId(ctx.clientId);
  });

  socket.on("disconnect", () => {
    io.emit("user:offline", {
      userId: ctx.userId,
      clientId: ctx.clientId,
      timestamp: new Date(),
    });
  });
}
