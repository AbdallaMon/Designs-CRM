import { adminResidualMessagesCodes, messagesNames } from "@dms/shared";
import { ok } from "../../../shared/http/response.js";
import {
  mapTelegramAuthStepToDTO,
  mapTelegramDataToDTO,
} from "./telegram.dto.js";
import { TelegramAuthusecase } from "./telegram.usecase.js";

const TK = messagesNames.adminResidualMessages;

export class TelegramController {
  static async getCurrentTelegramAuth(req, res) {
    const result = await TelegramAuthusecase.getActiveAuth();
    return ok(
      res,
      mapTelegramDataToDTO(result),
      adminResidualMessagesCodes.TELEGRAM_AUTH_FETCHED,
      TK,
    );
  }

  static async initTelegramAuth(req, res) {
    const { phoneNumber } = req.body;
    const result = await TelegramAuthusecase.initTelegramAuth(phoneNumber);
    return ok(res, mapTelegramAuthStepToDTO(result.data), result.message, TK);
  }

  static async verifyCode(req, res) {
    const { phoneNumber, code } = req.body;
    const result = await TelegramAuthusecase.verifyCode({
      phoneNumber,
      code,
    });
    return ok(res, mapTelegramAuthStepToDTO(result.data), result.message, TK);
  }

  static async verifyPassword(req, res) {
    const { phoneNumber, password } = req.body;
    const result = await TelegramAuthusecase.verifyPassword({
      phoneNumber,
      password,
    });
    return ok(res, mapTelegramAuthStepToDTO(result.data), result.message, TK);
  }
}
