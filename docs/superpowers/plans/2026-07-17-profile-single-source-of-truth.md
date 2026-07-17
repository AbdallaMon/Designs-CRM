# Profiles as the single source of truth (+ profile switcher rebuild) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `role`/`activeRole`/`subRoles` a *derived view* of the active profile at the auth boundary, and rebuild the profile switcher as the toolbar chip itself — so switching profile updates permissions, nav, and every label together.

**Architecture:** One change at the auth boundary (`auth.dto.js`) turns `role` into a projection of `currentProfile.baseRole`; the ~240 downstream call sites keep their code but are now fed by the active profile. `packages/shared/helpers.js` drops the transitional `subRoles`/`isSuperSales` permission unions (now unreachable/empty on every live path). The frontend chip becomes the switcher trigger, driven purely by the `profiles[]` array from `/auth/me`.

**Tech Stack:** Node + Express 4, Prisma 6, Vitest (backend + `packages/shared`), Next.js 16 + React 19 + MUI v7 (`web/`), ESM/JavaScript only.

## Global Constraints

- **JavaScript only, ESM** (`"type": "module"`). No TypeScript in app source.
- **Schema is frozen.** Do NOT drop/alter `User.role` or `UserSubRole`. No migration. Never touch production. (CLAUDE.md §2.2/§3)
- **Preserve observable behavior vs `master`.** The full existing backend suite (~970 tests) is the parity gate and must stay green. (rule 6)
- **Do NOT touch `server/src/modules/users/user/user.repo.js`** — it has complementary in-flight uncommitted work (`findDirectory` profile matching). Out of this plan's scope.
- **Do NOT touch the frozen contract/PDF tier** (`contracts/services/*`), the boot backfill (`deriveProfilesFromLegacy`/`resolveProfileKey`), or the user-CRUD write-sync (`user.usecase.js:445`).
- **Sales tier comes from the active profile, never the flags.** Do not read `isSuperSales`/`isPrimary` in module logic. (CLAUDE.md §2.8)
- **Frontend verification = `cd web && npx next build`.** The `web/` eslint config is broken in this repo; the build is the verification path.
- Message envelope + API contract unchanged. The `POST auth/profile/switch` server contract is unchanged.
- Commit after every task with a passing test/build.

---

### Task 1: Derive `role`/`activeRole`/`subRoles` from the active profile in `auth.dto.js`

**Files:**
- Modify: `server/src/modules/auth/auth.dto.js` (add `baseRole` to `USER_PROFILES_SELECT` at `:14-16`; add `AuthSchema.activeBaseRole` static; use it in `toMe` `:137-151` and `toTokenPayload` `:163-184`)
- Test: `server/src/modules/auth/__tests__/auth.dto.test.js` (extend)

**Interfaces:**
- Produces: `AuthSchema.activeBaseRole(user) -> string | null` — resolves the `baseRole` of the user's **effective** active profile (the resolved `currentProfileId`, not the possibly-stale `user.currentProfile` object). Consumed by `toMe` and `toTokenPayload` in this file only.
- Consumes: existing `AuthSchema.toMe(user)` and `AuthSchema.toTokenPayload(user)` shapes; `user.currentProfile` (`{id,key,baseRole,isAdminTier}`), `user.userProfiles` (`[{profile:{id,key,label,family,isAdminTier,baseRole}}]` after this task), `user.currentProfileId`, `user.baseRole` (present on the `req.auth` path).

- [ ] **Step 1: Write the failing tests**

Append to `server/src/modules/auth/__tests__/auth.dto.test.js`:

