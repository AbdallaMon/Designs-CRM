import express from "express";
import {
  getChatRoomById,
  verifyRoomAccessUsingtoken,
} from "../../../services/main/chat/chatRoomServices.js";

const router = express.Router();

// GET /shared/chat/rooms/:roomId - room details
router.get("/validate-token", async (req, res) => {
  try {
    const { token } = req.query;
    const roomData = await verifyRoomAccessUsingtoken(token);
    if (!roomData)
      return res
        .status(404)
        .json({ status: 404, message: "Chat room not found" });
    res.json({
      status: 200,
      data: { ...roomData, isValid: true },
    });
  } catch (error) {
    console.error("Get chat room error:", error);
    const statusCode = error.message?.includes("access") ? 403 : 500;
    res.status(statusCode).json({
      status: statusCode,
      message: error.message || "Error fetching chat room",
    });
  }
});
router.get("/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { clientId } = req.query;
    const room = await getChatRoomById(roomId, null, clientId);
    if (!room)
      return res
        .status(404)
        .json({ status: 404, message: "Chat room not found" });

    res.json({ status: 200, data: room });
  } catch (error) {
    console.error("Get chat room error:", error);
    const statusCode = error.message?.includes("access") ? 403 : 500;
    res.status(statusCode).json({
      status: statusCode,
      message: error.message || "Error fetching chat room",
    });
  }
});

export default router;
