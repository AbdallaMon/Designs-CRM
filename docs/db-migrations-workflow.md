# Database migrations workflow

- Schema is defined ONLY in `packages/db/prisma/schema.prisma`.
- Change the schema, then: `npm --workspace @dms/db run migrate:dev -- --name <change>`.
  Commit the generated migration. NEVER apply SQL to MySQL by hand.
- Deploy with `prisma migrate deploy`. Fresh envs build the full schema from migrations.
- Before merging schema changes, CI runs the drift check (below).

## Drift check (run before merging schema changes)

This repo has no CI system (no `.github/workflows`), so this check is not automated — run it manually before merging any schema change:

```
npx prisma migrate diff \
  --from-migrations packages/db/prisma/migrations \
  --to-schema-datamodel packages/db/prisma/schema.prisma \
  --shadow-database-url "<a throwaway MySQL/MariaDB url>" \
  --exit-code
```

Exit 0 means the migrations directory and `schema.prisma` are in sync; a non-zero exit means they've drifted — fix the migrations before merging.
