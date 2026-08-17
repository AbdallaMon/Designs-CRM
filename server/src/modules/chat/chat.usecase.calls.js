import { getIo } from "../../infra/socket/io-registry.js";
import { AppError } from "../../shared/errors/AppError.js";
import { chatMessagesCodes } from "@dms/shared";
import { chatRepository } from "./chat.repo.js";

async function requireStaffRoomMember({ roomId, userId }) {
  if (!userId) {
    throw new AppError({
      code: chatMessagesCodes.ROOM_FORBIDDEN_ACTION,
      statusCode: 403,
    });
  }
  const member = await chatRepository.getMember({
    roomId,
    userId,
    clientId: null,
  });
  if (!member) {
    throw new AppError({
      code: chatMessagesCodes.ROOM_ACCESS_DENIED,
      statusCode: 403,
    });
  }
  return member;
}

async function requireCallInRoom(callId, roomId) {
  const call = await chatRepository.getCallById(callId);
  if (!call || Number(call.roomId) !== Number(roomId)) {
    throw new AppError({
      code: chatMessagesCodes.ROOM_ACCESS_DENIED,
      statusCode: 403,
    });
  }
  return call;
}


/**
 * Calls concern of ChatUsecase — socket-triggered call lifecycle. Prototype-
 * composed onto {@link ChatUsecase} (see chat.usecase.js); moved verbatim,
 * behavior-preserving only.
 */
export const callMethods = {
  // ── Calls (socket-triggered) ───────────────────────────────────────────────

  async initiateCall({ roomId, callType, userId }) {
    await requireStaffRoomMember({ roomId, userId });
    const room = await chatRepository.findRoomBasic(roomId);
    if (!room?.allowCalls) {
      throw new AppError({
        code: chatMessagesCodes.ROOM_FORBIDDEN_ACTION,
        statusCode: 403,
      });
    }
    const call = await chatRepository.createCall({
      roomId,
      initiatorId: userId,
      type: callType,
    });
    const io = getIo();
    io.to(`room:${roomId}`).emit("call:initiated", {
      callId: call.id,
      callType,
      initiatedBy: Number(userId),
      roomId: Number(roomId),
      timestamp: new Date(),
    });
    return call;
  },

  async answerCall({ callId, roomId, userId }) {
    await requireStaffRoomMember({ roomId, userId });
    await requireCallInRoom(callId, roomId);
    await chatRepository.updateCall(callId, { status: "ONGOING" });
    await chatRepository.addCallParticipant({ callId, userId });
    const io = getIo();
    io.to(`room:${roomId}`).emit("call:answered", {
      callId: Number(callId),
      answeredBy: Number(userId),
      roomId: Number(roomId),
    });
  },

  async endCall({ callId, roomId, userId }) {
    await requireStaffRoomMember({ roomId, userId });
    await requireCallInRoom(callId, roomId);
    const call = await chatRepository.updateCall(callId, {
      status: "ENDED",
      endedAt: new Date(),
    });
    if (call.startedAt) {
      const duration = Math.floor((new Date() - call.startedAt) / 1000);
      await chatRepository.updateCall(callId, { duration });
    }
    const io = getIo();
    io.to(`room:${roomId}`).emit("call:ended", {
      callId: Number(callId),
      endedBy: Number(userId),
      roomId: Number(roomId),
    });
  },
};
