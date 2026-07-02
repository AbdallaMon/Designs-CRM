# Permission Profiles — Design

**Date:** 2026-07-02
**Branch:** `frontend-redesign`
**Status:** Draft for review
**Supersedes/extends:** `2026-07-01-permissions-parity-and-denial-reasons-design.md`, `permissions-parity-matrix.md`

---

## 1. Problem & goal

Authorization today is derived from a **static code map** keyed on
`role + subRoles + isSuperSales` (`packages/shared/constants/access/role-permissions.js`),
plus a fourth signal — `User.isPrimary` — that lives **only in the frontend**
(`checkIfPrimaryStaff`) and has **no permission code at all**. The result:

- ~340 scattered branches across ~80 files (`isPrimary`, `isSuperSales`,
  `checkIfPrimaryStaff`, `checkIfAdminOrSuperSales`, `user.role === "…"`) on both
  BE and FE.
- The primary-only lead tabs (price offers, projects, modifications, updates)
  **cannot** be expressed as permission codes — so the FE must role-branch, and
  the parity work could not converge them onto `usePermission`/capabilities.

**Goal:** make **one profile per user** the single thing that carries operational
permissions. Everything downstream (FE + BE) gates only on **permission codes +
capabilities + object-scope checkers**. `isPrimary`/`isSuperSales` (and,
eventually, the `role + subRoles` operational split) stop being read directly.

**Non-goal:** changing who-can-do-what. Cutover is **parity-preserving** —
identical effective access to `master`, proven by an updated parity matrix.

---

## 2. Locked decisions (from brainstorming)

1. **Code-defined profiles.** Permission *sets* live in `packages/shared`
   (`PROFILES` map). No admin-editable permission tables.
2. **One profile per user, mutually exclusive.** A user logs in and operates
   under exactly one profile.
3. **Storage:** add **one nullable scalar column `User.profile`** (a small
   additive `prisma migrate dev` migration — NOT permission tables). This is a
   deliberate, minimal revisit of the "schema frozen" decision, approved by the
   user. Prod is reconciled by the user via the runbook; we never touch prod.
4. **Bootstrap backfill script** maps existing users old→new
   (`isPrimary`→`PRIMARY_SALES`, `isSuperSales`→`SUPER_SALES`, plain staff→
   `NORMAL_SALES`, etc.). Idempotent; safe to re-run.
5. **`isPrimary`/`isSuperSales` are KEPT — never removed.** They are the source
   for the old→new backfill (and re-runs/rollback) and stay maintained in sync
   with the profile. The migration reads them; app logic stops gating on them.
5. **Front-end** user create/edit picks a profile (replacing the
   `isPrimary`/`isSuperSales` toggles).
6. **Profiles fold in `subRoles`.** The role+subRole operational model is
   replaced by a single profile. `User.role` is kept as a coarse/legacy category
   field (schema-frozen; still stored), but app code stops gating on it.
7. **Designers get sub-variants now** (grounded in project types — see §5, an
   open item to confirm).

---

## 3. Architecture

```
packages/shared/constants/access/
  profiles.js            NEW  — PROFILES map {KEY: [codes]}, PROFILE_META, resolveProfileKey()
  role-permissions.js    reused as the building blocks (LEAD_AUTHED, PROJECT_AUTHED, …)
  permissions.constants.js  +NEW lead-section view codes (§4)
helpers.js               getEffectivePermissions() rewritten to resolve via profile
server/…/auth.dto.js     /auth/me emits `profile` + (unchanged) permissions/permissionsByModule
server/…/user/*          create/update validate+persist `profile`; staff-extra deprecated
server/bootstrap         backfill script (idempotent) runs on boot
web/…/users/*            profile <select> replaces isPrimary/isSuperSales toggles
web/…/leads/*            section gates consume capabilities (Phase 3)
packages/db/prisma       migration: User.profile String?  (nullable, additive)
```

### 3.1 Profile model

`profiles.js` exports:

```js
// A profile = a named permission-code set, decoupled from the role enum.
export const PROFILES = {
  ADMIN:          [...],   // full admin surface (today's ADMIN role codes)
  SUPER_ADMIN:    [...],
  NORMAL_SALES:   [...SHARED_AUTHED, ...LEAD_AUTHED, ...PROJECT_AUTHED, ...STAFF_GATE],
  PRIMARY_SALES:  [...NORMAL_SALES, ...LEAD_SECTION_PRIMARY],       // + primary-only codes
  SUPER_SALES:    [...PRIMARY_SALES, ...SUPER_SALES_EXTRA_PERMISSIONS], // ⊇ primary + admin-tier
  DESIGNER_3D:    [...],   // §5 (sub-variants TBD-confirm)
  DESIGNER_2D:    [...],
  EXECUTOR_2D:    [...],
  ACCOUNTANT:     [...SHARED_AUTHED, ...LEAD_AUTHED, ...PROJECT_AUTHED, ...ACCOUNTING_ALL, ...STAFF_GATE],
  CONTACT_INITIATOR: [...],
};

export const PROFILE_META = {
  NORMAL_SALES:  { label: "موظف مبيعات", family: "SALES",   baseRole: "STAFF" },
  PRIMARY_SALES: { label: "مبيعات أساسي", family: "SALES",   baseRole: "STAFF" },
  SUPER_SALES:   { label: "سوبر مبيعات",  family: "SALES",   baseRole: "STAFF" },
  // …one entry per profile: label (Arabic), family, and the baseRole to persist.
};
```

