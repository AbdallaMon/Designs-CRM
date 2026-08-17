import { TELEGRAM_CONNECTION_STATUSES } from "@dms/shared";
import prisma from "../../../infra/prisma/prisma.js";
import { TELEGRAM_AUTH_CONNECTION_SELECT } from "./telegram.dto.js";

const LEGACY_CREDENTIAL_FIELDS = ["apiId", "apiHash", "sessionString"];

function assertNoPlaintextCredentialFields(fields) {
  if (LEGACY_CREDENTIAL_FIELDS.some((field) => Object.hasOwn(fields, field))) {
    throw new Error("TELEGRAM_PLAINTEXT_CREDENTIAL_WRITE_REJECTED");
  }
}

class TelegramAuthRepository {
  constructor(model = prisma.telegramConnection) {
    this.telegramModel = model;
  }

  async getMainConnection() {
    return this.telegramModel.findUnique({
      where: { name: "MAIN" },
      select: TELEGRAM_AUTH_CONNECTION_SELECT,
    });
  }

  async upsertMainConnection({
    ciphertext,
    metadata,
    status = TELEGRAM_CONNECTION_STATUSES.CONNECTED,
    updatedByUserId = null,
  }) {
    return prisma.$transaction(async (tx) => {
      const connection = await tx.telegramConnection.upsert({
        where: { name: "MAIN" },
        create: {
          name: "MAIN",
          apiId: null,
          apiHash: null,
          sessionString: null,
          isActive: true,
          status,
          updatedByUserId,
          notifiedOfDisconnection: false,
        },
        update: {
          apiId: null,
          apiHash: null,
          sessionString: null,
          isActive: true,
          status,
          lastError: null,
          lastCheckedAt: null,
          updatedByUserId,
          notifiedOfDisconnection: false,
        },
        select: { id: true, status: true, isActive: true },
      });
      await tx.telegramEncryptedCredential.upsert({
        where: { telegramConnectionId: connection.id },
        create: { telegramConnectionId: connection.id, ciphertext, ...metadata },
        update: { ciphertext, ...metadata },
      });
      return connection;
    });
  }

  replaceEncryptedCredentials({
    connectionId,
    ciphertext,
    metadata,
    fieldsToUpdate = {},
    updatedByUserId = null,
  }) {
    return prisma.$transaction(async (tx) => {
      const connection = await tx.telegramConnection.update({
        where: { id: Number(connectionId) },
        data: {
          ...fieldsToUpdate,
          apiId: null,
          apiHash: null,
          sessionString: null,
          updatedByUserId,
        },
        select: { id: true, status: true, isActive: true },
      });
      await tx.telegramEncryptedCredential.upsert({
        where: { telegramConnectionId: Number(connectionId) },
        create: {
          telegramConnectionId: Number(connectionId),
          ciphertext,
          ...metadata,
        },
        update: { ciphertext, ...metadata },
      });
      return connection;
    });
  }
  updateMainConnectionFields({ fieldsToUpdate, updatedByUserId = null }) {
    assertNoPlaintextCredentialFields(fieldsToUpdate);
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
        notifiedOfDisconnection: status === TELEGRAM_CONNECTION_STATUSES.DISCONNECTED ? false : true,
      },
    });
  }
  listLegacyCredentials({ cursor, take = 100 }) {
    return prisma.telegramConnection.findMany({
      where: {
        encryptedCredential: { is: null },
        OR: [
          { apiId: { not: null } },
          { apiHash: { not: null } },
          { sessionString: { not: null } },
        ],
      },
      orderBy: { id: "asc" },
      take,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: { id: true, apiId: true, apiHash: true, sessionString: true },
    });
  }

  backfillLegacyCredentials({ connectionId, ciphertext, metadata }) {
    return prisma.$transaction(async (tx) => {
      const result = await tx.telegramConnection.updateMany({
        where: {
          id: Number(connectionId),
          OR: [
            { apiId: { not: null } },
            { apiHash: { not: null } },
            { sessionString: { not: null } },
          ],
        },
        data: {
          apiId: null,
          apiHash: null,
          sessionString: null,
        },
      });
      if (result.count !== 1) return false;
      await tx.telegramEncryptedCredential.upsert({
        where: { telegramConnectionId: Number(connectionId) },
        create: {
          telegramConnectionId: Number(connectionId),
          ciphertext,
          ...metadata,
        },
        update: { ciphertext, ...metadata },
      });
      return true;
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
