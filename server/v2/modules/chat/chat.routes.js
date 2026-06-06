import { Router } from "express";
import { ChatController } from "./chat.controller.js";
import { AuthMiddleware } from "../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { chatSchemas } from "./chat.validation.js";
// Reuse the same instances created by the socket layer to avoid duplicate repository objects
import { chatUsecase } from "./chat.socket.js";

// ── Wire up the dependency chain ─────────────────────────────────────────────
const chatController = new ChatController(chatUsecase);

const chatRouter = Router();

// All chat routes require authentication
chatRouter.use(AuthMiddleware.requireAuth);

// ── Rooms ────────────────────────────────────────────────────────────────────
chatRouter.get(
  "/rooms",
  validate(chatSchemas.getRooms, "query"),
  asyncHandler(chatController.getRooms),
);
chatRouter.get(
  "/rooms/:roomId",
  validate(chatSchemas.roomIdParams, "params"),
  asyncHandler(chatController.getRoomById),
);
chatRouter.post(
  "/rooms",
  validate(chatSchemas.createRoom),
  asyncHandler(chatController.createRoom),
);
chatRouter.post(
  "/rooms/create-chat",
  validate(chatSchemas.createDirectChat),
  asyncHandler(chatController.createDirectChat),
);
chatRouter.post(
  "/rooms/lead-rooms",
  validate(chatSchemas.createLeadsRoom),
  asyncHandler(chatController.createLeadsRoom),
);
chatRouter.put(
  "/rooms/:roomId",
  validate(chatSchemas.roomIdParams, "params"),
  validate(chatSchemas.updateRoom),
  asyncHandler(chatController.updateRoom),
);
chatRouter.put(
  "/rooms/:roomId/update-room-settings",
  validate(chatSchemas.roomIdParams, "params"),
  validate(chatSchemas.updateRoom),
  asyncHandler(chatController.updateRoom),
);
chatRouter.delete(
  "/rooms/:roomId",
  validate(chatSchemas.roomIdParams, "params"),
  asyncHandler(chatController.deleteRoom),
);
chatRouter.post(
  "/rooms/:roomId/manageClient",
  validate(chatSchemas.roomIdParams, "params"),
  validate(chatSchemas.manageClient),
  asyncHandler(chatController.manageClient),
);
chatRouter.post(
  "/rooms/:roomId/regenerateToken",
  validate(chatSchemas.roomIdParams, "params"),
  asyncHandler(chatController.regenerateToken),
);

// ── Messages ─────────────────────────────────────────────────────────────────
chatRouter.get(
  "/rooms/:roomId/messages",
  validate(chatSchemas.roomIdParams, "params"),
  validate(chatSchemas.getMessages, "query"),
  asyncHandler(chatController.getMessages),
);
chatRouter.get(
  "/rooms/:roomId/messages/:messageId/page",
  validate(chatSchemas.messageIdParams, "params"),
  validate(chatSchemas.getMessagePage, "query"),
  asyncHandler(chatController.getMessagePage),
);
chatRouter.get(
  "/rooms/:roomId/pinned-messages",
  validate(chatSchemas.roomIdParams, "params"),
  asyncHandler(chatController.getPinnedMessages),
);
chatRouter.post(
  "/rooms/read-all",
  validate(chatSchemas.markAllRead),
  asyncHandler(chatController.markAllRead),
);
chatRouter.post(
  "/rooms/:roomId/read",
  validate(chatSchemas.roomIdParams, "params"),
  validate(chatSchemas.markRead),
  asyncHandler(chatController.markRoomRead),
);
chatRouter.post(
  "/messages/:messageId/reactions",
  validate(chatSchemas.messageIdParams, "params"),
  validate(chatSchemas.addReaction),
  asyncHandler(chatController.addReaction),
);
chatRouter.delete(
  "/messages/:messageId/reactions/:emoji",
  validate(chatSchemas.reactionParams, "params"),
  asyncHandler(chatController.removeReaction),
);

// ── Members ──────────────────────────────────────────────────────────────────
chatRouter.get(
  "/rooms/:roomId/members",
  validate(chatSchemas.roomIdParams, "params"),
  asyncHandler(chatController.getMembers),
);
chatRouter.post(
  "/rooms/:roomId/members",
  validate(chatSchemas.roomIdParams, "params"),
  validate(chatSchemas.addMembers),
  asyncHandler(chatController.addMembers),
);
chatRouter.delete(
  "/rooms/:roomId/members/:memberId",
  validate(chatSchemas.roomIdParams, "params"),
  validate(chatSchemas.memberIdParams, "params"),
  asyncHandler(chatController.removeMember),
);
chatRouter.put(
  "/rooms/:roomId/members/:memberId",
  validate(chatSchemas.roomIdParams, "params"),
  validate(chatSchemas.memberIdParams, "params"),
  validate(chatSchemas.updateMemberRole),
  asyncHandler(chatController.updateMemberRole),
);

// ── Files ─────────────────────────────────────────────────────────────────────
chatRouter.get(
  "/rooms/:roomId/files",
  validate(chatSchemas.roomIdParams, "params"),
  validate(chatSchemas.getFiles, "query"),
  asyncHandler(chatController.getFiles),
);
chatRouter.get(
  "/rooms/:roomId/files/stats",
  validate(chatSchemas.roomIdParams, "params"),
  asyncHandler(chatController.getFileStats),
);

export { chatRouter };
