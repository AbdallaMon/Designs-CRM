import { TELEGRAM_CONSTANTS } from "../telegram.constant.js";

export const TELEGRAM_AUTH_CONNECTION_SELECT = {
  name: true,
  apiId: true,
  apiHash: true,
  sessionString: true,
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
    phoneNumber: data.phoneNumber,
    status: data.status,
    lastCheckedAt: data.lastCheckedAt,
    lastConnectedAt: data.lastConnectedAt,
    lastError: data.lastError,
  };
};

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