`baseRole` matters because `User.role` (schema-frozen enum) must stay populated
and consistent — assigning a profile also sets the corresponding legacy `role`
(and the transitional `isPrimary`/`isSuperSales`) so nothing half-migrated breaks.

### 3.2 Resolution

```js
// The single place that reads user.profile (and, transitionally, the old flags).
export function resolveProfileKey(user) {
  if (user?.profile && PROFILES[user.profile]) return user.profile;
  // Transitional fallback for rows not yet backfilled:
  return deriveProfileFromLegacy(user); // (role, isPrimary, isSuperSales, subRoles)
}
```

`getEffectivePermissions(user)` is rewritten:

```js
const key = resolveProfileKey(user);
const set = new Set(PROFILES[key] ?? []);
// subRoles fold in: if a user still carries subRoles, union their profile codes
// during the transition (Phase 1 keeps this to guarantee parity), then drop it
// once backfill assigns composite profiles (Phase 4).
return { permissions: [...set], permissionsByModule: groupByModule([...set]) };
```

`permissionsByModule` grouping and `NAVIGATION_PERMISSION_ACTIONS` action flags
are **unchanged** — only the *source* of the code set changes. `buildNavigationTabs`
stays role-driven for now (nav parity is already proven); a later phase can move
it onto profiles.

---

## 4. New permission codes (make `isPrimary` expressible)

The primary-only lead-detail sections have no code today. Add a small group so
`PRIMARY_SALES`/admin profiles grant them and the FE gates on codes, not
`isPrimary`:

```js
// permissions.constants.js — appended to LEAD_PERMISSIONS
PRICE_OFFER_VIEW:  "lead.price_offer.view",   // see the commercial/price-offers section
PROJECTS_VIEW:     "lead.projects.view",      // see the lead-detail projects section
MODIFICATIONS_VIEW:"lead.modifications.view", // see the modifications section
UPDATES_VIEW:      "lead.updates.view",       // see the updates section (also needs status=FINALIZED)
ANALYSIS_VIEW:     "lead.analysis.view",      // see the client-analysis (SPAIN/VERSA) tools
```

Two DISTINCT grant sets, so the codes match today's gates **exactly**:

- `LEAD_SECTION_PRIMARY = [PRICE_OFFER_VIEW, PROJECTS_VIEW, MODIFICATIONS_VIEW, UPDATES_VIEW]`
  — granted to `PRIMARY_SALES`, `SUPER_SALES`, `ADMIN`, `SUPER_ADMIN`. Matches the
  current `admin || isPrimaryStaff` FE gate.
- `ANALYSIS_VIEW` — granted **more broadly**: `NORMAL_SALES` too (all STAFF),
  plus PRIMARY/SUPER/admin. Matches the current `admin || role==="STAFF"` gate
  (see §9). NOT part of `LEAD_SECTION_PRIMARY`.

These are **VIEW** codes for section visibility; the existing `*_MANAGE` codes +
capabilities still govern actions. (`UPDATES_VIEW` still additionally requires
`status === "FINALIZED"`, enforced as a capability, matching today.)

---

## 5. Profile taxonomy (parity map)

| Today (role + flags/subRoles) | Profile | Codes |
|---|---|---|
| STAFF, no flags | `NORMAL_SALES` | today's STAFF codes |
| STAFF + `isPrimary` | `PRIMARY_SALES` | NORMAL_SALES + LEAD_SECTION_PRIMARY |
| STAFF + `isSuperSales` | `SUPER_SALES` | PRIMARY_SALES + SUPER_SALES_EXTRA_PERMISSIONS |
| STAFF + both | `SUPER_SALES` | (⊇ primary — no lost access) |
| ACCOUNTANT | `ACCOUNTANT` | today's ACCOUNTANT codes |
| ADMIN / SUPER_ADMIN | `ADMIN` / `SUPER_ADMIN` | today's codes |
| SUPER_SALES (base role) | `SUPER_SALES_BASE`* | today's base SUPER_SALES codes |
| CONTACT_INITIATOR | `CONTACT_INITIATOR` | today's codes |
| THREE_D_DESIGNER | `DESIGNER_3D` | today's designer codes |
| TWO_D_DESIGNER | `DESIGNER_2D` | today's designer codes |
| TWO_D_EXECUTOR | `EXECUTOR_2D` | today's executor codes |

