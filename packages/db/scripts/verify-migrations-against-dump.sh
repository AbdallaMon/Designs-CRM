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
