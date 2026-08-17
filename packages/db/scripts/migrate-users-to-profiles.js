// One-time, idempotent migration for databases imported from the legacy app.
// It converts retained role/flag/sub-role fields into relational UserProfile rows
// and initializes currentProfileId without overwriting a value already selected.
import prisma from "../prisma.client.js";
import { PROFILE_KEYS, USER_ROLES } from "@dms/shared";

const ROLE_TO_PROFILE = Object.freeze({
  [USER_ROLES.ADMIN]: "ADMIN",
  [USER_ROLES.SUPER_ADMIN]: "SUPER_ADMIN",
  [USER_ROLES.SUPER_SALES]: "SUPER_SALES",
  [USER_ROLES.ACCOUNTANT]: "ACCOUNTANT",
  [USER_ROLES.THREE_D_DESIGNER]: "DESIGNER_3D",
  [USER_ROLES.TWO_D_DESIGNER]: "DESIGNER_2D",
  [USER_ROLES.TWO_D_EXECUTOR]: "EXECUTOR_2D",
  [USER_ROLES.CONTACT_INITIATOR]: "CONTACT_INITIATOR",
});

export function legacyProfileKey(user) {
  if (user?.role === USER_ROLES.STAFF || !user?.role) {
    if (user?.isSuperSales) return "SUPER_SALES";
    if (user?.isPrimary) return "PRIMARY_SALES";
    return "NORMAL_SALES";
  }
  return ROLE_TO_PROFILE[user.role] ?? "NORMAL_SALES";
}

export function deriveLegacyProfileKeys(user) {
  const current = legacyProfileKey(user);
  const keys = new Set([current]);
  for (const entry of Array.isArray(user?.subRoles) ? user.subRoles : []) {
    const role = typeof entry === "string" ? entry : entry?.subRole;
    if (role) keys.add(legacyProfileKey({ role }));
  }
  return { keys: [...keys], current };
}

export function planUserProfiles(user, profileIdByKey) {
  const { keys, current } = deriveLegacyProfileKeys(user);
  const missing = keys.filter((key) => profileIdByKey[key] == null);
  if (missing.length) {
    throw new Error(`Missing seeded profiles: ${missing.join(", ")}`);
  }
  return {
    profileIds: keys.map((key) => profileIdByKey[key]),
    currentProfileId: profileIdByKey[current],
  };
}

export async function runUserProfileMigration({ prisma: db, apply = false } = {}) {
  const profiles = await db.profile.findMany({ select: { id: true, key: true } });
  const profileIdByKey = Object.fromEntries(profiles.map(({ id, key }) => [key, id]));
  const missingCatalog = PROFILE_KEYS.filter((key) => profileIdByKey[key] == null);
  if (missingCatalog.length) {
    throw new Error(
      `Profile catalog is incomplete; run the seed first. Missing: ${missingCatalog.join(", ")}`,
    );
  }

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

  const plans = users.map((user) => ({
    user,
    plan: planUserProfiles(user, profileIdByKey),
  }));
  const result = {
    mode: apply ? "apply" : "dry-run",
    scannedUsers: users.length,
    plannedAssignments: plans.reduce((total, item) => total + item.plan.profileIds.length, 0),
    usersMissingCurrentProfile: plans.filter(({ user }) => user.currentProfileId == null).length,
    assignmentUpserts: 0,
    currentProfilesSet: 0,
  };
  if (!apply) return result;

  for (const { user, plan } of plans) {
    for (const profileId of plan.profileIds) {
      await db.userProfile.upsert({
        where: { userId_profileId: { userId: user.id, profileId } },
        update: {},
        create: { userId: user.id, profileId },
      });
      result.assignmentUpserts += 1;
    }
    if (user.currentProfileId == null) {
      const update = await db.user.updateMany({
        where: { id: user.id, currentProfileId: null },
        data: { currentProfileId: plan.currentProfileId },
      });
      result.currentProfilesSet += update.count;
    }
  }
  return result;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

const invokedDirectly =
  process.argv[1]?.replaceAll("\\", "/").endsWith("/scripts/migrate-users-to-profiles.js");
if (invokedDirectly) {
  const apply = hasFlag("--apply");
  if (apply && !hasFlag("--backup-confirmed")) {
    console.error("Refusing to write without --backup-confirmed.");
    process.exitCode = 1;
  } else {
    runUserProfileMigration({ prisma, apply })
      .then((result) => console.log(JSON.stringify(result, null, 2)))
      .catch((error) => {
        console.error("User profile migration failed:", error);
        process.exitCode = 1;
      })
      .finally(() => prisma.$disconnect());
  }
}
