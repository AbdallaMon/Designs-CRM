# Prisma Migration Reconciliation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the committed Prisma schema + migrations faithfully reproduce the deployed production database, so a fresh environment builds an identical DB and `prisma migrate dev` is safe again — without touching production destructively.

**Architecture:** Production is the source of truth (backup dump). We (1) reconcile `schema.prisma` to prod via `prisma db pull` (adopting all 10 prod-only columns and prod's real FK/index reality), (2) regenerate the broken `catch_up_full_schema` migration as a valid `(3-old-migrations → prod)` diff, (3) consolidate the three duplicate schema/migration locations down to the single canonical `packages/db/prisma`, and (4) hand the user a metadata-only production runbook (`migrate resolve --applied`). Every migration change is proven against a throwaway MariaDB 10.11 container loaded from the prod dump: a change is "correct" only when it applies cleanly to a fresh DB AND `prisma migrate diff` versus the loaded prod = 0.

**Tech Stack:** Prisma 6.19.3 (`@dms/db`, provider `mysql`, `url = env("DATABASE_URL")`), MariaDB 10.11 (prod engine), Docker, Node/npm workspaces.

## Global Constraints

- **NEVER run `migrate reset`, `migrate dev`, or `db push` against production.** Production is only ever touched by `migrate resolve --applied` (metadata) and, for future changes, `migrate deploy`.
- **The agent does not touch production.** All verification runs against a throwaway Docker container loaded from the local dump `C:\coding\backup\dreamstudiio\drea_studio_db.sql`. Production steps are delivered as a runbook the user executes.
- **Baseline shape (locked):** keep the 3 existing migrations (`20250118182131_init`, `20250118223321_price_offer_url`, `20250120212545_added_some_e_num`) + a **regenerated** `20260612040000_catch_up_full_schema`.
- **10 prod-only columns (locked): adopt via `db pull` — keep all 10.** They are `User.baseSalaryId`, `User.hasLogs`, `User.monthlySalaryId`, `Outcome.monthlySalaries`, `Outcome.operationalExpenses`, `Outcome.rentPeriods`, `BaseEmployeeSalary.notes`, `OperationalExpenses.notes`, `Rent.notes`, `RentPeriod.notes`. Nothing is dropped.
- **Canonical location:** `packages/db/prisma` only. `server/prisma` and `server/src/infra/prisma` schema+migration copies are retired.
- **Definition of "verified":** on a fresh DB, `prisma migrate deploy` applies all migrations with exit 0, AND `prisma migrate diff --from-url <prod_truth> --to-url <rebuilt> --exit-code` returns 0.
- **No Prisma schema change beyond adopting prod reality.** Relation/field NAMES used by the app (the Prisma client surface) must be preserved; any unavoidable rename is reconciled in app code in the same task.
- Verification container name `dms-mig-verify`, MariaDB 10.11, host port 3399, root password `verifypw`. DBs used: `prod_truth` (loaded from dump), plus throwaway `rebuilt`/`shadow` DBs.

---

### Task 1: Commit a reusable, parameterized verification harness

A repo-committed script that loads any structure dump into a throwaway MariaDB, applies the committed migrations to a fresh DB, and reports whether they reproduce the dump. This is the "test runner" every later task uses.

**Files:**
- Create: `packages/db/scripts/verify-migrations-against-dump.sh`
- Create: `packages/db/scripts/README.md`

**Interfaces:**
- Produces: a script invoked as `bash packages/db/scripts/verify-migrations-against-dump.sh <dump.sql>` that prints `VERIFY: PASS` (migrations reproduce the dump) or `VERIFY: FAIL` with the diff, and leaves DBs `prod_truth` + `rebuilt` in container `dms-mig-verify` for inspection. Exit 0 on PASS, non-zero on FAIL.

- [ ] **Step 1: Write the harness script**

```bash
# packages/db/scripts/verify-migrations-against-dump.sh
#!/usr/bin/env bash
# Verify committed Prisma migrations reproduce a given structure dump.
# Read-only w.r.t. production: uses only the local dump + a throwaway container.
set -u
DUMP="${1:?usage: verify-migrations-against-dump.sh <structure-dump.sql>}"
REPO="$(cd "$(dirname "$0")/../../.." && pwd)"
SCHEMA="$REPO/packages/db/prisma/schema.prisma"
CONT="dms-mig-verify"; PORT=3399; PW="verifypw"; IMG="mariadb:10.11"
URL="mysql://root:${PW}@127.0.0.1:${PORT}"
cd "$REPO"

docker rm -f "$CONT" >/dev/null 2>&1 || true
docker run --name "$CONT" -e MARIADB_ROOT_PASSWORD="$PW" -p ${PORT}:3306 -d "$IMG" >/dev/null || { echo "VERIFY: FAIL (container start)"; exit 1; }
for i in $(seq 1 90); do docker exec "$CONT" mariadb -uroot -p"$PW" -e "SELECT 1" >/dev/null 2>&1 && break; sleep 1; done

docker exec "$CONT" mariadb -uroot -p"$PW" -e "DROP DATABASE IF EXISTS prod_truth; CREATE DATABASE prod_truth; DROP DATABASE IF EXISTS rebuilt; CREATE DATABASE rebuilt;"
docker exec -i "$CONT" mariadb -uroot -p"$PW" prod_truth < "$DUMP"

export DATABASE_URL="${URL}/rebuilt"
npx --no-install prisma migrate deploy --schema "$SCHEMA" || { echo "VERIFY: FAIL (migrate deploy did not apply cleanly)"; exit 2; }

npx --no-install prisma migrate diff --from-url "${URL}/prod_truth" --to-url "${URL}/rebuilt" --script --exit-code > /tmp/verify_diff.sql 2>/tmp/verify_diff.err
CODE=$?
if [ "$CODE" = "0" ]; then echo "VERIFY: PASS (migrations reproduce the dump exactly)"; exit 0; fi
echo "VERIFY: FAIL (differences below)"; cat /tmp/verify_diff.sql; exit 3
```

- [ ] **Step 2: Write the README explaining usage + safety**

```markdown
# db/scripts

## verify-migrations-against-dump.sh
Proves the committed Prisma migrations reproduce a production structure dump.

    bash packages/db/scripts/verify-migrations-against-dump.sh /path/to/structure-dump.sql

- Read-only w.r.t. production. Spins a throwaway MariaDB 10.11 container
  (`dms-mig-verify`, port 3399) from the dump, applies migrations to a fresh
  `rebuilt` DB, and prints VERIFY: PASS / FAIL.
- Requires Docker + a structure-only dump (`mysqldump --no-data`).
- Never point DATABASE_URL at production while running this.
```

- [ ] **Step 3: Run it against the current (broken) state to confirm it reports FAIL**

Run: `bash packages/db/scripts/verify-migrations-against-dump.sh "C:/coding/backup/dreamstudiio/drea_studio_db.sql"`
Expected: `VERIFY: FAIL (migrate deploy did not apply cleanly)` (proves the harness catches the known `catch_up` errno-150 breakage).

- [ ] **Step 4: Commit**

```bash
git add packages/db/scripts/verify-migrations-against-dump.sh packages/db/scripts/README.md
git commit -m "chore(db): add migration-vs-prod-dump verification harness"
```

---

### Task 2: Reconcile `schema.prisma` to production via `db pull` (adopt prod reality; preserve the client surface)

`schema.prisma` is missing 10 prod columns and declares relations (e.g. `TextLong.con`/`pro`) that prod has no FK for, making it unbuildable. Run `db pull` **on the existing schema** (Prisma preserves existing model/field/relation names and adds `@map`/`@relation(map:)` for prod's real names), then reconcile any client-surface change the app depends on.

**Files:**
- Modify: `packages/db/prisma/schema.prisma`
- Reference (read): app usages under `server/src/**` for any affected relation accessors

**Interfaces:**
- Consumes: Task 1 harness + the running `dms-mig-verify` container's `prod_truth` DB.
- Produces: a `schema.prisma` that is a faithful mirror of prod (all 110 tables, all columns incl. the 10, prod FK/index names), whose Prisma client exposes the same model/field/relation accessors the app already calls.

- [ ] **Step 1: Ensure `prod_truth` is loaded (reuse Task 1 container)**

Run:
```bash
docker exec dms-mig-verify mariadb -uroot -pverifypw -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='prod_truth';"
```
Expected: `111` (110 models + `_prisma_migrations`). If the container is gone, re-run Task 1 Step 3 first.

- [ ] **Step 2: Back up the current schema, then `db pull` from prod**

```bash
cp packages/db/prisma/schema.prisma packages/db/prisma/schema.prisma.pre-pull.bak
DATABASE_URL="mysql://root:verifypw@127.0.0.1:3399/prod_truth" \
  npx --no-install prisma db pull --schema packages/db/prisma/schema.prisma
```
Expected: "Introspected 110 models …". `schema.prisma` now reflects prod.

- [ ] **Step 3: Diff the client surface and produce a change report**

```bash
git --no-pager diff --no-index packages/db/prisma/schema.prisma.pre-pull.bak packages/db/prisma/schema.prisma > /tmp/schema_pull.diff || true
grep -nE "^\-\s+\w+\s+\w+.*@relation|^\+\s+\w+\s+\w+.*@relation" /tmp/schema_pull.diff | head -80
```
Expected: added columns for the 10 prod-only fields; possibly removed relation fields where prod has no FK (e.g. `TextLong.con`, `TextLong.pro`) and `@relation(map:)`/`@@index(map:)` annotations for prod's manual names. Record every removed/renamed model, field, or relation accessor.

- [ ] **Step 4: For each removed/renamed relation accessor, check whether app code uses it**

For every relation field the diff removed or renamed (e.g. `con`, `pro` on `TextLong`), run:
```bash
# example for the `con` relation on textLong
grep -rn "textLong" server/src --include=*.js | grep -iE "\.con\b|con:" | head
```
Expected: a list of call sites (often none for these leaf relations). Note each one.

- [ ] **Step 5: Reconcile the client surface**

For each accessor the app DOES use that `db pull` removed/renamed, restore a working relation:
- If prod genuinely has the FK, `db pull` keeps it — nothing to do.
- If prod lacks the FK but the app needs the relation, add it back in `schema.prisma` as an explicit `@relation` on the existing scalar column (Prisma allows a relation without a DB-level FK only if the FK exists; if it does not, either keep it as a scalar-only field and update the one call site to query by id, OR schedule adding the FK to prod as a deliberate forward migration — capture this as a follow-up, do NOT add it silently here).
For accessors NOT used by the app (e.g. unused `TextLong.con`), leave them as `db pull` produced (scalar column, no relation).

Document each decision inline in `schema.prisma` with a short comment.

- [ ] **Step 6: Verify the reconciled schema BUILDS on a fresh DB and equals prod**

```bash
# generate a full baseline straight from the reconciled schema and apply it
DATABASE_URL="mysql://root:verifypw@127.0.0.1:3399/rebuilt" \
  npx --no-install prisma migrate diff --from-empty --to-schema-datamodel packages/db/prisma/schema.prisma --script > /tmp/schema_baseline.sql
docker exec dms-mig-verify mariadb -uroot -pverifypw -e "DROP DATABASE IF EXISTS schema_check; CREATE DATABASE schema_check;"
docker exec -i dms-mig-verify mariadb -uroot -pverifypw schema_check < /tmp/schema_baseline.sql && echo "SCHEMA BUILDS CLEAN"
npx --no-install prisma migrate diff --from-url "mysql://root:verifypw@127.0.0.1:3399/prod_truth" --to-url "mysql://root:verifypw@127.0.0.1:3399/schema_check" --script --exit-code; echo "diff exit=$? (0 = schema == prod)"
```
Expected: `SCHEMA BUILDS CLEAN` (no errno-150) and `diff exit=0`. If not, return to Step 5 for the offending table/relation.

- [ ] **Step 7: Verify the Prisma client generates and the app still imports it**

```bash
npx --no-install prisma generate --schema packages/db/prisma/schema.prisma
```
Expected: "Generated Prisma Client". Then smoke-check the app boots far enough to load the client:
```bash
node -e "import('@dms/db').then(m=>{console.log('client ok', !!m); process.exit(0)}).catch(e=>{console.error(e);process.exit(1)})"
```
Expected: `client ok true`.

- [ ] **Step 8: Remove the backup and commit**

```bash
rm packages/db/prisma/schema.prisma.pre-pull.bak
git add packages/db/prisma/schema.prisma
git commit -m "fix(db): reconcile schema.prisma to production (adopt 10 prod columns, real FK/index names, buildable)"
```

---

### Task 3: Regenerate `catch_up_full_schema` as a valid `(3-old → prod)` migration

The committed `catch_up_full_schema` fails on a fresh DB (errno 150 @ `TextLong`). Replace its SQL with a Prisma-generated diff from the 3-old-migrations state to prod, so `(3 old + catch_up)` builds cleanly and equals prod.

**Files:**
- Modify: `packages/db/prisma/migrations/20260612040000_catch_up_full_schema/migration.sql`

**Interfaces:**
- Consumes: the 3 existing migrations + `prod_truth` + reconciled `schema.prisma` (Task 2).
- Produces: a `catch_up` migration such that `migrate deploy` of all 4 migrations builds prod exactly.

- [ ] **Step 1: Compute the catch-up as (3-old migrations → prod), using a shadow DB**

```bash
# temp dir containing ONLY the 3 old migrations, so --from-migrations = the 3-old state
mkdir -p /tmp/oldmigs && cp packages/db/prisma/migrations/migration_lock.toml /tmp/oldmigs/
for m in 20250118182131_init 20250118223321_price_offer_url 20250120212545_added_some_e_num; do cp -r "packages/db/prisma/migrations/$m" /tmp/oldmigs/; done
docker exec dms-mig-verify mariadb -uroot -pverifypw -e "DROP DATABASE IF EXISTS shadow; CREATE DATABASE shadow;"
npx --no-install prisma migrate diff \
  --from-migrations /tmp/oldmigs \
  --to-url "mysql://root:verifypw@127.0.0.1:3399/prod_truth" \
  --shadow-database-url "mysql://root:verifypw@127.0.0.1:3399/shadow" \
  --script > packages/db/prisma/migrations/20260612040000_catch_up_full_schema/migration.sql
echo "new catch_up lines: $(wc -l < packages/db/prisma/migrations/20260612040000_catch_up_full_schema/migration.sql)"
```
Expected: a regenerated `migration.sql` (no manual edits).

- [ ] **Step 2: VERIFY the full chain builds fresh and equals prod (the test)**

Run: `bash packages/db/scripts/verify-migrations-against-dump.sh "C:/coding/backup/dreamstudiio/drea_studio_db.sql"`
Expected: `VERIFY: PASS (migrations reproduce the dump exactly)`.

- [ ] **Step 3: Confirm migrations also equal the reconciled schema.prisma (no drift going forward)**

```bash
docker exec dms-mig-verify mariadb -uroot -pverifypw -e "DROP DATABASE IF EXISTS driftchk; CREATE DATABASE driftchk;"
DATABASE_URL="mysql://root:verifypw@127.0.0.1:3399/driftchk" npx --no-install prisma migrate deploy --schema packages/db/prisma/schema.prisma
npx --no-install prisma migrate diff --from-url "mysql://root:verifypw@127.0.0.1:3399/driftchk" --to-schema-datamodel packages/db/prisma/schema.prisma --script --exit-code; echo "schema drift exit=$? (0 = migrations == schema)"
```
Expected: `schema drift exit=0` (so a future `migrate dev` starts from zero diff).

- [ ] **Step 4: Commit**

```bash
git add packages/db/prisma/migrations/20260612040000_catch_up_full_schema/migration.sql
git commit -m "fix(db): regenerate catch_up_full_schema as valid (3-old -> prod) diff that builds fresh"
```

---

### Task 4: Consolidate to the single canonical `packages/db/prisma`

Remove the duplicate schema + migration copies in `server/prisma` and `server/src/infra/prisma` so only one migrations history is ever run, and fix every reference.

**Files:**
- Delete: `server/prisma/schema.prisma`, `server/prisma/migrations/`, `server/src/infra/prisma/schema.prisma`, `server/src/infra/prisma/migrations/`
- Modify: any file importing/pointing at those paths (e.g. `server/prisma/prisma.js`, package.json `prisma.schema`, scripts, Dockerfiles)

**Interfaces:**
- Produces: a repo where `@dms/db` (`packages/db/prisma`) is the sole schema + migration source; app + scripts resolve the Prisma client from `@dms/db`.

- [ ] **Step 1: Find every reference to the duplicate locations**

```bash
grep -rnE "server/prisma|server/src/infra/prisma|prisma/schema.prisma" server package.json --include=*.js --include=*.json --include=Dockerfile -l | sort -u
```
Expected: a list of referencing files. Record them.

- [ ] **Step 2: Repoint each reference to `@dms/db` / `packages/db/prisma`**

For each file from Step 1, change the schema path or client import to the canonical package. Example — if `server/prisma/prisma.js` exports a client, replace its body with a re-export:
```js
// server/prisma/prisma.js — retire local client; re-export the canonical one
export { default } from "@dms/db/prisma.client.js";
```
(Match whatever the file’s existing consumers import.)

- [ ] **Step 3: Delete the duplicate schema + migration copies**

```bash
git rm -r server/prisma/schema.prisma server/prisma/migrations server/src/infra/prisma/schema.prisma server/src/infra/prisma/migrations
```

- [ ] **Step 4: Verify nothing still points at a deleted path and the app resolves the client**

```bash
grep -rnE "server/prisma/(schema|migrations)|server/src/infra/prisma" server package.json --include=*.js --include=*.json --include=Dockerfile
node -e "import('@dms/db').then(()=>{console.log('client resolves'); process.exit(0)}).catch(e=>{console.error(e);process.exit(1)})"
```
Expected: no grep hits; `client resolves`.

- [ ] **Step 5: Re-run the full verification to confirm consolidation didn't break the canonical migrations**

Run: `bash packages/db/scripts/verify-migrations-against-dump.sh "C:/coding/backup/dreamstudiio/drea_studio_db.sql"`
Expected: `VERIFY: PASS`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor(db): consolidate schema+migrations to packages/db; retire server/prisma + server/src/infra/prisma copies"
```

---

### Task 5: Write the production reconciliation runbook (user-executed, metadata-only)

Deliver the exact, safe commands the user runs on production to make its migration history match the code — without re-running SQL.

**Files:**
- Create: `docs/superpowers/plans/prod-migration-runbook.md`

**Interfaces:**
- Produces: a runbook the user executes on prod; the agent never runs it.

- [ ] **Step 1: Write the runbook**

```markdown
# Production migration-history reconciliation runbook

PRECONDITIONS
- The plan's Docker verification printed `VERIFY: PASS` (committed migrations reproduce prod).
- You have taken a FULL production backup (structure + data) NOW.

STEPS (run on a machine with DATABASE_URL pointed at PRODUCTION)
1. Back up:  mysqldump --single-transaction --routines --triggers <db> > prod-backup-$(date +%F).sql
2. Check current state:
     npx prisma migrate status --schema packages/db/prisma/schema.prisma
   Expect the 3 old migrations "applied" and catch_up "not applied".
3. Mark migrations as applied WITHOUT running their SQL (metadata only):
     npx prisma migrate resolve --applied 20250118182131_init
     npx prisma migrate resolve --applied 20250118223321_price_offer_url
     npx prisma migrate resolve --applied 20250120212545_added_some_e_num
     npx prisma migrate resolve --applied 20260612040000_catch_up_full_schema
   (The first three may already be applied; resolve is safe to assert.)
4. Confirm:
     npx prisma migrate status --schema packages/db/prisma/schema.prisma
   Expect: "Database schema is up to date!"

NEVER on production: prisma migrate reset | prisma migrate dev | prisma db push.
If step 2 reports a CHECKSUM MISMATCH on an old migration, STOP and report — it
means prod's applied SQL differs from the committed file; do not resolve until reconciled.
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/plans/prod-migration-runbook.md
git commit -m "docs(db): production migration-history reconciliation runbook (metadata-only)"
```

---

### Task 6: Guardrails so this never recurs

Add a CI drift check + a short workflow note, and clean up throwaway artifacts.

**Files:**
- Create: `docs/db-migrations-workflow.md`
- Modify: CI config if present (e.g. `.github/workflows/*.yml`) — else document the check in the workflow note

**Interfaces:**
- Produces: a documented "always `migrate dev`, never manual MySQL" workflow + an automated drift gate.

- [ ] **Step 1: Write the workflow note**

```markdown
# Database migrations workflow

- Schema is defined ONLY in `packages/db/prisma/schema.prisma`.
- Change the schema, then: `npm --workspace @dms/db run migrate:dev -- --name <change>`.
  Commit the generated migration. NEVER apply SQL to MySQL by hand.
- Deploy with `prisma migrate deploy`. Fresh envs build the full schema from migrations.
- Before merging schema changes, CI runs the drift check (below).
```

- [ ] **Step 2: Add a CI drift-check step (or document it if no CI exists)**

If a CI workflow exists, add a job that fails when `schema.prisma` and the migrations diverge:
```yaml
      - name: Prisma migration drift check
        run: |
          npx prisma migrate diff \
            --from-migrations packages/db/prisma/migrations \
            --to-schema-datamodel packages/db/prisma/schema.prisma \
            --shadow-database-url "${{ secrets.SHADOW_DATABASE_URL }}" \
            --exit-code
```
Expected behavior: exit 0 when in sync; non-zero (CI fails) on drift.

- [ ] **Step 3: Remove the throwaway verification container**

```bash
docker rm -f dms-mig-verify
```

- [ ] **Step 4: Commit**

```bash
git add docs/db-migrations-workflow.md .github/workflows/ 2>/dev/null; git add -A
git commit -m "chore(db): document migrations workflow + add CI drift gate"
```

---

## Notes for the executor

- Tasks 2–4 all depend on the running `dms-mig-verify` container with `prod_truth` loaded (Task 1 Step 3 creates it). If it's gone, re-run Task 1 Step 3.
- The **only** production interaction in this entire plan is Task 5, which the **user** runs. The agent must never point `DATABASE_URL` at production.
- If Task 2 Step 5 surfaces a relation the app needs but prod lacks a FK for, that becomes a *separate, explicit* forward-migration decision — do not silently add FKs to prod.
- The loose `.sql` files (`complete-chat-migration.sql`, etc.) live on the `master` branch's `server/prisma`, not on this branch; no deletion is needed here. They are superseded by the regenerated baseline.
