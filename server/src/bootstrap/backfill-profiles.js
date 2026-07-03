// Boot-time safety net for the DB-relational permission model: ensure every user
// has UserProfile assignments + a currentProfile. Delegates to the idempotent
// relational data migration (its `currentProfileId IS NULL` guard makes re-runs
// cheap). PREREQUISITE: the Profile catalog must be seeded first (npm run db:seed /
// the prod data step) — otherwise this safely no-ops.
//
// The legacy string-column backfill is kept below (dead-but-callable) so a rollback
// to the code-map resolver still has its `User.profile` data.
import { deriveProfileFromLegacy } from "@dms/shared";
import { runUserProfileMigration } from "../../../packages/db/scripts/migrate-users-to-profiles.js";

// New authoritative backfill: relational UserProfile rows + currentProfileId.
export { runUserProfileMigration as runProfileBackfill };

// LEGACY (rollback only — no longer wired into boot): populate the retained
// `User.profile` string column so a redeploy of the old code-map resolver works.
export async function runLegacyStringProfileBackfill({ prisma }) {
  const rows = await prisma.user.findMany({
    where: { profile: null },
    select: { id: true, role: true, isPrimary: true, isSuperSales: true },
  });
  let updated = 0;
  for (const u of rows) {
    await prisma.user.update({ where: { id: u.id }, data: { profile: deriveProfileFromLegacy(u) } });
    updated += 1;
  }
  return { scanned: rows.length, updated };
}