\* Note the collision: there is BOTH a base `SUPER_SALES` **role** (weaker: no
admin extras) and an `isSuperSales` **flag** (adds admin-tier). **Confirmed
naming:** the flagged staff → profile `SUPER_SALES`; the base role →
`SUPER_SALES_BASE`.

### 5.1 Designer profiles — RESOLVED from master

Checked master directly (`routes/shared/{projects,tasks}.js`,
`services/main/shared/projectServices.js`, `services/main/staff/staffServices.js`,
and the nav arrays). Findings:

- Master has **exactly three designer roles** — `THREE_D_DESIGNER`,
  `TWO_D_DESIGNER`, `TWO_D_EXECUTOR`. There are **no per-project-type designer
  sub-roles.** The 2D "departments" (Plan study / Final plan / Quantity) are
  **navigation entries under the single `TWO_D_DESIGNER` role**, not separate
  roles; project *type* is a per-project data attribute, not a per-user role.
- All three share the same project/task codes (`PROJECT_AUTHED`). The **only real
  permission difference**: the task-visibility filter
  (`projectServices.js` getTaskVisibilityFilter) admits `MODIFICATION`-type tasks
  for `ADMIN`/`SUPER_ADMIN`/`THREE_D_DESIGNER` only; `TWO_D_DESIGNER`/`TWO_D_EXECUTOR`
  see `PROJECT`-type only. This is a role-keyed data-scope inside the frozen
  service.
- What differs most between designers is **navigation** (3D → 3D work-stage +
  modification + archived; 2D → study/final-plan/quantity departments + archived;
  executor → a single "Work stage" link) — already role-driven in
  `navigation.js`.

**Decision (parity with master):** three designer profiles that mirror the three
roles exactly:

```
DESIGNER_3D  (baseRole THREE_D_DESIGNER)  — designer codes; sees MODIFICATION tasks
DESIGNER_2D  (baseRole TWO_D_DESIGNER)    — designer codes; PROJECT tasks only
EXECUTOR_2D  (baseRole TWO_D_EXECUTOR)    — executor codes; PROJECT tasks only
```

The 3D-only MODIFICATION-task visibility is preserved 1:1 — during Phase 1 it
stays derived from the profile's `baseRole` (via the frozen service, unchanged);
Phase 3 may promote it to an explicit code
(`project.modification_tasks.view`, granted to DESIGNER_3D + admins) so the
frozen service's role branch can read the code instead. Navigation stays
role-driven via `baseRole`. Backfill assigns each existing designer the profile
matching their role.

---

## 6. Bootstrap migration (old → new)

An **idempotent** script (`server/src/bootstrap/backfill-profiles.js`) invoked in
the server bootstrap (alongside the existing worker bootstrap — no detached
process, per the locked worker rule). For every user with `profile IS NULL`:

```
profile = deriveProfileFromLegacy(role, isPrimary, isSuperSales, subRoles)
```

- Reads only; writes `profile` in a single `updateMany`-style pass batched by
  computed key. Never edits SQL by hand; goes through Prisma.
- Logs a summary (counts per profile) and is a no-op on already-backfilled rows.
- Runs on every boot cheaply (a single `WHERE profile IS NULL` guard).

This is data backfill, not a schema migration; the schema migration (adding the
column) is separate and additive.

---

## 7. Frontend — assign a profile

- **User create/edit** (`web/…/users/…`, currently role select + `staff-extra`
  toggles): replace the `isPrimary`/`isSuperSales` toggles with a single
  **profile `<select>`**, options sourced from `PROFILE_META` (labelled Arabic),
  optionally grouped by `family`. The form sends `profile`.
- **Backend** `createUser`/`updateUser`: accept + validate `profile` against
  `PROFILES` keys (Zod). On write, set `profile` AND, transitionally, the derived
  legacy `role`/`isPrimary`/`isSuperSales` from `PROFILE_META` so any not-yet-
  swept reader stays correct. Deprecate the `staff-extra` PATCH (kept working
  during transition, removed in Phase 4).
- `/auth/me` adds `profile` to the payload (display/debug); gating stays on
  `permissions`/`permissionsByModule`/`capabilities`.

---

## 8. The sweep (Phase 3) — replace ~340 branches

Module-by-module, replace direct reads of `isPrimary`/`isSuperSales`/role helpers
with **permission codes / capabilities / checkers**:

- **BE:** any usecase/dto/repo branch on `isPrimary`/`isSuperSales`/role →
  `hasPermission(...)`, a capability, or an object-scope checker. (The keystone
  full-scope checkers already exist.)
