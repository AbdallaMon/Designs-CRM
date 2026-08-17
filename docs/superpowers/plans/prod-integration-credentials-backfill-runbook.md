# Production Integration-Credential Backfill Runbook

This is a **user-run** rollout. The agent does not access production.

## Preconditions

1. Take and verify a current full production backup.
2. Generate a dedicated 32-byte key:

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
   ```

3. Store it as `INTEGRATION_CREDENTIALS_MASTER_KEY` in the backend secret manager on every server
   and worker. Do not reuse or derive it from any existing secret, and do not commit or print it.
4. Deploy migration `20260816172257_encrypt_integration_credentials` using the normal production
   `prisma migrate deploy` workflow. Never use `migrate dev`, `db push`, or `migrate reset` on
   production.
5. Deploy the dual-read/encrypted-write application code and smoke-test Google/Telegram connection
   status before backfill.

## Backfill

Run once from the repository root with the production environment loaded:

```powershell
node --env-file=server/.env.production server/src/infra/security/backfill-integration-credentials.js
```

The command prints counts only. It never prints plaintext, ciphertext, IVs, tags, wrapped keys, or
the master key. A successful run exits zero and prints `INTEGRATION_CREDENTIAL_BACKFILL_COMPLETE`.

The update is idempotent and race-safe: it writes only rows that still have no ciphertext, and each
owner/ciphertext update plus its 1:1 metadata upsert is one transaction. A concurrent new encrypted
write wins; that row is reported as skipped.

## Verify

Run the same command again. Expected counts:

```text
google_scanned=0 google_backfilled=0 telegram_scanned=0 telegram_backfilled=0
```

Then smoke-test:

- Google status, calendar operation/refresh, and disconnect;
- Telegram startup health, OTP/password auth if needed, and session reuse after restart.

Do not inspect or export credential columns. If the command returns a master-key or decryption error,
stop and verify that every process has the exact same dedicated key. Do not rotate or replace the key
after encrypted rows exist without a separately reviewed rotation procedure.

## Later constrain step

Keep the dual-read fallback for the documented migration window. After all environments have zero
legacy rows and have completed smoke testing, schedule a separate change to remove the plaintext
columns and fallback readers. That destructive constrain migration is intentionally not part of this
rollout.
