# db/scripts

## verify-migrations-against-dump.sh
Proves the committed Prisma migrations reproduce a production structure dump.

    bash packages/db/scripts/verify-migrations-against-dump.sh /path/to/structure-dump.sql

- Read-only w.r.t. production. Spins a throwaway MariaDB 10.11 container
  (`dms-mig-verify`, port 3399) from the dump, applies migrations to a fresh
  `rebuilt` DB, and prints VERIFY: PASS / FAIL.
- Requires Docker + a structure-only dump (`mysqldump --no-data`).
- Never point DATABASE_URL at production while running this.
