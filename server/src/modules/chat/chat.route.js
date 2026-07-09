import { Router } from "express";
import { ChatController } from "./chat.controller.js";
import { AuthMiddleware } from "../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { chatSchemas } from "./chat.validation.js";
import { PERMISSIONS } from "@dms/shared";
// Reuse the same instances created by the socket layer to avoid duplicate repository objects
import { chatUsecase } from "./chat.socket.js";

// ── Wire up the dependency chain ─────────────────────────────────────────────
const chatController = new ChatController(chatUsecase);

const chatRouter = Router();

// All chat routes require authentication. Chat is available to every
// authenticated role today, so the permission codes below are granted to all
// roles in ROLE_PERMISSIONS — preserving observable behavior while expressing
// access as codes. Object-level access (which room) is enforced by the scope
// checker on object-scoped routes (see `GET /rooms/:roomId`).
const P = PERMISSIONS.CHAT;
chatRouter.use(AuthMiddleware.requireAuth);

// ── Rooms ────────────────────────────────────────────────────────────────────
chatRouter.get(
  "/rooms",
  AuthMiddleware.requirePermissions([P.ROOM_LIST]),
  validate(chatSchemas.getRooms, "query"),
  asyncHandler(chatController.getRooms),
);
chatRouter.get(
  "/rooms/:roomId",
  AuthMiddleware.requirePermissions([P.ROOM_VIEW]),
  validate(chatSchemas.roomIdParams, "params"),
  // Object-scope gate (the IDOR fix) — concrete reference example.
  AuthMiddleware.requireSpecialChecker(chatController.checkIfUserCanAccessRoom),
  asyncHandler(chatController.getRoomById),
);
chatRouter.post(
  "/rooms",
  AuthMiddleware.requirePermissions([P.ROOM_CREATE]),
  validate(chatSchemas.createRoom),
  asyncHandler(chatController.createRoom),
);
chatRouter.post(
  "/rooms/create-chat",
  AuthMiddleware.requirePermissions([P.ROOM_CREATE]),
  validate(chatSchemas.createDirectChat),
  asyncHandler(chatController.createDirectChat),
);
chatRouter.post(
  "/rooms/lead-rooms",
  AuthMiddleware.requirePermissions([P.ROOM_CREATE]),
  validate(chatSchemas.createLeadsRoom),
  asyncHandler(chatController.createLeadsRoom),
);
chatRouter.put(
  "/rooms/:roomId",
  AuthMiddleware.requirePermissions([P.ROOM_EDIT]),
  validate(chatSchemas.roomIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(chatController.checkIfUserCanAccessRoom),
  validate(chatSchemas.updateRoom),
  asyncHandler(chatController.updateRoom),
);
chatRouter.put(
  "/rooms/:roomId/update-room-settings",
  AuthMiddleware.requirePermissions([P.ROOM_EDIT]),
  validate(chatSchemas.roomIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(chatController.checkIfUserCanAccessRoom),
  validate(chatSchemas.updateRoom),
  asyncHandler(chatController.updateRoom),
);
chatRouter.delete(
  "/rooms/:roomId",
  AuthMiddleware.requirePermissions([P.ROOM_DELETE]),
  validate(chatSchemas.roomIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(chatController.checkIfUserCanAccessRoom),
  asyncHandler(chatController.deleteRoom),
);
chatRouter.post(
  "/rooms/:roomId/manageClient",
  AuthMiddleware.requirePermissions([P.MEMBER_MANAGE]),
  validate(chatSchemas.roomIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(chatController.checkIfUserCanAccessRoom),
  validate(chatSchemas.manageClient),
  asyncHandler(chatController.manageClient),
);
chatRouter.post(
  "/rooms/:roomId/regenerateToken",
  AuthMiddleware.requirePermissions([P.ROOM_EDIT]),
  validate(chatSchemas.roomIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(chatController.checkIfUserCanAccessRoom),
  asyncHandler(chatController.regenerateToken),
);

// ── Messages ─────────────────────────────────────────────────────────────────
chatRouter.get(
  "/rooms/:roomId/messages",
  AuthMiddleware.requirePermissions([P.MESSAGE_VIEW]),
  validate(chatSchemas.roomIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(chatController.checkIfUserCanAccessRoom),
  validate(chatSchemas.getMessages, "query"),
  asyncHandler(chatController.getMessages),
);
chatRouter.get(
  "/rooms/:roomId/messages/:messageId/page",
  AuthMiddleware.requirePermissions([P.MESSAGE_VIEW]),
  validate(chatSchemas.messageIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(chatController.checkIfUserCanAccessRoom),
  validate(chatSchemas.getMessagePage, "query"),
  asyncHandler(chatController.getMessagePage),
);
chatRouter.get(
  "/rooms/:roomId/pinned-messages",
  AuthMiddleware.requirePermissions([P.MESSAGE_VIEW]),
  validate(chatSchemas.roomIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(chatController.checkIfUserCanAccessRoom),
  asyncHandler(chatController.getPinnedMessages),
);
chatRouter.post(
  "/rooms/read-all",
  AuthMiddleware.requirePermissions([P.MESSAGE_SEND]),
  validate(chatSchemas.markAllRead),
  asyncHandler(chatController.markAllRead),
);
chatRouter.post(
  "/rooms/:roomId/read",
  AuthMiddleware.requirePermissions([P.MESSAGE_SEND]),
  validate(chatSchemas.roomIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(chatController.checkIfUserCanAccessRoom),
  validate(chatSchemas.markRead),
  asyncHandler(chatController.markRoomRead),
);
chatRouter.post(
  "/messages/:messageId/reactions",
  AuthMiddleware.requirePermissions([P.MESSAGE_SEND]),
  validate(chatSchemas.messageIdParams, "params"),
  validate(chatSchemas.addReaction),
  asyncHandler(chatController.addReaction),
);
chatRouter.delete(
  "/messages/:messageId/reactions/:emoji",
  AuthMiddleware.requirePermissions([P.MESSAGE_SEND]),
  validate(chatSchemas.reactionParams, "params"),
  asyncHandler(chatController.removeReaction),
);

// ── Members ──────────────────────────────────────────────────────────────────
chatRouter.get(
  "/rooms/:roomId/members",
  AuthMiddleware.requirePermissions([P.MESSAGE_VIEW]),
  validate(chatSchemas.roomIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(chatController.checkIfUserCanAccessRoom),
  asyncHandler(chatController.getMembers),
);
chatRouter.post(
  "/rooms/:roomId/members",
  AuthMiddleware.requirePermissions([P.MEMBER_MANAGE]),
  validate(chatSchemas.roomIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(chatController.checkIfUserCanAccessRoom),
  validate(chatSchemas.addMembers),
  asyncHandler(chatController.addMembers),
);
chatRouter.delete(
  "/rooms/:roomId/members/:memberId",
  AuthMiddleware.requirePermissions([P.MEMBER_MANAGE]),
  validate(chatSchemas.roomMemberParams, "params"),
  AuthMiddleware.requireSpecialChecker(chatController.checkIfUserCanAccessRoom),
  asyncHandler(chatController.removeMember),
);
chatRouter.put(
  "/rooms/:roomId/members/:memberId",
  AuthMiddleware.requirePermissions([P.MEMBER_MANAGE]),
  validate(chatSchemas.roomMemberParams, "params"),
  AuthMiddleware.requireSpecialChecker(chatController.checkIfUserCanAccessRoom),
  validate(chatSchemas.updateMemberRole),
  asyncHandler(chatController.updateMemberRole),
);

// ── Files ─────────────────────────────────────────────────────────────────────
chatRouter.get(
  "/rooms/:roomId/files",
  AuthMiddleware.requirePermissions([P.MESSAGE_VIEW]),
  validate(chatSchemas.roomIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(chatController.checkIfUserCanAccessRoom),
  validate(chatSchemas.getFiles, "query"),
  asyncHandler(chatController.getFiles),
);
chatRouter.get(
  "/rooms/:roomId/files/stats",
  AuthMiddleware.requirePermissions([P.MESSAGE_VIEW]),
  validate(chatSchemas.roomIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(chatController.checkIfUserCanAccessRoom),
  asyncHandler(chatController.getFileStats),
);

export { chatRouter };
