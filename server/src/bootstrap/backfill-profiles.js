// Idempotent bootstrap backfill: assign every user WITHOUT a profile the profile
// derived from their retained legacy fields (role + isPrimary + isSuperSales).
// Runs on server boot; a WHERE profile IS NULL guard makes re-runs cheap no-ops.
// Reads/writes only via Prisma — never hand-edits SQL. The legacy flags are KEPT.
import { deriveProfileFromLegacy } from "@dms/shared";

export async function runProfileBackfill({ prisma }) {
  const rows = await prisma.user.findMany({
    where: { profile: null },
    select: { id: true, role: true, isPrimary: true, isSuperSales: true },
  });
  let updated = 0;
  for (const u of rows) {
    const profile = deriveProfileFromLegacy(u);
    await prisma.user.update({ where: { id: u.id }, data: { profile } });
    updated += 1;
  }
  return { scanned: rows.length, updated };
}
