// Authenticated user API mounted under /v2/users. Every route has a permission code;
// profile routes additionally enforce object scope. Literal paths precede /:userId.
import { Router } from "express";
import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { PERMISSIONS } from "@dms/shared";
import { userController } from "./user.controller.js";
import { UserValidation } from "./user.validation.js";

const P = PERMISSIONS.USER;
const router = Router();

router.use(AuthMiddleware.requireAuth);

// ── directory pick-lists (broad authed surface; the chat module consumes these) ──
router.get(
  "/directory",
  AuthMiddleware.requirePermissions([P.DIRECTORY]),
  asyncHandler(userController.getDirectory),
);
router.get(
  "/related-chat-directory",
  AuthMiddleware.requirePermissions([P.DIRECTORY]),
  asyncHandler(userController.getRelatedChatDirectory),
);
// The server applies admin/profile directory scope from req.auth.
router.get(
  "/chat-directory",
  AuthMiddleware.requirePermissions([P.DIRECTORY]),
  asyncHandler(userController.getChatDirectory),
);

// ── admin management lists (literal before /:userId) ─────────────────────────────
router.get(
  "/all-users",
  AuthMiddleware.requirePermissions([P.LIST]),
  asyncHandler(userController.getAllUsers),
);
// assignable permission profiles for the admin picker (literal — before /:userId)
router.get(
  "/assignable-profiles",
  AuthMiddleware.requirePermissions([P.MANAGE_PROFILES]),
  asyncHandler(userController.listProfiles),
);
router.get(
  "/",
  AuthMiddleware.requirePermissions([P.LIST]),
  asyncHandler(userController.getUsers),
);
router.post(
  "/",
  AuthMiddleware.requirePermissions([P.CREATE]),
  validate(UserValidation.createUser),
  asyncHandler(userController.createUser),
);

// ── max leads ────────────────────────────────────────────────────────────────────
router.put(
  "/max-leads/:userId",
  AuthMiddleware.requirePermissions([P.SET_MAX_LEADS]),
  validate(UserValidation.userIdParams, "params"),
  validate(UserValidation.maxLeads),
  asyncHandler(userController.setMaxLeads),
);
router.put(
  "/max-leads-per-day/:userId",
  AuthMiddleware.requirePermissions([P.SET_MAX_LEADS]),
  validate(UserValidation.userIdParams, "params"),
  validate(UserValidation.maxLeadsPerDay),
  asyncHandler(userController.setMaxLeadsPerDay),
);

// ── self / admin profile (object-scope checked: self OR admin-tier — IDOR fix) ───
router.get(
  "/:userId/profile",
  AuthMiddleware.requirePermissions([P.PROFILE_VIEW]),
  validate(UserValidation.userIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(userController.checkIfUserCanAccessProfile),
  asyncHandler(userController.getProfile),
);
router.put(
  "/:userId/profile",
  AuthMiddleware.requirePermissions([P.PROFILE_EDIT]),
  validate(UserValidation.userIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(userController.checkIfUserCanMutateProfile),
  validate(UserValidation.updateProfile),
  asyncHandler(userController.updateProfile),
);

// ── admin user-management sub-resources (all admin-tier codes) ───────────────────
router.get(
  "/:userId/last-seen",
  AuthMiddleware.requirePermissions([P.VIEW_LAST_SEEN]),
  validate(UserValidation.userIdParams, "params"),
  asyncHandler(userController.getLastSeen),
);
router.get(
  "/:userId/logs",
  AuthMiddleware.requirePermissions([P.VIEW_LOGS]),
  validate(UserValidation.userIdParams, "params"),
  asyncHandler(userController.getLogs),
);
router.get(
  "/:userId/restricted-countries",
  AuthMiddleware.requirePermissions([P.MANAGE_RESTRICTED_COUNTRIES]),
  validate(UserValidation.userIdParams, "params"),
  asyncHandler(userController.getRestrictedCountries),
);
router.post(
  "/:userId/restricted-countries",
  AuthMiddleware.requirePermissions([P.MANAGE_RESTRICTED_COUNTRIES]),
  validate(UserValidation.userIdParams, "params"),
  validate(UserValidation.restrictedCountries),
  asyncHandler(userController.updateRestrictedCountries),
);
// Admin assigns the user's permission profiles and active profile.
router.put(
  "/:userId/profiles",
  AuthMiddleware.requirePermissions([P.MANAGE_PROFILES]),
  validate(UserValidation.userIdParams, "params"),
  validate(UserValidation.updateUserProfiles),
  asyncHandler(userController.updateProfiles),
);
router.get(
  "/:userId/auto-assignments",
  AuthMiddleware.requirePermissions([P.MANAGE_AUTO_ASSIGNMENTS]),
  validate(UserValidation.userIdParams, "params"),
  asyncHandler(userController.getAutoAssignments),
);
router.put(
  "/:userId/auto-assignments",
  AuthMiddleware.requirePermissions([P.MANAGE_AUTO_ASSIGNMENTS]),
  validate(UserValidation.userIdParams, "params"),
  validate(UserValidation.manageAutoAssignments),
  asyncHandler(userController.updateAutoAssignments),
);
// Status change is a workflow transition → dedicated action endpoint (not a generic PATCH).
router.post(
  "/:userId/actions/change-status",
  AuthMiddleware.requirePermissions([P.UPDATE]),
  validate(UserValidation.userIdParams, "params"),
  validate(UserValidation.changeStatus),
  asyncHandler(userController.changeStatus),
);

// ── admin user CRUD by id (declared LAST so the sub-resource literals above win) ──
router.put(
  "/:userId",
  AuthMiddleware.requirePermissions([P.UPDATE]),
  validate(UserValidation.userIdParams, "params"),
  validate(UserValidation.updateUser),
  asyncHandler(userController.updateUser),
);

export { router as userRouter };
