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
    const io = await getIo();
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
    const io = await getIo();
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
    const io = await getIo();
    io.to(`room:${roomId}`).emit("call:ended", {
      callId: Number(callId),
      endedBy: Number(userId),
      roomId: Number(roomId),
    });
  },
};
