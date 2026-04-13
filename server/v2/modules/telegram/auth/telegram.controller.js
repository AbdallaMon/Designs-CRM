import { AppError } from "../../../shared/errors/AppError.js";
import { internalServerError, ok } from "../../../shared/http/response.js";
import { mapTelegramDataToDTO } from "./telegram.dto.js";
import { TelegramAuthusecase } from "./telegram.usecase.js";

export class TelegramController {
  static async getCurrentTelegramAuth(req, res) {
    const result = await TelegramAuthusecase.getActiveAuth();
    ok(
      res,
      mapTelegramDataToDTO(result),
      "Current Telegram authentication retrieved successfully",
    );
  }
  static async initTelegramAuth(req, res) {
    const { phoneNumber } = req.body;

    const result = await TelegramAuthusecase.initTelegramAuth(phoneNumber);
    ok(
      res,
      result.data,
      result.message || "Telegram authentication initiated successfully",
    );
  }
  static async verifyCode(req, res) {
    const { phoneNumber, code } = req.body;
    const result = await TelegramAuthusecase.verifyCode({ phoneNumber, code });
    ok(
      res,
      result.data,
      result.message || "Telegram code verified successfully",
    );
  }
  static async verifyPassword(req, res) {
    const { phoneNumber, password } = req.body;
    const result = await TelegramAuthusecase.verifyPassword({
      phoneNumber,
      password,
    });
    ok(
      res,
      result.data,
      result.message || "Telegram password verified successfully",
    );
  }
}
