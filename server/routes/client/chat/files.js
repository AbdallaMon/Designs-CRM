import express from "express";
import { getChatRoomFiles } from "../../../services/main/chat/chatFileServices.js";

const router = express.Router();

// GET /shared/chat/rooms/:roomId/files - Get all files in room
router.get("/:roomId/files", async (req, res) => {
  try {
    const { roomId } = req.params;
    const {
      page,
      limit,
      sort,
      type,
      search,
      from,
      to,
      uniqueMonths,
      clientId,
    } = req.query;

    const result = await getChatRoomFiles({
      roomId,
      page: page ? parseInt(page, 10) : 0,
      limit: limit ? parseInt(limit, 10) : 20,
      sort: sort || "newest",
      type: type || null,
      search: search || "",
      from: from || null,
      to: to || null,
      uniqueMonthsString: uniqueMonths,
      clientId,
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

export default router;
