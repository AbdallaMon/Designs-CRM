import express from "express";
import multer from "multer";
import prisma from "../../prisma/prisma.js";
import {
  getMessages,
  markMessagesAsRead,
  addReaction,
  removeReaction,
  getMessagePageByMessageId,
  getPinnedMessages,
} from "../../services/main/chat/chatMessageServices.js";
import { getCurrentUser } from "../../services/main/utility/utility.js";

const router = express.Router();

// GET /shared/chat/rooms/:roomId/messages

router.get("/:roomId/messages", async (req, res) => {
  try {
    const user = await getCurrentUser(req, res);
    const userId = user.id;
    const { roomId } = req.params;
    const { page, limit } = req.query;

    const result = await getMessages({
      roomId,
      userId,
      page: page ? parseInt(page, 10) : 0,
      limit: limit ? parseInt(limit, 10) : 50,
    });

    res.json({ status: 200, ...result });
  } catch (error) {
    console.error("Get messages error:", error);
    const statusCode = error.message?.includes("access") ? 403 : 500;
    res.status(statusCode).json({
      status: statusCode,
      message: error.message || "Error fetching messages",
    });
  }
});

router.get("/:roomId/messages/:messageId/page", async (req, res) => {
  try {
    const { messageId } = req.params;
    const { limit } = req.query;

    const result = await getMessagePageByMessageId({
      messageId: Number(messageId),
      limit: Number(limit),
    });

    res.json({ status: 200, ...result });
  } catch (error) {
    console.error("Get messages error:", error);
    const statusCode = error.message?.includes("access") ? 403 : 500;
    res.status(statusCode).json({
      status: statusCode,
      message: error.message || "Error fetching messages",
    });
  }
});

// GET /shared/chat/:roomId/pinned-messages - list pinned messages in a room
router.get("/:roomId/pinned-messages", async (req, res) => {
  try {
    const user = await getCurrentUser(req, res);
    // userId fetched for future authorization if needed
    const { roomId } = req.params;

    const data = await getPinnedMessages({ roomId });

    res.json({ status: 200, data });
  } catch (error) {
    console.error("Get pinned messages error:", error);
    res.status(500).json({
      status: 500,
      message: error.message || "Error fetching pinned messages",
    });
  }
});

// POST /shared/chat/rooms/read-all - Mark all rooms as read
router.post("/read-all", async (req, res) => {
  try {
    const user = await getCurrentUser(req, res);
    const userId = user.id;
    const { roomIds } = req.body;

    // If roomIds provided, mark those; otherwise mark all user's rooms
    let rooms;
    if (roomIds && Array.isArray(roomIds) && roomIds.length > 0) {
      rooms = roomIds.map((id) => parseInt(id));
    } else {
      // Get all rooms for user
      const userRooms = await prisma.chatMember.findMany({
        where: {
          userId,
          leftAt: null,
        },
        select: { roomId: true },
      });
      rooms = userRooms.map((r) => r.roomId);
    }

    // Update lastReadAt for all rooms
    await prisma.chatMember.updateMany({
      where: {
        userId,
        roomId: { in: rooms },
      },
      data: { lastReadAt: new Date() },
    });

    res.json({ status: 200, message: "All rooms marked as read" });
  } catch (error) {
    console.error("Mark all as read error:", error);
    res.status(500).json({
      status: 500,
      message: error.message || "Error marking rooms as read",
    });
  }
});

// POST /shared/chat/rooms/:roomId/read
router.post("/:roomId/read", async (req, res) => {
  try {
    const user = await getCurrentUser(req, res);
    const userId = user.id;
    const { roomId } = req.params;
    const { messageId } = req.body;

    await markMessagesAsRead({ roomId, userId, messageId });

    res.json({ status: 200, message: "Messages marked as read" });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({
      status: 500,
      message: error.message || "Error marking messages as read",
    });
  }
});

// POST /shared/chat/messages/:messageId/reactions
router.post("/messages/:messageId/reactions", async (req, res) => {
  try {
    const user = await getCurrentUser(req, res);
    const userId = user.id;
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji)
      return res
        .status(400)
        .json({ status: 400, message: "Emoji is required" });

    const reaction = await addReaction({ messageId, userId, emoji });

    res.json({ status: 200, data: reaction });
  } catch (error) {
    console.error("Add reaction error:", error);
    res
      .status(500)
      .json({ status: 500, message: error.message || "Error adding reaction" });
  }
});

// DELETE /shared/chat/messages/:messageId/reactions/:emoji
router.delete("/messages/:messageId/reactions/:emoji", async (req, res) => {
  try {
    const user = await getCurrentUser(req, res);
    const userId = user.id;
    const { messageId, emoji } = req.params;

    await removeReaction({
      messageId,
      userId,
      emoji: decodeURIComponent(emoji),
    });

    res.json({ status: 200, message: "Reaction removed" });
  } catch (error) {
    console.error("Remove reaction error:", error);
    res.status(500).json({
      status: 500,
      message: error.message || "Error removing reaction",
    });
  }
});

export default router;
