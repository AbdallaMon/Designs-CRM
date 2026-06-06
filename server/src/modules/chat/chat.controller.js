import { ok, created, deleted } from "../../shared/http/response.js";
import {
  PERMISSIONS,
  computeCapabilities,
  hasPermission,
} from "@dms/shared";

export class ChatController {
  /** @param {import("./chat.usecase.js").ChatUsecase} usecase */
  constructor(usecase) {
    this.usecase = usecase;
  }

  // ── Object-scope checker entry point (wired via requireSpecialChecker) ───────
  // REFERENCE EXAMPLE: a thin controller method that delegates to the usecase
  // checker. It THROWS on denial (via the usecase) and returns the loaded row.
  checkIfUserCanAccessRoom = (req) => {
    return this.usecase.checkIfUserCanAccessRoom({
      roomId: parseInt(req.params.roomId, 10),
      authUserId: req.auth.id,
    });
  };

  // ── Rooms ──────────────────────────────────────────────────────────────────

  getRooms = async (req, res) => {
    const userId = req.auth.id;
    const result = await this.usecase.getRooms(userId, req.query);
    return ok(res, result);
  };

  getRoomById = async (req, res) => {
    const userId = req.auth.id;
    const { roomId } = req.params;
    const room = await this.usecase.getRoomById(roomId, userId, null);

    // REFERENCE EXAMPLE — per-record capabilities. Every scoped detail/list
    // response attaches a `capabilities.{...}` object the FE gates actions on
    // (decision: mandatory on scoped responses). Combines a permission CODE with
    // object-scope facts (creator/admin membership). Backend stays the source of
    // truth; capabilities are a rendering hint.
    const capabilities = computeCapabilities(
      {
        canEdit: ({ permissions, record, authUserId, selfMember }) =>
          hasPermission(permissions, PERMISSIONS.CHAT.ROOM_EDIT) &&
          (record.createdById === authUserId ||
            selfMember?.role === "ADMIN" ||
            selfMember?.role === "MODERATOR"),
        canDelete: ({ permissions, record, authUserId }) =>
          hasPermission(permissions, PERMISSIONS.CHAT.ROOM_DELETE) &&
          record.createdById === authUserId,
        canManageMembers: ({ permissions, selfMember }) =>
          hasPermission(permissions, PERMISSIONS.CHAT.MEMBER_MANAGE) &&
          (selfMember?.role === "ADMIN" || selfMember?.role === "MODERATOR"),
      },
      {
        permissions: req.auth.permissions,
        record: room,
        authUserId: userId,
        selfMember: room.selfMember,
      },
    );

    return ok(res, { ...room, capabilities });
  };

  createRoom = async (req, res) => {
    const userId = req.auth.id;
    const room = await this.usecase.createRoom(userId, req.body);
    return created(res, room);
  };

  createDirectChat = async (req, res) => {
    const userId = req.auth.id;
    const { participantId } = req.body;
    const room = await this.usecase.createDirectChat(userId, participantId);
    return ok(res, room);
  };

  createLeadsRoom = async (req, res) => {
    const userId = req.auth.id;
    const room = await this.usecase.createLeadsRoom(userId, req.body);
    return created(res, room, "Lead chat room created successfully");
  };

  updateRoom = async (req, res) => {
    const userId = req.auth.id;
    const { roomId } = req.params;
    const room = await this.usecase.updateRoom(roomId, userId, req.body);
    return ok(res, room, "Chat room updated successfully");
  };

  deleteRoom = async (req, res) => {
    const userId = req.auth.id;
    const { roomId } = req.params;
    const result = await this.usecase.deleteRoom(roomId, userId);
    return deleted(res, result.message);
  };

  manageClient = async (req, res) => {
    const userId = req.auth.id;
    const { roomId } = req.params;
    const { action } = req.body;
    const result = await this.usecase.manageClient(roomId, userId, action);
    return ok(res, null, result.message);
  };

  regenerateToken = async (req, res) => {
    const userId = req.auth.id;
    const { roomId } = req.params;
    const room = await this.usecase.regenerateToken(roomId, userId);
    return ok(res, room, "Chat access token regenerated successfully");
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
    return ok(res, result);
  };

  getMessagePage = async (req, res) => {
    const { messageId } = req.params;
    const { limit } = req.query;
    const result = await this.usecase.getMessagePage(messageId, limit);
    return ok(res, result);
  };

  getPinnedMessages = async (req, res) => {
    const userId = req.auth.id;
    const { roomId } = req.params;
    const messages = await this.usecase.getPinnedMessages(roomId, userId, null);
    return ok(res, messages);
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
    return ok(res, null, "Messages marked as read");
  };

  markAllRead = async (req, res) => {
    const userId = req.auth.id;
    const { roomIds } = req.body;
    const result = await this.usecase.markAllRead(userId, roomIds);
    return ok(res, null, result.message);
  };

  addReaction = async (req, res) => {
    const userId = req.auth.id;
    const { messageId } = req.params;
    const { emoji } = req.body;
    const reaction = await this.usecase.addReaction(messageId, userId, emoji);
    return ok(res, reaction);
  };

  removeReaction = async (req, res) => {
    const userId = req.auth.id;
    const { messageId, emoji } = req.params;
    await this.usecase.removeReaction(messageId, userId, emoji);
    return ok(res, null, "Reaction removed");
  };

  // ── Members ────────────────────────────────────────────────────────────────

  getMembers = async (req, res) => {
    const userId = req.auth.id;
    const { roomId } = req.params;
    const members = await this.usecase.getMembers(roomId, userId, null);
    return ok(res, members);
  };

  addMembers = async (req, res) => {
    const userId = req.auth.id;
    const { roomId } = req.params;
    const { userIds } = req.body;
    const room = await this.usecase.addMembers(roomId, userId, userIds);
    return ok(res, room, "Members added successfully");
  };

  removeMember = async (req, res) => {
    const userId = req.auth.id;
    const { roomId, memberId } = req.params;
    const result = await this.usecase.removeMember(roomId, userId, memberId);
    return ok(res, null, result.message);
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
    return ok(res, member);
  };

  // ── Files ──────────────────────────────────────────────────────────────────

  getFiles = async (req, res) => {
    const userId = req.auth.id;
    const { roomId } = req.params;
    const result = await this.usecase.getFiles(roomId, userId, null, req.query);
    return ok(res, result);
  };

  getFileStats = async (req, res) => {
    const userId = req.auth.id;
    const { roomId } = req.params;
    const stats = await this.usecase.getFileStats(roomId, userId, null);
    return ok(res, stats);
  };
}
