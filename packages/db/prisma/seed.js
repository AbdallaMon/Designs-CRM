// Idempotent catalog seed for the DB-relational permission model.
//   PermissionCode  ← ALL_PERMISSIONS
//   Profile         ← PROFILE_META
//   ProfilePermission ← the code-defined PROFILES map (diff-synced per profile)
// Upsert-only; safe to run on production (no truncation, no reset). The code
// constants remain the single source; re-running makes the DB match them exactly.
//
// Registered as `prisma.seed` in packages/db/package.json and runnable directly:
//   node packages/db/prisma/seed.js
import prisma from "../prisma.client.js";
import { ALL_PERMISSIONS, PROFILE_META, PROFILES, splitPermissionCode } from "@dms/shared";

export const ADMIN_TIER_PROFILE_KEYS = ["ADMIN", "SUPER_ADMIN", "SUPER_SALES"];

// Pure — build the catalog rows from the shared constants (unit-testable, no DB).
export function buildCatalog() {
  const codes = ALL_PERMISSIONS.map((code) => ({ code, module: splitPermissionCode(code).module }));
  const profiles = Object.entries(PROFILE_META).map(([key, m]) => ({
    key,
    label: m.label,
    family: m.family ?? null,
    baseRole: m.baseRole ?? null,
    isAdminTier: ADMIN_TIER_PROFILE_KEYS.includes(key),
  }));
  const links = [];
  for (const [profileKey, codeList] of Object.entries(PROFILES))
    for (const code of codeList) links.push({ profileKey, code });
  return { codes, profiles, links };
}

export async function seedCatalog({ prisma: db }) {
  const { codes, profiles, links } = buildCatalog();

  for (const c of codes)
    await db.permissionCode.upsert({ where: { code: c.code }, update: { module: c.module }, create: c });
  for (const p of profiles)
    await db.profile.upsert({
      where: { key: p.key },
      update: { label: p.label, family: p.family, baseRole: p.baseRole, isAdminTier: p.isAdminTier },
      create: p,
    });

  const codeId = new Map(
    (await db.permissionCode.findMany({ select: { id: true, code: true } })).map((r) => [r.code, r.id]),
  );
  const profId = new Map(
    (await db.profile.findMany({ select: { id: true, key: true } })).map((r) => [r.key, r.id]),
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
      (await db.profilePermission.findMany({ where: { profileId: pid }, select: { permissionCodeId: true } }))
        .map((r) => r.permissionCodeId),
    );
    const toAdd = [...desired].filter((c) => !existing.has(c));
    const toRemove = [...existing].filter((c) => !desired.has(c));
    if (toAdd.length || toRemove.length) {
      await db.$transaction([
        ...toAdd.map((cid) => db.profilePermission.create({ data: { profileId: pid, permissionCodeId: cid } })),
        ...(toRemove.length
          ? [db.profilePermission.deleteMany({ where: { profileId: pid, permissionCodeId: { in: toRemove } } })]
          : []),
      ]);
    }
    linksAdded += toAdd.length;
    linksRemoved += toRemove.length;
  }

  return { codes: codes.length, profiles: profiles.length, linksAdded, linksRemoved };
}

const invokedDirectly = process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("prisma/seed.js");
if (invokedDirectly) {
  seedCatalog({ prisma })
    .then((r) => {
      console.log(`✅ Seed: ${r.codes} codes, ${r.profiles} profiles, +${r.linksAdded}/-${r.linksRemoved} links`);
      return prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error("❌ Seed failed:", e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