```js
describe("toMe derives role from the active profile (not the legacy column)", () => {
  it("role/activeRole follow currentProfile.baseRole when it disagrees with user.role", () => {
    const me = AuthSchema.toMe({
      id: 1, email: "a@b.c", name: "A",
      role: "THREE_D_DESIGNER", // STALE legacy column
      currentProfileId: 9,
      currentProfile: { id: 9, key: "DESIGNER_2D", baseRole: "TWO_D_DESIGNER", isAdminTier: false },
      userProfiles: [
        { profile: { id: 8, key: "DESIGNER_3D", label: "3D", family: "DESIGN", isAdminTier: false, baseRole: "THREE_D_DESIGNER" } },
        { profile: { id: 9, key: "DESIGNER_2D", label: "2D", family: "DESIGN", isAdminTier: false, baseRole: "TWO_D_DESIGNER" } },
      ],
      permissions: ["lead.view"], permissionsByModule: { lead: { codes: ["lead.view"] } },
    });
    expect(me.role).toBe("TWO_D_DESIGNER");
    expect(me.activeRole).toBe("TWO_D_DESIGNER");
  });

  it("returns subRoles: [] even when the row carries subRole rows", () => {
    const me = AuthSchema.toMe({
      id: 1, email: "a@b.c", name: "A", role: "STAFF",
      subRoles: [{ subRole: "ACCOUNTANT" }],
      currentProfileId: 2,
      currentProfile: { id: 2, key: "NORMAL_SALES", baseRole: "STAFF", isAdminTier: false },
      userProfiles: [{ profile: { id: 2, key: "NORMAL_SALES", label: "Sales", family: "SALES", isAdminTier: false, baseRole: "STAFF" } }],
      permissions: [], permissionsByModule: {},
    });
    expect(me.subRoles).toEqual([]);
  });

  it("falls back to user.role when the user holds no profile (legacy row)", () => {
    const me = AuthSchema.toMe({ id: 1, email: "a@b.c", name: "A", role: "ACCOUNTANT" });
    expect(me.role).toBe("ACCOUNTANT");
    expect(me.activeRole).toBe("ACCOUNTANT");
  });

  it("uses req.auth.baseRole on the DB-free /auth/me path", () => {
    // req.auth has no currentProfile object and no userProfiles — only baseRole (from cache).
    const me = AuthSchema.toMe({
      id: 1, email: "a@b.c", name: "A", role: "STAFF",
      currentProfileId: 5, baseRole: "STAFF", currentProfileKey: "SUPER_SALES",
      profiles: [{ id: 5, key: "SUPER_SALES", label: "Super sales", family: "SALES", isAdminTier: true }],
      permissions: [], permissionsByModule: {},
    });
    expect(me.role).toBe("STAFF");
  });
});

describe("toTokenPayload derives role from the effective (corrected) profile", () => {
  it("uses the corrected currentProfileId, not the stale currentProfile object", () => {
    // login/refresh correct a dangling currentProfileId but leave user.currentProfile stale.
    const payload = AuthSchema.toTokenPayload({
      id: 1, email: "a@b.c", name: "A", isActive: true,
      role: "THREE_D_DESIGNER",
      currentProfileId: 9, // CORRECTED (effective)
      currentProfile: { id: 8, key: "DESIGNER_3D", baseRole: "THREE_D_DESIGNER" }, // STALE
      userProfiles: [
        { profile: { id: 8, key: "DESIGNER_3D", baseRole: "THREE_D_DESIGNER" } },
        { profile: { id: 9, key: "DESIGNER_2D", baseRole: "TWO_D_DESIGNER" } },
      ],
    });
    expect(payload.role).toBe("TWO_D_DESIGNER");
    expect(payload.activeRole).toBe("TWO_D_DESIGNER");
    expect(payload.subRoles).toEqual([]);
    expect(payload.currentProfileId).toBe(9);
    expect(payload.profileIds.sort()).toEqual([8, 9]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && npx vitest run src/modules/auth/__tests__/auth.dto.test.js`
Expected: FAIL — the 3 role-derivation asserts get the stale legacy column (`THREE_D_DESIGNER`/non-empty `subRoles`), and `toTokenPayload.role` is `THREE_D_DESIGNER`.

- [ ] **Step 3: Add `baseRole` to `USER_PROFILES_SELECT`**

In `server/src/modules/auth/auth.dto.js`, replace lines 14-16:

```js
const USER_PROFILES_SELECT = {
  select: { profile: { select: { id: true, key: true, label: true, family: true, isAdminTier: true } } },
};
```

with:

```js
const USER_PROFILES_SELECT = {
  // baseRole is needed so the auth boundary can derive `role` for the EFFECTIVE
  // active profile even on the login/refresh correction path (where the stored
  // currentProfileId was corrected but user.currentProfile still points at the old one).
  select: { profile: { select: { id: true, key: true, label: true, family: true, isAdminTier: true, baseRole: true } } },
};
```

- [ ] **Step 4: Add the `activeBaseRole` static helper**

In `server/src/modules/auth/auth.dto.js`, inside `class AuthSchema`, immediately before `static toMe(` (currently `auth.dto.js:87`), insert:

```js
  /**
   * The baseRole of the user's EFFECTIVE active profile.
   *
   * "Effective" = the resolved `currentProfileId`, which login/refresh may have
   * corrected away from the eagerly-loaded `user.currentProfile` object. We therefore
   * prefer `currentProfile` ONLY when its id matches, else look the id up in the held
   * `userProfiles`, else use the cache-resolved `user.baseRole` (the DB-free /auth/me
   * path). Returns null when the user holds no profile → callers fall back to user.role.
   */
  static activeBaseRole(user) {
    if (!user) return null;
    const effectiveId = user.currentProfileId ?? user.currentProfile?.id ?? null;
    if (user.currentProfile && user.currentProfile.id === effectiveId && user.currentProfile.baseRole) {
      return user.currentProfile.baseRole;
    }
    const held = Array.isArray(user.userProfiles)
      ? user.userProfiles.map((up) => up.profile).filter(Boolean)
      : [];
    const match = held.find((p) => p?.id === effectiveId);
    if (match?.baseRole) return match.baseRole;
    return user.baseRole ?? null;
  }
```

