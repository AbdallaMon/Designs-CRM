# DB-Relational Permissions & Switchable Profiles — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move authorization from a code-defined role→codes map to a DB-relational model (PermissionCode / Profile / ProfilePermission / UserProfile) with a single switchable `currentProfile`, preserving the `/auth/me` contract.

**Architecture:** Additive Prisma tables seeded from the existing code constants; a server-side in-process cache resolves `currentProfileId → codes` (zero per-request DB read); the JWT carries `currentProfileId`; `/auth/me` gains `profiles[]` + `currentProfileId`. Object-scope power moves from `role` to `currentProfile.isAdminTier`. Rollout is data-before-code; legacy columns are retained for rollback.

**Tech Stack:** JavaScript ESM, npm workspaces, Prisma 6 (MySQL), Express 4, Zod 4, Vitest (`npm test` → `vitest run`), Next.js 16 + MUI 7 (FE).

**Reference spec:** `docs/superpowers/specs/2026-07-03-db-relational-permissions-design.md`.

## Global Constraints

- **Parity = deployed `master`.** Only ONE intentional divergence: effective permissions = current profile ONLY (not the subRole union). Everything else keeps observable behavior identical. Document the divergence; don't widen access.
- **Production DB.** Local: `prisma migrate dev` / reset OK. Prod: additive `migrate deploy` + `migrate resolve --applied`, **never reset**. Seed/data-migration is upsert-only, no truncation. `DATABASE_URL` lives in `server/.env` (run prisma from `server/`, or add `packages/db/prisma/.env`).
- **Never hand-edit MySQL.** Schema only via `prisma migrate dev` (`npm run db:migrate`).
- **Never drop** `User.role` / `User.profile` / `User.subRoles` / `UserSubRole` (rollback).
- **Never change PDF logic.**
- **JavaScript only** (no TS), ESM. Strict layering: route→controller→usecase→repo→validation→dto; Prisma ONLY in repos.
- **Preserve `/auth/me` keys:** `id,email,name,role,permissions[],permissionsByModule{},navigationTabs[],profile`. Additions only.
- **Message `message` is always a language-neutral CODE**; use `AppError`.
- FE verified with `cd web && npx next build` (repo eslint is broken).

---

## File Structure

**DB (`packages/db`)**
- `prisma/schema.prisma` — +5 models (`PermissionCode`,`Profile`,`ProfilePermission`,`UserProfile`,`AuthAuditLog`) + `User.currentProfileId` and back-relations.
- `prisma/migrations/<ts>_add_relational_permissions/` — generated additive migration.
- `prisma/seed.js` — catalog seed (upsert PermissionCode/Profile/ProfilePermission). Registered as `prisma.seed`.
- `scripts/migrate-users-to-profiles.js` — idempotent user→profile assignment.

**Shared (`packages/shared`)**
- `helpers.js` — extract pure `buildPermissionsByModule(codes)`; add `buildNavigationTabsFromPermissions`; keep `getEffectivePermissions` for the seed/fallback.
- `constants/access/profiles.js` — add `deriveProfilesFromLegacy(user)`.
- `index.js` — barrel-export the new symbols.

**Server (`server/src`)**
- `infra/auth/profile-cache.js` — in-process `profileId → {key,isAdminTier,baseRole,codes}` cache.
- `infra/auth/profile-cache.repository.js` — the one Prisma read the cache uses.
- `shared/middlewares/auth.middleware.js` — resolve via cache.
- `modules/auth/auth.dto.js` — token payload + selects + `toMe` gain profile data.
- `modules/auth/auth.usecase.js` — login/refresh embed `currentProfileId`; refresh re-validates.
- `modules/auth/profile-switch.{controller,usecase,validation}.js` + wire into `auth.routes.js`.
- `modules/users/user/{user.repository,user.usecase,user.validation,user.controller}.js` + routes — admin assign/remove profiles.
- `modules/users/user/user.dto.js` + `modules/projects/project/project.usecase.js` — `isAdminTier`/`isAdminUser` read `authUser.isAdminTier`.
- `infra/audit/auth-audit.repository.js` — write `AuthAuditLog`.
- `bootstrap/backfill-profiles.js` — repoint to relational assignment.
- `server.js` — load cache on boot; run repointed backfill.
- `shared/messages/*` — new codes `PROFILE_NOT_ASSIGNED`,`PROFILE_NOT_FOUND`,`PROFILE_SWITCHED`,`PROFILES_UPDATED`.

**Frontend (`web/src/app`)**
- `providers/AuthProvider.jsx` — read `profiles`/`currentProfileId`.
- `UiComponents/utility/ProfileSwitcher.jsx` — new AppBar switcher.
- `(auth)/dashboard/(dashboard)/layout.jsx` — mount switcher.
- Users page admin profile manager (replaces the single profile select / `RoleManagerDialog` usage).

---

## Phasing (each phase independently testable)

- **Phase 1** — Schema + additive migration (Task 1).
- **Phase 2** — Shared pure helpers (Tasks 2–3).
- **Phase 3** — Catalog seed (Task 4).
- **Phase 4** — User-migration + boot backfill repoint (Tasks 5–6).
- **Phase 5** — Profile cache (Task 7).
- **Phase 6** — Auth token/dto/middleware + `/auth/me` (Tasks 8–9).
- **Phase 7** — Scope follows profile (Task 10).
- **Phase 8** — Switch endpoint + audit + codes (Tasks 11–12).
- **Phase 9** — Admin assign/remove (Task 13).
- **Phase 10** — Frontend (Tasks 14–16).
- **Phase 11** — Parity/integration gate + prod note (Task 17).

---

# PHASE 1 — Schema + additive migration

## Task 1: Add the 5 models + `User.currentProfileId`

**Files:**
- Modify: `packages/db/prisma/schema.prisma` (User model + append models + `UserRole` already exists)
- Create: `packages/db/prisma/migrations/<ts>_add_relational_permissions/migration.sql` (generated)

**Interfaces:**
- Produces: Prisma delegates `prisma.permissionCode`, `prisma.profile`, `prisma.profilePermission`, `prisma.userProfile`, `prisma.authAuditLog`, and `user.currentProfileId` / `user.currentProfile` / `user.userProfiles`.

- [ ] **Step 1: Add the models.** Append to `packages/db/prisma/schema.prisma` (before the enums block), exactly the 5 models from spec §2.1 (`PermissionCode`, `Profile`, `ProfilePermission`, `UserProfile`, `AuthAuditLog`). Use `@db.VarChar(191)` on `PermissionCode.code`.

