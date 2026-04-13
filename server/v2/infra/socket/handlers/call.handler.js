import prisma from "../../prisma.js";

/**
 * Handles WebRTC call signalling events:
 *   call:initiated, call:answered, call:ended
 *
 * @param {import("socket.io").Socket} socket
 * @param {{ io: import("socket.io").Server, ctx: { userId: number|null } }} options
 */
export function registerCallHandlers(socket, { io, ctx }) {
  socket.on("call:initiated", async (data) => {
    const { callType, roomId } = data;
    if (!callType || !roomId) return;
    try {
      const call = await prisma.call.create({
        data: {
          roomId: parseInt(roomId),
          initiatorId: ctx.userId,
          type: callType,
          status: "RINGING",
        },
      });

      io.to(`room:${roomId}`).emit("call:initiated", {
        callId: call.id,
        callType,
        initiatedBy: ctx.userId,
        roomId,
        timestamp: new Date(),
      });
    } catch (err) {
      console.error("call:initiated error:", err);
      socket.emit("error", { message: "Error initiating call" });
    }
  });

  socket.on("call:answered", async (data) => {
    const { callId, roomId } = data;
    if (!callId || !roomId) return;
    try {
      await prisma.call.update({
        where: { id: parseInt(callId) },
        data: { status: "ONGOING" },
      });

      await prisma.callParticipant.create({
        data: { callId: parseInt(callId), userId: ctx.userId },
      });

      io.to(`room:${roomId}`).emit("call:answered", {
        callId: parseInt(callId),
        answeredBy: ctx.userId,
        roomId,
      });
    } catch (err) {
      console.error("call:answered error:", err);
      socket.emit("error", { message: "Error answering call" });
    }
  });

  socket.on("call:ended", async (data) => {
    const { callId, roomId } = data;
    if (!callId || !roomId) return;
    try {
      const call = await prisma.call.update({
        where: { id: parseInt(callId) },
        data: { status: "ENDED", endedAt: new Date() },
      });

      if (call.startedAt) {
        const duration = Math.floor((new Date() - call.startedAt) / 1000);
        await prisma.call.update({
          where: { id: parseInt(callId) },
          data: { duration },
        });
      }

      io.to(`room:${roomId}`).emit("call:ended", {
        callId: parseInt(callId),
        endedBy: ctx.userId,
        roomId,
      });
    } catch (err) {
      console.error("call:ended error:", err);
      socket.emit("error", { message: "Error ending call" });
    }
  });
}
