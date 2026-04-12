import { AppError } from "../../../shared/errors/AppError.js";
import { internalServerError, ok } from "../../../shared/http/response.js";
import { mapTelegramDataToDTO } from "./telegram.dto.js";
import { TelegramAuthusecase } from "./telegram.usecase.js";

export class TelegramController {
  static async getCurrentTelegramAuth(req, res) {
    try {
      const result = await TelegramAuthusecase.getActiveAuth();

      ok(
        res,
        mapTelegramDataToDTO(result),
        "Current Telegram authentication retrieved successfully",
      );
    } catch (error) {
      console.error(
        "Error in TelegramController.getCurrentTelegramAuth:",
        error,
      );
      throw new AppError(
        "Failed to retrieve current Telegram authentication",
        500,
        error.message,
      );
    }
  }
  static async handleTelegramAuth(req, res) {
    const { phoneNumber, code, password, currentTelegramAuthStep } = req.body;

    const result = await TelegramAuthusecase.authintecateTelegram({
      phoneNumber,
      code,
      password,
      currentTelegramAuthStep,
    });
    ok(
      res,
      result,
      result.message || "Telegram authentication step handled successfully",
    );
  }
}
