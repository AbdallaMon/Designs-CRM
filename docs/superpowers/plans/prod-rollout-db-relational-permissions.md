# Production rollout — DB-relational permissions & switchable profiles

> **User-run.** The agent never touches production. This is the ordered, DATA-BEFORE-CODE
> rollout for the feature in `docs/superpowers/specs/2026-07-03-db-relational-permissions-design.md`.
> Everything is additive + idempotent (upsert-only). **NEVER** `prisma migrate reset | migrate dev | db push` on prod.

## What ships
- 5 new tables: `PermissionCode`, `Profile`, `ProfilePermission`, `UserProfile`, `AuthAuditLog` + `User.currentProfileId` (nullable FK). Migration: `20260703194146_add_relational_permissions` (pure `CREATE TABLE` + `ADD COLUMN` + FKs — no drops).
- No columns dropped: `User.role`, `User.profile` (string), `User.isPrimary`, `User.isSuperSales`, `UserSubRole` are all RETAINED for rollback.

## Preconditions
- Fresh FULL prod backup taken NOW (`mysqldump --single-transaction --routines --triggers`).
- The migration-history reconciliation runbook (`prod-migration-runbook.md`) has already been run once on prod (so `migrate status` is clean before this).
- Deploy artifact built from the merged branch.

## Ordered steps (run with DATABASE_URL → PRODUCTION)

1. **Migrate (schema only, additive).**
   ```
   npx prisma migrate deploy --schema packages/db/prisma/schema.prisma
   ```
   Applies `20260703194146_add_relational_permissions`. `deploy` never uses a shadow DB and never resets. Confirm with `npx prisma migrate status` → "up to date".

2. **Seed the catalog (idempotent upsert).**
   ```
   node packages/db/prisma/seed.js
   ```
   Upserts `PermissionCode` (from `ALL_PERMISSIONS`), `Profile` (from `PROFILE_META`), and `ProfilePermission` (diff-synced from the code-defined `PROFILES`). Re-runnable; prints `+0/-0 links` on a no-op.

3. **Migrate users → profiles (idempotent, no truncation).**
   ```
   node packages/db/scripts/migrate-users-to-profiles.js
   ```
   For every user: assigns a `UserProfile` per profile derived from `role`+`isPrimary`+`isSuperSales`+`subRoles`, and sets `currentProfileId` **only if null**. Re-runs report `currents set: 0`.

4. **Deploy the new server + web.** Because steps 1–3 populated the data, every user already has a `currentProfile` when the new code goes live. The server also runs an idempotent boot backfill (safety net) and loads the profile→codes cache on boot.

5. **Smoke-check.** Log in as a known multi-role user; `/auth/me` should carry `profiles[]` + `currentProfileId`; the header profile switcher appears; switching changes permissions/nav.

## Staleness contract (unchanged from master)
The access token carries `currentProfileId` + `profileIds`; `requireAuth` resolves codes from the in-process cache (zero per-request DB read). An admin's profile reassignment takes effect on the target's next **refresh** (which re-validates + re-mints) — i.e. within one access-token TTL, exactly like a role change on master. The switch endpoint re-mints immediately.

## Rollback
Redeploy the previous server/web build. The old code reads `role`/`profile`(string)/`subRoles` (all retained + kept in sync by the assign/switch flows) and the code-defined `PROFILES` map, so it functions with the new tables simply unused. No data migration is reversed; the new tables are inert under old code.

## Cache invalidation note
The profile→codes cache is loaded on boot. If you edit the catalog (re-run the seed) on a running instance without a redeploy, call the cache's `invalidate()` (or restart the instance) so the change is picked up. Per-user profile assignments do NOT require cache invalidation (they are resolved from the token, not the profile cache).
