import express from "express";
import {
  getChatRooms,
  createChatRoom,
  updateChatRoom,
  deleteChatRoom,
  getChatRoomById,
  checkIfChatAlreadyExists,
} from "../../services/main/chat/chatRoomServices.js";
import { getCurrentUser } from "../../services/main/utility/utility.js";

const router = express.Router();

// GET /shared/chat/rooms - list rooms
router.get("/", async (req, res) => {
  try {
    const user = await getCurrentUser(req, res);
    const userId = user.id;
    const {
      category,
      projectId,
      clientLeadId,
      page,
      limit,
      searchKey,
      chatType,
    } = req.query;
    const result = await getChatRooms({
      userId,
      category,
      projectId,
      clientLeadId,
      page: page ? parseInt(page, 10) : 0,
      limit: limit ? parseInt(limit, 10) : 25,
      search: searchKey ? searchKey : "",
      chatType: chatType ? chatType : null,
    });

    res.json({ status: 200, ...result });
  } catch (error) {
    console.error("Get chat rooms error:", error);
    res.status(500).json({
      status: 500,
      message: error.message || "Error fetching chat rooms",
    });
  }
});

// GET /shared/chat/rooms/:roomId - room details
router.get("/:roomId", async (req, res) => {
  try {
    const user = await getCurrentUser(req, res);
    const userId = user.id;
    const { roomId } = req.params;

    const room = await getChatRoomById(roomId, userId);
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

// POST /shared/chat/rooms - create room
router.post("/", async (req, res) => {
  try {
    const user = await getCurrentUser(req, res);
    const userId = user.id;
    const {
      name,
      type,
      projectId,
      clientLeadId,
      projectIds,
      userIds,
      allowFiles,
      allowCalls,
      isChatEnabled,
    } = req.body;

    if (!type)
      return res
        .status(400)
        .json({ status: 400, message: "Room type is required" });

    const room = await createChatRoom({
      name,
      type,
      projectId,
      clientLeadId,
      projectIds,
      userIds,
      createdById: userId,
      allowFiles,
      allowCalls,
      isChatEnabled,
    });

    res.status(200).json({ status: 200, data: room });
  } catch (error) {
    console.error("Create chat room error:", error);
    res.status(500).json({
      status: 500,
      message: error.message || "Error creating chat room",
    });
  }
});
router.post("/create-chat", async (req, res) => {
  try {
    const user = await getCurrentUser(req, res);
    const userId = user.id;

    const name = "Staff to Staff Chat";
    const participantId = Number(req.body.participantId);
    const userIds = [participantId];
    const existingRoom = await checkIfChatAlreadyExists({
      userId: Number(userId),
      otherUserId: participantId,
    });
    if (existingRoom) {
      return res.status(200).json({ status: 200, data: existingRoom });
    }
    const room = await createChatRoom({
      name,
      type: "STAFF_TO_STAFF",
      userIds,
      createdById: userId,
      allowFiles: true,
      allowCalls: true,
      isChatEnabled: true,
    });

    res.status(200).json({ status: 200, data: room });
  } catch (error) {
    console.error("Create chat room error:", error);
    res.status(500).json({
      status: 500,
      message: error.message || "Error creating chat room",
    });
  }
});

// PUT /shared/chat/rooms/:roomId - update room
router.put("/:roomId", async (req, res) => {
  try {
    const user = await getCurrentUser(req, res);
    const userId = user.id;
    const { roomId } = req.params;
    const updates = req.body;

    const room = await updateChatRoom(roomId, userId, updates);

    res.json({ status: 200, data: room });
  } catch (error) {
    console.error("Update chat room error:", error);
    const statusCode = error.message?.includes("permission") ? 403 : 500;
    res.status(statusCode).json({
      status: statusCode,
      message: error.message || "Error updating chat room",
    });
  }
});

// DELETE /shared/chat/rooms/:roomId - delete room
router.delete("/:roomId", async (req, res) => {
  try {
    const user = await getCurrentUser(req, res);
    const userId = user.id;
    const { roomId } = req.params;

    const result = await deleteChatRoom(roomId, userId);

    res.json({ status: 200, ...result });
  } catch (error) {
    console.error("Delete chat room error:", error);
    const statusCode = error.message?.includes("permission") ? 403 : 500;
    res.status(statusCode).json({
      status: statusCode,
      message: error.message || "Error deleting chat room",
    });
  }
});

export default router;
