/**
 * Chat message event handlers (send, edit, delete, forward, read receipts,
 * pin/unpin, reactions).
 *
 * @param {import("socket.io").Socket} socket
 * @param {{ ctx: object, usecase: import("../chat.usecase.js").ChatUsecase }} deps
 */
export function registerMessageHandlers(socket, { ctx, usecase }) {
  socket.on("message:create", async ({ data }) => {
    const { content, type, replyToId, attachments, roomId } = data;
    try {
      await usecase.sendMessage({
        content,
        type,
        replyToId,
        attachments,
        roomId,
        userId: ctx.userId,
        clientId: ctx.clientId,
      });
    } catch (err) {
      console.error("message:create error:", err);
      socket.emit("error", { message: err.message || "Error sending message" });
    }
  });

  socket.on("messages:forward", async (data) => {
    const { roomsIds, messageIds } = data;
    try {
      await usecase.forwardMessages({
        roomsIds,
        messageIds,
        userId: ctx.userId,
      });
    } catch (err) {
      console.error("messages:forward error:", err);
    }
  });

  socket.on("message:edit", async (data) => {
    const { messageId, content, roomId } = data;
    if (!messageId || !content || !roomId) return;
    try {
      await usecase.editMessage({
        messageId,
        userId: ctx.userId,
        clientId: ctx.clientId,
        content,
      });
    } catch (err) {
      console.error("message:edit error:", err);
      socket.emit("error", { message: err.message || "Error editing message" });
    }
  });

  socket.on("message:delete", async (data) => {
    const { messageId, roomId } = data;
    if (!messageId || !roomId) return;
    try {
      await usecase.deleteMessage({
        messageId,
        userId: ctx.userId,
        clientId: ctx.clientId,
      });
    } catch (err) {
      console.error("message:delete error:", err);
      socket.emit("error", {
        message: err.message || "Error deleting message",
      });
    }
  });

  socket.on("messages:mark_read", async (data) => {
    const { roomId } = data;
    if (!roomId) return;
    try {
      await usecase.markRoomRead(roomId, ctx.userId, ctx.clientId);
    } catch (err) {
      console.error("messages:mark_read error:", err);
    }
  });

  socket.on("message:mark_read", async (data) => {
    const { roomId, messageId } = data;
    if (!roomId) return;
    try {
      await usecase.markMessageRead(
        roomId,
        messageId,
        ctx.userId,
        ctx.clientId,
      );
    } catch (err) {
      console.error("message:mark_read error:", err);
    }
  });

  socket.on("message:pin", async (data) => {
    const { roomId, messageId } = data;
    if (!roomId || !messageId) return;
    try {
      await usecase.pinMessage({
        roomId,
        messageId,
        userId: ctx.userId,
        clientId: ctx.clientId,
      });
    } catch (err) {
      console.error("message:pin error:", err);
      socket.emit("error", { message: err.message || "Error pinning message" });
    }
  });

  socket.on("message:unpin", async (data) => {
    const { roomId, messageId } = data;
    if (!roomId || !messageId) return;
    try {
      await usecase.unpinMessage({
        roomId,
        messageId,
        userId: ctx.userId,
        clientId: ctx.clientId,
      });
    } catch (err) {
      console.error("message:unpin error:", err);
      socket.emit("error", {
        message: err.message || "Error unpinning message",
      });
    }
  });

  socket.on("reaction:added", async (data) => {
    const { emoji, messageId, userId } = data;
    try {
      await usecase.addReaction(messageId, userId || ctx.userId, emoji);
    } catch (err) {
      console.error("reaction:added error:", err);
    }
  });

  socket.on("reaction:removed", async (data) => {
    const { emoji, messageId, userId } = data;
    try {
      await usecase.removeReaction(messageId, userId || ctx.userId, emoji);
    } catch (err) {
      console.error("reaction:removed error:", err);
    }
  });
}