- [ ] **Step 5: Use the derivation in `toMe`**

In `server/src/modules/auth/auth.dto.js`, replace the return block at `:137-151`:

```js
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      activeRole: user.activeRole ?? user.role,
      subRoles,
      profile: currentProfileKey,
      currentProfileId,
      profiles,
      profilePicture: user.profilePicture ?? null,
      permissions,
      permissionsByModule,
      navigationTabs,
    };
```

with:

```js
    // role is now a VIEW of the active profile's baseRole, not the legacy column.
    // Fallback to user.role only when the user holds no profile (unmigrated row).
    const derivedRole = AuthSchema.activeBaseRole(user) ?? user.role;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: derivedRole,
      activeRole: derivedRole,
      subRoles: [],
      profile: currentProfileKey,
      currentProfileId,
      profiles,
      profilePicture: user.profilePicture ?? null,
      permissions,
      permissionsByModule,
      navigationTabs,
    };
```

Note: leave the `subRoles` local (`auth.dto.js:88`) and the `navigationTabs`/`navRole` block untouched — nav still needs `navRole` (profile-driven) and `buildNavigationTabs` still receives the legacy `subRoles` local, which is harmless. Only the returned `role`/`activeRole`/`subRoles` change.

- [ ] **Step 6: Use the derivation in `toTokenPayload`**

In `server/src/modules/auth/auth.dto.js`, replace the return block inside `toTokenPayload` at `:167-183`:

```js
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      activeRole: user.role,
      isActive: user.isActive,
      subRoles,
      currentProfileId: user.currentProfileId ?? user.currentProfile?.id ?? null,
```

with:

```js
    // role/activeRole are a VIEW of the effective active profile's baseRole (see
    // activeBaseRole) — NOT the stored column, which goes stale after a self-switch.
    const derivedRole = AuthSchema.activeBaseRole(user) ?? user.role;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: derivedRole,
      activeRole: derivedRole,
      isActive: user.isActive,
      subRoles: [],
      currentProfileId: user.currentProfileId ?? user.currentProfile?.id ?? null,
```

Leave the rest of the payload (`profileIds`, etc.) unchanged. The `subRoles` local at `:164-166` is now unused in the return; delete it to avoid a dead variable:

Replace `:163-166`:

```js
  static toTokenPayload(user) {
    const subRoles = Array.isArray(user.subRoles)
      ? user.subRoles.map((s) => (typeof s === "string" ? s : s?.subRole)).filter(Boolean)
      : [];
    return {
```

with:

```js
  static toTokenPayload(user) {
    return {
```

- [ ] **Step 7: Run the auth.dto tests to verify they pass**

Run: `cd server && npx vitest run src/modules/auth/__tests__/auth.dto.test.js`
Expected: PASS (all, including the pre-existing tests — the fixture at existing `:17-25` has `baseRole: "STAFF"` so `me.role` stays `"STAFF"`).

- [ ] **Step 8: Run the full auth module suite**

Run: `cd server && npx vitest run src/modules/auth`
Expected: PASS.

- [ ] **Step 9: Add the end-to-end switch regression (the reported bug)**

The `switch-profile.usecase.test.js` mock already returns `baseRole: "ACCOUNTANT"` from `profileCache.resolve` (`:38`) and switches to profile id 5. After Task 1, `toMe(freshUser)` derives `role` from the switched profile. Add the assertion to the first test in `server/src/modules/auth/__tests__/switch-profile.usecase.test.js` (the `"switches to a held profile..."` case), after the existing `setCurrentProfile` assertion:

```js
    // Regression (reported bug): the returned /me role follows the SWITCHED profile's
    // baseRole, not the stale legacy column (baseUser.role === "STAFF"). Fails pre-Task-1.
    expect(res.user.role).toBe("ACCOUNTANT");
    expect(res.user.activeRole).toBe("ACCOUNTANT");
```

Run: `cd server && npx vitest run src/modules/auth/__tests__/switch-profile.usecase.test.js`
Expected: PASS (this assertion would have failed on pre-Task-1 code, where `res.user.role` was `"STAFF"`).

- [ ] **Step 10: Commit**

```bash
git add server/src/modules/auth/auth.dto.js server/src/modules/auth/__tests__/auth.dto.test.js server/src/modules/auth/__tests__/switch-profile.usecase.test.js
git commit -m "feat(auth): derive role/activeRole from the active profile's baseRole (subRoles=[])"
```

---

### Task 2: Drop the transitional `subRoles`/`isSuperSales` unions from `helpers.js`