- **FE:** `checkIfPrimaryStaff`/`checkIfAdminOrSuperSales`/`user.role === …` →
  `usePermission().hasPermission(...)` / `PermissionGate` / `lead.capabilities.*`.
  The lead-section gates in `leadSections.jsx` consume the new §4 VIEW codes.
- Extend `computeLeadCapabilities` (and attach capabilities to the list/columns
  endpoints, which today only the detail endpoint does) so FE section/action
  gates read backend truth.

Each module lands as its own change with the parity matrix + tests green. Order:
leads → kanban → projects/work-stages → dashboard → users → remaining.

---

## 9. Parity strategy & testing

- **Golden parity matrix:** for every (legacy role, flag combo) → its mapped
  profile, assert the **effective code set is identical** to today's
  `getEffectivePermissions` output. This is a pure unit test over
  `packages/shared` (extends `permissions.test.js`), plus the existing
  master-parity matrix regenerated.
- **Analysis-section nuance:** today `analysis` shows for `admin || role==="STAFF"`
  (all STAFF, primary or not). If `ANALYSIS_VIEW` is granted only to
  PRIMARY/SUPER/admin it would NARROW access for non-primary STAFF. Fix: grant
  `ANALYSIS_VIEW` to `NORMAL_SALES` too (all sales), preserving parity. (Captured
  as a matrix assertion.)
- **Migration test:** seed users across every legacy combo, run the backfill,
  assert each lands on the expected profile and that `getEffectivePermissions`
  before == after.
- **Authz integration tests** (existing `authz.integration.test.js`) must stay
  green unchanged.
- Frontend verified via `cd web && npx next build` (eslint is broken repo-wide).

---

## 10. Phasing

- **Phase 1 — Framework + data (BE, zero UI/behavior change).** `profiles.js`,
  new §4 codes, `resolveProfileKey`, `getEffectivePermissions` rewrite (profile
  with legacy fallback), `User.profile` migration, backfill script, `/auth/me`
  emits `profile`. Parity matrix + migration test green. **Nothing visible
  changes.**
- **Phase 2 — Assignment.** FE profile picker; BE validate/persist `profile`
  (+ keep legacy fields in sync); deprecate `staff-extra`.
- **Phase 3 — The sweep.** Module-by-module replace the ~340 branches with
  codes/capabilities/checkers; extend capabilities to list/columns. Parity per
  module.
- **Phase 4 — Retire the *reads* only.** Once nothing in app logic branches on
  `isPrimary`/`isSuperSales`/`subRoles`, `getEffectivePermissions` can drop the
  legacy fallback and rely on `profile`. **The `isPrimary`/`isSuperSales` columns
  and their values are KEPT — never dropped, never nulled.** They remain the
  source of truth for the old→new backfill (and any re-run / rollback), and
  profile assignment keeps them in sync. "Retire" here means *stop gating on
  them*, NOT remove them.

**First implementation plan = Phases 1–2** (framework + migration + picker — the
three things explicitly requested). Phase 3 is a separate module-by-module plan;
Phase 4 is a small cleanup.

---

## 11. Risks

- **Parity drift** — mitigated by the golden matrix + migration before/after test;
  Phase 1 changes source only, not the code sets.
- **`User.role` divergence** — profile assignment always sets a consistent legacy
  `role`/flags via `PROFILE_META`, so anything not yet swept keeps working.
- **Schema unfreeze** — one nullable additive column; must keep the migrations
  building a fresh DB and be reconciled to prod by the user-run runbook
  (`docs/db-migrations-workflow.md`). Never touch prod.
- **subRoles users** — Phase 1 keeps unioning subRole codes for parity; only
  Phase 4 removes them, after backfill maps such users to a composite profile
  (may need extra profile keys — surfaced during backfill design).

---

## 12. Out of scope

- Admin-editable/runtime profiles (DB permission tables) — explicitly rejected.
- Changing who-can-do-what (any real access change is a separate documented
  decision, like the 4 intentional tightenings already tracked).
- Moving `buildNavigationTabs` off role (nav parity already proven; optional later).

---

## 13. Open questions

1. ~~Designer sub-variants~~ — **RESOLVED** from master (§5.1): three designer
   profiles mirroring the three roles; no project-type sub-roles.
2. ~~`SUPER_SALES` naming~~ — **RESOLVED**: `SUPER_SALES` = flagged staff,
   `SUPER_SALES_BASE` = base role.
3. **Profile labels (§3.1 `PROFILE_META`):** confirm the Arabic display labels for
   the profile picker (proposed: موظف مبيعات / مبيعات أساسي / سوبر مبيعات /
   مصمم 3D / مصمم 2D / منفّذ 2D / محاسب / مدير / …). Non-blocking — can be tuned
   during Phase 2.