- [ ] **Step 2: Extend `User`.** In `model User` add, directly under `profile` (line ~617):

```prisma
  currentProfileId                                         Int?
  currentProfile                                           Profile?               @relation("CurrentProfile", fields: [currentProfileId], references: [id], onDelete: SetNull, map: "User_currentProfile_fk")
```

and in the relations block add:

```prisma
  userProfiles                                             UserProfile[]          @relation("UserProfiles")
  assignedProfiles                                         UserProfile[]          @relation("UserProfileAssignedBy")
```

- [ ] **Step 3: Format + validate.**

Run: `cd server && npx prisma validate --schema ../packages/db/prisma/schema.prisma && npx prisma format --schema ../packages/db/prisma/schema.prisma`
Expected: "The schema at ... is valid 🚀".

- [ ] **Step 4: Generate the migration (local dev DB only — NEVER prod).**

Run: `npm run db:migrate -- --name add_relational_permissions`
Expected: creates `packages/db/prisma/migrations/<ts>_add_relational_permissions/migration.sql` with `CREATE TABLE` for the 5 tables + `ALTER TABLE User ADD COLUMN currentProfileId` + FKs, applies to the dev DB, regenerates the client. Confirm the SQL is purely additive (no DROP).

- [ ] **Step 5: Regenerate client + confirm fresh build parity.** Follow `docs/db-migrations-workflow.md` drift check (Docker fresh-migrate). At minimum:

Run: `npm run db:generate`
Expected: client regenerates with the new delegates, no errors.

- [ ] **Step 6: Commit.**

```bash
git add packages/db/prisma/schema.prisma packages/db/prisma/migrations
git commit -m "feat(db): additive relational-permissions tables + User.currentProfileId"
```

---

# PHASE 2 — Shared pure helpers

## Task 2: Extract `buildPermissionsByModule(codes)`

**Files:**
- Modify: `packages/shared/helpers.js`
- Test: `packages/shared/__tests__/permissions-by-module.test.js`

**Interfaces:**
- Produces: `buildPermissionsByModule(codes: string[]) -> { permissions: string[], permissionsByModule: Record<string,{codes:string[], [flag:string]:true}> }` — the exact grouping/action-flag logic currently inside `getEffectivePermissions`, but taking a code array directly.

- [ ] **Step 1: Write the failing test** `packages/shared/__tests__/permissions-by-module.test.js`:

```js
import { describe, it, expect } from "vitest";
import { buildPermissionsByModule } from "../helpers.js";

describe("buildPermissionsByModule", () => {
  it("groups codes by module and sets nav action flags", () => {
    const { permissions, permissionsByModule } = buildPermissionsByModule([
      "lead.list", "lead.view", "contract.create",
    ]);
    expect(new Set(permissions)).toEqual(new Set(["lead.list","lead.view","contract.create"]));
    expect(permissionsByModule.lead.codes).toContain("lead.view");
    expect(permissionsByModule.contract.codes).toEqual(["contract.create"]);
  });
  it("dedupes and tolerates empty input", () => {
    expect(buildPermissionsByModule([]).permissions).toEqual([]);
    expect(buildPermissionsByModule(["a.b","a.b"]).permissions).toEqual(["a.b"]);
  });
});
```

- [ ] **Step 2: Run — watch it fail.**

Run: `npx vitest run packages/shared/__tests__/permissions-by-module.test.js`
Expected: FAIL — `buildPermissionsByModule` is not exported.

- [ ] **Step 3: Implement.** In `packages/shared/helpers.js`, add the pure function (lift the loop body out of `getEffectivePermissions`):

```js
export function buildPermissionsByModule(codes) {
  const permissions = Array.from(new Set(Array.isArray(codes) ? codes : []));
  const permissionsByModule = {};
  for (const code of permissions) {
    const { module } = splitPermissionCode(code);
    const entry = (permissionsByModule[module] ??= { codes: [] });
    entry.codes.push(code);
    const actionFlag = NAVIGATION_PERMISSION_ACTIONS[module]?.[code];
    if (actionFlag) entry[actionFlag] = true;
  }
  return { permissions, permissionsByModule };
}
```

Then refactor `getEffectivePermissions` to reuse it (keep its existing signature/behavior for the seed + fallback):

```js
export function getEffectivePermissions(user) {
  if (!user) return { permissions: [], permissionsByModule: {} };
  const set = new Set(PROFILES[resolveProfileKey(user)] ?? []);
  const subRoles = Array.isArray(user.subRoles) ? user.subRoles : [];
  for (const entry of subRoles) {
    const subRole = typeof entry === "string" ? entry : entry?.subRole;
    if (!subRole) continue;
    for (const code of getPermissionsForRole(subRole)) set.add(code);
  }
  if (user.isSuperSales) for (const code of SUPER_SALES_EXTRA_PERMISSIONS) set.add(code);
  return buildPermissionsByModule(Array.from(set));
}
```

- [ ] **Step 4: Run — watch it pass.**

Run: `npx vitest run packages/shared`
Expected: PASS — new test + existing `permissions.test.js`/`profiles.test.js` all green.