**Files:**
- Modify: `packages/shared/helpers.js` (import `:9`; `getEffectivePermissions` `:34-76`; `navRoleFor` JSDoc + body `:162-179`)
- Modify: `packages/shared/__tests__/profiles.test.js` (drop the subRole parity combo `:111`)
- Test: `packages/shared/__tests__/profiles.test.js`, then the full backend suite

**Interfaces:**
- Consumes: `PROFILES`, `resolveProfileKey`, `buildPermissionsByModule` (unchanged).
- Produces: `getEffectivePermissions(user)` now returns **only** the resolved profile's codes (no subRole/isSuperSales union). `navRoleFor(user)` returns `user.navRole ?? user.activeRole ?? user.role` with no `isSuperSales` branch.

- [ ] **Step 1: Update the profiles parity test to drop the subRole combo**

In `packages/shared/__tests__/profiles.test.js`, delete line 111 (the subRole combo):

```js
  // a couple of subRole cases:
  combos.push({ role: "STAFF", isPrimary: false, isSuperSales: false, profile: null, subRoles: [{ subRole: "ACCOUNTANT" }] });
```

Rationale: subRoles are no longer a permission input. The `isSuperSales` combos in the loop (`:106-109`) stay — they still pass, because `resolveProfileKey` maps `isSuperSales → SUPER_SALES` and `SUPER_SALES_EXTRA_PERMISSIONS ⊆ PROFILES.SUPER_SALES` (asserted at `:38-41`), so the profile already carries those codes.

- [ ] **Step 2: Run the profiles test to verify it now fails against current code**

Run: `cd packages/shared && npx vitest run __tests__/profiles.test.js`
Expected: PASS currently (removing a combo can't fail existing code). This step establishes the baseline; the real failing test is the inverse — proving the union is gone. Add that assertion:

Append to `packages/shared/__tests__/profiles.test.js`:

```js
describe("getEffectivePermissions ignores legacy subRoles + isSuperSales", () => {
  it("does not union subRole codes into the effective set", () => {
    const withSub = new Set(getEffectivePermissions({ role: "STAFF", profile: "NORMAL_SALES", subRoles: [{ subRole: "ACCOUNTANT" }] }).permissions);
    const without = new Set(getEffectivePermissions({ role: "STAFF", profile: "NORMAL_SALES" }).permissions);
    expect([...withSub].sort()).toEqual([...without].sort());
  });
  it("does not union isSuperSales extras when the profile is NORMAL_SALES", () => {
    const flagged = new Set(getEffectivePermissions({ role: "STAFF", profile: "NORMAL_SALES", isSuperSales: true }).permissions);
    const plain = new Set(getEffectivePermissions({ role: "STAFF", profile: "NORMAL_SALES" }).permissions);
    expect([...flagged].sort()).toEqual([...plain].sort());
  });
});
```

Run: `cd packages/shared && npx vitest run __tests__/profiles.test.js`
Expected: FAIL — the new asserts fail because the current code unions the `ACCOUNTANT` subRole codes / `isSuperSales` extras into `withSub`/`flagged`.

- [ ] **Step 3: Remove the unions from `getEffectivePermissions`**

In `packages/shared/helpers.js`, replace the body `:57-76`:

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

  return buildPermissionsByModule(Array.from(set));
}
```

with:

```js
export function getEffectivePermissions(user) {
  if (!user) return { permissions: [], permissionsByModule: {} };

  // Profiles are the sole source of effective permissions. The resolved profile's
  // codes ARE the effective set — the legacy subRole/isSuperSales unions were removed
  // (Phase 4): they never fire on the main request path (requireAuth resolves from the
  // profile cache), and isSuperSales is not carried in the token, so the fallback
  // branches cannot re-add them. isSuperSales still influences WHICH profile
  // resolveProfileKey picks for an unmigrated row (SUPER_SALES), which already carries
  // the super-sales codes.
  const set = new Set(PROFILES[resolveProfileKey(user)] ?? []);
  return buildPermissionsByModule(Array.from(set));
}
```

- [ ] **Step 4: Update the `getEffectivePermissions` JSDoc**

In `packages/shared/helpers.js`, replace the JSDoc `:34-56`:

```js
/**
 * Compute a user's EFFECTIVE permissions, resolved via their PROFILE.
 *
 * Effective = the resolved profile's codes (see `resolveProfileKey`/`PROFILES`)
 *           ∪ each sub-role's role codes (user.subRoles[])           [transitional]
 *           ∪ isSuperSales extra codes (if user.isSuperSales).       [transitional]
 *
 * The subRole + isSuperSales unions are TRANSITIONAL parity augmentations that
 * guarantee the effective set stays a superset of the legacy role-only formula
 * for every user (removed once profiles are the sole source in Phase 4).
 *
 * Pure & unit-testable: no DB, no side effects. Tolerant of both shapes of
 * `subRoles`:
 *   - Prisma rows:        [{ subRole: "ACCOUNTANT" }, ...]
 *   - plain string array: ["ACCOUNTANT", ...]
 *
 * @param {object|null|undefined} user
 * @param {string} [user.role]
 * @param {string} [user.profile]
 * @param {boolean} [user.isSuperSales]
 * @param {Array<string|{subRole:string}>} [user.subRoles]
 * @returns {{ permissions: string[], permissionsByModule: Record<string, {codes: string[], [flag: string]: boolean|string[]}> }}
 */
