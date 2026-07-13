import { getIo } from "../../infra/socket/io-registry.js";
import { chatRepository } from "./chat.repo.js";


/**
 * Calls concern of ChatUsecase — socket-triggered call lifecycle. Prototype-
 * composed onto {@link ChatUsecase} (see chat.usecase.js); moved verbatim,
 * behavior-preserving only.
 */
export const callMethods = {
  // ── Calls (socket-triggered) ───────────────────────────────────────────────

  async initiateCall({ roomId, callType, userId }) {
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
