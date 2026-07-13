import { chatRepository } from "./chat.repo.js";

// Lazily resolve the socket server at call time. A static `import { getIo }`
// here would recreate a load-order-fragile cycle:
// infra/socket/index.js → chat.socket.js → chat.usecase.js → this file →
// infra/socket/index.js. The dynamic import is cached by the module loader, so
// this only defers resolution; the io instance and emit behavior are unchanged.
async function getIo() {
  return (await import("../../infra/socket/index.js")).getIo();
}

/**
 * Realtime concern of ChatUsecase — socket emit helpers, presence, and typing.
 * These are prototype-composed onto {@link ChatUsecase} (see chat.usecase.js),
 * so every `this.*` reference resolves against the same instance/prototype as
 * before the split. Behavior-preserving move only.
 */
export const realtimeMethods = {
  // ── Socket emit helpers ────────────────────────────────────────────────────

  async emitToAllMembersExcluding({
    roomId,
    userId,
    clientId,
    event,
    content,
  }) {
    const io = await getIo();
    const members = await chatRepository.getActiveMembersExcluding({
      roomId,
      userId,
      clientId,
    });
    for (const m of members) {
      if (m.userId) io.to(`user:${m.userId}`).emit(event, content);
      else if (m.clientId) io.to(`client:${m.clientId}`).emit(event, content);
    }
  },

  async emitToAllMembers({ roomId, event, content }) {
    const io = await getIo();
    const members = await chatRepository.getActiveMembers(roomId);
    for (const m of members) {
      if (m.userId) io.to(`user:${m.userId}`).emit(event, content);
      else if (m.clientId) io.to(`client:${m.clientId}`).emit(event, content);
    }
  },

  // ── Presence ───────────────────────────────────────────────────────────────

  updateUserLastSeen(userId) {
    chatRepository.updateUserLastSeen(userId);
  },

  async updateClientLastSeen(clientId) {
    await chatRepository.updateClientLastSeen(clientId);
  },

  // ── Typing indicator ───────────────────────────────────────────────────────

  async emitTyping({ socket, roomId, userId, clientId, user, client }) {
    const message = `${user?.name || client?.name || "Someone"} is typing`;

    socket.to(`room:${roomId}`).emit("user:typing", {
      userId,
      clientId,
      roomId,
      message,
    });

    await this.emitToAllMembersExcluding({
      roomId,
      userId,
      clientId,
      event: "notification:user_typing",
      content: { user, client, roomId, message },
    }).catch(console.error);

    return message;
  },

  async emitStopTyping({ socket, roomId, userId, clientId, user, client }) {
    socket
      .to(`room:${roomId}`)
      .emit("user:stop_typing", { userId, clientId, roomId });

    await this.emitToAllMembersExcluding({
      roomId,
      userId,
      clientId,
      event: "notification:user_stopped_typing",
      content: { user, client, roomId, message: "" },
    }).catch(console.error);
  },
};