```

with:

```js
/**
 * Compute a user's EFFECTIVE permissions, resolved via their PROFILE.
 *
 * Effective = the resolved profile's codes (see `resolveProfileKey`/`PROFILES`).
 * Profiles are the SOLE source; the legacy subRole/isSuperSales unions were removed
 * (they never fired on the main request path — requireAuth resolves from the profile
 * cache — and isSuperSales is not carried in the token).
 *
 * Pure & unit-testable: no DB, no side effects.
 *
 * @param {object|null|undefined} user
 * @param {string} [user.role]     used only by resolveProfileKey's legacy fallback
 * @param {string} [user.profile]  the active profile key (primary input)
 * @returns {{ permissions: string[], permissionsByModule: Record<string, {codes: string[], [flag: string]: boolean|string[]}> }}
 */
```

- [ ] **Step 5: Drop the now-unused `SUPER_SALES_EXTRA_PERMISSIONS` import**

In `packages/shared/helpers.js`, replace line 9:

```js
import { ROLE_PERMISSIONS, SUPER_SALES_EXTRA_PERMISSIONS } from "./constants/access/role-permissions.js";
```

with:

```js
import { ROLE_PERMISSIONS } from "./constants/access/role-permissions.js";
```

(`getPermissionsForRole` still uses `ROLE_PERMISSIONS`; it stays exported for other callers.)

- [ ] **Step 6: Remove the `isSuperSales` fallback from `navRoleFor`**

In `packages/shared/helpers.js`, replace the JSDoc + body `:162-179`:

```js
/**
 * Resolve the role used for NAVIGATION filtering. Mirrors master's
 * `linksForRole(user)` special-case: a STAFF user with `isSuperSales` renders the
 * SUPER_SALES sidebar. `user.activeRole` (role-switch) wins when present.
 * @param {object} user
 * @returns {string|undefined}
 */
function navRoleFor(user) {
  // The current profile drives the sidebar so switching profiles updates nav.
  // `navRole` (computed from the active profile in auth.dto.toMe) wins when present;
  // otherwise fall back to the legacy role rule (STAFF+isSuperSales → SUPER_SALES),
  // which preserves master behavior for unmigrated users / raw rows.
  if (user?.navRole) return user.navRole;
  const role = user?.activeRole || user?.role;
  if (role === USER_ROLES.STAFF && user?.isSuperSales) return USER_ROLES.SUPER_SALES;
  return role;
}
```

with:

```js
/**
 * Resolve the role used for NAVIGATION filtering. The active profile drives the
 * sidebar: `navRole` (computed from currentProfile in auth.dto.toMe — it already maps
 * the SUPER_SALES profile to the super-sales sidebar) wins when present. Falls back to
 * the derived `activeRole`/`role` for unmigrated rows with no active profile.
 * @param {object} user
 * @returns {string|undefined}
 */
