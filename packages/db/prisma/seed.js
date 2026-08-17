// Idempotent catalog seed for the DB-relational permission model.
//   PermissionCode  ← ALL_PERMISSIONS
//   Profile         ← PROFILE_META
//   ProfilePermission ← PROFILE_PERMISSION_DEFAULTS (diff-synced per profile)
// Upsert-only; safe to run on production (no truncation, no reset). The code
// constants remain the single source; re-running makes the DB match them exactly.
//
// Registered as `prisma.seed` in packages/db/package.json and runnable directly:
//   node packages/db/prisma/seed.js
import prisma from "../prisma.client.js";
import {
  ALL_PERMISSIONS,
  PROFILE_PERMISSION_DEFAULTS,
  PROFILE_META,
  PROFILES,
  splitPermissionCode,
} from "@dms/shared";

export const ADMIN_TIER_PROFILE_KEYS = [PROFILES.ADMIN, PROFILES.SUPER_ADMIN];

// ── Bootstrap admin ────────────────────────────────────────────────────────────
// Default credentials for the first-run admin. Only used when the DB has NO admin-tier
// user yet (see seedAdminUser). Override via env before seeding:
//   SEED_ADMIN_EMAIL, SEED_ADMIN_NAME, SEED_ADMIN_PASSWORD_HASH (a bcrypt hash — the seed
//   package has no bcrypt to hash a plaintext at runtime). Generate one with the server's
//   bcrypt: `node -e "require('bcrypt').hash('yourpass',8).then(console.log)"`.
const DEFAULT_ADMIN_EMAIL = "abdotlos60@gmail.com";
const DEFAULT_ADMIN_NAME = "Admin";
// bcrypt(cost 8) hash matching the requested default admin password.
const DEFAULT_ADMIN_PASSWORD_HASH =
  "$2b$08$Y9Ijxmfx2dsc9t.Eto.fn.JQ8FcKE9S4mHUNphYtaxWwdnEMZl7cm";

// Idempotent: create a bootstrap ADMIN user ONLY when no admin-tier user exists yet. Safe to
// re-run (no-op once any admin-tier profile is assigned). Wires currentProfileId +
// a UserProfile link to the ADMIN profile so permission resolution works on
// every path. Assumes seedCatalog ran first (so the ADMIN profile row exists).
export async function seedAdminUser({ prisma: db }) {
  const existingAdmin = await db.user.findFirst({
    where: {
      userProfiles: {
        some: { profile: { isAdminTier: true } },
      },
    },
    select: { id: true },
  });
  if (existingAdmin) return { created: false, reason: "admin-exists" };

  const email = process.env.SEED_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL;
  const takenByEmail = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (takenByEmail) return { created: false, reason: "email-taken", email };

  const adminProfile = await db.profile.findUnique({
    where: { key: PROFILES.ADMIN },
    select: { id: true },
  });

  const user = await db.user.create({
    data: {
      email,
      name: process.env.SEED_ADMIN_NAME || DEFAULT_ADMIN_NAME,
      password:
        process.env.SEED_ADMIN_PASSWORD_HASH || DEFAULT_ADMIN_PASSWORD_HASH,
      isActive: true,
      ...(adminProfile ? { currentProfileId: adminProfile.id } : {}),
    },
    select: { id: true, email: true },
  });

  if (adminProfile) {
    await db.userProfile.upsert({
      where: {
        userId_profileId: { userId: user.id, profileId: adminProfile.id },
      },
      update: {},
      create: { userId: user.id, profileId: adminProfile.id },
    });
  }

  return {
    created: true,
    userId: user.id,
    email: user.email,
    linkedProfile: Boolean(adminProfile),
  };
}

// Pure — build the catalog rows from the shared constants (unit-testable, no DB).
export function buildCatalog() {
  const codes = ALL_PERMISSIONS.map((code) => ({
    code,
    module: splitPermissionCode(code).module,
  }));
  const profiles = Object.entries(PROFILE_META).map(([key, m]) => ({
    key,
    label: m.label,
    family: m.family ?? null,
    isAdminTier: ADMIN_TIER_PROFILE_KEYS.includes(key),
    isAssignable: m.isAssignable ?? true,
  }));
  const links = [];
  for (const [profileKey, codeList] of Object.entries(PROFILE_PERMISSION_DEFAULTS))
    for (const code of codeList) links.push({ profileKey, code });
  return { codes, profiles, links };
}

export async function seedCatalog({ prisma: db }) {
  const { codes, profiles, links } = buildCatalog();

  for (const c of codes)
    await db.permissionCode.upsert({
      where: { code: c.code },
      update: { module: c.module },
      create: c,
    });
  for (const p of profiles)
    await db.profile.upsert({
      where: { key: p.key },
      update: {
        label: p.label,
        family: p.family,
        isAdminTier: p.isAdminTier,
        isAssignable: p.isAssignable,
      },
      create: p,
    });

  const codeId = new Map(
    (
      await db.permissionCode.findMany({ select: { id: true, code: true } })
    ).map((r) => [r.code, r.id]),
  );
  const profId = new Map(
    (await db.profile.findMany({ select: { id: true, key: true } })).map(
      (r) => [r.key, r.id],
    ),
  );

  // Desired code-id set per profile-id.
  const desiredByProfile = new Map();
  for (const l of links) {
    const pid = profId.get(l.profileKey);
    const cid = codeId.get(l.code);
    if (pid == null || cid == null) continue;
    if (!desiredByProfile.has(pid)) desiredByProfile.set(pid, new Set());
    desiredByProfile.get(pid).add(cid);
  }

  // Diff-sync each profile's links so the DB matches the constants exactly.
  let linksAdded = 0;
  let linksRemoved = 0;
  for (const [pid, desired] of desiredByProfile) {
    const existing = new Set(
      (
        await db.profilePermission.findMany({
          where: { profileId: pid },
          select: { permissionCodeId: true },
        })
      ).map((r) => r.permissionCodeId),
    );
    const toAdd = [...desired].filter((c) => !existing.has(c));
    const toRemove = [...existing].filter((c) => !desired.has(c));
    if (toAdd.length || toRemove.length) {
      await db.$transaction([
        ...toAdd.map((cid) =>
          db.profilePermission.create({
            data: { profileId: pid, permissionCodeId: cid },
          }),
        ),
        ...(toRemove.length
          ? [
              db.profilePermission.deleteMany({
                where: { profileId: pid, permissionCodeId: { in: toRemove } },
              }),
            ]
          : []),
      ]);
    }
    linksAdded += toAdd.length;
    linksRemoved += toRemove.length;
  }

  return {
    codes: codes.length,
    profiles: profiles.length,
    linksAdded,
    linksRemoved,
  };
}

const invokedDirectly =
  process.argv[1] &&
  process.argv[1].replace(/\\/g, "/").endsWith("prisma/seed.js");
if (invokedDirectly) {
  (async () => {
    const r = await seedCatalog({ prisma });
    console.log(
      `✅ Seed: ${r.codes} codes, ${r.profiles} profiles, +${r.linksAdded}/-${r.linksRemoved} links`,
    );
    const a = await seedAdminUser({ prisma });
    if (a.created)
      console.log(
        `✅ Bootstrap admin created: ${a.email} (id ${a.userId}, profile-linked=${a.linkedProfile})`,
      );
    else
      console.log(
        `ℹ️  Bootstrap admin skipped (${a.reason}${a.email ? `: ${a.email}` : ""})`,
      );
    await prisma.$disconnect();
  })().catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
}
