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
import { telegramAuthRepo } from "./telegram.repository.js";

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
          throw new AppError("Telegram session is not authorized", 401);
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
      throw new AppError(
        "Telegram connection failed. Admins have been notified to re-authenticate.",
        503,
      );
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
        message:
          "Telegram authentication initiated. Please enter the code sent to your Telegram app.",
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error.code === 420 && error.errorMessage === "FLOOD") {
        const waitTimeInMinute = Math.ceil(error.seconds / 60);
        const waitTimeInHour = Math.ceil(waitTimeInMinute / 60);
        const waitTime =
          waitTimeInHour > 0
            ? `${waitTimeInHour} hour(s)`
            : `${waitTimeInMinute} minute(s)`;
        throw new AppError(
          `Too many attempts to get otp code. Please wait ${waitTime} before trying again.`,
          429,
        );
      }
      throw new AppError(
        error.errorMessage ||
          error.message ||
          "Failed to initiate Telegram authentication",
        error.code || 500,
      );
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
        message: "Code verified. Please enter your 2FA password.",
      };
    } else {
      if (error.code === 400 && error.errorMessage === "PHONE_CODE_INVALID") {
        throw new AppError(
          "The code you entered is incorrect. Please check the code sent to your Telegram app and try again.",
          401,
        );
      }
      if (error.code === 400 && error.errorMessage === "PHONE_CODE_EXPIRED") {
        throw new AppError(
          "The code you entered has expired. Please request a new code.",
          401,
        );
      }

      throw new AppError(
        error.errorMessage || error.message || "Failed to verify Telegram code",
        error.code || 500,
      );
    }
  }
  static async verifyCode({ phoneNumber, code }) {
    try {
      const data = await this.#checkIfValidOTPCode(phoneNumber, code);
      console.log("OTP code verified successfully for phone number:", data);
      return {
        data,
        message: "Code verified. Telegram authentication successful.",
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
      return { data, message: "Telegram authentication successful." };
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error.errorMessage === "PASSWORD_HASH_INVALID") {
        throw new AppError(
          "Incorrect Telegram password. Please try again.",
          401,
        );
      }
      throw new AppError(
        error.errorMessage ||
          error.message ||
          "Failed to verify Telegram password",
        error.code || 500,
      );
    }
  }
  // static async verifyPassword({ phoneNumber, password }) {
  //   const telegramManager = getTelegramManager();
  //   let verifyPassword;
  //   try {
  //     verifyPassword = await telegramManager.verifyPassword(password);
  //   } catch (error) {
  //     console.error("Error verifying Telegram password:", error);
  //   }
  //   if (!verifyPassword) {
  //     throw new AppError("Incorrect Telegram password", 401);
  //   } else {
  //     const data = mapTelegramStatus({
  //       data: { phoneNumber: verifyPassword.phoneNumber },
  //       teleStatus: TELEGRAM_CONSTANTS.STATUS.passwordVerified,
  //     });

  //     await this.#handleTelegramAuthSuccess({
  //       key: String(phoneNumber),
  //     });
  //     return {
  //       data,
  //       message: "Telegram authentication successful.",
  //     };
  //   }
  // }
}

// if (error?.errorMessage === "SESSION_PASSWORD_NEEDED") {
