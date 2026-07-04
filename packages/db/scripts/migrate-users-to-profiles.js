// Idempotent user→profile data migration. For every user, derive its profile set
// from role + isPrimary + isSuperSales + subRoles, upsert a UserProfile row per
// derived profile, and set currentProfileId ONLY IF NULL (never clobber a profile
// the user later switched to or an admin reassigned). Upsert-only — safe on
// production (no truncation, no reset). The legacy columns are kept untouched.
//
// Runnable directly:  node packages/db/scripts/migrate-users-to-profiles.js
// Also imported by the boot backfill (server/src/bootstrap/backfill-profiles.js).
import prisma from "../prisma.client.js";
import { deriveProfilesFromLegacy } from "@dms/shared";

// Pure — map a legacy user + a { profileKey: id } lookup to the assignment plan.
export function planUserProfiles(user, profileIdByKey) {
  const { profiles, current } = deriveProfilesFromLegacy(user);
  const profileIds = profiles.map((k) => profileIdByKey[k]).filter((x) => x != null);
  return { profileIds, currentProfileId: profileIdByKey[current] ?? null };
}

export async function runUserProfileMigration({ prisma: db }) {
  const profileIdByKey = Object.fromEntries(
    (await db.profile.findMany({ select: { id: true, key: true } })).map((p) => [p.key, p.id]),
  );
  const users = await db.user.findMany({
    select: {
      id: true,
      role: true,
      isPrimary: true,
      isSuperSales: true,
      currentProfileId: true,
      subRoles: { select: { subRole: true } },
    },
  });

  let assigned = 0;
  let currentSet = 0;
  for (const u of users) {
    const { profileIds, currentProfileId } = planUserProfiles(u, profileIdByKey);
    for (const profileId of profileIds) {
      await db.userProfile.upsert({
        where: { userId_profileId: { userId: u.id, profileId } },
        update: {},
        create: { userId: u.id, profileId },
      });
      assigned += 1;
    }
    if (u.currentProfileId == null && currentProfileId != null) {
      // `select: { id }` so Prisma does NOT read back the full row (a MySQL update
      // has no RETURNING, so a default update SELECTs every scalar — which would
      // trip P2022 on any column the live DB is missing, unrelated to this write).
      await db.user.update({ where: { id: u.id }, data: { currentProfileId }, select: { id: true } });
      currentSet += 1;
    }
  }
  return { scanned: users.length, assigned, currentSet };
}

const invokedDirectly =
  process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("scripts/migrate-users-to-profiles.js");
if (invokedDirectly) {
  runUserProfileMigration({ prisma })
    .then((r) => {
      console.log(`✅ User migration: ${r.scanned} users, ${r.assigned} assignments, ${r.currentSet} currents set`);
      return prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error("❌ User migration failed:", e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
