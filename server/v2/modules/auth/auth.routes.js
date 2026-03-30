import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { authSchemas } from "./auth.validation.js";
import { AuthRateLimit } from "./auth.middleware.js";
import { AuthMiddleware } from "../../shared/middlewares/auth.middleware.js";

const router = Router();

// POST /auth/login
router.post(
  "/login",
  AuthRateLimit.loginLimiter,
  validate(authSchemas.login),
  asyncHandler(AuthController.login),
);

router.post("/refresh", asyncHandler(AuthController.refresh));
router.get(
  "/me",
  AuthMiddleware.requireAuth,
  asyncHandler(AuthController.getCurrentUser),
);
router.post(
  "/logout",
  AuthMiddleware.requireAuth,
  asyncHandler(AuthController.logout),
);

router.post(
  "/request-password-reset",
  AuthRateLimit.forgotPasswordLimiter,
  validate(authSchemas.requestReset),
  asyncHandler(AuthController.requestPasswordReset),
);
router.post(
  "/reset-password",
  validate(authSchemas.resetPassword),
  asyncHandler(AuthController.resetPassword),
);
export default router;
