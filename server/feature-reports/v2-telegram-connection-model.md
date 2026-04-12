# v2 Telegram Connection Model

## 1) Summary

Added a new Prisma model for Telegram connection/session storage in DB (instead of relying only on .env), including connection status and audit fields.

## 2) Files Created/Updated/Deleted

- Updated: prisma/schema.prisma
- Created: prisma/add-telegram-connection-model.sql
- Created: feature-reports/v2-telegram-connection-model.md

## 3) API Changes

No API endpoints were added in this step.

## 4) Data/Model Changes

Added enum:

- `TelegramConnectionStatus`
  - `CONNECTED`
  - `DISCONNECTED`
  - `INVALID_SESSION`

Added model:

- `TelegramConnection`
  - `id` (PK)
  - `name` (unique, default `MAIN`)
  - `apiId` (nullable)
  - `apiHash` (nullable)
  - `sessionString` (nullable text)
  - `isActive` (default true)
  - `status` (default `DISCONNECTED`)
  - `lastCheckedAt` (nullable)
  - `lastConnectedAt` (nullable)
  - `lastError` (nullable text)
  - `updatedByUserId` (nullable FK to `User`)
  - `createdAt`
  - `updatedAt`

Updated `User` model:

- Added relation field: `telegramConnectionsUpdated`

## 5) Validation/Security Changes

- No API validation changes in this step.
- Session is now prepared to be persisted in DB schema rather than .env.

## 6) Migration Details

A standalone SQL migration file was created outside `prisma/migrations` as requested:

- `prisma/add-telegram-connection-model.sql`

It creates:

- `TelegramConnection` table
- unique index on `name`
- indexes on `isActive` and `updatedByUserId`
- FK constraint to `User(id)` with `ON DELETE SET NULL`

## 7) Manual Test Checklist

1. Run Prisma format/validate to confirm schema validity.
2. Apply SQL manually on DB:
   - `source prisma/add-telegram-connection-model.sql` (or execute in DB client).
3. Verify table exists with expected columns and indexes.
4. Insert a row (`MAIN`) and ensure defaults are applied.
5. Update `updatedByUserId` with existing user id and verify FK.

## 8) Risks/Known Limitations

- This step does not include application logic/API usage yet.
- `name` is unique, so only one `MAIN` row is expected unless other names are intentionally used.
- Active-row uniqueness (single active config) is not DB-enforced here; it should be handled in usecase logic in next steps.
