import { pathToFileURL } from "node:url";

import { googleCalendarRepository } from "../../modules/calendar/google/google.repo.js";
import { telegramAuthRepo } from "../../modules/telegram/auth/telegram.repo.js";
import {
  IntegrationCredentialEncryptionError,
  integrationCredentialEncryption,
} from "./integration-credential-encryption.js";

async function backfillGoogle({ repository, encryptionService, batchSize }) {
  const counts = { scanned: 0, backfilled: 0, skipped: 0 };
  let cursor;
  while (true) {
    const rows = await repository.listLegacyCredentials({ cursor, take: batchSize });
    if (rows.length === 0) return counts;
    for (const row of rows) {
      counts.scanned += 1;
      const encrypted = encryptionService.encrypt({
        refreshToken: row.googleRefreshToken ?? null,
        accessToken: row.googleAccessToken ?? null,
      });
      const updated = await repository.backfillLegacyCredentials({
        userId: row.id,
        ciphertext: encrypted.ciphertext,
        metadata: encrypted.metadata,
      });
      counts[updated ? "backfilled" : "skipped"] += 1;
    }
    cursor = rows.at(-1).id;
  }
}

async function backfillTelegram({ repository, encryptionService, batchSize }) {
  const counts = { scanned: 0, backfilled: 0, skipped: 0 };
  let cursor;
  while (true) {
    const rows = await repository.listLegacyCredentials({ cursor, take: batchSize });
    if (rows.length === 0) return counts;
    for (const row of rows) {
      counts.scanned += 1;
      const encrypted = encryptionService.encrypt({
        apiId: row.apiId ?? null,
        apiHash: row.apiHash ?? null,
        sessionString: row.sessionString ?? null,
      });
      const updated = await repository.backfillLegacyCredentials({
        connectionId: row.id,
        ciphertext: encrypted.ciphertext,
        metadata: encrypted.metadata,
      });
      counts[updated ? "backfilled" : "skipped"] += 1;
    }
    cursor = rows.at(-1).id;
  }
}

export async function runIntegrationCredentialBackfill({
  googleRepository = googleCalendarRepository,
  telegramRepository = telegramAuthRepo,
  encryptionService = integrationCredentialEncryption,
  batchSize = 100,
} = {}) {
  const google = await backfillGoogle({
    repository: googleRepository,
    encryptionService,
    batchSize,
  });
  const telegram = await backfillTelegram({
    repository: telegramRepository,
    encryptionService,
    batchSize,
  });
  return { google, telegram };
}

function formatCounts(result) {
  return [
    "INTEGRATION_CREDENTIAL_BACKFILL_COMPLETE",
    `google_scanned=${result.google.scanned}`,
    `google_backfilled=${result.google.backfilled}`,
    `google_skipped=${result.google.skipped}`,
    `telegram_scanned=${result.telegram.scanned}`,
    `telegram_backfilled=${result.telegram.backfilled}`,
    `telegram_skipped=${result.telegram.skipped}`,
  ].join(" ");
}

const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  try {
    const result = await runIntegrationCredentialBackfill();
    console.log(formatCounts(result));
  } catch (error) {
    const code =
      error instanceof IntegrationCredentialEncryptionError
        ? error.code
        : "INTEGRATION_CREDENTIAL_BACKFILL_FAILED";
    console.error(code);
    process.exitCode = 1;
  }
}
