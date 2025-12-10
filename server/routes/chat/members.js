import express from "express";
import {
  addMembersToRoom,
  removeMemberFromRoom,
  updateMemberRole,
  getRoomMembers,
} from "../../services/main/chat/chatMemberServices.js";
import { getCurrentUser } from "../../services/main/utility/utility.js";

const router = express.Router();

// GET /shared/chat/rooms/:roomId/members
router.get("/:roomId/members", async (req, res) => {
  try {
    const user = await getCurrentUser(req, res);
    const userId = user.id;
    const { roomId } = req.params;

    const members = await getRoomMembers({ roomId, userId });

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

// POST /shared/chat/rooms/:roomId/members
router.post("/:roomId/members", async (req, res) => {
  try {
    const user = await getCurrentUser(req, res);
    const userId = user.id;
    const { roomId } = req.params;
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res
        .status(400)
        .json({ status: 400, message: "userIds array is required" });
    }

    const room = await addMembersToRoom({ roomId, userId, userIds });

    res.json({ status: 200, data: room });
  } catch (error) {
    console.error("Add members error:", error);
    const statusCode = error.message?.includes("permission") ? 403 : 500;
    res.status(statusCode).json({
      status: statusCode,
      message: error.message || "Error adding members",
    });
  }
});

// DELETE /shared/chat/rooms/:roomId/members/:memberId
router.delete("/:roomId/members/:memberId", async (req, res) => {
  try {
    const user = await getCurrentUser(req, res);
    const userId = user.id;
    const { roomId, memberId } = req.params;

    const result = await removeMemberFromRoom({ roomId, userId, memberId });

    res.json({ status: 200, ...result });
  } catch (error) {
    console.error("Remove member error:", error);
    const statusCode = error.message?.includes("permission") ? 403 : 500;
    res.status(statusCode).json({
      status: statusCode,
      message: error.message || "Error removing member",
    });
  }
});

// PUT /shared/chat/rooms/:roomId/members/:memberId
router.put("/:roomId/members/:memberId", async (req, res) => {
  try {
    const user = await getCurrentUser(req, res);
    const userId = user.id;
    const { roomId, memberId } = req.params;
    const { role } = req.body;

    if (!role)
      return res.status(400).json({ status: 400, message: "Role is required" });

    const member = await updateMemberRole({ roomId, userId, memberId, role });

    res.json({ status: 200, data: member });
  } catch (error) {
    console.error("Update member role error:", error);
    const statusCode = error.message?.includes("permission") ? 403 : 500;
    res.status(statusCode).json({
      status: statusCode,
      message: error.message || "Error updating member role",
    });
  }
});

export default router;
