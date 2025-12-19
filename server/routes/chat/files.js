import express from "express";
import {
  getChatRoomFiles,
  getChatRoomFileStats,
} from "../../services/main/chat/chatFileServices.js";
import { getCurrentUser } from "../../services/main/utility/utility.js";

const router = express.Router();

// GET /shared/chat/rooms/:roomId/files - Get all files in room
router.get("/:roomId/files", async (req, res) => {
  try {
    const user = await getCurrentUser(req, res);
    const userId = user.id;
    const { roomId } = req.params;
    const { page, limit, sort, type, search, from, to } = req.query;

    const result = await getChatRoomFiles({
      roomId,
      userId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      sort: sort || "newest",
      type: type || null,
      search: search || "",
      from: from || null,
      to: to || null,
    });

    res.json({ status: 200, ...result });
  } catch (error) {
    console.error("Get chat room files error:", error);
    const statusCode = error.message?.includes("access") ? 403 : 500;
    res.status(statusCode).json({
      status: statusCode,
      message: error.message || "Error fetching chat room files",
    });
  }
});

// GET /shared/chat/rooms/:roomId/files/stats - Get file statistics
router.get("/:roomId/files/stats", async (req, res) => {
  try {
    const user = await getCurrentUser(req, res);
    const userId = user.id;
    const { roomId } = req.params;

    const stats = await getChatRoomFileStats({ roomId, userId });

    res.json({ status: 200, data: stats });
  } catch (error) {
    console.error("Get chat room file stats error:", error);
    const statusCode = error.message?.includes("access") ? 403 : 500;
    res.status(statusCode).json({
      status: statusCode,
      message: error.message || "Error fetching file statistics",
    });
  }
});

export default router;