function navRoleFor(user) {
  if (user?.navRole) return user.navRole;
  return user?.activeRole || user?.role;
}
```

`USER_ROLES` is used ONLY at the line just removed (verified: the sole reference in the file). Drop the now-orphaned import — replace line 12:

```js
import { USER_ROLES } from "./constants/access/roles.constants.js";
```

with nothing (delete the line).

- [ ] **Step 7: Run the shared suite to verify the new tests pass**

Run: `cd packages/shared && npx vitest run`
Expected: PASS — including the new "ignores legacy subRoles + isSuperSales" tests and the existing parity block (the `isSuperSales` combos still hold via the profile).

- [ ] **Step 8: Run the FULL backend suite (parity gate)**

Run: `cd server && npx vitest run`
Expected: PASS (~970 tests). 

**If any test fails:** it will be a test that fed `subRoles` into `getEffectivePermissions` expecting those codes to be granted — that test encodes the OLD contract. Fix it by giving the fixture the equivalent **profile** (e.g. `profile: "ACCOUNTANT"` or a `userProfiles`/`currentProfile` with the right `baseRole`) instead of a `subRole`, matching the pattern in `auth.dto.test.js`. Do NOT re-add the union. Re-run until green.

- [ ] **Step 9: Commit**

```bash
git add packages/shared/helpers.js packages/shared/__tests__/profiles.test.js
git commit -m "refactor(shared): profiles are the sole permission source — drop subRole/isSuperSales unions + nav fallback"
```

---

### Task 3: Add the `activeProfileLabel` frontend helper

**Files:**
- Modify: `web/src/app/helpers/profiles.js` (append an exported helper)

**Interfaces:**
- Produces: `activeProfileLabel(profiles, currentProfileId) -> string | null` — the `label` of the active profile from the `/auth/me` `profiles[]` array, or `null` when there is no match (caller supplies its own legacy fallback). Consumed by `ProfileSwitcher.jsx` (Task 4) and `layout.jsx`'s `roleLabel` (Task 5).

- [ ] **Step 1: Add the helper**

Append to `web/src/app/helpers/profiles.js`:

```js
// The label of the user's ACTIVE profile, from the /auth/me `profiles[]` array
// (each entry: { id, key, label, family, isAdminTier }). Returns null when there is
// no match — callers supply their own legacy fallback. This is the single source the
// toolbar chip and the drawer footer both read, so they always agree after a switch.
export function activeProfileLabel(profiles, currentProfileId) {
  if (!Array.isArray(profiles) || currentProfileId == null) return null;
  const active = profiles.find((p) => p.id === currentProfileId);
  return active?.label ?? null;
}
```

- [ ] **Step 2: Verify the module parses (no dedicated web test runner)**

Run: `cd web && node --input-type=module -e "import('./src/app/helpers/profiles.js').then(m => { if (typeof m.activeProfileLabel !== 'function') { throw new Error('missing export'); } console.log('ok'); })"`
Expected: prints `ok`.

- [ ] **Step 3: Commit**

```bash
git add web/src/app/helpers/profiles.js
git commit -m "feat(web): activeProfileLabel helper — active profile's label from /auth/me profiles[]"
```

---

### Task 4: Create the chip-as-trigger `ProfileSwitcher`

**Files:**
- Create: `web/src/features/users/ProfileSwitcher.jsx`

**Interfaces:**
- Consumes: `useAuth()` → `{ profiles, currentProfileId, user, refetchMe }`; `activeProfileLabel` (Task 3); `handleRequestSubmit(data, setLoading, path, isFileUpload, toastMessage, setRedirect, method)`; `useToastContext()` → `{ setLoading }`; `colors` from `web/src/app/helpers/colors.js`.
- Produces: `export default function ProfileSwitcher()` — a self-contained toolbar control. Rendered by `layout.jsx` (Task 5).

- [ ] **Step 1: Write the component**

Create `web/src/features/users/ProfileSwitcher.jsx`:

```jsx
"use client";

import { useState } from "react";
import { Box, Chip, Menu, MenuItem, ListItemIcon, ListItemText, Typography } from "@mui/material";
import { MdCheck, MdKeyboardArrowDown } from "react-icons/md";
import { FaUserShield, FaUserTie, FaPalette, FaCalculator } from "react-icons/fa";

import { useAuth } from "@/app/providers/AuthProvider";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { activeProfileLabel } from "@/app/helpers/profiles";
import colors from "@/app/helpers/colors";

// Icon + color per profile FAMILY (from /auth/me profiles[].family). Caramel identity.
const familyConfig = {
  ADMIN: { icon: <FaUserShield />, color: colors.info },
  SALES: { icon: <FaUserTie />, color: colors.success },
  DESIGN: { icon: <FaPalette />, color: colors.secondary },
  FINANCE: { icon: <FaCalculator />, color: colors.primaryDark },
};
const fallbackConfig = { icon: <FaUserTie />, color: colors.textTertiary };

