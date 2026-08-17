# Integration Credentials Encryption at Rest — Implementation Plan

**Goal:** Encrypt persisted Google OAuth and Telegram credentials without changing their runtime
behavior, while supporting a safe, user-operated production backfill window.

## Constraints

- Modify only the task-owned schema/migration, credential repos/usecases, security service/tests,
  focused docs, and the safe environment example placeholder.
- JavaScript only. No production database access. No manual migration SQL.
- Preserve Agent 8's OAuth state, self-scope, provider-error redaction, Telegram response redaction,
  and health behavior.

## Task 1 — Additive schema and generated migration

- Add dedicated 1:1 sealed-credential models containing ciphertext and encryption metadata.
- Run `npm run db:migrate -- --name encrypt_integration_credentials` against the configured local
  development database so Prisma generates exactly one migration.
- Inspect the generated SQL; do not hand-author or apply SQL to production.

## Task 2 — Encryption service

- Add `server/src/infra/security/integration-credential-encryption.js` using Node crypto.
- Validate `INTEGRATION_CREDENTIALS_MASTER_KEY` as base64 decoding to exactly 32 bytes.
- Implement AES-256-GCM envelope encrypt/decrypt with random payload and wrapping IVs, stable
  non-secret errors, algorithm/version/AAD validation, and injectable randomness/key for tests.
- Add the environment-loader entry and a safe placeholder to root `.env.example` only.

## Task 3 — Transactional Google storage

- Extend the Google repository with raw encrypted/legacy reads and transactional encrypted writes,
  refresh writes, disconnect cleanup, and conditional legacy backfill.
- Route only Google credential persistence through the repository/encryption service; retain existing
  provider call order, user scoping, metadata fields, and calendar behavior.
- Make status derive from encrypted credential presence with legacy fallback during the window.

## Task 4 — Transactional Telegram storage

- Make the Telegram usecase encrypt credential payloads before persistence and decrypt repository
  storage before configuring the manager.
- Make repository upsert/session updates write owner ciphertext + metadata atomically and clear legacy
  credential fields. Keep non-secret status/phone updates unchanged.
- Preserve the existing internal return shape consumed by startup/auth flows and the safe public DTO.

## Task 5 — User-run backfill

- Add a focused JavaScript backfill entry point under `server/src/infra/security`.
- Page through legacy Google/Telegram rows, encrypt each payload, and use conditional transactional
  repository writes so concurrent new writes win safely.
- Print only scanned/backfilled/skipped counts. Never print credentials or cryptographic material.
- Document the exact production command, prerequisites, verification, rerun safety, and stop rules.

## Task 6 — Tests and verification

- Add crypto tests for round trip, nondeterminism, tamper rejection, and wrong/missing keys.
- Add focused repository/usecase tests proving no plaintext storage writes, atomic metadata writes,
  encrypted reads, and legacy/backfill transition.
- Run existing Agent 8 Google/Telegram focused tests.
- Run Prisma format/validate/generate, focused Vitest suites, and migration/schema drift verification
  against a throwaway local database only.
- Review the final scoped diff for secrets, logs, ciphertext exposure, and unrelated edits.
