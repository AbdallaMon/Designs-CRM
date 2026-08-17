# Integration Credentials Encryption at Rest — Design

- **Date:** 2026-08-16
- **Scope:** Stored Google Calendar OAuth tokens and Telegram connection credentials only
- **Status:** Approved for implementation by the Agent 11 task brief
- **Production access:** Prohibited; rollout commands are user-run

## Problem

Google access/refresh tokens currently live in `User.googleAccessToken` and
`User.googleRefreshToken`. Telegram API/session credentials currently live in
`TelegramConnection.apiId`, `apiHash`, and `sessionString`. These values are plaintext at rest.
The current environment has JWT, database, Google, and Telegram secrets but no dedicated
credential-encryption key.

## Cryptographic design

- Require `INTEGRATION_CREDENTIALS_MASTER_KEY`, encoded as base64 for exactly 32 bytes.
- Never fall back to or derive from JWT, database, Google, Telegram, or other application secrets.
- Use Node's built-in crypto implementation; no package dependency is needed.
- Use envelope encryption per owner record:
  1. generate a random 32-byte data-encryption key (DEK);
  2. encrypt a versioned JSON credential payload with AES-256-GCM and a random 12-byte IV;
  3. wrap the DEK with the master key using AES-256-GCM and a separate random 12-byte IV;
  4. store ciphertext on the owner and IV/tag/wrapped-key metadata in its 1:1 metadata row.
- Authenticate fixed versioned context as AAD. Missing/invalid keys, unknown algorithms or key
  versions, malformed metadata, tampered ciphertext, and invalid JSON all fail closed with stable,
  non-secret errors.
- No ciphertext, IV, tag, wrapped key, master key, or decrypted credential is returned by an HTTP
  DTO or written to logs.

## Additive data model

Add one narrowly scoped sealed-credential model per existing owner:

- `GoogleEncryptedCredential`, uniquely keyed by `userId`
- `TelegramEncryptedCredential`, uniquely keyed by `telegramConnectionId`

Each 1:1 row stores ciphertext plus algorithm, key version, payload IV/tag, wrapped DEK, and DEK-wrap
IV/tag. This is the repository's encryption-metadata convention collapsed into a sealed credential
row, so ordinary Prisma owner reads cannot accidentally include ciphertext. The relation cascades on
owner deletion, and absence of the relation means that integration is unconfigured or still awaiting
legacy backfill.

## Runtime behavior and compatibility

- New Google and Telegram credential writes encrypt first, then write owner ciphertext and 1:1
  metadata in the same Prisma transaction while clearing the corresponding legacy plaintext fields.
- Reads prefer encrypted storage and decrypt only inside trusted backend flows. During the documented
  migration window only, they fall back to existing plaintext columns when ciphertext is absent.
- Connection/status DTO behavior remains unchanged. Status checks use ciphertext presence first and
  legacy refresh-token presence only during the transition.
- Google OAuth exchange, refresh, revoke, calendar identity, self-scoping, and Agent 8's nonce/error
  hardening keep their observable behavior.
- Telegram auth steps, health checks, manager configuration, stable errors, and Agent 8's response
  redaction keep their observable behavior.

## Rollout: additive → backfill → constrain

1. **Prerequisite:** generate and securely provision a dedicated master key on every server/worker.
2. **Additive deploy:** apply the generated migration, then deploy dual-read/encrypted-write code.
3. **Backfill:** the user runs the repository command against the intended environment. It encrypts
   legacy rows, clears plaintext, and reports counts only.
4. **Verify:** rerun in dry/check mode and confirm zero legacy credential rows remain.
5. **Constrain (future change):** after the migration window, remove legacy read fallback and legacy
   plaintext columns in a separate migration. This task does not perform that destructive step.

The agent never runs the backfill or any migration command against production.

## Key generation and handling

Generate a real key outside source control:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Store the output as `INTEGRATION_CREDENTIALS_MASTER_KEY` in the deployment secret manager. The
committed `.env.example` contains only a non-working placeholder. Key rotation is represented by
`keyVersion`; rotation implementation is deliberately outside this rollout.

## Verification

- crypto round trip;
- randomized ciphertext for identical plaintext;
- tampered ciphertext/tag rejection;
- missing/wrong master key rejection;
- transactional writes never persist plaintext and always pair owner + metadata;
- encrypted reads plus legacy-read/backfill transition;
- existing Google/Telegram focused behavior tests;
- Prisma validate, generate, and migration/schema drift check.