// The profile chip IS the switcher trigger. Driven purely by the profiles[] array from
// /auth/me (each { id, key, label, family, isAdminTier }) — zero legacy-column reads.
// Holds >1 profile → a clickable chip with a caret that opens a menu and performs a real
// server-side switch (POST auth/profile/switch → refetchMe). Holds exactly 1 → a static
// chip showing the active profile's label. Holds 0 (unmigrated) → legacy roleLabel fallback.
export default function ProfileSwitcher() {
  const { profiles = [], currentProfileId, user, refetchMe } = useAuth();
  const { setLoading } = useToastContext();
  const [anchorEl, setAnchorEl] = useState(null);

  const list = Array.isArray(profiles) ? profiles : [];
  const activeLabel = activeProfileLabel(list, currentProfileId);
  const active = list.find((p) => p.id === currentProfileId) || null;
  const activeFamilyConfig = (active && familyConfig[active.family]) || fallbackConfig;

  // 0 profiles (unmigrated): fall back to the legacy role label so nothing regresses.
  const label = activeLabel ?? legacyRoleLabel(user);
  if (!label) return null;

  const multi = list.length > 1;

  async function handleSelect(profileId) {
    setAnchorEl(null);
    if (profileId === currentProfileId) return;
    const res = await handleRequestSubmit(
      { profileId },
      setLoading,
      "auth/profile/switch",
      false,
      "Switching profile...",
      null,
      "POST",
    );
    if (res?.success === true || res?.status === 200) {
      await refetchMe();
    }
  }

  return (
    <>
      <Chip
        size="small"
        icon={<Box sx={{ display: "flex", color: activeFamilyConfig.color, ml: 0.5 }}>{activeFamilyConfig.icon}</Box>}
        label={
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
            <span>{label}</span>
            {multi && <MdKeyboardArrowDown size={16} />}
          </Box>
        }
        onClick={multi ? (e) => setAnchorEl(e.currentTarget) : undefined}
        sx={{
          fontWeight: 600,
          color: colors.textPrimary,
          backgroundColor: colors.bgTertiary,
          cursor: multi ? "pointer" : "default",
          display: { xs: "none", sm: "inline-flex" },
          "& .MuiChip-icon": { color: activeFamilyConfig.color },
          ...(multi && { "&:hover": { backgroundColor: colors.bgQuaternary } }),
        }}
      />

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 240,
              borderRadius: 2,
              border: `1px solid ${colors.border}`,
              boxShadow: `0 8px 24px ${colors.shadowDark}`,
            },
          },
        }}
      >
        <Typography
          variant="caption"
          sx={{ px: 2, py: 1, display: "block", color: colors.textTertiary, fontWeight: 700, letterSpacing: 0.5 }}
        >
          SWITCH PROFILE
        </Typography>
        {list.map((profile) => {
          const cfg = familyConfig[profile.family] || fallbackConfig;
          const isCurrent = profile.id === currentProfileId;
          return (
            <MenuItem
              key={profile.id}
              selected={isCurrent}
              onClick={() => handleSelect(profile.id)}
              sx={{
                py: 1.25,
                "&.Mui-selected": { backgroundColor: colors.primaryAlt },
                "&.Mui-selected:hover": { backgroundColor: colors.highlight },
              }}
            >
              <ListItemIcon sx={{ color: cfg.color, minWidth: 36 }}>{cfg.icon}</ListItemIcon>
              <ListItemText primary={profile.label} primaryTypographyProps={{ fontWeight: isCurrent ? 700 : 500 }} />
              {isCurrent && <MdCheck size={18} color={colors.success} />}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}

// Legacy fallback for unmigrated accounts (0 profiles) — mirrors the pre-change
// roleLabel(user) so those users still see a correct-ish label.
function legacyRoleLabel(user) {
  if (!user) return "";
  if (user.role === "STAFF") return user.profile === "SUPER_SALES" ? "Super Sales" : "Sales";
  const map = {
    ADMIN: "Admin", SUPER_ADMIN: "Admin", THREE_D_DESIGNER: "3D Designer",
    TWO_D_DESIGNER: "2D Designer", TWO_D_EXECUTOR: "Executor", ACCOUNTANT: "Accountant",
    CONTACT_INITIATOR: "Contact Initiator", SUPER_SALES: "Super Sales",
  };
  return map[user.role] || user.role || "";
}
```

- [ ] **Step 2: Confirm `ToastLoadingProvider` exposes `setLoading`**

Run: `cd web && grep -n "setLoading" src/app/providers/ToastLoadingProvider.jsx | head -3`
Expected: at least one match (the provider's value includes `setLoading`). If the export name differs, adjust the `useToastContext()` destructure to match. (`UserRoles.jsx` used the same `useToastContext()` + `setLoading` pairing, so this should match.)

- [ ] **Step 3: Commit**

```bash
git add web/src/features/users/ProfileSwitcher.jsx
git commit -m "feat(web): ProfileSwitcher — chip-as-trigger profile switch on the caramel identity"
```

---

### Task 5: Wire `ProfileSwitcher` into the toolbar, derive `roleLabel` from profiles, delete `UserRoles.jsx`

**Files:**
- Modify: `web/src/app/(auth)/dashboard/(dashboard)/layout.jsx` (import `:50`; `roleLabel` `:552-556`; `DashboardLayout` useAuth destructure `:669`; `userRoleLabel` `:708`; toolbar chip + render site `:820-832`)
- Delete: `web/src/features/users/UserRoles.jsx`

**Interfaces:**
- Consumes: `ProfileSwitcher` (Task 4), `activeProfileLabel` (Task 3), `useAuth()` → adds `profiles`, `currentProfileId`.

- [ ] **Step 1: Swap the import**

In `web/src/app/(auth)/dashboard/(dashboard)/layout.jsx`, replace line 50:

```js
import SignInWithDifferentUserRole from "@/features/users/UserRoles";
```

with:

```js
import ProfileSwitcher from "@/features/users/ProfileSwitcher";
import { activeProfileLabel } from "@/app/helpers/profiles";
```

- [ ] **Step 2: Derive `roleLabel` from the active profile**

In `web/src/app/(auth)/dashboard/(dashboard)/layout.jsx`, replace `roleLabel` `:552-556`:

```js
function roleLabel(user) {
  if (user?.role === "STAFF")
    return user.profile === "SUPER_SALES" ? "Super Sales" : "Sales";
  return ROLE_LABELS[user?.role] || user?.role || "";
}
```

with:

```js
// Prefer the active profile's own label (from /auth/me profiles[]); fall back to the
// derived role for unmigrated accounts. Keeps the drawer footer in step with the chip.
function roleLabel(user, profiles, currentProfileId) {
  const fromProfile = activeProfileLabel(profiles, currentProfileId);
  if (fromProfile) return fromProfile;
  if (user?.role === "STAFF")
    return user.profile === "SUPER_SALES" ? "Super Sales" : "Sales";
  return ROLE_LABELS[user?.role] || user?.role || "";
}
```

- [ ] **Step 3: Pass `profiles`/`currentProfileId` from `useAuth`**

In `web/src/app/(auth)/dashboard/(dashboard)/layout.jsx`, replace line 669:

```js
  let { user, isLoggedIn, validatingAuth } = useAuth();
```

with:

```js
  let { user, isLoggedIn, validatingAuth, profiles, currentProfileId } = useAuth();
```

Then replace line 708:

```js
  const userRoleLabel = roleLabel(user);
```

with:

```js
  const userRoleLabel = roleLabel(user, profiles, currentProfileId);
```

- [ ] **Step 4: Replace the standalone chip + old switcher with `ProfileSwitcher`**

In `web/src/app/(auth)/dashboard/(dashboard)/layout.jsx`, replace the block `:820-832`:

```jsx
                {userRoleLabel && (
                  <Chip
                    size="small"
                    label={userRoleLabel}
                    sx={{
                      fontWeight: 600,
                      color: colors.textOnPrimary,
                      backgroundColor: theme.palette.status.neutral,
                      display: { xs: "none", sm: "inline-flex" },
                    }}
                  />
                )}
                <SignInWithDifferentUserRole />
```

with:

```jsx
                <ProfileSwitcher />
```

The drawer footer at `:727-731` keeps using `userRoleLabel` (now profile-derived), so drawer and chip agree. `DrawerUserFooter`'s `label` prop is unchanged.

- [ ] **Step 5: Delete the legacy component**

```bash
git rm web/src/features/users/UserRoles.jsx
```

- [ ] **Step 6: Confirm no other importer of the deleted file**

Run: `cd web && grep -rn "features/users/UserRoles" src/ || echo "no importers"`
Expected: `no importers`. (If any remain, they are unexpected — stop and report; the spec found only `layout.jsx`.)

- [ ] **Step 7: Verify the frontend builds**

Run: `cd web && npx next build`
Expected: build succeeds. (`web/` eslint is broken in this repo — the build is the verification path, per the repo convention.)

- [ ] **Step 8: Commit**

```bash
git add "web/src/app/(auth)/dashboard/(dashboard)/layout.jsx"
git commit -m "feat(web): chip-as-switcher in the toolbar; roleLabel from active profile; drop legacy UserRoles"
```

---

### Task 6: Full verification + manual smoke

**Files:** none (verification only)

- [ ] **Step 1: Backend parity gate**

Run: `cd server && npx vitest run`
Expected: PASS (~970 tests).

- [ ] **Step 2: Shared suite**

Run: `cd packages/shared && npx vitest run`
Expected: PASS.

- [ ] **Step 3: Frontend build**

Run: `cd web && npx next build`
Expected: build succeeds.

- [ ] **Step 4: Production data safety check (USER RUNS — do not run against prod yourself)**

Ask the user to run against **production** and confirm both return `0` before shipping (from spec §5):

```sql
SELECT COUNT(*) FROM UserSubRole;
SELECT COUNT(*) FROM User u LEFT JOIN UserProfile up ON up.userId = u.id WHERE up.id IS NULL;
```

If either is non-zero, STOP and report — the union removal / derivation fallback needs re-scoping.

- [ ] **Step 5: Manual smoke (local, on the 2-profile account)**

Log in as `abdalle.webdev@gmail.com` (holds `DESIGNER_3D` + `DESIGNER_2D`). Confirm:
- The toolbar chip shows the active profile with a caret.
- Clicking opens the menu listing both profiles, a check on the active one.
- Switching 3D → 2D updates the chip label, the drawer footer label, AND the sidebar nav together (no manual reload).
- On a 1-profile account (e.g. `abdotlos60@gmail.com`), the chip renders static with no caret and no menu.

- [ ] **Step 6: Update PROJECT_STATE.md**

Add a line under the profiles-sweep status noting the auth-boundary derivation + switcher rebuild are done on `feat/workstage-flow-redesign`. Commit:

```bash
git add PROJECT_STATE.md
git commit -m "docs: profiles-as-SoT auth derivation + switcher rebuild done"
```
