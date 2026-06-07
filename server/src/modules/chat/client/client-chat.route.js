// chat/client routes — the PUBLIC client-chat surface. Legacy:
//   routes/client/chat/rooms.js     (mounted /client/chat/rooms)
//   routes/client/chat/messages.js  (mounted /client/chat)
//   routes/client/chat/members.js   (mounted /client/chat/rooms)
//   routes/client/chat/files.js     (mounted /client/chat/rooms)
// all wired in routes/clients/clients.js, which has NO router-level auth — each
// client route authenticates the client by its own means (here a per-room token,
// ChatRoom.chatAccessToken). Mounted under v2 at `/v2/client/chat`.
//
// PUBLIC BY DESIGN — NO `requireAuth`, NO `requirePermissions`, NO permission code.
// Every endpoint is token-based exactly like the booking funnel, /files/client/*,
// and the client calendar/contracts/image-session surfaces. Gating these would
// break the public client chat (a client has no session). The token is verified
// inside the usecase (resolveRoom), which derives the room + client member FROM the
// token and REJECTS any `:roomId` that differs from the token's room (IDOR close).
//
// PATHS preserved 1:1 vs legacy (sub-paths mirrored under /v2/client/chat):
//   GET /rooms/validate-token              GET /rooms/:roomId
//   GET /rooms/:roomId/members             GET /rooms/:roomId/files
//   GET /:roomId/messages                  GET /:roomId/messages/:messageId/page
//   GET /:roomId/pinned-messages
import { Router } from "express";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { clientChatController } from "./client-chat.controller.js";
import { ClientChatValidation } from "./client-chat.validation.js";

const router = Router();

// ── Rooms (legacy /client/chat/rooms) ─────────────────────────────────────────
// `/rooms/validate-token` MUST be declared before `/rooms/:roomId` so the literal
// sub-path wins over the param route.
router.get(
  "/rooms/validate-token",
  validate(ClientChatValidation.validateToken, "query"),
  asyncHandler(clientChatController.validateToken),
);
router.get(
  "/rooms/:roomId",
  validate(ClientChatValidation.roomIdParams, "params"),
  validate(ClientChatValidation.tokenQuery, "query"),
  asyncHandler(clientChatController.getRoom),
);

// ── Members + files (legacy /client/chat/rooms) ───────────────────────────────
router.get(
  "/rooms/:roomId/members",
  validate(ClientChatValidation.roomIdParams, "params"),
  validate(ClientChatValidation.tokenQuery, "query"),
  asyncHandler(clientChatController.getMembers),
);
router.get(
  "/rooms/:roomId/files",
  validate(ClientChatValidation.roomIdParams, "params"),
  validate(ClientChatValidation.filesQuery, "query"),
  asyncHandler(clientChatController.getFiles),
);

// ── Messages (legacy /client/chat) ────────────────────────────────────────────
// `/:roomId/messages/:messageId/page` MUST be declared before `/:roomId/messages`
// so the deeper literal route is matched.
router.get(
  "/:roomId/messages/:messageId/page",
  validate(ClientChatValidation.messageIdParams, "params"),
  validate(ClientChatValidation.messagePageQuery, "query"),
  asyncHandler(clientChatController.getMessagePage),
);
router.get(
  "/:roomId/messages",
  validate(ClientChatValidation.roomIdParams, "params"),
  validate(ClientChatValidation.messagesQuery, "query"),
  asyncHandler(clientChatController.getMessages),
);
router.get(
  "/:roomId/pinned-messages",
  validate(ClientChatValidation.roomIdParams, "params"),
  validate(ClientChatValidation.tokenQuery, "query"),
  asyncHandler(clientChatController.getPinnedMessages),
);

export { router as clientChatRouter };
