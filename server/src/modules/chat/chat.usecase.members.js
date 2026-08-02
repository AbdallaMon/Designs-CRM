import { getIo } from "../../infra/socket/io-registry.js";
import { AppError } from "../../shared/errors/AppError.js";
import { chatMessagesCodes } from "@dms/shared";
import { chatRepository } from "./chat.repo.js";


/**
 * Members concern of ChatUsecase — list/add/remove members and role updates.
 * Prototype-composed onto {@link ChatUsecase} (see chat.usecase.js); moved
 * verbatim, behavior-preserving only.
 */
export const memberMethods = {
  // ── Members ────────────────────────────────────────────────────────────────

  async getMembers(roomId, userId, clientId) {
    const member = await chatRepository.getMember({
      roomId,
      userId,
      clientId,
    });
    if (!member)
      throw new AppError({ code: chatMessagesCodes.ROOM_ACCESS_DENIED, statusCode: 403 });
    const members = await chatRepository.getMembers(roomId);
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
    const requester = await chatRepository.getMember({ roomId, userId });
    if (
      !requester ||
      (requester.role !== "ADMIN" && requester.role !== "MODERATOR")
    ) {
      throw new AppError({ code: chatMessagesCodes.ROOM_FORBIDDEN_ACTION, statusCode: 403 });
    }

    const memberData = userIds.map((uid) => ({
      roomId: Number(roomId),
      userId: Number(uid),
      role: "MEMBER",
    }));
    await chatRepository.addRoomMembers(memberData);

    const newMembers = await chatRepository.findMembersByUserIds(
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

    const room = await chatRepository.getFullRoom(roomId);
    return room;
  },

  async removeMember(roomId, userId, memberId) {
    const requester = await chatRepository.getMember({ roomId, userId });
    const memberToRemove = await chatRepository.getMemberById(memberId);

    if (!memberToRemove) throw new AppError({ code: chatMessagesCodes.MEMBER_NOT_FOUND, statusCode: 404 });

    const isSelf = memberToRemove.userId === Number(userId);
    const isAdmin =
      requester?.role === "ADMIN" || requester?.role === "MODERATOR";

    if (!isSelf && !isAdmin) {
      throw new AppError({ code: chatMessagesCodes.ROOM_FORBIDDEN_ACTION, statusCode: 403 });
    }

    await chatRepository.removeMember(memberId);

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

  async leaveRoom(roomId, userId) {
    // The acting user is the authenticated caller (never a body/param id). Find
    // the caller's OWN membership row and remove it. The room scope checker has
    // already run, so this membership normally exists; guard defensively with the
    // same "not a member" scope code used across this module.
    const member = await chatRepository.getMember({ roomId, userId });
    if (!member) throw new AppError({ code: chatMessagesCodes.ROOM_ACCESS_DENIED, statusCode: 403 });

    await chatRepository.removeMember(member.id);

    const io = getIo();
    io.to(`room:${roomId}`).emit("member:removed", {
      roomId: Number(roomId),
      memberId: Number(member.id),
      userId: member.userId,
    });

    if (member.userId) {
      io.to(`user:${member.userId}`).emit("notification:room_removed", {
        roomId: Number(roomId),
      });
    }

    return { code: chatMessagesCodes.MEMBER_REMOVED };
  },

  async updateMemberRole(roomId, userId, memberId, role) {
    const requester = await chatRepository.getAdminOrModeratorMember({
      roomId,
      userId,
    });
    if (!requester)
      throw new AppError({ code: chatMessagesCodes.ROOM_FORBIDDEN_ACTION, statusCode: 403 });

    const validRoles = ["ADMIN", "MODERATOR", "MEMBER"];
    if (!validRoles.includes(role)) throw new AppError({ code: chatMessagesCodes.INVALID_MEMBER_ROLE, statusCode: 400 });

    const updated = await chatRepository.updateMemberRole(memberId, role);

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
