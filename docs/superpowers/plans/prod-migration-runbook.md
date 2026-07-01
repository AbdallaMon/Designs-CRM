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
