import { AppError } from "../../shared/errors/AppError.js";
import { getIo } from "../../infra/socket/index.js";
import { chatMessagesCodes } from "@dms/shared";

/**
 * Members concern of ChatUsecase — list/add/remove members and role updates.
 * Prototype-composed onto {@link ChatUsecase} (see chat.usecase.js); moved
 * verbatim, behavior-preserving only.
 */
export const memberMethods = {
  // ── Members ────────────────────────────────────────────────────────────────

  async getMembers(roomId, userId, clientId) {
    const member = await this.repository.getMember({
      roomId,
      userId,
      clientId,
    });
    if (!member)
      throw new AppError(chatMessagesCodes.ROOM_ACCESS_DENIED, 403);
    const members = await this.repository.getMembers(roomId);
    // Members are not server-paginated (the room member set is small); we still
    // return the normalized list envelope so the FE treats every list endpoint
    // uniformly.
    return {
      items: members,
      total: members.length,
      page: 0,
      pageSize: members.length,
    };
  },

  async addMembers(roomId, userId, userIds) {
    const requester = await this.repository.getMember({ roomId, userId });
    if (
      !requester ||
      (requester.role !== "ADMIN" && requester.role !== "MODERATOR")
    ) {
      throw new AppError(chatMessagesCodes.ROOM_FORBIDDEN_ACTION, 403);
    }

    const memberData = userIds.map((uid) => ({
      roomId: Number(roomId),
      userId: Number(uid),
      role: "MEMBER",
    }));
    await this.repository.addRoomMembers(memberData);

    const newMembers = await this.repository.findMembersByUserIds(
      roomId,
      userIds,
    );

    const io = getIo();
    for (const uid of userIds) {
      io.to(`user:${uid}`).emit("notification:room_created", {
        roomId: Number(roomId),
        userId: Number(userId),
      });
    }
    io.to(`room:${roomId}`).emit("members:added", {
      roomId: Number(roomId),
      newMembers,
    });

    const room = await this.repository.getFullRoom(roomId);
    return room;
  },

  async removeMember(roomId, userId, memberId) {
    const requester = await this.repository.getMember({ roomId, userId });
    const memberToRemove = await this.repository.getMemberById(memberId);

    if (!memberToRemove) throw new AppError(chatMessagesCodes.MEMBER_NOT_FOUND, 404);

    const isSelf = memberToRemove.userId === Number(userId);
    const isAdmin =
      requester?.role === "ADMIN" || requester?.role === "MODERATOR";

    if (!isSelf && !isAdmin) {
      throw new AppError(chatMessagesCodes.ROOM_FORBIDDEN_ACTION, 403);
    }

    await this.repository.removeMember(memberId);

    const io = getIo();
    io.to(`room:${roomId}`).emit("member:removed", {
      roomId: Number(roomId),
      memberId: Number(memberId),
      userId: memberToRemove.userId,
    });

    if (memberToRemove.userId) {
      io.to(`user:${memberToRemove.userId}`).emit("notification:room_removed", {
        roomId: Number(roomId),
      });
    }

    return { code: chatMessagesCodes.MEMBER_REMOVED };
  },

  async updateMemberRole(roomId, userId, memberId, role) {
    const requester = await this.repository.getAdminOrModeratorMember({
      roomId,
      userId,
    });
    if (!requester)
      throw new AppError(chatMessagesCodes.ROOM_FORBIDDEN_ACTION, 403);

    const validRoles = ["ADMIN", "MODERATOR", "MEMBER"];
    if (!validRoles.includes(role)) throw new AppError(chatMessagesCodes.INVALID_MEMBER_ROLE, 400);

    const updated = await this.repository.updateMemberRole(memberId, role);

    const io = getIo();
    io.to(`room:${roomId}`).emit("member:role_updated", {
      roomId: Number(roomId),
      memberId: Number(memberId),
      role,
      userId: updated.userId,
    });

    return updated;
  },
};
