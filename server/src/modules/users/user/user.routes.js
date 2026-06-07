// users/user routes — the authenticated user surface, mounted under `/v2/users`
// (legacy routers stay mounted in parallel during the strangler window). Auth once at
// the router; each route declares its permission code(s); the self-profile `/:userId/
// profile` routes ALSO carry the object-scope checker (requireSpecialChecker) — this is
// the IDOR fix the legacy `/shared/users/:userId/profile` routes lacked.
//
// THREE legacy surfaces are merged here, each with its OWN gate (verified against the
// legacy `verifyTokenAndHandleAuthorization` modes):
//   - DIRECTORY  (legacy `/shared/all-chat-users`, `/shared/all-related-chat-users`,
//                 gate "SHARED" → any authed role) → P.DIRECTORY (all authed roles).
//   - MANAGEMENT (legacy `/admin/users*`, gate "ADMIN" → ADMIN/SUPER_ADMIN/isSuperSales/
//                 admin sub-role) → per-action management codes (admin-tier only).
//   - PROFILE    (legacy `/shared/users/:userId/profile`, gate "SHARED") → P.PROFILE_*
//                 (all authed roles) + the self-OR-admin scope checker (IDOR fix).
//
// ROUTE ORDER: literal paths are declared BEFORE the `/:userId` catch-all so they are
// not shadowed (Express matches in declaration order). NOTE: validate(..,"params") runs
// AT MOST ONCE per route — the middleware replaces req.params with the parsed object, so
// a second params-validate would strip the first.
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
  asyncHandler(userController.directory),
);
router.get(
  "/related-chat-directory",
  AuthMiddleware.requirePermissions([P.DIRECTORY]),
  asyncHandler(userController.relatedChatDirectory),
);

// ── admin management lists (literal before /:userId) ─────────────────────────────
router.get(
  "/all-users",
  AuthMiddleware.requirePermissions([P.LIST]),
  asyncHandler(userController.allUsers),
);
router.get(
  "/",
  AuthMiddleware.requirePermissions([P.LIST]),
  asyncHandler(userController.list),
);
router.post(
  "/",
  AuthMiddleware.requirePermissions([P.CREATE]),
  validate(UserValidation.createUser),
  asyncHandler(userController.create),
);

// ── max-leads (legacy literal-prefixed `/max-leads/:userId`) ─────────────────────
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
router.put(
  "/:userId/roles",
  AuthMiddleware.requirePermissions([P.MANAGE_ROLES]),
  validate(UserValidation.userIdParams, "params"),
  validate(UserValidation.manageRoles),
  asyncHandler(userController.manageRoles),
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
router.patch(
  "/:userId/staff-extra",
  AuthMiddleware.requirePermissions([P.MANAGE_STAFF_EXTRA]),
  validate(UserValidation.userIdParams, "params"),
  validate(UserValidation.staffExtra),
  asyncHandler(userController.staffExtra),
);

// ── admin user CRUD by id (declared LAST so the sub-resource literals above win) ──
router.put(
  "/:userId",
  AuthMiddleware.requirePermissions([P.UPDATE]),
  validate(UserValidation.userIdParams, "params"),
  validate(UserValidation.updateUser),
  asyncHandler(userController.update),
);
router.patch(
  "/:userId",
  AuthMiddleware.requirePermissions([P.UPDATE]),
  validate(UserValidation.userIdParams, "params"),
  validate(UserValidation.changeStatus),
  asyncHandler(userController.changeStatus),
);

export { router as userRouter };
