import { Router } from "express";
import { TelegramController } from "./telegram.controller.js";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import {
  awaitCodeSchema,
  awaitPasswordSchema,
  initSchema,
} from "../telegram.validation.js";
import { mapTelegramPhone } from "./telegram.dto.js";

const telegramRouter = Router();
telegramRouter.use(AuthMiddleware.requireAuth);
telegramRouter.use(AuthMiddleware.requireRole(["ADMIN"]));

telegramRouter.get(
  "/current",
  asyncHandler(TelegramController.getCurrentTelegramAuth),
);

telegramRouter.post(
  "/auth/init",
  (req, res, next) => {
    if (req.body.phoneNumber) {
      req.body.phoneNumber = mapTelegramPhone(req.body.phoneNumber);
    }
    next();
  },
  validate(initSchema),
  asyncHandler(TelegramController.initTelegramAuth),
);
telegramRouter.post(
  "/auth/verify-code",
  (req, res, next) => {
    console.log("Original phone number input:", req.body);
    if (req.body.phoneNumber) {
      req.body.phoneNumber = mapTelegramPhone(req.body.phoneNumber);
    }
    next();
  },
  validate(awaitCodeSchema),

  asyncHandler(TelegramController.verifyCode),
);
telegramRouter.post(
  "/auth/verify-password",
  validate(awaitPasswordSchema),

  asyncHandler(TelegramController.verifyPassword),
);

export { telegramRouter };
