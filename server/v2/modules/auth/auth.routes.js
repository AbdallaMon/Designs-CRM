import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { authSchemas } from "./auth.validation.js";

const router = Router();

// POST /auth/login
router.post(
  "/login",
  validate(authSchemas.login),
  asyncHandler(AuthController.login),
);

export default router;
