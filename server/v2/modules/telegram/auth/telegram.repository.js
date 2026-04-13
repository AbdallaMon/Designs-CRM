import prisma from "../../../infra/prisma.js";
import { TELEGRAM_AUTH_CONNECTION_SELECT } from "./telegram.dto.js";

class TelegramAuthRepository {
  constructor(model = prisma.TelegramConnection) {
    this.telegramModel = model;
  }

  async getMainConnection() {
    return this.telegramModel.findUnique({
      where: { name: "MAIN" },
      select: TELEGRAM_AUTH_CONNECTION_SELECT,
    });
  }

  async upsertMainConnection({
    apiId,
    apiHash,
    sessionString,
    status = "CONNECTED",
    updatedByUserId = null,
  }) {
    return prisma.$transaction(async (tx) => {
      return tx.telegramConnection.upsert({
        where: { name: "MAIN" },
        create: {
          name: "MAIN",
          apiId: String(apiId),
          apiHash,
          sessionString,
          isActive: true,
          status,
          updatedByUserId,
          notifiedOfDisconnection: false,
        },
        update: {
          apiId: String(apiId),

          apiHash,
          sessionString,
          isActive: true,
          status,
          lastError: null,
          lastCheckedAt: null,
          updatedByUserId,
          notifiedOfDisconnection: false,
        },
      });
    });
  }
  updateMainConnectionFields({ fieldsToUpdate, updatedByUserId = null }) {
    return this.telegramModel.updateMany({
      where: { name: "MAIN" },
      data: {
        ...fieldsToUpdate,
        updatedByUserId,
      },
    });
  }

  async updateConnectionStatus({
    status,
    lastError = null,
    markConnectedAt = false,
    markCheckedAt = true,
    updatedByUserId = null,
  }) {
    const now = new Date();

    return this.telegramModel.updateMany({
      where: { name: "MAIN" },
      data: {
        status,
        lastError,
        updatedByUserId,
        lastCheckedAt: markCheckedAt ? now : undefined,
        lastConnectedAt: markConnectedAt ? now : undefined,
        notifiedOfDisconnection: status === "DISCONNECTED" ? false : true,
      },
    });
  }
  async updateTelegramAuthField({ field, value, updatedByUserId = null }) {
    await this.telegramModel.updateMany({
      where: { name: "MAIN" },
      data: {
        [field]: value,
        updatedByUserId,
      },
    });
  }
  async markNotifiedOfDisconnection() {
    return this.telegramModel.updateMany({
      where: { name: "MAIN" },
      data: {
        notifiedOfDisconnection: true,
      },
    });
  }
}
export const telegramAuthRepo = new TelegramAuthRepository();
