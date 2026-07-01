# Design — Reconcile Prisma migration history with the real production DB

- **Date:** 2026-07-01
- **Branch:** `frontend-redesign`
- **Status:** VERIFIED — decisions locked; ready for implementation plan (`writing-plans`)
- **Source of truth:** production backup `C:\coding\backup\dreamstudiio\drea_studio_db.sql` (structure-only phpMyAdmin dump, MariaDB 10.11)
- **Baseline shape (user-chosen):** keep the 3 old migrations + a **regenerated** catch-up (the current one is broken — see Verification result)
- **10 prod-only columns (user-chosen):** adopt prod reality via `prisma db pull` — keep all 10
- **Relationship to the permissions work:** ORTHOGONAL. The permissions-parity spec needs no schema change. This is a separate sub-project.

---

## 1. Problem

Master recorded only **3 Prisma migrations** (Jan 2025). Everything since was applied **by hand in MySQL** and left as loose `.sql` files that Prisma's `_prisma_migrations` table never recorded:
- `complete-chat-migration.sql` — 17 chat tables (ChatRoom, ChatMessage, Call, …)
- `add-telegram-connection-model.sql` — TelegramConnection
- `v2-booking-leads-alters.sql` — ClientLead/Client booking columns
- `add-v2-notification-types.sql` — NotificationType enum values (applied iteratively)

Consequences:
- A fresh DB built from the migration files does **not** reproduce production.
- You cannot `prisma migrate deploy` on production — it already has those tables from the manual SQL, so deploy would collide.
- The codebase has **three competing** `schema.prisma` + `migrations/` locations (`packages/db`, `server/prisma`, `server/src/infra/prisma`) — a drift hazard.

## 2. Findings (verified this session)

- **`packages/db/prisma/migrations/20260612040000_catch_up_full_schema`** already exists (2243 lines) — a Prisma-generated diff from the 3-old-migrations state to the full current `schema.prisma`. It is the baseline attempt; it must be *proven* against prod.
- **Table-level parity is clean:** prod backup has 111 tables = 110 models + `_prisma_migrations`. Every prod table exists in `schema.prisma`; every model exists in prod. Zero table-level drift.
- **Highest-risk enum is clean:** `NotificationType` matches prod exactly (all 36 values incl. the iteratively hand-added `LEAD_CREATED`, `LEAD_SUBMITTED`, `LEAD_STATUS_CHANGED`, `TELEGRAM_REAUTH_NEEDED`).
- Prod `_prisma_migrations` rows are not in the dump (structure-only), but master's files tell us prod recorded only the 3 old migrations.

## 3. Verification method (definitive)

Read-only w.r.t. production (uses only the local backup + a throwaway container):
1. Start MariaDB 10.11 in Docker; load the prod backup into `prod_truth`.
2. Apply the committed migrations (3 old + catch_up) to an empty `mig_truth` via `prisma migrate deploy`.
3. `prisma migrate diff --from-url prod_truth --to-url mig_truth --script --exit-code`.
   - **Exit 0 / empty script ⇒ the migration files reproduce production exactly.**
   - Non-empty ⇒ the exact delta to fold into a corrected catch-up.

### Verification result (Docker, MariaDB 10.11, executed 2026-07-01)

Definitive, and it changes the plan:

- **Prod backup loads cleanly → 111 tables** (110 models + `_prisma_migrations`).
- ❌ **The committed migrations do NOT build a fresh DB.** `prisma migrate deploy` applies the 3 old migrations, then `catch_up_full_schema` **fails**: `P3018 … errno 150 "Foreign key constraint is incorrectly formed"` at `CREATE TABLE TextLong`.
- ❌ **`schema.prisma` itself is unbuildable.** A baseline generated straight from `schema.prisma` (`migrate diff --from-empty --to-schema-datamodel`) **also fails** — errno 150 on `ALTER TABLE TextLong ADD CONSTRAINT TextLong_conId_fkey … REFERENCES Con(id)`. So the fault is in `schema.prisma`, not merely the hand-edited catch-up. (Prod has **no** such FK; `schema.prisma` declares a relation Prisma renders as an FK MySQL rejects.)
- ✅ **A baseline introspected from PROD works.** `migrate diff --from-empty --to-url <prod>` → `baseline_from_prod.sql` (2463 lines) **applies cleanly to a fresh DB (110 tables)** and **equals prod exactly** (`migrate diff prod ↔ rebuilt = 0 differences`). **This is our known-good baseline.**
- ⚠️ **`schema.prisma` has drifted from prod** (clean `migrate diff --from-url prod --to-schema-datamodel schema` = 1709 lines):
  - **10 columns exist in PROD but not in `schema.prisma`:** `User.baseSalaryId`, `User.hasLogs`, `User.monthlySalaryId`, `Outcome.monthlySalaries`, `Outcome.operationalExpenses`, `Outcome.rentPeriods`, `BaseEmployeeSalary.notes`, `OperationalExpenses.notes`, `Rent.notes`, `RentPeriod.notes`. (0 columns exist in schema but not prod.)
  - **141 DropForeignKey / 134 AddForeignKey** — prod's FKs use ad-hoc manual names (`fk_accountant`, `Answer_ibfk_1`); Prisma wants its `Table_col_fkey` convention. Cosmetic, but churny.
  - **250 MODIFY + 4 AlterColumn + 52 DropIndex / 4 CreateIndex** — **cosmetic** (108 are `DATETIME(3)` default/precision restatements; VARCHAR→191 length normalization; `DEFAULT 0` vs `0.00`). No dangerous type conversions.
