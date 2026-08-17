import prisma from "../../../infra/prisma/prisma.js";

const ENCRYPTION_METADATA_SELECT = {
  algorithm: true,
  keyVersion: true,
  dataIv: true,
  dataAuthTag: true,
  wrappedDataKey: true,
  keyIv: true,
  keyAuthTag: true,
};

const GOOGLE_CREDENTIAL_STORAGE_SELECT = {
  googleEncryptedCredential: {
    select: { ciphertext: true, ...ENCRYPTION_METADATA_SELECT },
  },
  googleRefreshToken: true,
  googleAccessToken: true,
  googleTokenExpiresAt: true,
  googleCalendarId: true,
};

async function inTransaction(client, work) {
  if (client) return work(client);
  return prisma.$transaction(work);
}

class GoogleCalendarRepository {
  model = prisma.user;

  findCredentialStorage({ userId, client }) {
    return (client ?? prisma).user.findUnique({
      where: { id: Number(userId) },
      select: GOOGLE_CREDENTIAL_STORAGE_SELECT,
    });
  }

  findConnectionStatus({ userId }) {
    return prisma.user.findUnique({
      where: { id: Number(userId) },
      select: {
        googleEncryptedCredential: { select: { id: true } },
        googleRefreshToken: true,
        googleCalendarId: true,
        googleTokenExpiresAt: true,
      },
    });
  }

  findCalendarIdentity({ userId }) {
    return prisma.user.findUnique({
      where: { id: Number(userId) },
      select: { googleCalendarId: true },
    });
  }

  replaceEncryptedCredentials({
    userId,
    ciphertext,
    metadata,
    tokenExpiresAt,
    calendarId,
    client,
  }) {
    return inTransaction(client, async (tx) => {
      const user = await tx.user.update({
        where: { id: Number(userId) },
        data: {
          googleRefreshToken: null,
          googleAccessToken: null,
          googleTokenExpiresAt: tokenExpiresAt,
          googleCalendarId: calendarId,
        },
        select: { id: true },
      });
      await tx.googleEncryptedCredential.upsert({
        where: { userId: Number(userId) },
        create: { userId: Number(userId), ciphertext, ...metadata },
        update: { ciphertext, ...metadata },
      });
      return user;
    });
  }

  updateCalendarIdentity({ userId, calendarId, googleEmail }) {
    return prisma.user.update({
      where: { id: Number(userId) },
      data: { googleCalendarId: calendarId, googleEmail },
    });
  }

  clearCredentials({ userId, client }) {
    return inTransaction(client, async (tx) => {
      const user = await tx.user.update({
        where: { id: Number(userId) },
        data: {
          googleRefreshToken: null,
          googleAccessToken: null,
          googleTokenExpiresAt: null,
          googleCalendarId: null,
          googleEmail: null,
        },
        select: { id: true },
      });
      await tx.googleEncryptedCredential.deleteMany({
        where: { userId: Number(userId) },
      });
      return user;
    });
  }

  listLegacyCredentials({ cursor, take = 100 }) {
    return prisma.user.findMany({
      where: {
        googleEncryptedCredential: { is: null },
        OR: [
          { googleRefreshToken: { not: null } },
          { googleAccessToken: { not: null } },
        ],
      },
      orderBy: { id: "asc" },
      take,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        googleRefreshToken: true,
        googleAccessToken: true,
      },
    });
  }

  backfillLegacyCredentials({ userId, ciphertext, metadata }) {
    return prisma.$transaction(async (tx) => {
      const result = await tx.user.updateMany({
        where: {
          id: Number(userId),
          OR: [
            { googleRefreshToken: { not: null } },
            { googleAccessToken: { not: null } },
          ],
        },
        data: {
          googleRefreshToken: null,
          googleAccessToken: null,
        },
      });
      if (result.count !== 1) return false;
      await tx.googleEncryptedCredential.upsert({
        where: { userId: Number(userId) },
        create: { userId: Number(userId), ciphertext, ...metadata },
        update: { ciphertext, ...metadata },
      });
      return true;
    });
  }
}

export const googleCalendarRepository = new GoogleCalendarRepository();
export { GoogleCalendarRepository };
