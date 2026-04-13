import {
  sendMessage,
  editMessage,
  deleteMessage,
  forwardMultipleMessages,
  markMessagesAsRead,
  markAMessageAsRead,
  pinMessage,
  unpinMessage,
  addReaction,
  removeReaction,
} from "../../../../services/main/chat/chatMessageServices.js";

/**
 * Handles all chat message socket events:
 *   message:create, messages:forward, message:edit, message:delete,
 *   messages:mark_read, message:mark_read,
 *   message:pin, message:unpin,
 *   reaction:added, reaction:removed
 *
 * @param {import("socket.io").Socket} socket
 * @param {{ ctx: { userId: number|null, clientId: string|null } }} options
 */
export function registerMessageHandlers(socket, { ctx }) {
  socket.on("message:create", async ({ data }) => {
    try {
      const { content, type, replyToId, attachments, roomId } = data;
      await sendMessage({
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
    }
  });

  socket.on("messages:forward", async (data) => {
    const { roomsIds, messageIds } = data;
    await forwardMultipleMessages({ roomsIds, messageIds, userId: ctx.userId });
  });

  socket.on("message:edit", async (data) => {
    const { messageId, content, roomId } = data;
    if (!messageId || !content || !roomId) return;
    try {
      await editMessage({ content, messageId, userId: ctx.userId });
    } catch (err) {
      console.error("message:edit error:", err);
      socket.emit("error", { message: "Error editing message" });
    }
  });

  socket.on("message:delete", async (data) => {
    const { messageId, roomId } = data;
    if (!messageId || !roomId) return;
    try {
      await deleteMessage({
        messageId,
        userId: ctx.userId,
        clientId: ctx.clientId,
      });
    } catch (err) {
      console.error("message:delete error:", err);
      socket.emit("error", { message: "Error deleting message" });
    }
  });

  socket.on("messages:mark_read", async (data) => {
    const { roomId } = data;
    if (!roomId) return;
    try {
      await markMessagesAsRead({
        roomId,
        userId: ctx.userId,
        clientId: ctx.clientId,
      });
    } catch (err) {
      console.error("messages:mark_read error:", err);
    }
  });

  socket.on("message:mark_read", async (data) => {
    const { roomId, messageId } = data;
    if (!roomId) return;
    try {
      await markAMessageAsRead({
        messageId,
        roomId,
        userId: ctx.userId,
        clientId: ctx.clientId,
      });
    } catch (err) {
      console.error("message:mark_read error:", err);
    }
  });

  socket.on("message:pin", async (data) => {
    const { roomId, messageId } = data;
    if (!roomId) return;
    try {
      await pinMessage({
        roomId,
        messageId,
        userId: ctx.userId,
        clientId: ctx.clientId,
      });
    } catch (err) {
      console.error("message:pin error:", err);
    }
  });

  socket.on("message:unpin", async (data) => {
    const { roomId, messageId } = data;
    if (!roomId) return;
    try {
      await unpinMessage({
        roomId,
        messageId,
        userId: ctx.userId,
        clientId: ctx.clientId,
      });
    } catch (err) {
      console.error("message:unpin error:", err);
    }
  });

  socket.on("reaction:added", async (data) => {
    const { emoji, messageId, userId } = data;
    try {
      await addReaction({ emoji, messageId, userId });
    } catch (err) {
      console.error("reaction:added error:", err);
    }
  });

  socket.on("reaction:removed", async (data) => {
    const { emoji, messageId, userId } = data;
    try {
      await removeReaction({ emoji, messageId, userId });
    } catch (err) {
      console.error("reaction:removed error:", err);
    }
  });
}
