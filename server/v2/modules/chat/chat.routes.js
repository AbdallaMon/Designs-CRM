import { Router } from "express";
import { ChatController } from "./chat.controller.js";
import { AuthMiddleware } from "../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
// Reuse the same instances created by the socket layer to avoid duplicate repository objects
import { chatUsecase } from "./chat.socket.js";

// ── Wire up the dependency chain ─────────────────────────────────────────────
const chatController = new ChatController(chatUsecase);

const chatRouter = Router();

// All chat routes require authentication
chatRouter.use(AuthMiddleware.requireAuth);

// ── Rooms ────────────────────────────────────────────────────────────────────
chatRouter.get("/rooms", asyncHandler(chatController.getRooms));
chatRouter.get("/rooms/:roomId", asyncHandler(chatController.getRoomById));
chatRouter.post("/rooms", asyncHandler(chatController.createRoom));
chatRouter.post(
  "/rooms/create-chat",
  asyncHandler(chatController.createDirectChat),
);
chatRouter.post(
  "/rooms/lead-rooms",
  asyncHandler(chatController.createLeadsRoom),
);
chatRouter.put("/rooms/:roomId", asyncHandler(chatController.updateRoom));
chatRouter.put(
  "/rooms/:roomId/update-room-settings",
  asyncHandler(chatController.updateRoom),
);
chatRouter.delete("/rooms/:roomId", asyncHandler(chatController.deleteRoom));
chatRouter.post(
  "/rooms/:roomId/manageClient",
  asyncHandler(chatController.manageClient),
);
chatRouter.post(
  "/rooms/:roomId/regenerateToken",
  asyncHandler(chatController.regenerateToken),
);

// ── Messages ─────────────────────────────────────────────────────────────────
chatRouter.get(
  "/rooms/:roomId/messages",
  asyncHandler(chatController.getMessages),
);
chatRouter.get(
  "/rooms/:roomId/messages/:messageId/page",
  asyncHandler(chatController.getMessagePage),
);
chatRouter.get(
  "/rooms/:roomId/pinned-messages",
  asyncHandler(chatController.getPinnedMessages),
);
chatRouter.post("/rooms/read-all", asyncHandler(chatController.markAllRead));
chatRouter.post(
  "/rooms/:roomId/read",
  asyncHandler(chatController.markRoomRead),
);
chatRouter.post(
  "/messages/:messageId/reactions",
  asyncHandler(chatController.addReaction),
);
chatRouter.delete(
  "/messages/:messageId/reactions/:emoji",
  asyncHandler(chatController.removeReaction),
);

// ── Members ──────────────────────────────────────────────────────────────────
chatRouter.get(
  "/rooms/:roomId/members",
  asyncHandler(chatController.getMembers),
);
chatRouter.post(
  "/rooms/:roomId/members",
  asyncHandler(chatController.addMembers),
);
chatRouter.delete(
  "/rooms/:roomId/members/:memberId",
  asyncHandler(chatController.removeMember),
);
chatRouter.put(
  "/rooms/:roomId/members/:memberId",
  asyncHandler(chatController.updateMemberRole),
);

// ── Files ─────────────────────────────────────────────────────────────────────
chatRouter.get("/rooms/:roomId/files", asyncHandler(chatController.getFiles));
chatRouter.get(
  "/rooms/:roomId/files/stats",
  asyncHandler(chatController.getFileStats),
);

export { chatRouter };
