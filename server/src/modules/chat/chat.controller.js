import { ok, created, deleted } from "../../shared/http/response.js";
import { chatMessagesCodes, messagesNames } from "@dms/shared";
import { chatUsecase } from "./chat.usecase.js";

const TK = messagesNames.chatMessages;

class ChatController {
  // ── Object-scope checker entry point (wired via requireSpecialChecker) ───────
  // Thin controller method that delegates to the usecase checker. It THROWS on
  // denial (via the usecase) and returns the loaded membership row on success.
  // Wired on EVERY object-scoped `/rooms/:roomId/...` route (the IDOR gate).
  checkIfUserCanAccessRoom(req) {
    return chatUsecase.checkIfUserCanAccessRoom({
      roomId: parseInt(req.params.roomId, 10),
      authUserId: req.auth.id,
    });
  }

  // ── Rooms ──────────────────────────────────────────────────────────────────

  async getRooms(req, res) {
    const result = await chatUsecase.getRooms(req.auth, req.query);
    return ok(res, result, chatMessagesCodes.ROOMS_FETCHED, TK);
  }

  async getRoomById(req, res) {
    const { roomId } = req.params;
    // capabilities are computed in the usecase/dto and already attached to `room`.
    const room = await chatUsecase.getRoomById(roomId, req.auth, null);
    return ok(res, room, chatMessagesCodes.ROOM_FETCHED, TK);
  }

  async createRoom(req, res) {
    const userId = req.auth.id;
    const room = await chatUsecase.createRoom(userId, req.body);
    return created(res, room, chatMessagesCodes.ROOM_CREATED, TK);
  }

  async createDirectChat(req, res) {
    const userId = req.auth.id;
    const { participantId } = req.body;
    const room = await chatUsecase.createDirectChat(userId, participantId);
    return ok(res, room, chatMessagesCodes.ROOM_CREATED, TK);
  }

  async createLeadsRoom(req, res) {
    const userId = req.auth.id;
    const room = await chatUsecase.createLeadsRoom(userId, req.body);
    return created(res, room, chatMessagesCodes.LEAD_ROOM_CREATED, TK);
  }

  async updateRoom(req, res) {
    const userId = req.auth.id;
    const { roomId } = req.params;
    const room = await chatUsecase.updateRoom(roomId, userId, req.body);
    return ok(res, room, chatMessagesCodes.ROOM_UPDATED, TK);
  }

  async deleteRoom(req, res) {
    const userId = req.auth.id;
    const { roomId } = req.params;
    const result = await chatUsecase.deleteRoom(roomId, userId);
    return deleted(res, result.code, TK);
  }

  async manageClient(req, res) {
    const userId = req.auth.id;
    const { roomId } = req.params;
    const { action } = req.body;
    const result = await chatUsecase.manageClient(roomId, userId, action);
    return ok(res, null, result.code, TK);
  }

  async regenerateToken(req, res) {
    const userId = req.auth.id;
    const { roomId } = req.params;
    const room = await chatUsecase.regenerateToken(roomId, userId);
    return ok(res, room, chatMessagesCodes.TOKEN_REGENERATED, TK);
  }

  // ── Messages ───────────────────────────────────────────────────────────────

  async getMessages(req, res) {
    const userId = req.auth.id;
    const { roomId } = req.params;
    const result = await chatUsecase.getMessages(
      roomId,
      userId,
      null,
      req.query,
    );
    return ok(res, result, chatMessagesCodes.MESSAGES_FETCHED, TK);
  }

  async getMessagePage(req, res) {
    const { messageId } = req.params;
    const { limit } = req.query;
    const result = await chatUsecase.getMessagePage(messageId, limit);
    return ok(res, result, chatMessagesCodes.MESSAGES_FETCHED, TK);
  }

  async getPinnedMessages(req, res) {
    const userId = req.auth.id;
    const { roomId } = req.params;
    const messages = await chatUsecase.getPinnedMessages(roomId, userId, null);
    return ok(res, messages, chatMessagesCodes.PINNED_MESSAGES_FETCHED, TK);
  }

  async markRoomRead(req, res) {
    const userId = req.auth.id;
    const { roomId } = req.params;
    const { messageId } = req.body;
    if (messageId) {
      await chatUsecase.markMessageRead(roomId, messageId, userId, null);
    } else {
      await chatUsecase.markRoomRead(roomId, userId, null);
    }
    return ok(res, null, chatMessagesCodes.MESSAGES_MARKED_READ, TK);
  }

  async markAllRead(req, res) {
    const userId = req.auth.id;
    const { roomIds } = req.body;
    const result = await chatUsecase.markAllRead(userId, roomIds);
    return ok(res, null, result.code, TK);
  }

  async addReaction(req, res) {
    const userId = req.auth.id;
    const { messageId } = req.params;
    const { emoji } = req.body;
    const reaction = await chatUsecase.addReaction(messageId, userId, emoji);
    return ok(res, reaction, chatMessagesCodes.REACTION_ADDED, TK);
  }

  async removeReaction(req, res) {
    const userId = req.auth.id;
    const { messageId, emoji } = req.params;
    await chatUsecase.removeReaction(messageId, userId, emoji);
    return ok(res, null, chatMessagesCodes.REACTION_REMOVED, TK);
  }

  // ── Members ────────────────────────────────────────────────────────────────

  async getMembers(req, res) {
    const userId = req.auth.id;
    const { roomId } = req.params;
    const result = await chatUsecase.getMembers(roomId, userId, null);
    return ok(res, result, chatMessagesCodes.MEMBERS_FETCHED, TK);
  }

  async addMembers(req, res) {
    const userId = req.auth.id;
    const { roomId } = req.params;
    const { userIds } = req.body;
    const room = await chatUsecase.addMembers(roomId, userId, userIds);
    return ok(res, room, chatMessagesCodes.MEMBERS_ADDED, TK);
  }

  async removeMember(req, res) {
    const userId = req.auth.id;
    const { roomId, memberId } = req.params;
    const result = await chatUsecase.removeMember(roomId, userId, memberId);
    return ok(res, null, result.code, TK);
  }

  async leaveRoom(req, res) {
    const userId = req.auth.id;
    const { roomId } = req.params;
    const result = await chatUsecase.leaveRoom(roomId, userId);
    return ok(res, null, result.code, TK);
  }

  async updateMemberRole(req, res) {
    const userId = req.auth.id;
    const { roomId, memberId } = req.params;
    const { role } = req.body;
    const member = await chatUsecase.updateMemberRole(
      roomId,
      userId,
      memberId,
      role,
    );
    return ok(res, member, chatMessagesCodes.MEMBER_ROLE_UPDATED, TK);
  }

  // ── Files ──────────────────────────────────────────────────────────────────

  async getFiles(req, res) {
    const userId = req.auth.id;
    const { roomId } = req.params;
    const result = await chatUsecase.getFiles(roomId, userId, null, req.query);
    return ok(res, result, chatMessagesCodes.FILES_FETCHED, TK);
  }

  async getFileStats(req, res) {
    const userId = req.auth.id;
    const { roomId } = req.params;
    const stats = await chatUsecase.getFileStats(roomId, userId, null);
    return ok(res, stats, chatMessagesCodes.FILE_STATS_FETCHED, TK);
  }
}

export const chatController = new ChatController();
export { ChatController };
