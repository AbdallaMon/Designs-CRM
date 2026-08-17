import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => {
  const tx = {
    user: { update: vi.fn(), updateMany: vi.fn() },
    googleEncryptedCredential: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    telegramConnection: {
      upsert: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    telegramEncryptedCredential: { upsert: vi.fn() },
  };
  return {
    tx,
    prisma: {
      user: { findUnique: vi.fn(), findMany: vi.fn() },
      telegramConnection: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        updateMany: vi.fn(),
      },
      $transaction: vi.fn((work) => work(tx)),
    },
  };
});

vi.mock("../../prisma/prisma.js", () => ({ default: database.prisma }));

import { googleCalendarRepository } from "../../../modules/calendar/google/google.repo.js";
import { telegramAuthRepo } from "../../../modules/telegram/auth/telegram.repo.js";

const metadata = {
  algorithm: "AES-256-GCM",
  keyVersion: 1,
  dataIv: "data-iv",
  dataAuthTag: "data-tag",
  wrappedDataKey: "wrapped-key",
  keyIv: "key-iv",
  keyAuthTag: "key-tag",
};

describe("transactional integration credential storage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    database.tx.user.update.mockResolvedValue({ id: 7 });
    database.tx.telegramConnection.upsert.mockResolvedValue({
      id: 3,
      status: "CONNECTED",
      isActive: true,
    });
  });

  it("writes Google ciphertext and metadata atomically without plaintext", async () => {
    const result = await googleCalendarRepository.replaceEncryptedCredentials({
      userId: 7,
      ciphertext: "ciphertext-only",
      metadata,
      tokenExpiresAt: new Date("2030-01-01T00:00:00Z"),
      calendarId: null,
    });

    expect(database.prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(database.tx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          googleRefreshToken: null,
          googleAccessToken: null,
        }),
        select: { id: true },
      }),
    );
    expect(database.tx.googleEncryptedCredential.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: { userId: 7, ciphertext: "ciphertext-only", ...metadata },
      }),
    );
    expect(result).toEqual({ id: 7 });
    expect(JSON.stringify(result)).not.toMatch(/ciphertext|refresh|access/i);
  });

  it("writes Telegram ciphertext and metadata atomically without plaintext", async () => {
    const result = await telegramAuthRepo.upsertMainConnection({
      ciphertext: "ciphertext-only",
      metadata,
      status: "CONNECTED",
      updatedByUserId: 9,
    });

    expect(database.prisma.$transaction).toHaveBeenCalledTimes(1);
    const call = database.tx.telegramConnection.upsert.mock.calls[0][0];
    expect(call.create).toEqual(
      expect.objectContaining({
        apiId: null,
        apiHash: null,
        sessionString: null,
      }),
    );
    expect(call.update).toEqual(
      expect.objectContaining({
        apiId: null,
        apiHash: null,
        sessionString: null,
      }),
    );
    expect(database.tx.telegramEncryptedCredential.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: {
          telegramConnectionId: 3,
          ciphertext: "ciphertext-only",
          ...metadata,
        },
      }),
    );
    expect(result).toEqual({ id: 3, status: "CONNECTED", isActive: true });
    expect(JSON.stringify(result)).not.toMatch(/ciphertext|apiHash|session/i);
  });

  it("rejects the legacy Telegram plaintext write seam", () => {
    expect(() =>
      telegramAuthRepo.updateMainConnectionFields({
        fieldsToUpdate: { sessionString: "must-not-be-stored" },
      }),
    ).toThrowError("TELEGRAM_PLAINTEXT_CREDENTIAL_WRITE_REJECTED");
    expect(database.prisma.telegramConnection.updateMany).not.toHaveBeenCalled();
  });
});
