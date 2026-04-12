import e from "cors";
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
import { th } from "@faker-js/faker";

export class TelegramAuthusecase {
  constructor() {
    this.telegramManager = getTelegramManager();
    this.TeleStatus = null;
  }

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
  static async #sendCodeAndMapDataAndUpdateCache(phoneNumber) {
    const telegramManager = getTelegramManager();
    const sendCodeViaAppRequest = await telegramManager.sendCode(phoneNumber);

    const data = mapTelegramStatus({
      data: sendCodeViaAppRequest,
      teleStatus: TELEGRAM_CONSTANTS.STATUS.init,
    });
    await telegramAuthRepo.updateConnectionStatus({
      status: "DISCONNECTED",
    });
    await telegramAuthRepo.updateTelegramAuthField({
      field: "phoneNumber",
      value: phoneNumber,
    });
    await TelegramAuthCache.createNewTeleStatus({
      key: String(phoneNumber),
      data,
      expireIn: 60 * 60,
    });
    return data;
  }
  static async #verifyCodeAndMapDataAndUpdateCache({ code, teleCache }) {
    const telegramManager = getTelegramManager();

    const verifyCodeResult = await telegramManager.verifyCode({
      phoneNumber: teleCache.phoneNumber,
      phoneCodeHash: teleCache.phoneCodeHash,
      phoneCode: code,
    });

    const data = mapTelegramStatus({
      data: teleCache,
      teleStatus: TELEGRAM_CONSTANTS.STATUS.awaitCode,
    });

    await TelegramAuthCache.updateCurrentTeleStatus({
      key: String(verifyCodeResult.phoneNumber),
      data,
      expireIn: 60 * 60,
    });
    const connectionString = telegramManager.getSessionString();
    await telegramAuthRepo.updateMainConnectionFields({
      fieldsToUpdate: {
        sessionString: connectionString,
        phoneNumber: data.phoneNumber,
        status: "CONNECTED",
      },
    });
    return data;
  }
  static async #sendPasswordNeeded({ code, teleCache }) {
    const data = mapTelegramStatus({
      data: teleCache,
      teleStatus: TELEGRAM_CONSTANTS.STATUS.requirePassword,
    });

    return data;
  }
  static async #verifyPasswordAndMapDataAndUpdateCache({ password }) {
    const telegramManager = getTelegramManager();
    const verifyPassword = await telegramManager.verifyPassword(password);
    if (!verifyPassword) {
      throw new AppError("Incorrect Telegram password", 401);
    } else {
      await telegramAuthRepo.updateTelegramAuthField({
        field: "sessionString",
        value: verifyPassword.sessionString,
      });

      const data = mapTelegramStatus({
        data: { phoneNumber: verifyPassword.phoneNumber },
        teleStatus: TELEGRAM_CONSTANTS.STATUS.passwordVerified,
      });
      const connectionString = telegramManager.getSessionString();

      await telegramAuthRepo.updateMainConnectionFields({
        fieldsToUpdate: {
          sessionString: connectionString,
          phoneNumber: verifyPassword.phoneNumber,
          status: "CONNECTED",
        },
      });
      return data;
    }
  }
  static async authintecateTelegram({
    phoneNumber,
    code,
    password,
    currentTelegramAuthStep,
  }) {
    let data;
    let message;
    const key = String(phoneNumber);
    let teleCache = await TelegramAuthCache.getCurrentTeleStatus({
      key,
    });
    if (currentTelegramAuthStep === TELEGRAM_CONSTANTS.STATUS.init) {
      TelegramAuthCache.deleteCurrentTeleStatus({ key });
    }
    let teleStatus = teleCache
      ? teleCache.teleStatus
      : TELEGRAM_CONSTANTS.STATUS.init;
    try {
      switch (teleStatus) {
        case TELEGRAM_CONSTANTS.STATUS.init:
          TelegramAuthCache.deleteCurrentTeleStatus({ key });
          data = await this.#sendCodeAndMapDataAndUpdateCache(phoneNumber);
          break;
        case TELEGRAM_CONSTANTS.STATUS.awaitCode:
          try {
            const verifyCodeResult =
              await this.#verifyCodeAndMapDataAndUpdateCache({
                code,
                teleCache,
                message,
              });
            data = verifyCodeResult;
          } catch (error) {
            if (error?.errorMessage === "SESSION_PASSWORD_NEEDED") {
              data = await this.#sendPasswordNeeded({ code, teleCache });
              TelegramAuthCache.updateCurrentTeleStatus({
                key,
                data,
                expireIn: 60 * 60,
              });
              message = "Code verified. Please enter your 2FA password.";
            } else {
              throw error;
            }
          }
          break;

        case TELEGRAM_CONSTANTS.STATUS.awaitPassword:
          const verifyPasswordResult =
            await this.#verifyPasswordAndMapDataAndUpdateCache({
              password,
            });
          data = verifyPasswordResult;
          break;
      }
      if (data?.teleStatus === TELEGRAM_CONSTANTS.STATUS.success) {
        await telegramAuthRepo.updateConnectionStatus({
          status: "CONNECTED",
        });
        TelegramAuthCache.deleteCurrentTeleStatus({ key });
      }
    } catch (error) {
      if (error.message === "Password is empty") {
        TelegramAuthCache.deleteCurrentTeleStatus({ key });
        throw new AppError(
          "Something went wrong during Telegram authentication. Please start again.",
          500,
        );
      }

      if (error?.errorMessage === "SESSION_PASSWORD_NEEDED") {
      }
      if (error?.errorMessage === "AUTH_KEY_UNREGISTERED") {
        TelegramAuthCache.updateCurrentTeleStatus({
          key,
          data: {
            ...teleCache,
            teleStatus: TELEGRAM_CONSTANTS.STATUS.reWritePassword,
          },
          expireIn: 60 * 60,
        });
        return {
          data: {
            phoneNumber,
            teleStatus: TELEGRAM_CONSTANTS.STATUS.reWritePassword,
          },
          message: "The password you entered is incorrect. Please try again.",
        };
      }
      if (error.errorMessage === "PHONE_CODE_EXPIRED") {
        TelegramAuthCache.deleteCurrentTeleStatus({ key });
      }
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        error.errorMessage || error.message,
        error.code || 500,
      );
    }
    if (!data) {
      TelegramAuthCache.deleteCurrentTeleStatus({ key });
      message =
        "An unknown error occurred during Telegram authentication. Please try again.";
    }
    if (data?.teleStatus === TELEGRAM_CONSTANTS.STATUS.awaitCode) {
      message = "Code sent to Telegram app. Please enter the code to continue.";
    }
    if (data?.teleStatus === TELEGRAM_CONSTANTS.STATUS.requirePassword) {
      message = "Code verified. Please enter your 2FA password.";
    }
    if (data?.teleStatus === TELEGRAM_CONSTANTS.STATUS.passwordVerified) {
      message = "Password verified. Telegram authentication successful.";
    }
    if (data?.teleStatus === TELEGRAM_CONSTANTS.STATUS.success) {
      message = "Telegram authentication successful.";
    }
    if (data?.teleStatus === TELEGRAM_CONSTANTS.STATUS.reWritePassword) {
      message =
        "You entered the wrong password. Please enter your 2FA password again.";
    }
    if (data?.teleStatus === TELEGRAM_CONSTANTS.STATUS.init) {
      message = "Code sent to Telegram app. Please enter the code to continue.";
    }
    return { phoneNumber, teleStatus: data?.teleStatus, message };
  }
}
