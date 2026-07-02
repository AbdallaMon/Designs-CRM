# Permission Profiles Implementation Plan (Phases 1–2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce code-defined permission **profiles** (one per user) as the source of a user's permissions, backfill existing users from the retained `isPrimary`/`isSuperSales` flags, and let the FE assign a profile — with **zero change to effective access** (parity with master).

**Architecture:** A `PROFILES` map in `@dms/shared` gives each profile a permission-code set (built from the existing `role-permissions.js` blocks, so it's parity-equal by construction). `getEffectivePermissions` resolves a user's profile (from the new `User.profile` column, falling back to a derivation from the legacy flags) and unions its codes with transitional subRole/`isSuperSales` augmentations that guarantee identical output on the pre-existing code universe. A bootstrap script backfills `profile`; the user create/edit UI sends a `profile` that the backend persists and keeps in sync with the legacy `role`/flags.

**Tech Stack:** JavaScript ESM, npm workspaces, Prisma 6 (MySQL), Express, Zod, **Vitest** (`npm test` → `vitest run`), Next.js 16 + MUI 7 (FE).

## Global Constraints

- **Parity is the hard requirement.** Effective access must stay identical to master on the pre-existing permission-code universe. The ONLY new grants are the new `lead.*.view` codes (§4 of the spec), which nothing gates on in Phases 1–2.
- **Keep `isPrimary`/`isSuperSales` forever.** Never drop or null them; they are the backfill source + rollback. App logic still stops gating on them (later phases).
- **Never edit MySQL by hand.** Schema changes go through `npm run db:migrate` (`prisma migrate dev --schema packages/db/prisma/schema.prisma`) per `docs/db-migrations-workflow.md`. **Never touch production** — prod is a user-run runbook.
- **Never change PDF logic** (unrelated here, but the repo rule stands).
- **JavaScript only** in source (no TS). ESM (`"type":"module"`).
- **One profile per user, mutually exclusive.** `SUPER_SALES` = flagged staff; `SUPER_SALES_BASE` = the base SUPER_SALES role.
- Frontend verified with `cd web && npx next build` (repo eslint is broken).
- Reference: spec `docs/superpowers/specs/2026-07-02-permission-profiles-design.md`.

---

## File Structure

- Create `packages/shared/constants/access/profiles.js` — `PROFILES`, `PROFILE_META`, `PROFILE_KEYS`, `deriveProfileFromLegacy()`, `resolveProfileKey()`.
- Modify `packages/shared/constants/access/permissions.constants.js` — add 5 lead VIEW codes.
- Modify `packages/shared/constants/access/role-permissions.js` — export the reusable code blocks the profiles need (`LEAD_SECTION_PRIMARY`, and the already-exported building blocks).
- Modify `packages/shared/helpers.js` — rewrite `getEffectivePermissions` to resolve via profile; re-export profile helpers.
- Modify `packages/shared/index.js` — barrel-export the new profile symbols.
- Create/extend `packages/shared/__tests__/profiles.test.js` and `.../permissions.test.js` — parity + resolution tests.
- Modify `packages/db/prisma/schema.prisma` — add `User.profile String?`.
- New migration dir under `packages/db/prisma/migrations/` (generated).
- Create `server/src/bootstrap/backfill-profiles.js` — idempotent backfill.
- Modify `server/src/server.js` — invoke the backfill on boot.
- Create `server/src/bootstrap/__tests__/backfill-profiles.test.js`.
- Modify `server/src/modules/auth/auth.dto.js` — `toMe` emits `profile`.
- Modify `server/src/modules/users/user/user.validation.js` — accept `profile`.
- Modify `server/src/modules/users/user/user.usecase.js` — derive `role`/flags from `profile`, persist `profile`.
- Modify `web/src/app/UiComponents/pages/UsersPage.jsx` — profile `<select>` in create/edit `inputs`.

---

# PHASE 1 — Framework + data (backend, zero visible change)

## Task 1: `profiles.js` — the profile map + resolver

**Files:**
- Create: `packages/shared/constants/access/profiles.js`
- Modify: `packages/shared/constants/access/role-permissions.js` (export `LEAD_SECTION_PRIMARY`, `LEAD_SECTION_ANALYSIS`)
- Modify: `packages/shared/constants/access/permissions.constants.js` (add view codes — done here so profiles can reference them)
- Test: `packages/shared/__tests__/profiles.test.js`

**Interfaces:**
- Produces: `PROFILES` (`Record<string,string[]>`), `PROFILE_KEYS` (`string[]`), `PROFILE_META` (`Record<string,{label:string,family:string,baseRole:string,isPrimary?:boolean,isSuperSales?:boolean}>`), `deriveProfileFromLegacy(user):string`, `resolveProfileKey(user):string`.

- [ ] **Step 1: Add the new lead VIEW codes** to `permissions.constants.js`, inside `LEAD_PERMISSIONS` (after `COUNTRY_CHECK`):

```js
  // section-visibility codes (make the FE's isPrimary-gated tabs expressible as codes;
  // nothing gates on them until Phase 3 — additive, no parity impact).
  PRICE_OFFER_VIEW: "lead.price_offer.view",
  PROJECTS_VIEW: "lead.projects.view",
  MODIFICATIONS_VIEW: "lead.modifications.view",
  UPDATES_VIEW: "lead.updates.view",
  ANALYSIS_VIEW: "lead.analysis.view",
```

- [ ] **Step 2: Export the profile code blocks** in `role-permissions.js`. After `SUPER_SALES_EXTRA_PERMISSIONS`, add:

```js
// Lead-detail sections that master shows only to admin || primary staff. New VIEW
// codes (see permissions.constants.js) granted to PRIMARY_SALES/SUPER_SALES/admin.
export const LEAD_SECTION_PRIMARY = [
  P.LEAD.PRICE_OFFER_VIEW,
  P.LEAD.PROJECTS_VIEW,
  P.LEAD.MODIFICATIONS_VIEW,
  P.LEAD.UPDATES_VIEW,
];
// The client-analysis tools master shows to admin || ANY staff → also NORMAL_SALES.
export const LEAD_SECTION_ANALYSIS = [P.LEAD.ANALYSIS_VIEW];
```

Also export the currently-module-private building blocks the profiles reuse. Change their declarations from `const X = [...]` to `export const X = [...]` for: `SHARED_AUTHED`, `LEAD_AUTHED`, `LEAD_ADMIN`, `PROJECT_AUTHED`, `PROJECT_ADMIN`, `USER_ADMIN`, `ACCOUNTING_ALL`, `STAFF_GATE`, `TELEGRAM_ADMIN`, `SITE_UTILITY_ADMIN`, `COURSE_ADMIN`, `IMAGE_SESSION_ADMIN`, `ADMIN_RESIDUAL`. (They already exist; just add `export`.) `ROLE_PERMISSIONS` and `SUPER_SALES_EXTRA_PERMISSIONS` are already exported.

- [ ] **Step 3: Write the failing test** `packages/shared/__tests__/profiles.test.js`:

```js
import { describe, it, expect } from "vitest";
import { PROFILES, PROFILE_KEYS, PROFILE_META, deriveProfileFromLegacy, resolveProfileKey }
  from "../constants/access/profiles.js";
import { ROLE_PERMISSIONS, SUPER_SALES_EXTRA_PERMISSIONS } from "../constants/access/role-permissions.js";
import { ALL_PERMISSIONS } from "../constants/access/permissions.constants.js";

const set = (a) => new Set(a);
const eq = (a, b) => set(a).size === set(b).size && a.every((x) => set(b).has(x));

describe("profiles map", () => {
  it("every profile key has a code array and a PROFILE_META entry", () => {
    for (const key of PROFILE_KEYS) {
      expect(Array.isArray(PROFILES[key])).toBe(true);
      expect(PROFILE_META[key]).toBeTruthy();
      expect(PROFILE_META[key].baseRole).toBeTruthy();
    }
  });

  it("all profile codes are real permission codes", () => {
    const universe = set(ALL_PERMISSIONS);
    for (const key of PROFILE_KEYS)
      for (const code of PROFILES[key]) expect(universe.has(code)).toBe(true);
  });

  it("NORMAL_SALES equals STAFF role codes plus ANALYSIS_VIEW", () => {
    const staff = ROLE_PERMISSIONS.STAFF;
    const extra = PROFILES.NORMAL_SALES.filter((c) => !staff.includes(c));
    expect(extra).toEqual(["lead.analysis.view"]);
  });

  it("SUPER_SALES ⊇ PRIMARY_SALES ⊇ NORMAL_SALES", () => {
    const sup = set(PROFILES.SUPER_SALES), pri = set(PROFILES.PRIMARY_SALES);
    expect(PROFILES.PRIMARY_SALES.every((c) => sup.has(c))).toBe(true);
    expect(PROFILES.NORMAL_SALES.every((c) => pri.has(c))).toBe(true);
  });

  it("SUPER_SALES includes the isSuperSales admin-tier extras", () => {
    const sup = set(PROFILES.SUPER_SALES);
    expect(SUPER_SALES_EXTRA_PERMISSIONS.every((c) => sup.has(c))).toBe(true);
  });
});

describe("deriveProfileFromLegacy", () => {
  const cases = [
    [{ role: "STAFF" }, "NORMAL_SALES"],
    [{ role: "STAFF", isPrimary: true }, "PRIMARY_SALES"],
    [{ role: "STAFF", isSuperSales: true }, "SUPER_SALES"],
    [{ role: "STAFF", isPrimary: true, isSuperSales: true }, "SUPER_SALES"],
    [{ role: "ADMIN" }, "ADMIN"],
    [{ role: "SUPER_ADMIN" }, "SUPER_ADMIN"],
    [{ role: "SUPER_SALES" }, "SUPER_SALES_BASE"],
    [{ role: "ACCOUNTANT" }, "ACCOUNTANT"],
    [{ role: "THREE_D_DESIGNER" }, "DESIGNER_3D"],
    [{ role: "TWO_D_DESIGNER" }, "DESIGNER_2D"],
    [{ role: "TWO_D_EXECUTOR" }, "EXECUTOR_2D"],
    [{ role: "CONTACT_INITIATOR" }, "CONTACT_INITIATOR"],
  ];
  it.each(cases)("%o -> %s", (user, expected) => {
    expect(deriveProfileFromLegacy(user)).toBe(expected);
  });
});

describe("resolveProfileKey", () => {
  it("prefers a valid user.profile", () => {
    expect(resolveProfileKey({ profile: "PRIMARY_SALES", role: "STAFF" })).toBe("PRIMARY_SALES");
  });
  it("falls back to legacy derivation for an unset/invalid profile", () => {
    expect(resolveProfileKey({ profile: null, role: "STAFF", isPrimary: true })).toBe("PRIMARY_SALES");
    expect(resolveProfileKey({ profile: "NOPE", role: "ADMIN" })).toBe("ADMIN");
  });
});
```

- [ ] **Step 4: Run it and watch it fail**

Run: `npx vitest run packages/shared/__tests__/profiles.test.js`
Expected: FAIL — cannot resolve `../constants/access/profiles.js`.

- [ ] **Step 5: Create `packages/shared/constants/access/profiles.js`**

```js
// Code-defined permission PROFILES — one profile per user (mutually exclusive).
// A profile's code set is BUILT from the same blocks as ROLE_PERMISSIONS, so the
// effective access is parity-equal to master by construction (see helpers.js).
import {
  SHARED_AUTHED, LEAD_AUTHED, LEAD_ADMIN, PROJECT_AUTHED, PROJECT_ADMIN,
  USER_ADMIN, ACCOUNTING_ALL, STAFF_GATE, TELEGRAM_ADMIN, SITE_UTILITY_ADMIN,
  COURSE_ADMIN, IMAGE_SESSION_ADMIN, ADMIN_RESIDUAL, SUPER_SALES_EXTRA_PERMISSIONS,
  LEAD_SECTION_PRIMARY, LEAD_SECTION_ANALYSIS,
} from "./role-permissions.js";
import { USER_ROLES } from "./roles.constants.js";

const dedupe = (arr) => Array.from(new Set(arr));

// Sales family (STAFF base role + the retained flags → three profiles).
const NORMAL_SALES = dedupe([...SHARED_AUTHED, ...LEAD_AUTHED, ...PROJECT_AUTHED, ...STAFF_GATE, ...LEAD_SECTION_ANALYSIS]);
const PRIMARY_SALES = dedupe([...NORMAL_SALES, ...LEAD_SECTION_PRIMARY]);
const SUPER_SALES = dedupe([...PRIMARY_SALES, ...SUPER_SALES_EXTRA_PERMISSIONS]);

// Admin tier (mirror ROLE_PERMISSIONS.ADMIN / SUPER_ADMIN exactly + the new view codes,
// which admins would obviously hold — additive, no parity impact).
const ADMIN = dedupe([
  ...SHARED_AUTHED, ...TELEGRAM_ADMIN, ...SITE_UTILITY_ADMIN, ...COURSE_ADMIN,
  ...LEAD_AUTHED, ...LEAD_ADMIN, ...USER_ADMIN, ...PROJECT_AUTHED, ...PROJECT_ADMIN,
  ...IMAGE_SESSION_ADMIN, ...ADMIN_RESIDUAL, ...LEAD_SECTION_PRIMARY, ...LEAD_SECTION_ANALYSIS,
]);

// Designers/executor (mirror their role codes; the 3D-only MODIFICATION-task
// visibility stays role-derived via baseRole in the frozen service — see spec §5.1).
const DESIGNER = dedupe([...SHARED_AUTHED, ...LEAD_AUTHED, ...PROJECT_AUTHED, ...STAFF_GATE]);
const ACCOUNTANT = dedupe([...SHARED_AUTHED, ...LEAD_AUTHED, ...PROJECT_AUTHED, ...ACCOUNTING_ALL, ...STAFF_GATE]);
const SUPER_SALES_BASE = dedupe([...SHARED_AUTHED, ...LEAD_AUTHED, ...PROJECT_AUTHED]);
const CONTACT_INITIATOR = dedupe([...SHARED_AUTHED, ...LEAD_AUTHED, ...PROJECT_AUTHED]);

export const PROFILES = {
  ADMIN,
  SUPER_ADMIN: ADMIN, // SUPER_ADMIN has the identical code set to ADMIN in ROLE_PERMISSIONS
  NORMAL_SALES,
  PRIMARY_SALES,
  SUPER_SALES,
  SUPER_SALES_BASE,
  ACCOUNTANT,
  DESIGNER_3D: DESIGNER,
  DESIGNER_2D: DESIGNER,
  EXECUTOR_2D: DESIGNER,
  CONTACT_INITIATOR,
};

export const PROFILE_KEYS = Object.keys(PROFILES);

// Display + the legacy fields to keep in sync when a profile is assigned (Phase 2).
export const PROFILE_META = {
  ADMIN:            { label: "مدير",          family: "ADMIN",    baseRole: USER_ROLES.ADMIN },
  SUPER_ADMIN:      { label: "مدير أعلى",     family: "ADMIN",    baseRole: USER_ROLES.SUPER_ADMIN },
  NORMAL_SALES:     { label: "موظف مبيعات",   family: "SALES",    baseRole: USER_ROLES.STAFF, isPrimary: false, isSuperSales: false },
  PRIMARY_SALES:    { label: "مبيعات أساسي",  family: "SALES",    baseRole: USER_ROLES.STAFF, isPrimary: true,  isSuperSales: false },
  SUPER_SALES:      { label: "سوبر مبيعات",   family: "SALES",    baseRole: USER_ROLES.STAFF, isPrimary: false, isSuperSales: true },
  SUPER_SALES_BASE: { label: "سوبر سيلز (دور)", family: "SALES",  baseRole: USER_ROLES.SUPER_SALES },
  ACCOUNTANT:       { label: "محاسب",         family: "FINANCE",  baseRole: USER_ROLES.ACCOUNTANT },
  DESIGNER_3D:      { label: "مصمم 3D",       family: "DESIGN",   baseRole: USER_ROLES.THREE_D_DESIGNER },
  DESIGNER_2D:      { label: "مصمم 2D",       family: "DESIGN",   baseRole: USER_ROLES.TWO_D_DESIGNER },
  EXECUTOR_2D:      { label: "منفّذ 2D",      family: "DESIGN",   baseRole: USER_ROLES.TWO_D_EXECUTOR },
  CONTACT_INITIATOR:{ label: "مبادر تواصل",   family: "SALES",    baseRole: USER_ROLES.CONTACT_INITIATOR },
};

// Map a legacy user row (role + retained flags) to its profile key.
export function deriveProfileFromLegacy(user) {
  const role = user?.role;
  if (role === USER_ROLES.STAFF) {
    if (user?.isSuperSales) return "SUPER_SALES"; // super ⊇ primary
    if (user?.isPrimary) return "PRIMARY_SALES";
    return "NORMAL_SALES";
  }
  switch (role) {
    case USER_ROLES.ADMIN: return "ADMIN";
    case USER_ROLES.SUPER_ADMIN: return "SUPER_ADMIN";
    case USER_ROLES.SUPER_SALES: return "SUPER_SALES_BASE";
    case USER_ROLES.ACCOUNTANT: return "ACCOUNTANT";
    case USER_ROLES.THREE_D_DESIGNER: return "DESIGNER_3D";
    case USER_ROLES.TWO_D_DESIGNER: return "DESIGNER_2D";
    case USER_ROLES.TWO_D_EXECUTOR: return "EXECUTOR_2D";
    case USER_ROLES.CONTACT_INITIATOR: return "CONTACT_INITIATOR";
    default: return "NORMAL_SALES";
  }
}

// The single place that decides a user's profile: the stored column if valid,
// else the legacy derivation (transitional, for rows not yet backfilled).
export function resolveProfileKey(user) {
  if (user?.profile && PROFILES[user.profile]) return user.profile;
  return deriveProfileFromLegacy(user);
}
```

- [ ] **Step 6: Run the test to green**

Run: `npx vitest run packages/shared/__tests__/profiles.test.js`
Expected: PASS (all cases).

- [ ] **Step 7: Commit**

```bash
git add packages/shared/constants/access/profiles.js \
        packages/shared/constants/access/role-permissions.js \
        packages/shared/constants/access/permissions.constants.js \
        packages/shared/__tests__/profiles.test.js
git commit -m "feat(shared): code-defined permission profiles + lead view codes"
```

---

## Task 2: Rewrite `getEffectivePermissions` to resolve via profile (parity-proven)

**Files:**
- Modify: `packages/shared/helpers.js`
- Modify: `packages/shared/index.js` (barrel export the profile symbols)
- Test: `packages/shared/__tests__/profiles.test.js` (append a parity block)

**Interfaces:**
- Consumes: `resolveProfileKey`, `PROFILES` from Task 1.
- Produces: unchanged public shape `getEffectivePermissions(user) -> { permissions, permissionsByModule }`.

- [ ] **Step 1: Append the parity test** to `packages/shared/__tests__/profiles.test.js`:

```js
import { getEffectivePermissions } from "../helpers.js";
import { getPermissionsForRole } from "../helpers.js";

// The OLD formula, inlined as the parity oracle: role codes ∪ subRole codes ∪
// (isSuperSales ? EXTRA). This is exactly what master/pre-change computed.
function oldEffective(user) {
  const s = new Set(getPermissionsForRole(user.role));
  for (const e of user.subRoles ?? []) {
    const sr = typeof e === "string" ? e : e?.subRole;
    if (sr) for (const c of getPermissionsForRole(sr)) s.add(c);
  }
  if (user.isSuperSales) for (const c of SUPER_SALES_EXTRA_PERMISSIONS) s.add(c);
  return s;
}

describe("getEffectivePermissions parity (old universe)", () => {
  const NEW_CODES = new Set([
    "lead.price_offer.view","lead.projects.view","lead.modifications.view",
    "lead.updates.view","lead.analysis.view",
  ]);
  const roles = ["ADMIN","SUPER_ADMIN","STAFF","THREE_D_DESIGNER","TWO_D_DESIGNER",
    "TWO_D_EXECUTOR","ACCOUNTANT","SUPER_SALES","CONTACT_INITIATOR"];
  const combos = [];
  for (const role of roles)
    for (const isPrimary of [false, true])
      for (const isSuperSales of [false, true])
        combos.push({ role, isPrimary, isSuperSales, profile: null, subRoles: [] });
  // a couple of subRole cases:
  combos.push({ role: "STAFF", isPrimary: false, isSuperSales: false, profile: null, subRoles: [{ subRole: "ACCOUNTANT" }] });

  it.each(combos)("effective ∩ oldUniverse === old formula for %o", (user) => {
    const got = new Set(getEffectivePermissions(user).permissions);
    const old = oldEffective(user);
    // 1) restricting new to old codes equals the old formula:
    const gotOld = new Set([...got].filter((c) => !NEW_CODES.has(c)));
    expect(gotOld).toEqual(old);
    // 2) new grants only ever ADD new codes (never remove an old one):
    for (const c of old) expect(got.has(c)).toBe(true);
  });
});
```

- [ ] **Step 2: Run it — watch it fail**

Run: `npx vitest run packages/shared/__tests__/profiles.test.js -t parity`
Expected: FAIL (getEffectivePermissions still uses the old role-only path; the new codes assertions or the STAFF+isPrimary case may already pass, but PRIMARY view-code additions aren't present yet → the `old ⊆ got` check passes but we want the profile path exercised; if it already passes, proceed — Step 3 makes it the intended implementation).

- [ ] **Step 3: Rewrite `getEffectivePermissions`** in `helpers.js`. Replace the body (the block that builds `set` from role/subRoles/isSuperSales, lines ~51–91) with:

```js
export function getEffectivePermissions(user) {
  if (!user) return { permissions: [], permissionsByModule: {} };

  // Profile is the primary source (Phase 1). subRole + isSuperSales unions are
  // TRANSITIONAL parity augmentations — they guarantee the effective set is a
  // superset of the legacy formula for every user, and are removed in Phase 4.
  const set = new Set(PROFILES[resolveProfileKey(user)] ?? []);

  const subRoles = Array.isArray(user.subRoles) ? user.subRoles : [];
  for (const entry of subRoles) {
    const subRole = typeof entry === "string" ? entry : entry?.subRole;
    if (!subRole) continue;
    for (const code of getPermissionsForRole(subRole)) set.add(code);
  }
  if (user.isSuperSales) {
    for (const code of SUPER_SALES_EXTRA_PERMISSIONS) set.add(code);
  }

  const permissions = Array.from(set);

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

Add the import at the top of `helpers.js` (next to the other access imports):

```js
import { PROFILES, resolveProfileKey } from "./constants/access/profiles.js";
```

`getPermissionsForRole`, `SUPER_SALES_EXTRA_PERMISSIONS`, `splitPermissionCode`, `NAVIGATION_PERMISSION_ACTIONS` are already imported/defined in `helpers.js`.

- [ ] **Step 4: Barrel-export** the profile symbols. In `packages/shared/index.js`, add (next to the other access re-exports):

```js
export { PROFILES, PROFILE_KEYS, PROFILE_META, deriveProfileFromLegacy, resolveProfileKey }
  from "./constants/access/profiles.js";
```

(If `index.js` uses `export * from "./constants/access/..."` per-file, add the same `export * from "./constants/access/profiles.js";` line instead — match the file's existing style.)

- [ ] **Step 5: Run the full shared test suite to green**

Run: `npx vitest run packages/shared`
Expected: PASS — `profiles.test.js` (incl. parity) and the existing `permissions.test.js` all green.

- [ ] **Step 6: Commit**

```bash
git add packages/shared/helpers.js packages/shared/index.js packages/shared/__tests__/profiles.test.js
git commit -m "feat(shared): resolve effective permissions via profile (parity-preserved)"
```

---

## Task 3: Add the `User.profile` column (Prisma migration)

**Files:**
- Modify: `packages/db/prisma/schema.prisma` (User model)
- Create: `packages/db/prisma/migrations/<timestamp>_add_user_profile/migration.sql` (generated)

**Interfaces:**
- Produces: a nullable `User.profile` column readable/writable by Prisma as `user.profile`.

- [ ] **Step 1: Add the field** to `model User` in `packages/db/prisma/schema.prisma`, directly under `isSuperSales`:

```prisma
  isPrimary                                                Boolean                @default(false)
  isSuperSales                                             Boolean                @default(false)
  profile                                                  String?                @db.VarChar(64)
```

- [ ] **Step 2: Generate + apply the migration** (dev DB only — NEVER prod):

Run: `npm run db:migrate -- --name add_user_profile`
Expected: Prisma creates `packages/db/prisma/migrations/<ts>_add_user_profile/migration.sql` containing an `ALTER TABLE ... ADD COLUMN profile ...`, applies it to the dev DB, and regenerates the client. Confirm the SQL is a single additive `ADD COLUMN` (nullable, no default backfill) and touches nothing else.

- [ ] **Step 3: Verify a fresh DB still builds byte-equal to prod + column present.** Follow `docs/db-migrations-workflow.md`'s drift check (the Docker fresh-migrate verification). At minimum:

Run: `npm run db:generate`
Expected: client regenerates with `profile` on the `User` model, no errors.

- [ ] **Step 4: Commit**

```bash
git add packages/db/prisma/schema.prisma packages/db/prisma/migrations
git commit -m "feat(db): add nullable User.profile column (additive migration)"
```

---

## Task 4: Bootstrap backfill script

**Files:**
- Create: `server/src/bootstrap/backfill-profiles.js`
- Create: `server/src/bootstrap/__tests__/backfill-profiles.test.js`
- Modify: `server/src/server.js`

**Interfaces:**
- Consumes: `deriveProfileFromLegacy` (`@dms/shared`), the Prisma singleton (`@dms/db`).
- Produces: `runProfileBackfill({ prisma }): Promise<{ scanned:number, updated:number }>` — idempotent.

- [ ] **Step 1: Write the failing test** `server/src/bootstrap/__tests__/backfill-profiles.test.js`. Mock a minimal prisma:

```js
import { describe, it, expect, vi } from "vitest";
import { runProfileBackfill } from "../backfill-profiles.js";

function fakePrisma(rows) {
  const users = rows.map((r) => ({ isPrimary: false, isSuperSales: false, profile: null, ...r }));
  return {
    user: {
      findMany: vi.fn(async ({ where }) =>
        users.filter((u) => (where?.profile === null ? u.profile === null : true))
             .map((u) => ({ id: u.id, role: u.role, isPrimary: u.isPrimary, isSuperSales: u.isSuperSales }))),
      update: vi.fn(async ({ where, data }) => {
        const u = users.find((x) => x.id === where.id);
        u.profile = data.profile;
        return u;
      }),
    },
    _users: users,
  };
}

describe("runProfileBackfill", () => {
  it("assigns the derived profile to every unbackfilled user", async () => {
    const prisma = fakePrisma([
      { id: 1, role: "STAFF" },
      { id: 2, role: "STAFF", isPrimary: true },
      { id: 3, role: "STAFF", isSuperSales: true },
      { id: 4, role: "THREE_D_DESIGNER" },
      { id: 5, role: "ACCOUNTANT" },
    ]);
    const res = await runProfileBackfill({ prisma });
    expect(res).toEqual({ scanned: 5, updated: 5 });
    expect(prisma._users.map((u) => u.profile)).toEqual([
      "NORMAL_SALES", "PRIMARY_SALES", "SUPER_SALES", "DESIGNER_3D", "ACCOUNTANT",
    ]);
  });

  it("is idempotent — a second run updates nothing", async () => {
    const prisma = fakePrisma([{ id: 1, role: "STAFF" }]);
    await runProfileBackfill({ prisma });
    const second = await runProfileBackfill({ prisma });
    expect(second).toEqual({ scanned: 0, updated: 0 });
  });
});
```

- [ ] **Step 2: Run — watch it fail**

Run: `npx vitest run server/src/bootstrap/__tests__/backfill-profiles.test.js`
Expected: FAIL — cannot resolve `../backfill-profiles.js`.

- [ ] **Step 3: Create `server/src/bootstrap/backfill-profiles.js`**

```js
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
```

- [ ] **Step 4: Run — watch it pass**

Run: `npx vitest run server/src/bootstrap/__tests__/backfill-profiles.test.js`
Expected: PASS (both cases).

- [ ] **Step 5: Wire it into boot** in `server/src/server.js`. Add the import at the top:

```js
import prisma from "@dms/db";
import { runProfileBackfill } from "./bootstrap/backfill-profiles.js";
```

Inside the async IIFE, after `await connectRedis();` and before the workers block, add:

```js
  // One-time (idempotent) profile backfill: assign profiles to users created before
  // the profiles feature. Non-fatal — never block the API from serving HTTP.
  try {
    const r = await runProfileBackfill({ prisma });
    if (r.updated) console.log(`✅ Profile backfill: ${r.updated}/${r.scanned} users assigned`);
  } catch (e) {
    console.error("❌ Profile backfill failed:", e?.message);
  }
```

(Confirm the Prisma singleton import path: the repo exposes it as `@dms/db` — see the shims in `server/prisma/prisma.js`. If `@dms/db`'s default export isn't the client, import it the same way an existing repository does, e.g. `import { prisma } from "@dms/db"`.)

- [ ] **Step 6: Commit**

```bash
git add server/src/bootstrap/backfill-profiles.js \
        server/src/bootstrap/__tests__/backfill-profiles.test.js \
        server/src/server.js
git commit -m "feat(server): idempotent profile backfill on bootstrap"
```

---

## Task 5: `/auth/me` emits `profile`

**Files:**
- Modify: `server/src/modules/auth/auth.dto.js`
- Test: `server/src/modules/auth/__tests__/auth.dto.test.js` (create if absent, else append)

**Interfaces:**
- Consumes: `resolveProfileKey` (`@dms/shared`).
- Produces: `AuthSchema.toMe(user)` includes `profile: string`.

- [ ] **Step 1: Write the failing test** (append to or create `server/src/modules/auth/__tests__/auth.dto.test.js`):

```js
import { describe, it, expect } from "vitest";
import { AuthSchema } from "../auth.dto.js";

describe("toMe profile", () => {
  it("emits the stored profile when present", () => {
    const me = AuthSchema.toMe({ id: 1, email: "a@b.c", name: "A", role: "STAFF", profile: "PRIMARY_SALES" });
    expect(me.profile).toBe("PRIMARY_SALES");
  });
  it("derives the profile from legacy fields when unset", () => {
    const me = AuthSchema.toMe({ id: 1, email: "a@b.c", name: "A", role: "STAFF", isSuperSales: true, profile: null });
    expect(me.profile).toBe("SUPER_SALES");
  });
});
```

- [ ] **Step 2: Run — watch it fail**

Run: `npx vitest run server/src/modules/auth/__tests__/auth.dto.test.js`
Expected: FAIL — `me.profile` is `undefined`.

- [ ] **Step 3: Implement.** In `auth.dto.js`, extend the import from `@dms/shared` to include `resolveProfileKey`:

```js
import {
  AUTH_COOKIE_NAME, AUTH_REFRESH_TOKEN_COOKIE_NAME,
  getEffectivePermissions, buildNavigationTabs, resolveProfileKey,
} from "@dms/shared";
```

In `toMe(...)`, add `profile` to the returned object (after `isPrimary`):

```js
      isPrimary: Boolean(user.isPrimary),
      profile: resolveProfileKey(user),
      profilePicture: user.profilePicture ?? null,
```

- [ ] **Step 4: Run — watch it pass**

Run: `npx vitest run server/src/modules/auth/__tests__/auth.dto.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/auth/auth.dto.js server/src/modules/auth/__tests__/auth.dto.test.js
git commit -m "feat(auth): emit resolved profile on /auth/me"
```

---

## Task 6: Phase 1 gate — full suite + parity matrix

**Files:** none (verification only).

- [ ] **Step 1: Run the whole test suite**

Run: `npm test`
Expected: PASS — all `packages/shared` + `server` tests green, including the existing `authz.integration.test.js` and `permissions.test.js` (unchanged behavior).

- [ ] **Step 2: Sanity-check `/auth/me` shape (manual, optional).** Start the server (`npm run dev:server`), hit `/v2/auth/me` as a seeded STAFF+isPrimary user, confirm the payload now has `"profile":"PRIMARY_SALES"` and that `permissions`/`permissionsByModule` are unchanged vs before (spot-check a couple of codes).

- [ ] **Step 3: Commit any doc note** (optional): update `PROJECT_STATE.md` to record "Phase 1 (profiles framework + backfill) complete; access unchanged".

```bash
git add PROJECT_STATE.md && git commit -m "docs: record profiles Phase 1 complete (parity preserved)"
```

---

# PHASE 2 — Assignment (FE picks a profile; BE persists + syncs)

## Task 7: Backend accepts + persists `profile` (syncing legacy fields)

**Files:**
- Modify: `server/src/modules/users/user/user.validation.js`
- Modify: `server/src/modules/users/user/user.usecase.js`
- Test: `server/src/modules/users/user/__tests__/user.usecase.test.js` (append)

**Interfaces:**
- Consumes: `PROFILE_KEYS`, `PROFILE_META` (`@dms/shared`).
- Produces: `create`/`update` accept `body.profile`; when present they set `role`/`isPrimary`/`isSuperSales` from `PROFILE_META` before the legacy write, and persist `profile`.

- [ ] **Step 1: Accept `profile` in validation.** In `user.validation.js`, add `profile: z.string().optional()` to both `createUser` and `updateUser` object shapes (they are `.passthrough()`, so this is only for clarity/coercion):

```js
  static createUser = z.object({
    email: z.string().min(1),
    password: z.string().min(1),
    name: z.string().min(1),
    role: z.string().min(1).optional(),
    profile: z.string().optional(),
    telegramUsername: z.string().nullish(),
  }).passthrough();
```

(Do the same `profile: z.string().optional()` addition to `updateUser`. Note `role` becomes optional on create since profile can supply it — keep `.passthrough()` so existing callers still work.)

- [ ] **Step 2: Write the failing test** (append to `user.usecase.test.js`). Mock the legacy service + repo:

```js
import { describe, it, expect, vi } from "vitest";
import { PROFILE_META } from "@dms/shared";

// Assume a helper exists to build the usecase with mocked repo+legacy; if the file
// already has one, reuse it. Otherwise construct UserUsecase with stubs.
import { UserUsecase } from "../user.usecase.js";

function makeUsecase() {
  const created = [];
  const setProfile = vi.fn(async () => {});
  const legacy = {
    createStaffUser: vi.fn(async (body) => { created.push(body); return { id: 99, ...body }; }),
    editStaffUser: vi.fn(async (body) => ({ id: body.id ?? 1, ...body })),
  };
  const repo = { setUserProfile: setProfile };
  const uc = new UserUsecase({ repository: repo, legacy });
  return { uc, legacy, setProfile };
}

describe("create with profile", () => {
  it("derives role+flags from PROFILE_META and persists profile", async () => {
    const { uc, legacy, setProfile } = makeUsecase();
    await uc.create({ body: { email: "a@b.c", password: "x", name: "A", profile: "PRIMARY_SALES" },
      authUser: { role: "ADMIN" } });
    const sent = legacy.createStaffUser.mock.calls[0][0];
    expect(sent.role).toBe(PROFILE_META.PRIMARY_SALES.baseRole); // "STAFF"
    expect(sent.isPrimary).toBe(true);
    expect(sent.isSuperSales).toBe(false);
    expect(setProfile).toHaveBeenCalledWith({ userId: 99, profile: "PRIMARY_SALES" });
  });

  it("rejects an unknown profile", async () => {
    const { uc } = makeUsecase();
    await expect(uc.create({ body: { email: "a@b.c", password: "x", name: "A", profile: "NOPE" },
      authUser: { role: "ADMIN" } })).rejects.toBeTruthy();
  });
});
```

- [ ] **Step 3: Run — watch it fail**

Run: `npx vitest run server/src/modules/users/user/__tests__/user.usecase.test.js -t profile`
Expected: FAIL — `create` ignores `profile`; `repo.setUserProfile` doesn't exist.

- [ ] **Step 4: Implement in `user.usecase.js`.** Add the import + a small helper, then apply the profile in `create`/`update`. At the top, extend the `@dms/shared` import to include `PROFILE_KEYS, PROFILE_META`:

```js
import { PROFILE_KEYS, PROFILE_META } from "@dms/shared";
```

Add a private helper (near the other module consts):

```js
// When a profile is supplied, it is authoritative: derive the legacy role/flags from
// PROFILE_META and merge them into the body the frozen create/edit service writes, so
// nothing that still reads role/isPrimary/isSuperSales goes out of sync.
function applyProfileToBody(body) {
  const key = body?.profile;
  if (key == null) return { body, profile: null };
  if (!PROFILE_KEYS.includes(key)) throw new AppError(C.USER_ROLE_NOT_ALLOWED, 400);
  const meta = PROFILE_META[key];
  const merged = { ...body, role: meta.baseRole };
  if (meta.isPrimary !== undefined) merged.isPrimary = meta.isPrimary;
  if (meta.isSuperSales !== undefined) merged.isSuperSales = meta.isSuperSales;
  return { body: merged, profile: key };
}
```

In `create`, wrap the body before the legacy call and persist the profile after:

```js
  async create({ body, authUser }) {
    if (!body || Object.keys(body).length === 0) throw new AppError(C.USER_NO_DATA_SENT, 404);
    const { body: withRole, profile } = applyProfileToBody(body);
    // (existing isSuperSales-creator legacy rule stays, now checking withRole.role)
    if (authUser.isSuperSales && authUser.role !== "ADMIN" && authUser.role !== "SUPER_ADMIN" &&
        (withRole.role === "ADMIN" || withRole.role === "SUPER_ADMIN" || withRole.role !== "STAFF")) {
      throw new AppError(C.USER_ROLE_NOT_ALLOWED, 403);
    }
    try {
      const createdUser = await this.legacy.createStaffUser(withRole);
      if (profile && createdUser?.id != null) {
        await this.repo.setUserProfile({ userId: createdUser.id, profile });
      }
      return createdUser;
    } catch (error) {
      if (isEmailTakenError(error)) throw new AppError(C.EMAIL_ALREADY_REGISTERED, 400);
      throw error;
    }
  }
```

In `update`, do the same:

```js
  async update({ userId, body, authUser }) {
    if (!body || !userId) throw new AppError(C.USER_NOT_FOUND, 404);
    const { body: withRole, profile } = applyProfileToBody(body);
    if (authUser.role !== "ADMIN" && authUser.role !== "SUPER_ADMIN" && authUser.isSuperSales &&
        withRole.role && withRole.role !== "STAFF") {
      throw new AppError(C.USER_ROLE_NOT_ALLOWED, 403);
    }
    try {
      const updated = await this.legacy.editStaffUser(withRole, userId);
      if (profile) await this.repo.setUserProfile({ userId: Number(userId), profile });
      return updated;
    } catch (error) {
      if (isEmailTakenError(error)) throw new AppError(C.EMAIL_ALREADY_REGISTERED, 400);
      throw error;
    }
  }
```

- [ ] **Step 5: Add the repo method** `setUserProfile` to `server/src/modules/users/user/user.repository.js` (Prisma lives only in repos):

```js
  async setUserProfile({ userId, profile }) {
    return this.prisma.user.update({ where: { id: Number(userId) }, data: { profile } });
  }
```

(Match the file's existing method style / how it references the client — e.g. `this.prisma` or an imported singleton.)

- [ ] **Step 6: Run — watch it pass**

Run: `npx vitest run server/src/modules/users/user/__tests__/user.usecase.test.js`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add server/src/modules/users/user/user.validation.js \
        server/src/modules/users/user/user.usecase.js \
        server/src/modules/users/user/user.repository.js \
        server/src/modules/users/user/__tests__/user.usecase.test.js
git commit -m "feat(users): accept+persist profile on create/update, sync legacy fields"
```

---

## Task 8: FE — profile `<select>` in user create/edit

**Files:**
- Modify: `web/src/app/UiComponents/pages/UsersPage.jsx`

**Interfaces:**
- Consumes: `PROFILE_META`, `PROFILE_KEYS` (`@dms/shared`) OR a local mirror (see step 1).
- Produces: create/edit form sends `profile`; role field derived from it.

- [ ] **Step 1: Source the profile options.** At the top of `UsersPage.jsx`, import the profile metadata. If `@dms/shared` is importable from the web workspace (check an existing web import of shared; if not, mirror the label map locally as `PROFILE_OPTIONS`):

```js
import { PROFILE_META } from "@dms/shared";
const PROFILE_OPTIONS = Object.entries(PROFILE_META).map(([value, m]) => ({ value, label: m.label }));
```

- [ ] **Step 2: Add the profile select to `inputs`.** In the `inputs` array (currently containing the `role` field at index ~`name:"role"`), add a `profile` select field and make it required, keeping the existing `role` field for display/back-compat OR removing it if the form should be profile-only. Minimal change — add:

```js
  {
    data: { id: "profile", type: "select", label: "الملف الوظيفي (Profile)", options: PROFILE_OPTIONS },
    pattern: { required: { value: true, message: "اختر ملفًا وظيفيًا" } },
  },
```

Match the exact field-config shape the codebase's form/`CreateModal` expects (see the neighbouring `role` field at `UsersPage.jsx:233` — copy its structure: `data: { id, type:"select", label, options }`, `pattern: {...}`). Reuse `editInputs = [...inputs]` so edit gets it too.

- [ ] **Step 3: Prefill on edit.** Ensure the edit modal seeds `profile` from the row (`item.profile`). If the edit modal seeds from the item object automatically (as `role` is today), no code is needed; otherwise pass `item.profile` through the same path the modal uses for `role`.

- [ ] **Step 4: Verify the FE build**

Run: `cd /c/coding/design-managment-system/web && npx next build 2>&1 | tail -8`
Expected: "✓ Compiled successfully" + "Generating static pages (42/42)" + the route table — no errors.

- [ ] **Step 5: Manual check (optional).** Run the app, open Users → create a user, pick a profile, submit. Confirm the created user has the expected `role`/`isPrimary`/`isSuperSales` and `profile` (via DB or `/auth/me` after logging in as them).

- [ ] **Step 6: Commit**

```bash
git add web/src/app/UiComponents/pages/UsersPage.jsx
git commit -m "feat(web): profile picker in user create/edit"
```

---

## Self-Review (completed while writing)

- **Spec coverage:** §3 model → Tasks 1–2; §4 new codes → Task 1 Step 1; §5 taxonomy → Task 1 (`PROFILES`/`PROFILE_META`) incl. designer 3-profile decision + `SUPER_SALES`/`SUPER_SALES_BASE`; §6 backfill → Task 4; §7 FE + BE persist → Tasks 7–8; §9 parity/tests → Task 2 parity block + Task 6; §10 phasing → Phase 1 (Tasks 1–6) / Phase 2 (Tasks 7–8). Phases 3–4 are explicitly out of this plan.
- **Flag retention:** no task removes `isPrimary`/`isSuperSales`; the migration is additive; backfill only reads them. ✓
- **Placeholder scan:** every code step has concrete code; commands have expected output. The two "match the file's existing style" notes (barrel export form in Task 2 Step 4; repo client handle in Task 7 Step 5) are genuine adapt-to-codebase points, not deferrals — both give the exact code and only ask to match the surrounding convention.
- **Type consistency:** `deriveProfileFromLegacy`/`resolveProfileKey`/`PROFILES`/`PROFILE_META`/`PROFILE_KEYS` names are used identically across Tasks 1, 2, 4, 5, 7. `runProfileBackfill({prisma})` and `setUserProfile({userId,profile})` signatures match their call sites.
- **Parity risk:** Task 2's test proves `effective ∩ oldUniverse === oldFormula` for all role×flag combos + a subRole case, and `old ⊆ new` (never removes a grant). New grants are only the 5 additive view codes.

---

## Notes for the executor

- Phase 1 (Tasks 1–6) changes **no observable behavior** — it only adds a column, a field on `/auth/me`, and reroutes the *source* of the identical permission set. Ship it behind the parity tests.
- Phase 2 (Tasks 7–8) makes profiles assignable; the legacy flags stay in sync so Phase 3's sweep can proceed safely later.
- Do NOT start Phase 3 (replacing the ~340 role/flag branches) from this plan — it is a separate, module-by-module plan.
