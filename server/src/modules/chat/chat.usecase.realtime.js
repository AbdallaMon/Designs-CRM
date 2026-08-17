import { getIo } from "../../infra/socket/io-registry.js";
import { AppError } from "../../shared/errors/AppError.js";
import { chatMessagesCodes } from "@dms/shared";
import { chatRepository } from "./chat.repo.js";
import { exposeAssetReferences } from "../../infra/upload/asset-access.js";

async function requireRoomMember({ roomId, userId, clientId }) {
  const member = await chatRepository.getMember({ roomId, userId, clientId });
  if (!member) {
    throw new AppError({
      code: chatMessagesCodes.ROOM_ACCESS_DENIED,
      statusCode: 403,
    });
  }
  return member;
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
    const io = getIo();
    const exposedContent = exposeAssetReferences(content);
    const members = await chatRepository.getActiveMembersExcluding({
      roomId,
      userId,
      clientId,
    });
    for (const m of members) {
      if (m.userId) io.to(`user:${m.userId}`).emit(event, exposedContent);
      else if (m.clientId) io.to(`client:${m.clientId}`).emit(event, exposedContent);
    }
  },

  async emitToAllMembers({ roomId, event, content }) {
    const io = getIo();
    const exposedContent = exposeAssetReferences(content);
    const members = await chatRepository.getActiveMembers(roomId);
    for (const m of members) {
      if (m.userId) io.to(`user:${m.userId}`).emit(event, exposedContent);
      else if (m.clientId) io.to(`client:${m.clientId}`).emit(event, exposedContent);
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
    await requireRoomMember({ roomId, userId, clientId });
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
    await requireRoomMember({ roomId, userId, clientId });
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
