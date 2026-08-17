import { TELEGRAM_CONNECTION_STATUSES } from "@dms/shared";
import { TELEGRAM_CONSTANTS } from "../telegram.constant.js";
export const mapTelegramPhone = (phoneNumber) => {
  return phoneNumber.replace(/\s/g, "");
};
export const TELEGRAM_AUTH_CONNECTION_SELECT = {
  id: true,
  name: true,
  apiId: true,
  apiHash: true,
  sessionString: true,
  encryptedCredential: {
    select: {
      ciphertext: true,
      algorithm: true,
      keyVersion: true,
      dataIv: true,
      dataAuthTag: true,
      wrappedDataKey: true,
      keyIv: true,
      keyAuthTag: true,
    },
  },
  isActive: true,
  status: true,
  lastCheckedAt: true,
  lastConnectedAt: true,
  lastError: true,
  updatedByUserId: true,
  createdAt: true,
  updatedAt: true,
  phoneNumber: true,
  notifiedOfDisconnection: true,
};
export const mapTelegramDataToDTO = (data) => {
  return {
    phoneNumber: data?.phoneNumber ?? null,
    status: data?.status ?? TELEGRAM_CONNECTION_STATUSES.DISCONNECTED,
  };
};

export const mapTelegramAuthStepToDTO = (data) => ({
  phoneNumber: data?.phoneNumber ?? null,
  teleStatus: data?.teleStatus,
});

export const mapTelegramStatus = ({ data, teleStatus }) => {
  switch (teleStatus) {
    case TELEGRAM_CONSTANTS.STATUS.init:
      return {
        phoneNumber: data.phoneNumber,
        teleStatus: TELEGRAM_CONSTANTS.STATUS.awaitCode,
        phoneCodeHash: data.phoneCodeHash,
      };
    case TELEGRAM_CONSTANTS.STATUS.awaitCode: {
      return {
        phoneNumber: data.phoneNumber,
        teleStatus: TELEGRAM_CONSTANTS.STATUS.success,
      };
    }
    case TELEGRAM_CONSTANTS.STATUS.requirePassword: {
      return {
        phoneNumber: data.phoneNumber,
        teleStatus: TELEGRAM_CONSTANTS.STATUS.awaitPassword,
      };
    }
    case TELEGRAM_CONSTANTS.STATUS.passwordVerified: {
      return {
        phoneNumber: data.phoneNumber,
        teleStatus: TELEGRAM_CONSTANTS.STATUS.success,
      };
    }
    case TELEGRAM_CONSTANTS.STATUS.reWritePassword: {
      return {
        phoneNumber: data.phoneNumber,
        teleStatus: TELEGRAM_CONSTANTS.STATUS.reWritePassword,
      };
    }
  }
};
