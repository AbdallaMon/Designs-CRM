import express from "express";
import { getRoomMembers } from "../../../services/main/chat/chatMemberServices.js";

const router = express.Router();

// GET /shared/chat/rooms/:roomId/members
router.get("/:roomId/members", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { clientId } = req.query;

    const members = await getRoomMembers({ roomId, clientId });

    res.json({ status: 200, data: members });
  } catch (error) {
    console.error("Get room members error:", error);
    const statusCode = error.message?.includes("access") ? 403 : 500;
    res.status(statusCode).json({
      status: statusCode,
      message: error.message || "Error fetching room members",
    });
  }
});

export default router;
