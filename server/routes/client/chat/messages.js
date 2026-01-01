import express from "express";
import {
  getMessagePageByMessageId,
  getMessages,
  getPinnedMessages,
} from "../../../services/main/chat/chatMessageServices.js";

const router = express.Router();

// GET /client/chat/rooms/:roomId/messages

router.get("/:roomId/messages", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page, limit, clientId } = req.query;

    const result = await getMessages({
      roomId,
      clientId,
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

      clientId: req.query.clientId,
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
    const { roomId } = req.params;

    const data = await getPinnedMessages({
      roomId,
      clientId: req.query.clientId,
    });

    res.json({ status: 200, data });
  } catch (error) {
    console.error("Get pinned messages error:", error);
    res.status(500).json({
      status: 500,
      message: error.message || "Error fetching pinned messages",
    });
  }
});

export default router;
