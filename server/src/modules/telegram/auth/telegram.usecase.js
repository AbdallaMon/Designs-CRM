import { AppError } from "../../../shared/errors/AppError.js";
import {
  CONTENT_TYPES,
  NOTIFICATION_TYPES,
} from "../../../shared/notifications/notification.constants.js";
import { sendToAdmins } from "../../../shared/notifications/notification.service.js";
import { getTelegramManager } from "../manager/telegram.manager.js";
import { TELEGRAM_CONSTANTS } from "../telegram.constant.js";
import { TelegramAuthCache } from "./telegram.cache.js";
import { mapTelegramStatus } from "./telegram.dto.js";
import { TelegramAuthEmails } from "./telegram.emails.js";
import { telegramAuthRepo } from "./telegram.repo.js";
import {
  adminResidualMessagesCodes,
  messagesNames,
} from "@dms/shared";

const TK = messagesNames.adminResidualMessages;

export class TelegramAuthusecase {
  static #CACHE_PREFIX = "telegram:auth:";
  static #cacheKey = (phone) => `${TelegramAuthusecase.#CACHE_PREFIX}${phone}`;
  static async getActiveAuth(checkHealth = true) {
    try {
      const telegramData = await telegramAuthRepo.getMainConnection();
      if (checkHealth && telegramData?.sessionString) {
        const telegramManager = getTelegramManager();
        await telegramManager.setConfig({
          sessionString: telegramData.sessionString,
        });
        await telegramManager.connect();
        const health = await telegramManager.checkHealth();
        if (!health.authorized) {
          throw new AppError({
            code: adminResidualMessagesCodes.TELEGRAM_SESSION_UNAUTHORIZED,
            statusCode: 401,
            translationKey: TK,
          });
        }
      }
      return telegramData;
    } catch (e) {
      if (e instanceof AppError) throw e;
      const reauthEmail = TelegramAuthEmails.reAuthAlert();
      await sendToAdmins({
        content: reauthEmail.html,
        type: NOTIFICATION_TYPES.TELEGRAM_REAUTH_NEEDED,
        isEmailOnly: true,
        options: {
          contentType: CONTENT_TYPES.HTML,
          emailSubject: reauthEmail.subject,
        },
      });
      await telegramAuthRepo.markNotifiedOfDisconnection();
      throw new AppError({
        code: adminResidualMessagesCodes.TELEGRAM_CONNECTION_FAILED,
        statusCode: 503,
        translationKey: TK,
      });
    }
  }
  static async updateTelegramAuthConnection({
    apiId,
    apiHash,
    sessionString,
    status,
    updatedByUserId,
  }) {
    return await telegramAuthRepo.upsertMainConnection({
      apiId,
      apiHash,
      sessionString,
      status,
      updatedByUserId,
    });
  }
  static async #handleTelegramAuthSuccess({ key }) {
    const telegramManager = getTelegramManager();
    const connectionString = telegramManager.getSessionString();

