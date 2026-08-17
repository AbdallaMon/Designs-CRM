import { AppError } from "../../../shared/errors/AppError.js";
import {
  CONTENT_TYPES,
  NOTIFICATION_TYPES,
} from "../../../shared/notifications/notification.constants.js";
import { sendToAdmins } from "../../../shared/notifications/notification.service.js";
import { getTelegramManager } from "../manager/telegram.manager.js";
import { TELEGRAM_CONSTANTS } from "../telegram.constant.js";
import { TelegramAuthCache } from "./telegram.cache.js";
import {
  mapTelegramAuthStepToDTO,
  mapTelegramStatus,
} from "./telegram.dto.js";
import { TelegramAuthEmails } from "./telegram.emails.js";
import { telegramAuthRepo } from "./telegram.repo.js";
import { integrationCredentialEncryption } from "../../../infra/security/integration-credential-encryption.js";
import {
  TELEGRAM_CONNECTION_STATUSES, adminResidualMessagesCodes,
  messagesNames,
} from "@dms/shared";

const TK = messagesNames.adminResidualMessages;

export class TelegramAuthusecase {
  static #CACHE_PREFIX = "telegram:auth:";
  static #cacheKey = (phone) => `${TelegramAuthusecase.#CACHE_PREFIX}${phone}`;
  static #decryptStoredConnection(stored) {
    if (!stored) return null;
    const { encryptedCredential, ...connection } = stored;
    if (!encryptedCredential) return connection;
    const credentials = integrationCredentialEncryption.decrypt({
      ciphertext: encryptedCredential.ciphertext,
      metadata: encryptedCredential,
    });
    return {
      ...connection,
      apiId: credentials.apiId ?? null,
      apiHash: credentials.apiHash ?? null,
      sessionString: credentials.sessionString ?? null,
    };
  }

  static #encryptCredentials({ apiId, apiHash, sessionString }) {
    return integrationCredentialEncryption.encrypt({
      apiId: apiId == null ? null : String(apiId),
      apiHash: apiHash ?? null,
      sessionString: sessionString ?? null,
    });
  }

  static async #readStoredConnection() {
    const stored = await telegramAuthRepo.getMainConnection();
    return this.#decryptStoredConnection(stored);
  }

  static async getActiveAuth(checkHealth = true) {
    try {
      const telegramData = await this.#readStoredConnection();
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
      try {
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
      } catch {
        // Notification failure must not expose a provider error through this API.
      }
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
    const encrypted = this.#encryptCredentials({ apiId, apiHash, sessionString });
    return await telegramAuthRepo.upsertMainConnection({
      ciphertext: encrypted.ciphertext,
      metadata: encrypted.metadata,
      status,
      updatedByUserId,
    });
  }
  static async #handleTelegramAuthSuccess({ key }) {
    const telegramManager = getTelegramManager();
    const connectionString = telegramManager.getSessionString();
    const connection = await this.#readStoredConnection();
    const encrypted = this.#encryptCredentials({
      apiId: connection?.apiId,
      apiHash: connection?.apiHash,
      sessionString: connectionString,
    });

    await telegramAuthRepo.replaceEncryptedCredentials({
      connectionId: connection.id,
      ciphertext: encrypted.ciphertext,
      metadata: encrypted.metadata,
      fieldsToUpdate: {
        status: TELEGRAM_CONNECTION_STATUSES.CONNECTED,
      },
    });
    await TelegramAuthCache.deleteCurrentTeleStatus({ key });
  }
  static async initTelegramAuth(phoneNumber) {
    try {
      const key = this.#cacheKey(phoneNumber);
      const telegramManager = getTelegramManager();
      await TelegramAuthCache.deleteCurrentTeleStatus({ key });
      const sendCodeViaAppRequest = await telegramManager.sendCode(phoneNumber);

      const data = mapTelegramStatus({
        data: sendCodeViaAppRequest,
        teleStatus: TELEGRAM_CONSTANTS.STATUS.init,
      });
      await telegramAuthRepo.updateMainConnectionFields({
        fieldsToUpdate: {
          phoneNumber,
          status: TELEGRAM_CONNECTION_STATUSES.DISCONNECTED,
        },
      });
      await TelegramAuthCache.createNewTeleStatus({
        key: key,
        data,
        expireIn: 60 * 60,
      });
      return {
        data: mapTelegramAuthStepToDTO(data),
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
    if (!teleCache?.phoneCodeHash) {
      throw new AppError({
        code: adminResidualMessagesCodes.TELEGRAM_CODE_EXPIRED,
        statusCode: 401,
        translationKey: TK,
      });
    }
    const telegramManager = getTelegramManager();

    await telegramManager.verifyCode({
      phoneNumber: phoneNumber,
      phoneCodeHash: teleCache.phoneCodeHash,
      phoneCode: code,
    });
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
    if (error instanceof AppError) throw error;
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
      return {
        data: mapTelegramAuthStepToDTO(data),
        message: adminResidualMessagesCodes.TELEGRAM_CODE_VERIFIED,
      };
    } catch (error) {
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
        data: mapTelegramAuthStepToDTO(data),
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
