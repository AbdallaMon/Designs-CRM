import { Server } from "socket.io";
import prisma from "../prisma/prisma.js";
import { allowedOrigins } from "../index.js";
import {
  addReaction,
  deleteMessage,
  editMessage,
  markMessagesAsRead,
  removeReaction,
  sendMessage,
} from "./main/chat/chatMessageServices.js";

let io;
const userSessions = new Map();
const typingTimeouts = new Map(); // Track typing timeouts

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  io.on("connection", async (socket) => {
    let userId;
    socket.on("online", ({ userId: id, user }) => {
      // const id = user.id;
      socket.join(`user:${id}`);
      userId = id;
      // Broadcast user is online
      io.emit("user:online", {
        userId: id,
        socketId: socket.id,
        timestamp: new Date(),
        user,
      });
    });
    userId = !userId ? Number(socket.handshake.query.userId) : userId;

    // ==================== EXISTING HEARTBEAT ====================

    // ==================== CHAT ROOM EVENTS ====================

    /**
     * Join a chat room
     */
    socket.on("join_room", async (data) => {
      const { roomId, userId } = data;

      if (!roomId) return;

      // Verify user is member of room
      const member = await prisma.chatMember.findFirst({
        where: {
          roomId: parseInt(roomId),
          userId,
          leftAt: null,
        },
      });

      if (!member) {
        socket.emit("error", { message: "Not a member of this room" });
        return;
      }

      // Leave previous rooms (except user room)
      const rooms = Array.from(socket.rooms);
      rooms.forEach((room) => {
        if (room !== socket.id && !room.startsWith("user:")) {
          socket.leave(room);
        }
      });

      // Join new room
      socket.join(`room:${roomId}`);

      // Notify others in room
      socket.to(`room:${roomId}`).emit("member:joined", {
        userId,
        roomId,
        timestamp: new Date(),
      });
    });

    /**
     * Leave a chat room
     */
    socket.on("leave_room", (data) => {
      const { roomId } = data;

      if (!roomId) return;

      socket.leave(`room:${roomId}`);

      // Notify others in room
      socket.to(`room:${roomId}`).emit("member:left", {
        userId,
        roomId,
        timestamp: new Date(),
      });

      console.log(`User ${userId} left room ${roomId}`);
    });

    // ==================== TYPING INDICATORS ====================

    /**
     * User is typing
     */
    socket.on("user:typing", (data) => {
      const { roomId, user } = data;
      const userId = user.userId;
      if (!roomId) return;

      // Clear existing timeout
      const timeoutKey = `${userId}-${roomId}`;
      if (typingTimeouts.has(timeoutKey)) {
        clearTimeout(typingTimeouts.get(timeoutKey));
      }

      // Broadcast to room (except sender)
      socket.to(`room:${roomId}`).emit("user:typing", {
        userId,
        roomId,
        timestamp: new Date(),
        message: `${user?.name || "Some one"} is typign`,
      });

      // Auto-stop typing after 3 seconds
      const timeout = setTimeout(() => {
        socket.to(`room:${roomId}`).emit("user:stop_typing", {
          userId,
          roomId,
        });
        typingTimeouts.delete(timeoutKey);
      }, 3000);

      typingTimeouts.set(timeoutKey, timeout);
    });

    /**
     * User stopped typing
     */
    socket.on("user:stop_typing", (data) => {
      const { roomId } = data;

      if (!roomId) return;

      // Clear timeout
      const timeoutKey = `${userId}-${roomId}`;
      if (typingTimeouts.has(timeoutKey)) {
        clearTimeout(typingTimeouts.get(timeoutKey));
        typingTimeouts.delete(timeoutKey);
      }

      // Broadcast to room (except sender)
      socket.to(`room:${roomId}`).emit("user:stop_typing", {
        userId,
        roomId,
      });
    });

    socket.on("message:create", async ({ data }) => {
      try {
        const {
          content,
          type,
          replyToId,
          fileUrl,
          fileName,
          fileSize,
          fileMimeType,
          roomId,
        } = data;
        console.log(data, "data");
        await sendMessage({
          content,
          type,
          replyToId,
          fileUrl,
          fileName,
          fileSize,
          fileMimeType,
          userId: data.userId,
          roomId,
        });
      } catch (e) {
        console.log(e, "error in sending message");
      }
    });
    // ==================== MESSAGE EVENTS ====================

    /**
     * Edit message (broadcast handled by service, but we can also handle here)
     */
    socket.on("message:edit", async (data) => {
      const { messageId, content, roomId } = data;

      if (!messageId || !content || !roomId) return;

      try {
        await editMessage({ content, messageId, userId });
      } catch (error) {
        console.error("Edit message error:", error);
        socket.emit("error", { message: "Error editing message" });
      }
    });

    /**
     * Delete message (broadcast handled by service, but we can also handle here)
     */
    socket.on("message:delete", async (data) => {
      const { messageId, roomId, userId } = data;
      console.log(messageId, roomId, "messageId, roomId");
      if (!messageId || !roomId) return;

      try {
        await deleteMessage({ messageId, userId });
      } catch (error) {
        console.error("Delete message error:", error);
        socket.emit("error", { message: "Error deleting message" });
      }
    });

    // ==================== CALL EVENTS ====================

    /**
     * Mark messages as read
     */
    socket.on("message:mark_read", async (data) => {
      const { roomId, messageId, userId } = data;
      console.log(data, "data in mark as read");
      if (!roomId) return;

      try {
        // Get member
        await markMessagesAsRead({ messageId, roomId, userId });
      } catch (error) {
        console.error("Mark as read error:", error);
      }
    });

    /**
     * reactions
     */

    socket.on("reaction:added", async (data) => {
      const { emoji, messageId, userId } = data;

      if (!roomId) return;

      try {
        // Get member
        await addReaction({ emoji, messageId, userId });
      } catch (error) {
        console.error("Mark as read error:", error);
      }
    });
    socket.on("reaction:removed", async (data) => {
      const { emoji, messageId, userId } = data;

      if (!roomId) return;

      try {
        // Get member
        await removeReaction({ emoji, messageId, userId });
      } catch (error) {
        console.error("Mark as read error:", error);
      }
    });
    /* Initiate a call
     */
    socket.on("call:initiated", async (data) => {
      const { callType, roomId } = data;

      if (!callType || !roomId) return;

      try {
        // Create call record
        const call = await prisma.call.create({
          data: {
            roomId: parseInt(roomId),
            initiatorId: userId,
            type: callType,
            status: "RINGING",
          },
        });

        // Broadcast to room
        io.to(`room:${roomId}`).emit("call:initiated", {
          callId: call.id,
          callType,
          initiatedBy: userId,
          roomId,
          timestamp: new Date(),
        });

        console.log(
          `Call ${call.id} initiated in room ${roomId} by user ${userId}`
        );
      } catch (error) {
        console.error("Call initiation error:", error);
        socket.emit("error", { message: "Error initiating call" });
      }
    });

    /**
     * Answer a call
     */
    socket.on("call:answered", async (data) => {
      const { callId, roomId } = data;

      if (!callId || !roomId) return;

      try {
        // Update call status
        await prisma.call.update({
          where: { id: parseInt(callId) },
          data: { status: "ONGOING" },
        });

        // Add participant
        await prisma.callParticipant.create({
          data: {
            callId: parseInt(callId),
            userId,
          },
        });

        // Broadcast to room
        io.to(`room:${roomId}`).emit("call:answered", {
          callId: parseInt(callId),
          answeredBy: userId,
          roomId,
        });

        console.log(`Call ${callId} answered by user ${userId}`);
      } catch (error) {
        console.error("Call answer error:", error);
        socket.emit("error", { message: "Error answering call" });
      }
    });

    /**
     * End a call
     */
    socket.on("call:ended", async (data) => {
      const { callId, roomId } = data;

      if (!callId || !roomId) return;

      try {
        // Update call status
        const call = await prisma.call.update({
          where: { id: parseInt(callId) },
          data: {
            status: "ENDED",
            endedAt: new Date(),
          },
        });

        // Calculate duration
        if (call.startedAt) {
          const duration = Math.floor((new Date() - call.startedAt) / 1000);
          await prisma.call.update({
            where: { id: parseInt(callId) },
            data: { duration },
          });
        }

        // Broadcast to room
        io.to(`room:${roomId}`).emit("call:ended", {
          callId: parseInt(callId),
          endedBy: userId,
          roomId,
        });

        console.log(`Call ${callId} ended by user ${userId}`);
      } catch (error) {
        console.error("Call end error:", error);
        socket.emit("error", { message: "Error ending call" });
      }
    });

    // ==================== DISCONNECT ====================

    socket.on("disconnect", () => {
      console.log(`User ${userId} disconnected: ${socket.id}`);
      userSessions.delete(userId);

      // Clear any typing timeouts for this user
      typingTimeouts.forEach((timeout, key) => {
        if (key.startsWith(`${userId}-`)) {
          clearTimeout(timeout);
          typingTimeouts.delete(key);
        }
      });

      // Broadcast user is offline
      io.emit("user:offline", {
        userId,
        timestamp: new Date(),
      });

      console.log(`User ${userId} disconnected`);
    });
  });
}

function updateLastSeen(userId) {
  prisma.user
    .update({
      where: { id: userId },
      data: { lastSeenAt: new Date() },
    })
    .catch(console.error);
}

export function getIo() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}