    await telegramAuthRepo.updateMainConnectionFields({
      fieldsToUpdate: {
        sessionString: connectionString,
        status: "CONNECTED",
      },
    });
    await TelegramAuthCache.deleteCurrentTeleStatus({ key });
  }
  static async initTelegramAuth(phoneNumber) {
    try {
      const key = this.#cacheKey(phoneNumber);
      const telegramManager = getTelegramManager();
      console.log(telegramManager, "telegramManager");
      await TelegramAuthCache.deleteCurrentTeleStatus({ key });
      const sendCodeViaAppRequest = await telegramManager.sendCode(phoneNumber);

      const data = mapTelegramStatus({
        data: sendCodeViaAppRequest,
        teleStatus: TELEGRAM_CONSTANTS.STATUS.init,
      });
      await telegramAuthRepo.updateMainConnectionFields({
        fieldsToUpdate: {
          phoneNumber,
          status: "DISCONNECTED",
        },
      });
      await TelegramAuthCache.createNewTeleStatus({
        key: key,
        data,
        expireIn: 60 * 60,
      });
      return {
        data,
        message: adminResidualMessagesCodes.TELEGRAM_AUTH_INITIATED,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error.code === 420 && error.errorMessage === "FLOOD") {
        throw new AppError({
          code: adminResidualMessagesCodes.TELEGRAM_AUTH_RATE_LIMITED,
          statusCode: 429,
          translationKey: TK,
          details: { retryAfterSeconds: error.seconds ?? null },
        });
      }
      throw new AppError({
        code: adminResidualMessagesCodes.TELEGRAM_AUTH_INIT_FAILED,
        statusCode: 502,
        translationKey: TK,
      });
    }
  }
  static async #checkIfValidOTPCode(phoneNumber, code) {
    const key = this.#cacheKey(phoneNumber);
    const teleCache = await TelegramAuthCache.getCurrentTeleStatus({
      key,
    });
    const telegramManager = getTelegramManager();

    const verifyCode = await telegramManager.verifyCode({
      phoneNumber: phoneNumber,
      phoneCodeHash: teleCache.phoneCodeHash,
      phoneCode: code,
    });
    console.log(verifyCode, "verifyCode");

    const data = mapTelegramStatus({
      data: {
        ...teleCache,
        phoneNumber: phoneNumber,
      },
      teleStatus: TELEGRAM_CONSTANTS.STATUS.awaitCode,
    });

    await this.#handleTelegramAuthSuccess({
      key: key,
    });
    return data;
  }
  static async #sendPasswordNeeded(phoneNumber) {
    const key = this.#cacheKey(phoneNumber);
    const teleCache = await TelegramAuthCache.getCurrentTeleStatus({
      key,
    });
    const data = mapTelegramStatus({
      data: teleCache,
      teleStatus: TELEGRAM_CONSTANTS.STATUS.requirePassword,
    });
    await TelegramAuthCache.updateCurrentTeleStatus({
      key,
      data,
      expireIn: 60 * 60,
    });
    return data;
  }
  static async #handleVerifyCodeError(error, phoneNumber) {
    if (error?.errorMessage === "SESSION_PASSWORD_NEEDED") {
      const data = await this.#sendPasswordNeeded(phoneNumber);
      return {
        data,
        message: adminResidualMessagesCodes.TELEGRAM_PASSWORD_REQUIRED,
      };
    } else {
      if (error.code === 400 && error.errorMessage === "PHONE_CODE_INVALID") {
        throw new AppError({
          code: adminResidualMessagesCodes.TELEGRAM_CODE_INCORRECT,
          statusCode: 401,
          translationKey: TK,
        });
      }
      if (error.code === 400 && error.errorMessage === "PHONE_CODE_EXPIRED") {
        throw new AppError({
          code: adminResidualMessagesCodes.TELEGRAM_CODE_EXPIRED,
          statusCode: 401,
          translationKey: TK,
        });
      }

      throw new AppError({
        code: adminResidualMessagesCodes.TELEGRAM_CODE_VERIFICATION_FAILED,
        statusCode: 502,
        translationKey: TK,
      });
    }
  }
  static async verifyCode({ phoneNumber, code }) {
    try {
      const data = await this.#checkIfValidOTPCode(phoneNumber, code);
      console.log("OTP code verified successfully for phone number:", data);
      return {
        data,
        message: adminResidualMessagesCodes.TELEGRAM_CODE_VERIFIED,
      };
    } catch (error) {
      console.error("Error verifying Telegram code:", error);
      return await this.#handleVerifyCodeError(error, phoneNumber);
    }
  }
  static async verifyPassword({ phoneNumber, password }) {
    const telegramManager = getTelegramManager();
    try {
      const user = await telegramManager.verifyPassword(password);
      const data = mapTelegramStatus({
        data: { phoneNumber: user.phone || phoneNumber },
        teleStatus: TELEGRAM_CONSTANTS.STATUS.passwordVerified,
      });
      await this.#handleTelegramAuthSuccess({
        key: this.#cacheKey(phoneNumber),
      });
      return {
        data,
        message: adminResidualMessagesCodes.TELEGRAM_PASSWORD_VERIFIED,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error.errorMessage === "PASSWORD_HASH_INVALID") {
        throw new AppError({
          code: adminResidualMessagesCodes.TELEGRAM_PASSWORD_INCORRECT,
          statusCode: 401,
          translationKey: TK,
        });
      }
      throw new AppError({
        code: adminResidualMessagesCodes.TELEGRAM_PASSWORD_VERIFICATION_FAILED,
        statusCode: 502,
        translationKey: TK,
      });
    }
  }
}
