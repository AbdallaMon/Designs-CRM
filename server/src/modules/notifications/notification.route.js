// notifications routes — the SELF-SCOPED notification surface. Mounted under
// `/v2/notifications`. Authentication is mounted ONCE here (the legacy
// `/utility/notification/*` endpoints were UNAUTHENTICATED — this is the security fix);
// each route declares its NOTIFICATION.* permission code (granted to every authed role
// via SHARED_AUTHED). The subject user is ALWAYS req.auth.id — no route accepts a
// client-supplied target userId (the IDOR fix).
//
// Endpoint map (legacy → v2):
//   GET  /utility/notification/unread (UNAUTH, client userId)
//                                       → GET  /v2/notifications/unread   (auth, self)
//   GET  /shared/utilities/notifications (SHARED, client userId)
//                                       → GET  /v2/notifications          (auth, self)
//   POST /utility/notification/users/:userId (UNAUTH, ANY userId)
//                                       → POST /v2/notifications/actions/mark-read (auth, self)
import { Router } from "express";
import { AuthMiddleware } from "../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { PERMISSIONS } from "@dms/shared";
import { notificationController } from "./notification.controller.js";
import { NotificationValidation } from "./notification.validation.js";

const P = PERMISSIONS.NOTIFICATION;
const router = Router();

// Authentication mounted once — the legacy notification endpoints had NO auth.
router.use(AuthMiddleware.requireAuth);

// ── reads (self-scoped) ──────────────────────────────────────────────────────────────
router.get(
  "/",
  AuthMiddleware.requirePermissions([P.LIST]),
  validate(NotificationValidation.listQuery, "query"),
  asyncHandler(notificationController.list),
);
router.get(
  "/unread",
  AuthMiddleware.requirePermissions([P.LIST]),
  validate(NotificationValidation.listQuery, "query"),
  asyncHandler(notificationController.listUnread),
);

// ── workflow action: mark own notifications read (self-scoped, no client userId) ───────
router.post(
  "/actions/mark-read",
  AuthMiddleware.requirePermissions([P.MARK_READ]),
  validate(NotificationValidation.markRead),
  asyncHandler(notificationController.markRead),
);

export { router as notificationRouter };
