import { ok, created, deleted } from "../../shared/http/response.js";
import { chatMessagesCodes, messagesNames } from "@dms/shared";

const TK = messagesNames.chatMessages;

export class ChatController {
  /** @param {import("./chat.usecase.js").ChatUsecase} usecase */
  constructor(usecase) {
    this.usecase = usecase;
  }

  // ── Object-scope checker entry point (wired via requireSpecialChecker) ───────
  // Thin controller method that delegates to the usecase checker. It THROWS on
  // denial (via the usecase) and returns the loaded membership row on success.
  // Wired on EVERY object-scoped `/rooms/:roomId/...` route (the IDOR gate).
  checkIfUserCanAccessRoom = (req) => {
    return this.usecase.checkIfUserCanAccessRoom({
      roomId: parseInt(req.params.roomId, 10),
      authUserId: req.auth.id,
    });
  };

  // ── Rooms ──────────────────────────────────────────────────────────────────

  getRooms = async (req, res) => {
    const result = await this.usecase.getRooms(req.auth, req.query);
    return ok(res, result, chatMessagesCodes.ROOMS_FETCHED, TK);
  };

  getRoomById = async (req, res) => {
    const { roomId } = req.params;
    // capabilities are computed in the usecase/dto and already attached to `room`.
    const room = await this.usecase.getRoomById(roomId, req.auth, null);
    return ok(res, room, chatMessagesCodes.ROOM_FETCHED, TK);
  };

  createRoom = async (req, res) => {
    const userId = req.auth.id;
    const room = await this.usecase.createRoom(userId, req.body);
    return created(res, room, chatMessagesCodes.ROOM_CREATED, TK);
  };

  createDirectChat = async (req, res) => {
    const userId = req.auth.id;
    const { participantId } = req.body;
    const room = await this.usecase.createDirectChat(userId, participantId);
    return ok(res, room, chatMessagesCodes.ROOM_CREATED, TK);
  };

  createLeadsRoom = async (req, res) => {
    const userId = req.auth.id;
    const room = await this.usecase.createLeadsRoom(userId, req.body);
    return created(res, room, chatMessagesCodes.LEAD_ROOM_CREATED, TK);
  };

  updateRoom = async (req, res) => {
    const userId = req.auth.id;
    const { roomId } = req.params;
    const room = await this.usecase.updateRoom(roomId, userId, req.body);
    return ok(res, room, chatMessagesCodes.ROOM_UPDATED, TK);
  };

  deleteRoom = async (req, res) => {
    const userId = req.auth.id;
    const { roomId } = req.params;
    const result = await this.usecase.deleteRoom(roomId, userId);
    return deleted(res, result.code, TK);
  };

  manageClient = async (req, res) => {
    const userId = req.auth.id;
    const { roomId } = req.params;
    const { action } = req.body;
    const result = await this.usecase.manageClient(roomId, userId, action);
    return ok(res, null, result.code, TK);
  };

  regenerateToken = async (req, res) => {
    const userId = req.auth.id;
    const { roomId } = req.params;
    const room = await this.usecase.regenerateToken(roomId, userId);
    return ok(res, room, chatMessagesCodes.TOKEN_REGENERATED, TK);
  };

  // ── Messages ───────────────────────────────────────────────────────────────

  getMessages = async (req, res) => {
    const userId = req.auth.id;
    const { roomId } = req.params;
    const result = await this.usecase.getMessages(
      roomId,
      userId,
      null,
      req.query,
    );
    return ok(res, result, chatMessagesCodes.MESSAGES_FETCHED, TK);
  };

  getMessagePage = async (req, res) => {
    const { messageId } = req.params;
    const { limit } = req.query;
    const result = await this.usecase.getMessagePage(messageId, limit);
    return ok(res, result, chatMessagesCodes.MESSAGES_FETCHED, TK);
  };

  getPinnedMessages = async (req, res) => {
    const userId = req.auth.id;
    const { roomId } = req.params;
    const messages = await this.usecase.getPinnedMessages(roomId, userId, null);
    return ok(res, messages, chatMessagesCodes.PINNED_MESSAGES_FETCHED, TK);
  };

  markRoomRead = async (req, res) => {
    const userId = req.auth.id;
    const { roomId } = req.params;
    const { messageId } = req.body;
    if (messageId) {
      await this.usecase.markMessageRead(roomId, messageId, userId, null);
    } else {
      await this.usecase.markRoomRead(roomId, userId, null);
    }
    return ok(res, null, chatMessagesCodes.MESSAGES_MARKED_READ, TK);
  };

  markAllRead = async (req, res) => {
    const userId = req.auth.id;
    const { roomIds } = req.body;
    const result = await this.usecase.markAllRead(userId, roomIds);
    return ok(res, null, result.code, TK);
  };

  addReaction = async (req, res) => {
    const userId = req.auth.id;
    const { messageId } = req.params;
    const { emoji } = req.body;
    const reaction = await this.usecase.addReaction(messageId, userId, emoji);
    return ok(res, reaction, chatMessagesCodes.REACTION_ADDED, TK);
  };

  removeReaction = async (req, res) => {
    const userId = req.auth.id;
    const { messageId, emoji } = req.params;
    await this.usecase.removeReaction(messageId, userId, emoji);
    return ok(res, null, chatMessagesCodes.REACTION_REMOVED, TK);
  };

  // ── Members ────────────────────────────────────────────────────────────────

  getMembers = async (req, res) => {
    const userId = req.auth.id;
    const { roomId } = req.params;
    const result = await this.usecase.getMembers(roomId, userId, null);
    return ok(res, result, chatMessagesCodes.MEMBERS_FETCHED, TK);
  };

  addMembers = async (req, res) => {
    const userId = req.auth.id;
    const { roomId } = req.params;
    const { userIds } = req.body;
    const room = await this.usecase.addMembers(roomId, userId, userIds);
    return ok(res, room, chatMessagesCodes.MEMBERS_ADDED, TK);
  };

  removeMember = async (req, res) => {
    const userId = req.auth.id;
    const { roomId, memberId } = req.params;
    const result = await this.usecase.removeMember(roomId, userId, memberId);
    return ok(res, null, result.code, TK);
  };

  updateMemberRole = async (req, res) => {
    const userId = req.auth.id;
    const { roomId, memberId } = req.params;
    const { role } = req.body;
    const member = await this.usecase.updateMemberRole(
      roomId,
      userId,
      memberId,
      role,
    );
    return ok(res, member, chatMessagesCodes.MEMBER_ROLE_UPDATED, TK);
  };

  // ── Files ──────────────────────────────────────────────────────────────────

  getFiles = async (req, res) => {
    const userId = req.auth.id;
    const { roomId } = req.params;
    const result = await this.usecase.getFiles(roomId, userId, null, req.query);
    return ok(res, result, chatMessagesCodes.FILES_FETCHED, TK);
  };

  getFileStats = async (req, res) => {
    const userId = req.auth.id;
    const { roomId } = req.params;
    const stats = await this.usecase.getFileStats(roomId, userId, null);
    return ok(res, stats, chatMessagesCodes.FILE_STATS_FETCHED, TK);
  };
}
