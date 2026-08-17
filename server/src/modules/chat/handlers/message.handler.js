import { socketErrorEnvelope } from "./socket-error.js";
import { requireSocketRoom } from "./socket-room-access.js";

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
    if (!requireSocketRoom(socket, ctx, roomId)) return;
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
      socket.emit("error", socketErrorEnvelope(err));
    }
  });

  socket.on("messages:forward", async (data) => {
    const { roomsIds, messageIds } = data;
    if (
      !Array.isArray(roomsIds) ||
      !roomsIds.every((roomId) => requireSocketRoom(socket, ctx, roomId))
    ) return;
    try {
      await usecase.forwardMessages({
        roomsIds,
        messageIds,
        userId: ctx.userId,
        clientId: ctx.clientId,
        allowedRoomId: ctx.allowedRoomId,
      });
    } catch (err) {
      console.error("messages:forward error:", err);
      socket.emit("error", socketErrorEnvelope(err));
    }
  });

  socket.on("message:edit", async (data) => {
    const { messageId, content, roomId } = data;
    if (!messageId || !content || !roomId) return;
    if (!requireSocketRoom(socket, ctx, roomId)) return;
    try {
      await usecase.editMessage({
        messageId,
        roomId,
        userId: ctx.userId,
        clientId: ctx.clientId,
        content,
      });
    } catch (err) {
      console.error("message:edit error:", err);
      socket.emit("error", socketErrorEnvelope(err));
    }
  });

  socket.on("message:delete", async (data) => {
    const { messageId, roomId } = data;
    if (!messageId || !roomId) return;
    if (!requireSocketRoom(socket, ctx, roomId)) return;
    try {
      await usecase.deleteMessage({
        messageId,
        roomId,
        userId: ctx.userId,
        clientId: ctx.clientId,
      });
    } catch (err) {
      console.error("message:delete error:", err);
      socket.emit("error", socketErrorEnvelope(err));
    }
  });

  socket.on("messages:mark_read", async (data) => {
    const { roomId } = data;
    if (!roomId) return;
    if (!requireSocketRoom(socket, ctx, roomId)) return;
    try {
      await usecase.markRoomRead(roomId, ctx.userId, ctx.clientId);
    } catch (err) {
      console.error("messages:mark_read error:", err);
      socket.emit("error", socketErrorEnvelope(err));
    }
  });

  socket.on("message:mark_read", async (data) => {
    const { roomId, messageId } = data;
    if (!roomId) return;
    if (!requireSocketRoom(socket, ctx, roomId)) return;
    try {
      await usecase.markMessageRead(
        roomId,
        messageId,
        ctx.userId,
        ctx.clientId,
      );
    } catch (err) {
      console.error("message:mark_read error:", err);
      socket.emit("error", socketErrorEnvelope(err));
    }
  });

  socket.on("message:pin", async (data) => {
    const { roomId, messageId } = data;
    if (!roomId || !messageId) return;
    if (!requireSocketRoom(socket, ctx, roomId)) return;
    try {
      await usecase.pinMessage({
        roomId,
        messageId,
        userId: ctx.userId,
        clientId: ctx.clientId,
      });
    } catch (err) {
      console.error("message:pin error:", err);
      socket.emit("error", socketErrorEnvelope(err));
    }
  });

  socket.on("message:unpin", async (data) => {
    const { roomId, messageId } = data;
    if (!roomId || !messageId) return;
    if (!requireSocketRoom(socket, ctx, roomId)) return;
    try {
      await usecase.unpinMessage({
        roomId,
        messageId,
        userId: ctx.userId,
        clientId: ctx.clientId,
      });
    } catch (err) {
      console.error("message:unpin error:", err);
      socket.emit("error", socketErrorEnvelope(err));
    }
  });

  socket.on("reaction:added", async (data) => {
    const { emoji, messageId, roomId } = data;
    if (!emoji || !messageId || !roomId) return;
    if (!requireSocketRoom(socket, ctx, roomId)) return;
    try {
      await usecase.addReaction({
        messageId,
        roomId,
        userId: ctx.userId,
        clientId: ctx.clientId,
        emoji,
      });
    } catch (err) {
      console.error("reaction:added error:", err);
      socket.emit("error", socketErrorEnvelope(err));
    }
  });

  socket.on("reaction:removed", async (data) => {
    const { emoji, messageId, roomId } = data;
    if (!emoji || !messageId || !roomId) return;
    if (!requireSocketRoom(socket, ctx, roomId)) return;
    try {
      await usecase.removeReaction({
        messageId,
        roomId,
        userId: ctx.userId,
        clientId: ctx.clientId,
        emoji,
      });
    } catch (err) {
      console.error("reaction:removed error:", err);
      socket.emit("error", socketErrorEnvelope(err));
    }
  });
}
