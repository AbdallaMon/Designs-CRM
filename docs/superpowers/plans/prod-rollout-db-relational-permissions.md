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

## Package scripts (in `@dms/db`)

All rollout steps are npm scripts on the `@dms/db` package (`packages/db/package.json`), so you
run them **from the package** — no raw `npx prisma …` / `node …/seed.js` paths to remember:

| Script | Runs | Purpose |
|---|---|---|
| `migrate:status` | `prisma migrate status` | check applied/pending migrations |
| `migrate:deploy` | `prisma migrate deploy` | apply pending migrations (prod-safe, no shadow DB, no reset) |
| `seed` | `node prisma/seed.js` | upsert the PermissionCode/Profile/ProfilePermission catalog |
| `migrate:users` | `node scripts/migrate-users-to-profiles.js` | dry-run by default; assign UserProfiles + set currentProfileId with explicit apply flags |
| `prod:rollout` | `migrate:deploy && seed && migrate:users -- --apply --backup-confirmed` | the three data steps in order (one-shot) |

Run any of them from the repo root with `-w @dms/db`, or after `cd packages/db`:

```bash
npm run <script> -w @dms/db      # from repo root
# or:  cd packages/db && npm run <script>
```

## Step 0 — point at PRODUCTION

The scripts read `DATABASE_URL` from the environment (the dev `packages/db/prisma/.env` is
git-ignored and absent on a prod checkout). Export it for this shell session:

```bash
export DATABASE_URL="mysql://<user>:<pass>@<prod-host>:3306/<db>"   # bash/sh
# PowerShell:  $env:DATABASE_URL = "mysql://<user>:<pass>@<prod-host>:3306/<db>"
```

## Ordered steps (run with DATABASE_URL → PRODUCTION)

1. **Check status (should be clean before you start).**
   ```bash
   npm run migrate:status -w @dms/db
   ```
   Expect the reconciled history "up to date" (per `prod-migration-runbook.md`). If it reports a
   CHECKSUM MISMATCH, STOP and reconcile first.

2. **Migrate (schema only, additive).**
   ```bash
   npm run migrate:deploy -w @dms/db
   ```
   Applies `20260703194146_add_relational_permissions` (pure CREATE TABLE + ADD COLUMN + FKs).
   `deploy` never uses a shadow DB and never resets. Re-confirm with `npm run migrate:status -w @dms/db`
   → "Database schema is up to date!".

3. **Seed the catalog (idempotent upsert).**
   ```bash
   npm run seed -w @dms/db
   ```
   Upserts `PermissionCode` (from `ALL_PERMISSIONS`), `Profile` (from `PROFILE_META`), and
   `ProfilePermission` (diff-synced from the code-defined `PROFILES`). Prints
   `✅ Seed: N codes, M profiles, +X/-Y links`; a re-run prints `+0/-0 links`.

4. **Migrate users → profiles (idempotent, no truncation).**
   ```bash
   npm run migrate:users -w @dms/db
   npm run migrate:users -w @dms/db -- --apply --backup-confirmed
   npm run migrate:users -w @dms/db
   ```
   For every user: assigns a `UserProfile` per profile derived from
   `role`+`isPrimary`+`isSuperSales`+`subRoles`, and sets `currentProfileId` **only if null**.
   The first and last commands are read-only previews. The final preview must report
   `usersMissingCurrentProfile: 0`.

   > **Or run steps 2–4 as one command:** `npm run prod:rollout -w @dms/db`
   > (chains `migrate:deploy && seed && migrate:users`). Prefer the individual steps the first
   > time so you can eyeball each result.

5. **Deploy the new server + web.** Because steps 2–4 populated the data, every user already has a
   `currentProfile` when the new code goes live. The server also runs an idempotent boot backfill
   (safety net) and loads the profile→codes cache on boot.

6. **Smoke-check.** Log in as a known multi-role user; `/auth/me` should carry `profiles[]` +
   `currentProfileId`; the header profile switcher appears; switching changes permissions/nav.

## Staleness contract (unchanged from master)
The access token carries `currentProfileId` + `profileIds`; `requireAuth` resolves codes from the in-process cache (zero per-request DB read). An admin's profile reassignment takes effect on the target's next **refresh** (which re-validates + re-mints) — i.e. within one access-token TTL, exactly like a role change on master. The switch endpoint re-mints immediately.

## Rollback
Redeploy the previous server/web build. The old code reads `role`/`profile`(string)/`subRoles` (all retained + kept in sync by the assign/switch flows) and the code-defined `PROFILES` map, so it functions with the new tables simply unused. No data migration is reversed; the new tables are inert under old code.

## Cache invalidation note
The profile→codes cache is loaded on boot. If you edit the catalog (re-run the seed) on a running instance without a redeploy, call the cache's `invalidate()` (or restart the instance) so the change is picked up. Per-user profile assignments do NOT require cache invalidation (they are resolved from the token, not the profile cache).

## Troubleshooting — `P2022: column … does not exist` on `migrate:users` (schema drift)

**Symptom.** `migrate:users` (or the running app) throws `PrismaClientKnownRequestError P2022: The column
'…User.<col>' does not exist`. A MySQL `UPDATE` has no `RETURNING`, so Prisma reads the row back
selecting every scalar — and errors on any column the live DB is missing. (The script now uses
`select: { id }` on that update, but the app itself will still hit this on other reads.)

**Cause.** The target DB was NOT built from the current schema — it's an older/partial copy missing
columns (and often FKs/indexes). This happens when a Coolify DB was created from an old dump, or when
the reconciliation runbook marked `catch_up_full_schema` `--applied` (metadata only) on a DB that was
actually behind the reconciled schema.

**Decide first — is the data disposable or real?**
- **Disposable / fresh:** rebuild cleanly — `npx prisma migrate reset --force --skip-seed` then
  `npm run seed -w @dms/db`. Gives the exact correct structure (all columns, enums, FKs).
- **Real data to keep:** bring the structure up to the schema IN PLACE, applying **only the column /
  type changes** and skipping the FK/index/rename statements (Prisma manages relations at the app
  layer, so DB-level FKs aren't needed to run):

```bash
cd /app
# 1) full diff (live DB → schema)
npx prisma migrate diff \
  --from-schema-datasource packages/db/prisma/schema.prisma \
  --to-schema-datamodel   packages/db/prisma/schema.prisma \
  --script > /tmp/drift.sql
# 2) keep ONLY the ALTER TABLE (ADD COLUMN / MODIFY) blocks — drop FK/index/rename
awk '/^-- / { keep = ($0 ~ /^-- AlterTable/); next } keep { print }' /tmp/drift.sql > /tmp/cols.sql
# 3) verify no DATA-LOSS op (DROP DEFAULT is harmless — it only removes a column default)
grep -iE 'drop[[:space:]]+(column|table)|truncate' /tmp/cols.sql && echo "STOP - review /tmp/cols.sql" || echo "SAFE"
# 4) apply, then finish
npx prisma db execute --schema packages/db/prisma/schema.prisma --file /tmp/cols.sql
npm run migrate:users -w @dms/db -- --apply --backup-confirmed
```

The skipped foreign keys/indexes are optional hardening — add them later from `/tmp/drift.sql` **after**
cleaning orphaned rows (a `DROP DEFAULT` in the diff is safe; a `DROP COLUMN`/`DROP TABLE`/`TRUNCATE` is
not — stop and review if `grep` flags one). NOTE: without DB-level FKs, `ON DELETE CASCADE` won't fire
at the DB layer — verify delete flows or add the FKs before relying on cascades.
