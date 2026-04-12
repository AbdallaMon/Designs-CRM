import { Router } from "express";
import { TelegramController } from "./telegram.controller.js";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";

const telegramRouter = Router();
//todo add require auth
telegramRouter.get(
  "/current",
  AuthMiddleware.requireAuth,
  AuthMiddleware.requireRole(["ADMIN"]),
  asyncHandler(TelegramController.getCurrentTelegramAuth),
);

telegramRouter.post(
  "/auth",
  AuthMiddleware.requireAuth,
  AuthMiddleware.requireRole(["ADMIN"]),
  asyncHandler(TelegramController.handleTelegramAuth),
);

export { telegramRouter };
