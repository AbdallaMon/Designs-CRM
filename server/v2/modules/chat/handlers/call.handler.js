/**
 * WebRTC call signalling handlers (initiated, answered, ended).
 *
 * @param {import("socket.io").Socket} socket
 * @param {{ io: import("socket.io").Server, ctx: object, usecase: import("../chat.usecase.js").ChatUsecase }} deps
 */
export function registerCallHandlers(socket, { io, ctx, usecase }) {
  socket.on("call:initiated", async (data) => {
    const { callType, roomId } = data;
    if (!callType || !roomId) return;
    try {
      await usecase.initiateCall({ roomId, callType, userId: ctx.userId });
    } catch (err) {
      console.error("call:initiated error:", err);
      socket.emit("error", { message: err.message || "Error initiating call" });
    }
  });

  socket.on("call:answered", async (data) => {
    const { callId, roomId } = data;
    if (!callId || !roomId) return;
    try {
      await usecase.answerCall({ callId, roomId, userId: ctx.userId });
    } catch (err) {
      console.error("call:answered error:", err);
      socket.emit("error", { message: err.message || "Error answering call" });
    }
  });

  socket.on("call:ended", async (data) => {
    const { callId, roomId } = data;
    if (!callId || !roomId) return;
    try {
      await usecase.endCall({ callId, roomId, userId: ctx.userId });
    } catch (err) {
      console.error("call:ended error:", err);
      socket.emit("error", { message: err.message || "Error ending call" });
    }
  });
}
