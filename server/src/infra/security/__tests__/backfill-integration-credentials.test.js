import { describe, expect, it, vi } from "vitest";

import { runIntegrationCredentialBackfill } from "../backfill-integration-credentials.js";
import { IntegrationCredentialEncryptionService } from "../integration-credential-encryption.js";

const MASTER_KEY = Buffer.alloc(32, 11).toString("base64");

describe("integration credential legacy backfill", () => {
  it("encrypts legacy values, supports a clean rerun, and passes no plaintext to storage", async () => {
    const encryptionService = new IntegrationCredentialEncryptionService({ masterKey: MASTER_KEY });
    const googleRepository = {
      listLegacyCredentials: vi
        .fn()
        .mockResolvedValueOnce([
          {
            id: 1,
            googleRefreshToken: "legacy-google-refresh",
            googleAccessToken: "legacy-google-access",
          },
        ])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]),
      backfillLegacyCredentials: vi.fn().mockResolvedValue(true),
    };
    const telegramRepository = {
      listLegacyCredentials: vi
        .fn()
        .mockResolvedValueOnce([
          {
            id: 2,
            apiId: "123",
            apiHash: "legacy-telegram-hash",
            sessionString: "legacy-telegram-session",
          },
        ])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]),
      backfillLegacyCredentials: vi.fn().mockResolvedValue(true),
    };

    const first = await runIntegrationCredentialBackfill({
      googleRepository,
      telegramRepository,
      encryptionService,
      batchSize: 10,
    });
    const second = await runIntegrationCredentialBackfill({
      googleRepository,
      telegramRepository,
      encryptionService,
      batchSize: 10,
    });

    expect(first).toEqual({
      google: { scanned: 1, backfilled: 1, skipped: 0 },
      telegram: { scanned: 1, backfilled: 1, skipped: 0 },
    });
    expect(second).toEqual({
      google: { scanned: 0, backfilled: 0, skipped: 0 },
      telegram: { scanned: 0, backfilled: 0, skipped: 0 },
    });

    const googleWrite = googleRepository.backfillLegacyCredentials.mock.calls[0][0];
    const telegramWrite = telegramRepository.backfillLegacyCredentials.mock.calls[0][0];
    expect(JSON.stringify(googleWrite)).not.toMatch(/legacy-google/);
    expect(JSON.stringify(telegramWrite)).not.toMatch(/legacy-telegram/);
    expect(
      encryptionService.decrypt({
        ciphertext: googleWrite.ciphertext,
        metadata: googleWrite.metadata,
      }),
    ).toEqual({
      refreshToken: "legacy-google-refresh",
      accessToken: "legacy-google-access",
    });
    expect(
      encryptionService.decrypt({
        ciphertext: telegramWrite.ciphertext,
        metadata: telegramWrite.metadata,
      }),
    ).toEqual({
      apiId: "123",
      apiHash: "legacy-telegram-hash",
      sessionString: "legacy-telegram-session",
    });
  });
});