- **Artifacts (scratchpad):** `baseline_from_prod.sql`, `baseline_from_schema.sql`, `clean_prod_to_schema.sql`, `diff_prod_vs_baselineFromProd.sql`.

**Two distinct problems, not one:**
1. **Migration-history drift** (your stated concern) — solvable with the prod-introspected baseline + `resolve --applied`.
2. **`schema.prisma` ↔ prod model drift** (discovered) — `schema.prisma` lacks 10 prod columns, uses different FK/index/type details, and is currently **unbuildable**. **Consequence: `prisma migrate dev` from today's `schema.prisma` would try to DROP those 10 production columns and rename 141 FKs.** This is the dangerous one.

## 4. Plan (baseline = introspected-from-prod)

**4.1 Baseline content = `baseline_from_prod.sql`.** The committed `catch_up_full_schema` is broken; replace it. To honor "keep 3 old + catch-up", regenerate the catch-up as the `(3-old-migrations state) → prod` diff (computed against a shadow DB loaded from the 3 old migrations, target = prod), verified by the §3 Docker method until it builds cleanly AND `migrate diff` vs prod = 0. (Simpler alternative if you prefer: one squashed `0_init` from prod — cleaner history, but you chose keep-3-old, so this is the fallback.)

**4.2 Consolidate to one canonical location.** Make `packages/db/prisma` the single source of truth for schema + migrations. Retire/remove the duplicate `server/prisma` and `server/src/infra/prisma` schema+migration copies (or reduce them to re-exports) so only one migrations folder is ever used. Delete the loose `.sql` files once confirmed folded into the baseline. Ensure app + scripts point at `@dms/db`.

**4.3 Reconcile production's migration history (metadata-only — the one prod-touching step).** On production run, in order:
```
# 1. BACK UP production first (mysqldump) — non-negotiable.
# 2. Point DATABASE_URL at production.
npx prisma migrate resolve --applied 20250118182131_init
npx prisma migrate resolve --applied 20250118223321_price_offer_url
npx prisma migrate resolve --applied 20250120212545_added_some_e_num
npx prisma migrate resolve --applied 20260612040000_catch_up_full_schema
npx prisma migrate status   # expect: "Database schema is up to date."
```
`migrate resolve --applied` writes a row to `_prisma_migrations` **without running the SQL** — safe because §3 proved prod already equals the catch-up end-state. (The first three may already be marked applied on prod; `resolve` is idempotent-safe to assert them.)

**4.3b Reconcile `schema.prisma` to prod (REQUIRED before any `migrate dev`).** Because `schema.prisma` lacks 10 prod columns and is unbuildable, `prisma migrate dev` today is destructive. Fix by making the code match the deployed reality:
- `prisma db pull` from a prod clone → regenerate `schema.prisma` to reflect prod (adds the 10 columns, adopts prod's FK/index/types, resolves the invalid `TextLong↔Con`/`Pro` relations to prod's actual form).
- Regenerate the Prisma client; **verify app model/field names still resolve** (`db pull` preserves model/field names but may rename relation fields / add `@map`/`@relation(map:)` — diff the client surface and fix any renamed relation accessor the app uses).
- Re-run §3 to confirm the reconciled schema builds cleanly and equals prod.
- **Decision (LOCKED 2026-07-01): adopt prod's reality wholesale via `db pull`.** All 10 prod-only columns are modeled and kept; nothing is dropped. `schema.prisma` becomes a faithful mirror of production.

**4.4 Going forward.** All schema changes via `prisma migrate dev` against a dev DB, committed as migration files. **No more manual MySQL.** Fresh environments run `migrate deploy` and get the full schema; production continues from the reconciled baseline. `prisma migrate status` in CI to catch drift early.

## 5. Safety rules (non-negotiable)

- **Never** run `migrate reset`, `migrate dev`, or `db push` against production (data loss / collisions).
- On production, only ever `migrate resolve --applied` (metadata) and, for future changes, `migrate deploy`.
- All diffing/verification runs against a **clone/dump**, never live prod.
- **Back up production** before any migration operation.
- The agent does **not** touch production; it delivers verified migration files + the exact runbook; the user (or a controlled clone run) executes §4.3.

## 6. Risks & mitigations

- **catch-up misses a manual prod change** → §3 Docker diff catches it definitively before any prod step.
- **Duplicate schema locations cause the wrong migrations to run** → §4.2 consolidation to `packages/db` only.
- **`resolve --applied` run before verification** → gate it behind an empty §3 diff; document the order.
- **Index/FK/collation nuances** → the `migrate diff` compares full structure (indexes, FKs, columns, enums), not just tables.

## 7. Deliverables

1. Verified `packages/db/prisma/migrations` (3 old + catch-up) that reproduces prod (proof: empty `migrate diff`).
2. Single canonical `packages/db/prisma`; duplicates retired; loose `.sql` removed.
3. `docs/.../prod-migration-runbook.md` — the exact §4.3 commands + backup step for the user to run on prod.
4. A short "migrations workflow" note so manual MySQL never happens again.
