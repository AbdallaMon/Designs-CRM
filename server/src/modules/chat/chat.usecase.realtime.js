import { getIo } from "../../infra/socket/index.js";

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
    const io = getIo();
    const members = await this.repository.getActiveMembersExcluding({
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
    const io = getIo();
    const members = await this.repository.getActiveMembers(roomId);
    for (const m of members) {
      if (m.userId) io.to(`user:${m.userId}`).emit(event, content);
      else if (m.clientId) io.to(`client:${m.clientId}`).emit(event, content);
    }
  },

  // ── Presence ───────────────────────────────────────────────────────────────

  updateUserLastSeen(userId) {
    this.repository.updateUserLastSeen(userId);
  },

  async updateClientLastSeen(clientId) {
    await this.repository.updateClientLastSeen(clientId);
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
