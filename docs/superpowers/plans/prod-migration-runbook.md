# Production migration-history reconciliation runbook

PRECONDITIONS
- The plan's Docker verification printed `VERIFY: PASS` (committed migrations reproduce prod).
- You have taken a FULL production backup (structure + data) NOW.

STEPS (run on a machine with DATABASE_URL pointed at PRODUCTION)
1. Back up:  mysqldump --single-transaction --routines --triggers <db> > prod-backup-$(date +%F).sql
2. Check current state:
     npx prisma migrate status --schema packages/db/prisma/schema.prisma
   Expect the 3 old migrations "applied" and catch_up "not applied".
3. Mark the four baseline migrations as applied WITHOUT running their SQL
   (idempotent; already-applied migrations are skipped):
     npm run db:resolve
4. Confirm the baseline reconciliation, then apply newer additive migrations manually:
     npx prisma migrate status --schema packages/db/prisma/schema.prisma
     npm run db:deploy
     npm run db:generate
     npm run db:status
   The final status must report: "Database schema is up to date!"

NEVER on production: prisma migrate reset | prisma migrate dev | prisma db push.
If step 2 reports a CHECKSUM MISMATCH on an old migration, STOP and report — it
means prod's applied SQL differs from the committed file; do not resolve until reconciled.