- [ ] **Step 5: Barrel export.** In `packages/shared/index.js` add `buildPermissionsByModule` to the `helpers.js` re-export (match the file's existing export style).

- [ ] **Step 6: Commit.**

```bash
git add packages/shared/helpers.js packages/shared/index.js packages/shared/__tests__/permissions-by-module.test.js
git commit -m "refactor(shared): extract pure buildPermissionsByModule"
```

## Task 3: `deriveProfilesFromLegacy(user)`

**Files:**
- Modify: `packages/shared/constants/access/profiles.js`
- Modify: `packages/shared/index.js`
- Test: `packages/shared/__tests__/profiles.test.js` (append)

**Interfaces:**
- Consumes: existing `deriveProfileFromLegacy`, `USER_ROLES`, `PROFILE_KEYS`.
- Produces: `deriveProfilesFromLegacy(user) -> { profiles: string[], current: string }` — `current` is the base-role profile (== `deriveProfileFromLegacy`); `profiles` is `current` ∪ each subRole's profile ∪ (sales flags already folded into `current`).

- [ ] **Step 1: Append the failing test** to `packages/shared/__tests__/profiles.test.js`:

```js
import { deriveProfilesFromLegacy } from "../constants/access/profiles.js";

describe("deriveProfilesFromLegacy", () => {
  it("single-role user → one profile, current == it", () => {
    expect(deriveProfilesFromLegacy({ role: "ACCOUNTANT" }))
      .toEqual({ profiles: ["ACCOUNTANT"], current: "ACCOUNTANT" });
  });
  it("STAFF+isSuperSales → SUPER_SALES current", () => {
    expect(deriveProfilesFromLegacy({ role: "STAFF", isSuperSales: true }))
      .toEqual({ profiles: ["SUPER_SALES"], current: "SUPER_SALES" });
  });
  it("base role + subRoles → union, current is base", () => {
    const r = deriveProfilesFromLegacy({ role: "STAFF", subRoles: [{ subRole: "ACCOUNTANT" }] });
    expect(r.current).toBe("NORMAL_SALES");
    expect(new Set(r.profiles)).toEqual(new Set(["NORMAL_SALES", "ACCOUNTANT"]));
  });
});
```

- [ ] **Step 2: Run — watch it fail.**

Run: `npx vitest run packages/shared/__tests__/profiles.test.js -t deriveProfilesFromLegacy`
Expected: FAIL — not exported.

- [ ] **Step 3: Implement** in `packages/shared/constants/access/profiles.js`:

```js
// Full profile set for a legacy user: base-role profile (the default current) plus one
// profile per subRole. Sales flags are already folded into the base via deriveProfileFromLegacy.
export function deriveProfilesFromLegacy(user) {
  const current = deriveProfileFromLegacy(user);
  const set = new Set([current]);
  const subRoles = Array.isArray(user?.subRoles) ? user.subRoles : [];
  for (const entry of subRoles) {
    const sr = typeof entry === "string" ? entry : entry?.subRole;
    if (!sr) continue;
    set.add(deriveProfileFromLegacy({ role: sr }));
  }
  return { profiles: Array.from(set), current };
}
```

- [ ] **Step 4: Run — watch it pass.**

Run: `npx vitest run packages/shared/__tests__/profiles.test.js`
Expected: PASS.

- [ ] **Step 5: Barrel export** `deriveProfilesFromLegacy` in `packages/shared/index.js`.

- [ ] **Step 6: Commit.**

```bash
git add packages/shared/constants/access/profiles.js packages/shared/index.js packages/shared/__tests__/profiles.test.js
git commit -m "feat(shared): deriveProfilesFromLegacy (multi-profile mapping)"
```

---

# PHASE 3 — Catalog seed

## Task 4: Idempotent PermissionCode / Profile / ProfilePermission seed

**Files:**
- Create: `packages/db/prisma/seed.js`
- Modify: `packages/db/package.json` (add `"prisma": { "seed": "node prisma/seed.js" }` + a `db:seed` script)
- Test: `packages/db/__tests__/seed.logic.test.js` (pure helper test — the DB-touching run is manual)

**Interfaces:**
- Consumes: `ALL_PERMISSIONS`, `PROFILE_META`, `PROFILES`, `splitPermissionCode` from `@dms/shared`; the Prisma singleton from `@dms/db`.
- Produces: `buildCatalog() -> { codes:[{code,module}], profiles:[{key,label,family,baseRole,isAdminTier}], links:[{profileKey,code}] }` (pure, testable) and `seedCatalog({ prisma })` (idempotent upsert + diff-sync).

- [ ] **Step 1: Write the failing pure test** `packages/db/__tests__/seed.logic.test.js`:

```js
import { describe, it, expect } from "vitest";
import { buildCatalog, ADMIN_TIER_PROFILE_KEYS } from "../prisma/seed.js";

describe("buildCatalog", () => {
  const cat = buildCatalog();
  it("emits a code row per ALL_PERMISSIONS entry with a module", () => {
    expect(cat.codes.length).toBeGreaterThan(0);
    for (const c of cat.codes) { expect(c.code).toContain("."); expect(c.module).toBeTruthy(); }
  });
  it("marks ADMIN/SUPER_ADMIN/SUPER_SALES as admin-tier", () => {
    const byKey = Object.fromEntries(cat.profiles.map((p) => [p.key, p]));
    for (const k of ADMIN_TIER_PROFILE_KEYS) expect(byKey[k].isAdminTier).toBe(true);
    expect(byKey.NORMAL_SALES.isAdminTier).toBe(false);
  });
  it("every link references a real profile key and a real code", () => {
    const keys = new Set(cat.profiles.map((p) => p.key));
    const codes = new Set(cat.codes.map((c) => c.code));
    for (const l of cat.links) { expect(keys.has(l.profileKey)).toBe(true); expect(codes.has(l.code)).toBe(true); }
  });
});
```

- [ ] **Step 2: Run — watch it fail.**

Run: `npx vitest run packages/db/__tests__/seed.logic.test.js`
Expected: FAIL — cannot resolve `../prisma/seed.js`.

- [ ] **Step 3: Create `packages/db/prisma/seed.js`:**

```js
// Idempotent catalog seed: PermissionCode ← ALL_PERMISSIONS, Profile ← PROFILE_META,
// ProfilePermission ← the code-defined PROFILES map (diff-synced). Upsert-only; safe on prod.
import prisma from "../index.js"; // the @dms/db singleton (adjust to the package's actual entry)
import { ALL_PERMISSIONS, PROFILE_META, PROFILES, splitPermissionCode } from "@dms/shared";

export const ADMIN_TIER_PROFILE_KEYS = ["ADMIN", "SUPER_ADMIN", "SUPER_SALES"];

export function buildCatalog() {
  const codes = ALL_PERMISSIONS.map((code) => ({ code, module: splitPermissionCode(code).module }));
  const profiles = Object.entries(PROFILE_META).map(([key, m]) => ({
    key, label: m.label, family: m.family ?? null, baseRole: m.baseRole ?? null,
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
    await db.profile.upsert({ where: { key: p.key }, update: { label: p.label, family: p.family, baseRole: p.baseRole, isAdminTier: p.isAdminTier }, create: p });

  const codeId = new Map((await db.permissionCode.findMany({ select: { id: true, code: true } })).map((r) => [r.code, r.id]));
  const profId = new Map((await db.profile.findMany({ select: { id: true, key: true } })).map((r) => [r.key, r.id]));

  // diff-sync links per profile so the DB matches the constants exactly
  const desiredByProfile = new Map();
  for (const l of links) {
    const pid = profId.get(l.profileKey), cid = codeId.get(l.code);
    if (pid == null || cid == null) continue;
    (desiredByProfile.get(pid) ?? desiredByProfile.set(pid, new Set()).get(pid)).add(cid);
  }
  for (const [pid, desired] of desiredByProfile) {
    const existing = new Set((await db.profilePermission.findMany({ where: { profileId: pid }, select: { permissionCodeId: true } })).map((r) => r.permissionCodeId));
    const toAdd = [...desired].filter((c) => !existing.has(c));
    const toRemove = [...existing].filter((c) => !desired.has(c));
    await db.$transaction([
      ...toAdd.map((cid) => db.profilePermission.create({ data: { profileId: pid, permissionCodeId: cid } })),
      ...(toRemove.length ? [db.profilePermission.deleteMany({ where: { profileId: pid, permissionCodeId: { in: toRemove } } })] : []),
    ]);
  }
  return { codes: codes.length, profiles: profiles.length, links: links.length };
}

const invokedDirectly = process.argv[1] && process.argv[1].endsWith("seed.js");
if (invokedDirectly) {
  seedCatalog({ prisma })
    .then((r) => { console.log(`✅ Seed: ${r.codes} codes, ${r.profiles} profiles, ${r.links} links`); return prisma.$disconnect(); })
    .catch(async (e) => { console.error("❌ Seed failed:", e); await prisma.$disconnect(); process.exit(1); });
}
```

(During execution, confirm the `@dms/db` singleton import path — reuse whatever `server/prisma/prisma.js` re-exports.)

- [ ] **Step 4: Register the seed.** In `packages/db/package.json` add:

```json
  "prisma": { "seed": "node prisma/seed.js" },
  "scripts": { "db:seed": "node prisma/seed.js" }
```

- [ ] **Step 5: Run — watch the pure test pass.**

Run: `npx vitest run packages/db/__tests__/seed.logic.test.js`
Expected: PASS.

- [ ] **Step 6: Run the real seed against the local dev DB.**

Run: `cd server && node ../packages/db/prisma/seed.js` (or `npm run db:seed -w @dms/db`)
Expected: prints the counts; a second run prints identical counts and changes nothing (idempotent). Spot-check: `SELECT COUNT(*) FROM PermissionCode;` == `ALL_PERMISSIONS.length`.

- [ ] **Step 7: Commit.**

```bash
git add packages/db/prisma/seed.js packages/db/package.json packages/db/__tests__/seed.logic.test.js
git commit -m "feat(db): idempotent permission/profile catalog seed"
```

---

# PHASE 4 — User-migration + boot backfill repoint

## Task 5: `migrate-users-to-profiles.js` (idempotent data-migration)

**Files:**
- Create: `packages/db/scripts/migrate-users-to-profiles.js`
- Create: `server/src/bootstrap/__tests__/assign-profiles.test.js` (unit test on the pure assignment planner)

**Interfaces:**
- Consumes: `deriveProfilesFromLegacy` (`@dms/shared`), Prisma singleton.
- Produces: `planUserProfiles(user, profileIdByKey) -> { profileIds:number[], currentProfileId:number }` (pure); `runUserProfileMigration({ prisma }) -> { scanned, assigned, currentSet }` (idempotent).

- [ ] **Step 1: Write the failing test** `server/src/bootstrap/__tests__/assign-profiles.test.js`:

```js
import { describe, it, expect } from "vitest";
import { planUserProfiles } from "../../../../packages/db/scripts/migrate-users-to-profiles.js";

const ID = { NORMAL_SALES: 10, ACCOUNTANT: 20, ADMIN: 30 };

describe("planUserProfiles", () => {
  it("maps base role + subRoles to profile ids, current = base", () => {
    const p = planUserProfiles({ role: "STAFF", subRoles: [{ subRole: "ACCOUNTANT" }] }, ID);
    expect(p.currentProfileId).toBe(ID.NORMAL_SALES);
    expect(new Set(p.profileIds)).toEqual(new Set([ID.NORMAL_SALES, ID.ACCOUNTANT]));
  });
  it("single role", () => {
    expect(planUserProfiles({ role: "ADMIN" }, ID)).toEqual({ profileIds: [ID.ADMIN], currentProfileId: ID.ADMIN });
  });
});
```

- [ ] **Step 2: Run — watch it fail.**

Run: `npx vitest run server/src/bootstrap/__tests__/assign-profiles.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `packages/db/scripts/migrate-users-to-profiles.js`:**

```js
// Idempotent: assign every user the UserProfile rows derived from role+flags+subRoles and
// set currentProfileId ONLY IF NULL (never clobber a switched/reassigned current). Upsert-only.
import prisma from "../index.js";
import { deriveProfilesFromLegacy } from "@dms/shared";

export function planUserProfiles(user, profileIdByKey) {
  const { profiles, current } = deriveProfilesFromLegacy(user);
  const profileIds = profiles.map((k) => profileIdByKey[k]).filter((x) => x != null);
  return { profileIds, currentProfileId: profileIdByKey[current] };
}

export async function runUserProfileMigration({ prisma: db }) {
  const profileIdByKey = Object.fromEntries((await db.profile.findMany({ select: { id: true, key: true } })).map((p) => [p.key, p.id]));
  const users = await db.user.findMany({ select: { id: true, role: true, isPrimary: true, isSuperSales: true, currentProfileId: true, subRoles: { select: { subRole: true } } } });
  let assigned = 0, currentSet = 0;
  for (const u of users) {
    const { profileIds, currentProfileId } = planUserProfiles(u, profileIdByKey);
    for (const pid of profileIds) {
      await db.userProfile.upsert({ where: { userId_profileId: { userId: u.id, profileId: pid } }, update: {}, create: { userId: u.id, profileId: pid } });
      assigned += 1;
    }
    if (u.currentProfileId == null && currentProfileId != null) {
      await db.user.update({ where: { id: u.id }, data: { currentProfileId } });
      currentSet += 1;
    }
  }
  return { scanned: users.length, assigned, currentSet };
}

const invokedDirectly = process.argv[1] && process.argv[1].endsWith("migrate-users-to-profiles.js");
if (invokedDirectly) {
  runUserProfileMigration({ prisma })
    .then((r) => { console.log(`✅ User migration: ${r.scanned} users, ${r.assigned} assignments, ${r.currentSet} currents set`); return prisma.$disconnect(); })
    .catch(async (e) => { console.error("❌ User migration failed:", e); await prisma.$disconnect(); process.exit(1); });
}
```

- [ ] **Step 4: Run — watch it pass.**

Run: `npx vitest run server/src/bootstrap/__tests__/assign-profiles.test.js`
Expected: PASS.

- [ ] **Step 5: Run against the local dev DB (after Task 4 seed).**

Run: `cd server && node ../packages/db/scripts/migrate-users-to-profiles.js`
Expected: prints counts; a second run sets `currents: 0` and re-upserts the same assignments (idempotent). Spot-check a known multi-subRole user has ≥2 `UserProfile` rows and a non-null `currentProfileId`.

- [ ] **Step 6: Commit.**

```bash
git add packages/db/scripts/migrate-users-to-profiles.js server/src/bootstrap/__tests__/assign-profiles.test.js
git commit -m "feat(db): idempotent user→profile data migration"
```

## Task 6: Repoint boot backfill to relational assignment

**Files:**
- Modify: `server/src/bootstrap/backfill-profiles.js`
- Modify: `server/src/server.js` (call site)
- Test: `server/src/bootstrap/__tests__/backfill-profiles.test.js` (update)

**Interfaces:**
- Produces: `runProfileBackfill({ prisma })` now ensures every user has ≥1 `UserProfile` + a `currentProfileId` by delegating to `runUserProfileMigration`.

- [ ] **Step 1: Update the test** `server/src/bootstrap/__tests__/backfill-profiles.test.js` to assert delegation (mock `db.profile.findMany`, `db.user.findMany`, `db.userProfile.upsert`, `db.user.update`) — assert a user with `currentProfileId: null` gets `user.update` called and one with it set does not.

- [ ] **Step 2: Run — watch it fail** (old string-column behavior).

- [ ] **Step 3: Reimplement** `backfill-profiles.js` to re-export the relational migration:

```js
// Boot-time safety net: ensure every user has profile assignments + a current profile.
// Delegates to the idempotent data migration (WHERE currentProfileId IS NULL guards re-runs).
export { runUserProfileMigration as runProfileBackfill } from "../../../packages/db/scripts/migrate-users-to-profiles.js";
```

(During execution, verify the relative import resolves from `server/src/bootstrap/`; if the monorepo aliases `@dms/db-scripts` or similar, use that. Otherwise keep the old function name as a thin wrapper calling `runUserProfileMigration`.)

- [ ] **Step 4: Run — watch it pass.**

- [ ] **Step 5: Verify `server.js` call site** still passes `{ prisma }` and logs `r.assigned`/`r.currentSet` (adjust the log line).

- [ ] **Step 6: Commit.**

```bash
git add server/src/bootstrap/backfill-profiles.js server/src/server.js server/src/bootstrap/__tests__/backfill-profiles.test.js
git commit -m "feat(server): repoint boot backfill to relational profile assignment"
```

---

# PHASE 5 — Profile cache

## Task 7: `ProfilePermissionCache`

**Files:**
- Create: `server/src/infra/auth/profile-cache.repository.js`
- Create: `server/src/infra/auth/profile-cache.js`
- Test: `server/src/infra/auth/__tests__/profile-cache.test.js`

**Interfaces:**
- Consumes: Prisma singleton (in the repo only).
- Produces: `createProfileCache({ repository })` → object with `load(): Promise<void>`, `resolve(profileId): { permissions, permissionsByModule, isAdminTier, baseRole, key } | null`, `invalidate(): void`. Repo: `loadProfilesWithCodes() -> [{ id, key, isAdminTier, baseRole, codes: string[] }]`.

- [ ] **Step 1: Write the failing test** `server/src/infra/auth/__tests__/profile-cache.test.js`:

```js
import { describe, it, expect } from "vitest";
import { createProfileCache } from "../profile-cache.js";

const fakeRepo = {
  loadProfilesWithCodes: async () => [
    { id: 1, key: "ADMIN", isAdminTier: true, baseRole: "ADMIN", codes: ["lead.list", "lead.view"] },
    { id: 2, key: "NORMAL_SALES", isAdminTier: false, baseRole: "STAFF", codes: ["lead.list"] },
  ],
};

describe("profile cache", () => {
  it("resolves codes + isAdminTier by profileId", async () => {
    const cache = createProfileCache({ repository: fakeRepo });
    await cache.load();
    const admin = cache.resolve(1);
    expect(admin.isAdminTier).toBe(true);
    expect(new Set(admin.permissions)).toEqual(new Set(["lead.list", "lead.view"]));
    expect(admin.permissionsByModule.lead.codes).toContain("lead.view");
    expect(cache.resolve(2).isAdminTier).toBe(false);
  });
  it("returns null for an unknown id", async () => {
    const cache = createProfileCache({ repository: fakeRepo });
    await cache.load();
    expect(cache.resolve(999)).toBeNull();
  });
});
```

- [ ] **Step 2: Run — watch it fail.**

Run: `npx vitest run server/src/infra/auth/__tests__/profile-cache.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Create the repository** `server/src/infra/auth/profile-cache.repository.js`:

```js
import prisma from "@dms/db";
export const profileCacheRepository = {
  async loadProfilesWithCodes() {
    const rows = await prisma.profile.findMany({
      select: { id: true, key: true, isAdminTier: true, baseRole: true,
        permissionLinks: { select: { permissionCode: { select: { code: true } } } } },
    });
    return rows.map((p) => ({ id: p.id, key: p.key, isAdminTier: p.isAdminTier, baseRole: p.baseRole,
      codes: p.permissionLinks.map((l) => l.permissionCode.code) }));
  },
};
```

- [ ] **Step 4: Create the cache** `server/src/infra/auth/profile-cache.js`:

```js
import { buildPermissionsByModule } from "@dms/shared";
import { profileCacheRepository } from "./profile-cache.repository.js";

export function createProfileCache({ repository = profileCacheRepository } = {}) {
  let byId = new Map();
  return {
    async load() {
      const rows = await repository.loadProfilesWithCodes();
      const next = new Map();
      for (const p of rows) {
        const { permissions, permissionsByModule } = buildPermissionsByModule(p.codes);
        next.set(p.id, { key: p.key, isAdminTier: p.isAdminTier, baseRole: p.baseRole, permissions, permissionsByModule });
      }
      byId = next;
    },
    resolve(profileId) {
      if (profileId == null) return null;
      return byId.get(Number(profileId)) ?? null;
    },
    async invalidate() { await this.load(); },
  };
}

export const profileCache = createProfileCache();
```

- [ ] **Step 5: Run — watch it pass.**

Run: `npx vitest run server/src/infra/auth/__tests__/profile-cache.test.js`
Expected: PASS.

- [ ] **Step 6: Load the cache on boot.** In `server/src/server.js`, after the DB is reachable and BEFORE the HTTP server starts serving, add:

```js
import { profileCache } from "./infra/auth/profile-cache.js";
// ...
await profileCache.load();
console.log("✅ Profile permission cache loaded");
```

(Place it after the profile backfill so freshly-seeded profiles are present.)

- [ ] **Step 7: Commit.**

```bash
git add server/src/infra/auth/profile-cache.js server/src/infra/auth/profile-cache.repository.js server/src/infra/auth/__tests__/profile-cache.test.js server/src/server.js
git commit -m "feat(server): in-process profile→codes permission cache"
```

---

# PHASE 6 — Auth token / dto / middleware / /auth/me

## Task 8: Token payload + selects + middleware resolve via cache

**Files:**
- Modify: `server/src/modules/auth/auth.dto.js` (`userAuthSelect`, `toTokenPayload`)
- Modify: `server/src/shared/middlewares/auth.middleware.js` (`requireAuth`)
- Modify: `server/src/modules/auth/auth.usecase.js` (refresh re-validates current)
- Test: `server/src/shared/middlewares/__tests__/auth.middleware.test.js`

**Interfaces:**
- Consumes: `profileCache.resolve` (Task 7).
- Produces: `req.auth = { id, email, name, role, currentProfileId, currentProfileKey, baseRole, isAdminTier, permissions, permissionsByModule }`.

- [ ] **Step 1: Write the failing test** `server/src/shared/middlewares/__tests__/auth.middleware.test.js` — stub `JwtService.verifyAccess` to return `{ id: 5, currentProfileId: 1, role: "ADMIN" }` and inject a fake `profileCache` resolving id 1 → `{ key:"ADMIN", isAdminTier:true, permissions:["lead.view"], permissionsByModule:{lead:{codes:["lead.view"]}} }`; assert `req.auth.permissions` and `req.auth.isAdminTier === true`. (If `requireAuth` imports the singleton directly, refactor it to read `profileCache` from a module import so the test can `vi.mock` it.)

- [ ] **Step 2: Run — watch it fail.**

- [ ] **Step 3: Implement.**
  - `auth.dto.js` `userAuthSelect`: add `currentProfileId: true`, `currentProfile: { select: { id: true, key: true, baseRole: true, isAdminTier: true } }`, and `userProfiles: { select: { profile: { select: { id: true, key: true, label: true, family: true, isAdminTier: true } } } }`. Mirror into `userRefreshSelect`.
  - `auth.dto.js` `toTokenPayload`: add `currentProfileId: user.currentProfileId ?? user.currentProfile?.id ?? null` (keep `id,email,name,role,isActive`; drop `subRoles`/`isSuperSales` from the payload — no longer used for resolution).
  - `auth.middleware.js` `requireAuth`: replace `getEffectivePermissions(payload)` with:

```js
import { profileCache } from "../../infra/auth/profile-cache.js";
// ...
const resolved = profileCache.resolve(payload.currentProfileId);
if (!resolved) return next(new AppError(authMessagesCodes.UNAUTHORIZED, 401)); // force refresh
req.auth = {
  ...payload,
  currentProfileKey: resolved.key,
  baseRole: resolved.baseRole,
  isAdminTier: Boolean(resolved.isAdminTier),
  permissions: resolved.permissions,
  permissionsByModule: resolved.permissionsByModule,
};
```

  - `auth.usecase.js` `refreshTokens`: after re-reading the user, if `user.currentProfileId` is not among `user.userProfiles.map(up => up.profile.id)`, set it to the base-role profile (else first assigned) before `toTokenPayload` (add a small `resolveValidCurrent(user)` helper; persist the correction via the repo if changed).

- [ ] **Step 4: Run — watch it pass.** Run the middleware test + existing auth tests.

- [ ] **Step 5: Commit.**

```bash
git add server/src/modules/auth/auth.dto.js server/src/shared/middlewares/auth.middleware.js server/src/modules/auth/auth.usecase.js server/src/shared/middlewares/__tests__/auth.middleware.test.js
git commit -m "feat(auth): resolve request permissions from currentProfile via cache"
```

## Task 9: `/auth/me` gains `profiles[]` + `currentProfileId`

**Files:**
- Modify: `server/src/modules/auth/auth.dto.js` (`toMe`)
- Test: `server/src/modules/auth/__tests__/auth.dto.test.js` (append)

**Interfaces:**
- Produces: `toMe(user)` returns all existing keys plus `profiles: [{id,key,label,family,isAdminTier}]`, `currentProfileId`, and `profile` = `currentProfileKey`.

- [ ] **Step 1: Append the failing test:**

```js
describe("toMe profiles", () => {
  it("returns the assigned profiles + current", () => {
    const me = AuthSchema.toMe({
      id: 1, email: "a@b.c", name: "A", role: "STAFF", currentProfileId: 2,
      currentProfile: { id: 2, key: "PRIMARY_SALES", baseRole: "STAFF", isAdminTier: false },
      userProfiles: [{ profile: { id: 2, key: "PRIMARY_SALES", label: "x", family: "SALES", isAdminTier: false } },
                     { profile: { id: 5, key: "ACCOUNTANT", label: "y", family: "FINANCE", isAdminTier: false } }],
      permissions: ["lead.view"], permissionsByModule: { lead: { codes: ["lead.view"] } },
    });
    expect(me.currentProfileId).toBe(2);
    expect(me.profile).toBe("PRIMARY_SALES");
    expect(me.profiles.map((p) => p.key).sort()).toEqual(["ACCOUNTANT", "PRIMARY_SALES"]);
  });
});
```

- [ ] **Step 2: Run — watch it fail.**

- [ ] **Step 3: Implement** in `toMe`: derive `profiles` from `user.userProfiles?.map(up => up.profile)`; set `currentProfileId: user.currentProfileId ?? null`; set `profile: user.currentProfile?.key ?? resolveProfileKey(user)`. Keep `permissions`/`permissionsByModule` from `req.auth` when present (as today), else `buildPermissionsByModule` from the current profile's codes. Keep `navigationTabs` — now built from `permissions` (Task 10 makes nav permission-driven).

- [ ] **Step 4: Run — watch it pass.**

- [ ] **Step 5: Commit.**

```bash
git add server/src/modules/auth/auth.dto.js server/src/modules/auth/__tests__/auth.dto.test.js
git commit -m "feat(auth): /auth/me returns profiles[] + currentProfileId (contract preserved)"
```

---

# PHASE 7 — Scope + navigation follow the current profile

## Task 10: `isAdminTier`/`isAdminUser` + nav from permissions

**Files:**
- Modify: `server/src/modules/users/user/user.dto.js` (`isAdminTier`)
- Modify: `server/src/modules/projects/project/project.usecase.js` (`isAdminUser`)
- Modify: `packages/shared/helpers.js` (`buildNavigationTabs` → permission-driven, or add `buildNavigationTabsFromPermissions`)
- Test: `server/src/modules/users/user/__tests__/is-admin-tier.test.js`; `packages/shared/__tests__/navigation.test.js`

**Interfaces:**
- Produces: `isAdminTier(authUser)` / `isAdminUser(authUser)` return `Boolean(authUser.isAdminTier)`; nav filtered by whether the current profile's codes satisfy each tab's required code/module.

- [ ] **Step 1: Write the failing tests** — `isAdminTier({ isAdminTier: true, role: "STAFF" }) === true` and `isAdminTier({ isAdminTier: false, role: "ADMIN" }) === false` (proves it reads the flag, not role); a nav test asserting a profile whose codes lack a module hides that tab.

- [ ] **Step 2: Run — watch them fail.**

- [ ] **Step 3: Implement.**
  - `user.dto.js`: `export const isAdminTier = (authUser) => Boolean(authUser?.isAdminTier);`
  - `project.usecase.js`: `const isAdminUser = (authUser) => Boolean(authUser?.isAdminTier);`
  - `helpers.js` `buildNavigationTabs`: change the filter from `role ∈ allowedRoles` to permission-driven — a tab shows if the user holds its `requiredPermission` (or any code in its module). Map each `NAVIGATION` item to a required code/module (add `requiredPermission`/`module` to the nav config where missing). Preserve tab order/labels. Keep a `baseRole` fallback for tabs that have no natural code (if any) using `authUser.baseRole`.

- [ ] **Step 4: Run — watch them pass**, plus the full shared + server suites (regression).

- [ ] **Step 5: Commit.**

```bash
git add server/src/modules/users/user/user.dto.js server/src/modules/projects/project/project.usecase.js packages/shared/helpers.js packages/shared/constants/access/navigation.js server/src/modules/users/user/__tests__/is-admin-tier.test.js packages/shared/__tests__/navigation.test.js
git commit -m "feat(authz): admin-tier + navigation follow the current profile"
```

---

# PHASE 8 — Switch endpoint + audit + message codes

## Task 11: `AuthAuditLog` repository + message codes

**Files:**
- Create: `server/src/infra/audit/auth-audit.repository.js`
- Modify: the shared message-codes source (`packages/shared/messages-codes/*` or `server/src/shared/messages/*` — match the repo) — add `PROFILE_NOT_ASSIGNED`,`PROFILE_NOT_FOUND`,`PROFILE_SWITCHED`,`PROFILES_UPDATED` + Arabic resolution mirror in `web/src/app/helpers/messages/*`.
- Test: `server/src/infra/audit/__tests__/auth-audit.repository.test.js`

**Interfaces:**
- Produces: `authAuditRepository.record({ actorUserId, targetUserId, action, detail }) -> Promise<void>`.

- [ ] **Step 1–4 (TDD):** test that `record` calls `prisma.authAuditLog.create` with the right shape (mock prisma); implement:

```js
import prisma from "@dms/db";
export const authAuditRepository = {
  async record({ actorUserId, targetUserId = null, action, detail = null }) {
    await prisma.authAuditLog.create({ data: { actorUserId, targetUserId, action, detail } });
  },
};
```

- [ ] **Step 5:** add the four message CODEs (language-neutral) + Arabic mirror strings. Run the message-code validation test if one exists.

- [ ] **Step 6: Commit** `feat(server): AuthAuditLog repo + profile message codes`.

## Task 12: `POST /v2/auth/profile/switch`

**Files:**
- Create: `server/src/modules/auth/profile-switch.usecase.js`, `profile-switch.controller.js`, `profile-switch.validation.js`
- Modify: `server/src/modules/auth/auth.routes.js` (wire the route, behind `requireAuth`)
- Modify: `server/src/modules/auth/auth.repository.js` (add `getUserWithProfiles(id)`, `setCurrentProfile(id, profileId)`)
- Test: `server/src/modules/auth/__tests__/profile-switch.usecase.test.js`

**Interfaces:**
- Consumes: `authAuditRepository`, auth repo, `JwtService`, `toMe`.
- Produces: usecase `switchProfile({ authUser, profileId }) -> { user, accessToken, refreshToken }`; throws `AppError(PROFILE_NOT_ASSIGNED, 403)` if unheld.

- [ ] **Step 1: Failing test** — a fake repo where user holds profiles `[2,5]`; `switchProfile({ authUser:{id:1}, profileId: 5 })` sets current to 5, audits `PROFILE_SWITCH`, returns re-signed tokens + `toMe`. `profileId: 99` (unheld) throws 403.

- [ ] **Step 2: Run — fail.**

- [ ] **Step 3: Implement** the usecase:

```js
export async function switchProfile({ authUser, profileId }) {
  const user = await authRepository.getUserWithProfiles(authUser.id);
  const held = new Set((user.userProfiles ?? []).map((up) => up.profile.id));
  if (!held.has(Number(profileId))) throw new AppError(messages.PROFILE_NOT_ASSIGNED, 403);
  await authRepository.setCurrentProfile(user.id, Number(profileId));
  await authAuditRepository.record({ actorUserId: user.id, targetUserId: user.id, action: "PROFILE_SWITCH", detail: { profileId } });
  const fresh = await authRepository.findById(user.id); // includes currentProfile + userProfiles
  const accessToken = JwtService.signAccess(AuthSchema.toTokenPayload(fresh));
  const refreshToken = JwtService.signRefresh(AuthSchema.toTokenPayload(fresh));
  return { user: AuthSchema.toMe(fresh), accessToken, refreshToken };
}
```

  Controller sets the auth cookies (reuse the login controller's cookie-setting helper) and responds `{ success, message: PROFILE_SWITCHED, data: { user }, translationKey }`. Validation: `z.object({ profileId: z.coerce.number().int().positive() })`. Route: `router.post("/profile/switch", requireAuth, validate(schema), controller.switchProfile)`.

- [ ] **Step 4: Run — pass.**

- [ ] **Step 5: Commit** `feat(auth): self-service profile switch endpoint`.

---

# PHASE 9 — Admin assign / remove profiles

## Task 13: `PUT /v2/users/:userId/profiles`

**Files:**
- Modify: `server/src/modules/users/user/user.repository.js` (`setUserProfiles`, `getUserProfiles`)
- Modify: `server/src/modules/users/user/user.usecase.js` (`updateUserProfiles`)
- Modify: `server/src/modules/users/user/user.validation.js` (`updateProfilesSchema`)
- Modify: `server/src/modules/users/user/user.controller.js` + routes (gate `user.manage_roles` + admin-tier)
- Test: `server/src/modules/users/user/__tests__/update-profiles.usecase.test.js`

**Interfaces:**
- Produces: `updateUserProfiles({ authUser, userId, profileIds, currentProfileId }) -> updatedUserMe`. Diff-applies `UserProfile` rows (audited add/remove); if `currentProfileId` isn't in the new set, fall back to base-role profile else first; syncs `role`/flags from the new current's `baseRole`/meta (reuse `applyProfileToBody` path).

- [ ] **Step 1: Failing test** — user currently holds `[2]`; `updateUserProfiles({ profileIds:[2,5], currentProfileId:5 })` → repo `setUserProfiles` called with add `[5]`, `currentProfileId=5`; audits `PROFILE_ASSIGN` for 5. Removing 2 audits `PROFILE_REMOVE`. Passing an empty `profileIds` throws (a user must keep ≥1 profile).

- [ ] **Step 2–4 (TDD):** implement repo diff (`$transaction` of createMany for adds + deleteMany for removes), usecase (validate `profileIds` non-empty; resolve fallback current; audit each delta; keep `role`/flags synced), validation `z.object({ profileIds: z.array(z.coerce.number().int().positive()).min(1), currentProfileId: z.coerce.number().int().positive().optional() })`, controller + route gated by `requirePermissions([PERMISSIONS.USER.MANAGE_ROLES])` + the users object-scope checker. On success invalidate nothing (per-user data, not the profile catalog).

- [ ] **Step 5: Commit** `feat(users): admin assign/remove profiles (audited)`.

---

# PHASE 10 — Frontend

## Task 14: `AuthProvider` reads profiles

**Files:** Modify `web/src/app/providers/AuthProvider.jsx`.

- [ ] **Step 1:** After `setUser(nextUser)`, add `setProfiles(nextUser?.profiles ?? [])` and `setCurrentProfileId(nextUser?.currentProfileId ?? null)`; expose `profiles`, `currentProfileId`, and a `refetchMe()` in the context value. (Add the two `useState`s.)
- [ ] **Step 2:** Verify build: `cd web && npx next build 2>&1 | tail -5` → compiled successfully.
- [ ] **Step 3: Commit** `feat(web): expose profiles + currentProfile in AuthProvider`.

## Task 15: `ProfileSwitcher` in the AppBar

**Files:** Create `web/src/app/UiComponents/utility/ProfileSwitcher.jsx`; modify `web/src/app/(auth)/dashboard/(dashboard)/layout.jsx` (~`:656`).

- [ ] **Step 1:** Build a MUI `Select`/menu bound to `profiles`, value `currentProfileId`; on change call `handleRequestSubmit` → `POST auth/profile/switch { profileId }`; on success call `refetchMe()` (re-pulls `/auth/me`, re-gates the app). Hide when `profiles.length <= 1`. Label each option with `profile.label`.
- [ ] **Step 2:** Mount `<ProfileSwitcher />` in the AppBar cluster beside the role chip; keep `SignInWithDifferentUserRole` for now (dev tool).
- [ ] **Step 3:** Build verify (`npx next build`).
- [ ] **Step 4: Commit** `feat(web): current-profile switcher in dashboard header`.

## Task 16: Admin profile manager on the Users page

**Files:** Modify the Users page + replace `RoleManagerDialog` usage with a profile multi-select + current radio.

- [ ] **Step 1:** Add a dialog listing all assignable profiles (fetched from a lightweight `GET /v2/utilities/...` or a new `GET /v2/profiles` returning `{id,key,label,family}`; if none exists, add a tiny read endpoint gated by `user.list`). Multi-select the user's `profileIds` + choose `currentProfileId`; submit to `PUT users/:userId/profiles`.
- [ ] **Step 2:** Build verify.
- [ ] **Step 3: Commit** `feat(web): admin profile assignment on users page`.

---

# PHASE 11 — Gate + prod note

## Task 17: Full suite, parity matrix, prod rollout note

**Files:** `docs/superpowers/specs/permissions-parity-matrix.md` (append a section); `docs/superpowers/plans/prod-migration-runbook.md` (append the ordered rollout); `PROJECT_STATE.md`.

- [ ] **Step 1:** `npm test` — all shared + server tests green (incl. the existing `authz.integration.test.js`, `permissions.test.js`).
- [ ] **Step 2:** Add a parity section: single-profile users identical to master; list the intentional divergence (current-profile-only) + the count of prod users with subRoles (query provided in the runbook).
- [ ] **Step 3:** Append the prod rollout order to the runbook: (1) `migrate deploy` + `migrate resolve --applied` baseline, (2) `db:seed`, (3) `node scripts/migrate-users-to-profiles.js`, (4) deploy the new server/web, (5) rollback = redeploy old code (columns retained). Explicit "NEVER reset prod".
- [ ] **Step 4:** Update `PROJECT_STATE.md` (feature complete; parity divergence documented).
- [ ] **Step 5: Commit** `docs: DB-relational permissions parity + prod rollout note`.

---

## Self-Review

- **Spec coverage:** §2 model → Task 1; §2.2 current-profile rule → Tasks 7–9 + parity Task 17; §3 cache/token/middleware → Tasks 7–9; §3.5 /auth/me → Task 9; §4 scope → Task 10; §5 seed → Task 4; §6 user-migration → Tasks 5–6; §7 rollout → Task 17; §8 endpoints → Tasks 11–13; §9 FE → Tasks 14–16; §10 tests → per-task + Task 17; §2.1 AuthAuditLog → Task 11. All covered.
- **Placeholder scan:** every code step has real code; the two "match the repo" notes (message-codes location in Task 11; `@dms/db` import path in Tasks 4/5) are genuine adapt-to-codebase points with the exact code given.
- **Type consistency:** `buildPermissionsByModule(codes)`, `deriveProfilesFromLegacy(user)→{profiles,current}`, `planUserProfiles(user,map)→{profileIds,currentProfileId}`, `profileCache.resolve(id)→{permissions,permissionsByModule,isAdminTier,baseRole,key}`, `req.auth.isAdminTier`, `switchProfile({authUser,profileId})`, `updateUserProfiles({authUser,userId,profileIds,currentProfileId})` — names used consistently across tasks.
- **Divergence guard:** only the current-profile-only rule changes observable access; documented + quantified in Task 17. Legacy columns never dropped.

## Notes for the executor
- **Data before code** (spec §7): Tasks 1→4→5 populate the DB before Tasks 7–9 flip the runtime source. Locally this is fine in-session; on prod it is the strict order in Task 17.
- **Never reset prod.** All DB scripts are upsert/idempotent.
- Prisma migration (Task 1) + the real seed/user-migration runs (Tasks 4–5) require a reachable dev DB (`server/.env` `DATABASE_URL`). Unit tests (pure + mocked) run without a DB.
