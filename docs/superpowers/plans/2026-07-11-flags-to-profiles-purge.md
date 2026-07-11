# Flags → Profiles purge (codebase-wide) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** Remove every `isSuperSales` / `isPrimary` FLAG read from application logic (backend + frontend) and derive sales tier from the active PROFILE instead, per CLAUDE.md §2.8 / §6 (locked 2026-07-11).

**Architecture:** Sales tier comes from the active profile. Backend reads `authUser.currentProfileKey` (`"SUPER_SALES"` / `"PRIMARY_SALES"` / `"NORMAL_SALES"`) and `authUser.isAdminTier`. Frontend reads `user.profile` (= current profile key, emitted by `auth.dto` `toMe`). The `isSuperSales`/`isPrimary` COLUMNS remain in the schema, read ONLY by the sanctioned boundaries below.

**Tech Stack:** Express + Prisma (server), Next.js + MUI (web), Vitest. ESM, JS only.

## Global Constraints

- **Parity-exact mapping** (a migrated user's access must not widen/narrow vs the flag it replaces):
  - `authUser.isSuperSales` (backend) → `authUser.currentProfileKey === "SUPER_SALES"`
  - `authUser.isPrimary` (backend) → `authUser.currentProfileKey === "PRIMARY_SALES"`
  - `user.isSuperSales` (frontend) → `user.profile === "SUPER_SALES"`
  - `user.isPrimary` (frontend) → `user.profile === "PRIMARY_SALES"`
  - admin-tier unions (`ADMIN||SUPER_ADMIN||isSuperSales`) → prefer `authUser.isAdminTier` where the value is the acting user; else `role ADMIN/SUPER_ADMIN || currentProfileKey === "SUPER_SALES"`.
- **Acting-user vs DB-loaded-user:** `currentProfileKey`/`user.profile` exist on the ACTING user (token/`toMe`). If a site reads the flag on a DB-loaded OTHER user (not the caller), that object has no `currentProfileKey` — STOP and report it for per-site handling (may need to select the profile relation). Do NOT invent a currentProfileKey on a DB row.
- **Sanctioned flag reads — DO NOT TOUCH:** `packages/shared` `deriveProfilesFromLegacy`/`resolveProfileKey` (backfill derivation); `server/src/modules/users/user/user.repo.js` `setUserProfile` + `user.usecase.js` `syncLegacyFlags`/`STAFF_EXTRA_EDITABLE` + `user.validation.js` whitelist (the write-sync that maintains the columns for frozen legacy services); the `select: { isPrimary, isSuperSales }` fragments feeding those.
- **No PDF logic change; no schema change; JS/JSX only; preserve observable API + envelope.**
- Run scoped tests: `npx vitest run <path>` from repo root. FE: `cd web && npx next build`. No `DATABASE_URL` here (tests mocked).
- Working tree is CLEAN and the other session is done — use path-isolated commits (`git commit -- <paths>`) and `git show -p HEAD` hunk-checks anyway (habit).

---

### Task 1: FE central helpers → profile

**Files:** Modify `web/src/app/helpers/functions/utility.js`.
**Sites:** `checkIfPrimaryStaff` (L189-195, reads `user.isPrimary`), `checkIfAdminOrSuperSales` (L206-210, `user.isSuperSales`), `checkIfAdminOrSuperOrContactInitiator` (L212-219, `user.isSuperSales`).

- [ ] **Step 1: Convert the three helpers (parity-exact).**

```js
export const checkIfPrimaryStaff = (user) => {
  return (
    (user.role === "STAFF" ||
      user.subRoles?.some((r) => r.subRole === "STAFF")) &&
    user.profile === "PRIMARY_SALES"
  );
};
```

```js
export const checkIfAdminOrSuperSales = (user) => {
  return (
    user.role === "ADMIN" || user.role === "SUPER_ADMIN" || user.profile === "SUPER_SALES"
  );
};
```

```js
export const checkIfAdminOrSuperOrContactInitiator = (user) => {
  return (
    user.role === "ADMIN" ||
    user.role === "SUPER_ADMIN" ||
    user.profile === "SUPER_SALES" ||
    user.role === "CONTACT_INITIATOR"
  );
};
```

- [ ] **Step 2: Build.** `cd web && npx next build` → passes (classify any failure as yours vs pre-existing).
- [ ] **Step 3: Commit** `git commit -m "refactor(web): sales-tier helpers read user.profile, not isSuperSales/isPrimary" -- web/src/app/helpers/functions/utility.js`; hunk-check.

---

### Task 2: FE direct flag-read sweep

**Files & sites (convert each per the parity-exact mapping):**
- `web/src/shared/components/buttons/UpdateInitialConsultLead.jsx:24` `!user.isSuperSales` → `user.profile !== "SUPER_SALES"`
- `web/src/shared/components/common/DeleteModelButton.jsx:41,48` `user.isSuperSales` → `user.profile === "SUPER_SALES"`
- `web/src/app/(auth)/dashboard/(dashboard)/page.jsx:27` `!user.isSuperSales` → `user.profile !== "SUPER_SALES"`
- `web/src/app/(auth)/dashboard/(dashboard)/on-hold-deals/page.jsx:311` `!user.isSuperSales` → `user.profile !== "SUPER_SALES"`
- `web/src/app/(auth)/dashboard/(dashboard)/layout.jsx:309,482` `user.isSuperSales` → `user.profile === "SUPER_SALES"`
- `web/src/app/(auth)/dashboard/(dashboard)/calendar/page.jsx:14` `user.isSuperSales` → `user.profile === "SUPER_SALES"`
- `web/src/app/(auth)/dashboard/(dashboard)/notifications/page.jsx:12` `!user.isSuperSales` → `user.profile !== "SUPER_SALES"`
- `web/src/app/(auth)/dashboard/(dashboard)/all-deals/page.jsx:10` `!user.isSuperSales` → `user.profile !== "SUPER_SALES"`
- `web/src/app/(auth)/dashboard/(dashboard)/deals/page.jsx:12` `!user.isSuperSales` → `user.profile !== "SUPER_SALES"`
- `web/src/features/Kanban/staff/StaffLeadsKanbanBoard.jsx:21` `!user.isPrimary && !user.isSuperSales` → `user.profile !== "PRIMARY_SALES" && user.profile !== "SUPER_SALES"`
- `web/src/features/leads/PreviewLeadDialog.jsx:134` `!user.isPrimary` → `user.profile !== "PRIMARY_SALES"`
- `web/src/features/leads/tabs/SalesToolsTabs.jsx:143` `!user.isPrimary` → `user.profile !== "PRIMARY_SALES"`
- `web/src/features/leads/core/LeadSliderCard.jsx:52` `user.isSuperSales` (showContact) → `user.profile === "SUPER_SALES"`
- `web/src/features/leads/pages/NewLeadsPage.jsx:68,109` `user.isSuperSales` / `!user.isSuperSales` → `user.profile === "SUPER_SALES"` / `user.profile !== "SUPER_SALES"`

**Keep (NOT a logic read):** `web/src/app/helpers/constants/users.js:42-43` — these are a color legend keyed by the strings "isPrimary"/"isSuperSales" for the user-admin badges; leave unless it breaks (report if it does).

- [ ] **Step 1: Convert every site above.** Preserve surrounding logic exactly; only the flag term changes.
- [ ] **Step 2: Build.** `cd web && npx next build` → passes.
- [ ] **Step 3: Grep-verify** no `\.isSuperSales|\.isPrimary` remain in the converted files (excluding `constants/users.js`).
- [ ] **Step 4: Commit** `git commit -m "refactor(web): read user.profile for sales tier across dashboards/leads/kanban" -- <the 14 files>`; hunk-check.

---

### Task 3: Backend — users module

**Files & sites:**
- `server/src/modules/users/user/user.usecase.js:317,350` — `authUser.isSuperSales` guards (a non-admin super-sales creator/editor may not set a non-STAFF role) → `authUser.currentProfileKey === "SUPER_SALES"`. (These read the ACTING user.)
- `server/src/modules/users/user/user.repo.js:140` — `currentUser.isSuperSales` scope. Confirm `currentUser` is the acting user (has `currentProfileKey`); if so → `currentUser.currentProfileKey === "SUPER_SALES"`. If it's a DB-loaded row without the profile, STOP and report.
- `server/src/modules/users/user/user.dto.js:43` — `if (authUser.isSuperSales) return true;` (full-scope) → `if (authUser.currentProfileKey === "SUPER_SALES") return true;` (or `authUser.isAdminTier`).

**DO NOT TOUCH** in this module: `setUserProfile`, `syncLegacyFlags`, `STAFF_EXTRA_EDITABLE`, the validation whitelist, and the `isPrimary/isSuperSales` write/select fragments (sanctioned write-sync).

- [ ] **Step 1:** Convert the 3 acting-user reads; verify each is the caller (`authUser`/`currentUser`=caller). Report any DB-loaded-user read instead of guessing.
- [ ] **Step 2:** `npx vitest run server/src/modules/users` → passes (update any fixture that set `isSuperSales:true` and asserts super behavior to `currentProfileKey:"SUPER_SALES"`; don't change assertions).
- [ ] **Step 3: Commit** `git commit -m "refactor(users): authorize on currentProfileKey, not isSuperSales flag (write-sync kept)" -- <files>`; hunk-check.

---

### Task 4: Backend — projects module

**Files & sites:**
- `server/src/modules/projects/project/project.repo.js:55-56` — `hasFullScope({ role, isSuperSales })` `if (isSuperSales) return true;` → accept `{ role, currentProfileKey, isAdminTier }`; `if (currentProfileKey === "SUPER_SALES" || isAdminTier) return true;`. Update its callers to pass `...authUser`.
- `server/src/modules/projects/project/project.usecase.js:48` — `Boolean(authUser?.isSuperSales)` → `authUser?.currentProfileKey === "SUPER_SALES"` (or `isAdminTier`).
- `server/src/modules/projects/project/project.dto.js:50` — `Boolean(authUser?.isSuperSales)` → same.
- `server/src/modules/projects/task/task.dto.js:10` — `Boolean(authUser?.isSuperSales) || ["ADMIN","SUPER_ADMIN"].includes(authUser?.role)` → `authUser?.isAdminTier || ["ADMIN","SUPER_ADMIN"].includes(authUser?.role)` (isAdminTier covers super-sales).

- [ ] **Step 1:** Convert; confirm `hasFullScope`'s callers spread `...authUser` (like the leads repo pattern) so `currentProfileKey`/`isAdminTier` reach it.
- [ ] **Step 2:** `npx vitest run server/src/modules/projects` → passes (update super-sales fixtures to `currentProfileKey`/`isAdminTier`; keep assertions).
- [ ] **Step 3: Commit** `git commit -m "refactor(projects): full-scope from currentProfileKey/isAdminTier, not isSuperSales" -- <files>`; hunk-check.

---

### Task 5: Backend — dashboard, calendar, utilities, generic-delete, contracts-legacy

**Files & sites (all ACTING-user reads unless noted):**
- `server/src/modules/dashboard/dashboard.usecase.js:809` — `Boolean(authUser?.isSuperSales)` → `authUser?.currentProfileKey === "SUPER_SALES"` (this is inside an admin-tier check `ADMIN_TIER_ROLES.includes(role) || ...` → could use `authUser?.isAdminTier`).
- `server/src/modules/calendar/availability/availability.usecase.js:509,511` — `authUser.isSuperSales` (two reads: the `userId` scoping and the `isSuperSales:` arg passed down to `month-view`) → `authUser.currentProfileKey === "SUPER_SALES"`. Keep the `isSuperSales` PARAM NAME on the internal `month-view` function (or rename to `isSuperSalesScope`) — it's an internal boolean arg, not a flag read; just feed it the profile-derived value.
- `server/src/modules/calendar/availability/month-view.usecase.js:22,72` — the internal `isSuperSales` param/branch: this consumes the boolean passed by availability.usecase; no flag read of its own. Leave the param, OR rename to `isSuperSalesScope` for clarity (optional). Do NOT read a flag here.
- `server/src/modules/utilities/utility.usecase.js:140,155-156,287` — `user.isSuperSales`/`currentUser.isSuperSales`. Confirm acting user → `currentProfileKey === "SUPER_SALES"`. Note L155-156 builds a local `isSuperSales` boolean — feed it from the profile.
- `server/src/modules/utilities/utility.repo.js:115` — `select: { role, subRoles, isSuperSales }`. If this select feeds the utility scope logic for the ACTING user, prefer using `authUser.currentProfileKey` upstream and drop the `isSuperSales` from the select; if the select feeds a frozen legacy path, STOP and report. Do not blindly drop a select a frozen service needs.
- `server/src/modules/generic-delete/generic-delete.usecase.js:24,102` — `deleteAModel({ ..., isSuperSales })` receives a boolean arg computed at :102 `Boolean(authUser?.isSuperSales)` → compute from `authUser?.currentProfileKey === "SUPER_SALES"`; the internal `isSuperSales` param may stay (it's a passed boolean, not a flag read).
- `server/src/modules/contracts/legacy/contract-services.js:1157` — `!user.isSuperSales`. **CAUTION: this file is in `contracts/legacy` (PDF-frozen tier).** Verify the read at :1157 is a NON-PDF scope/branch decision (not PDF layout/generation). If it is a plain scope read, convert `!user.isSuperSales` → `user.currentProfileKey !== "SUPER_SALES"`. If it is entangled with PDF generation logic, STOP and report — do not risk the freeze.

- [ ] **Step 1:** Convert each; honor the CAUTION/STOP notes. For internal boolean params (month-view, generic-delete, availability→month-view), keep the param and only change the flag→profile at the SOURCE where the boolean is computed.
- [ ] **Step 2:** `npx vitest run server/src/modules/dashboard server/src/modules/calendar server/src/modules/utilities server/src/modules/generic-delete server/src/modules/contracts` → passes (update super-sales fixtures; keep assertions).
- [ ] **Step 3: Commit** `git commit -m "refactor(dashboard/calendar/utilities/generic-delete/contracts): sales tier from currentProfileKey" -- <files>`; hunk-check (esp. contract-services — confirm only the scope line changed, no PDF logic).

---

### Task 6: auth.middleware (drop flag fallback) + auth.dto (drop flag exposure) + final regression

**Files & sites:**
- `server/src/shared/middlewares/auth.middleware.js` — DROP the `legacyIsAdminTier` flag read (`payload?.isSuperSales`, L18-23) per the owner's decision (profiles only). The authoritative `isAdminTier` comes from the resolved profile (`resolved.isAdminTier`). For the transitional fallback branch (no `currentProfileId` resolved): set `isAdminTier` WITHOUT reading flags — either `false` (un-migrated → not admin-tier; owner waived un-migrated sessions) or resolve from `payload.currentProfileKey` if present. Remove the `legacyIsAdminTier` function and its `isSuperSales` read. Keep permission resolution (`getEffectivePermissions`) as-is unless it too reads the flags — if it does and removing breaks un-migrated tokens, STOP and report (that's a separate auth decision).
- `server/src/modules/auth/auth.dto.js:129,142-143,173-174` — the `toMe`/token DISPLAY exposure of `isSuperSales`/`isPrimary`. The FE no longer reads them (Tasks 1-2). Drop `isSuperSales`/`isPrimary` from the `toMe` output object and the token claims. **KEEP** the `select` fragments at L30-31,46-47 (they feed `resolveProfileKey`/derivation) and KEEP `profile: currentProfileKey`.

- [ ] **Step 1:** Edit auth.middleware (drop `legacyIsAdminTier` + its flag read). Verify the resolved path still sets `isAdminTier` from `resolved.isAdminTier`.
- [ ] **Step 2:** Edit auth.dto (drop flag exposure from `toMe` + token; keep `profile` + the derivation selects).
- [ ] **Step 3:** `npx vitest run server/src/modules/auth server/src/shared/middlewares packages/shared` → passes (update fixtures/tests that asserted `me.isSuperSales`/`isPrimary` presence — those fields are intentionally gone now).
- [ ] **Step 4: Final regression** — `npx vitest run server/src/modules/leads server/src/modules/users server/src/modules/projects packages/shared` and `cd web && npx next build`.
- [ ] **Step 5: Grep gate** — `git grep -nE "\.isSuperSales|\.isPrimary" -- server/src web/src ':!**/__tests__/**'` returns ONLY the sanctioned sites (backfill derivation, user write-sync, `constants/users.js` color legend). Anything else is a miss — fix it.
- [ ] **Step 6: Commit** `git commit -m "refactor(auth): drop isSuperSales/isPrimary from middleware admin-tier + /me; profiles only" -- <files>`; then update PROJECT_STATE (mark phase-2 purge complete) in a follow-up doc commit.

---

## Self-Review

- Coverage: FE helpers (T1) + FE direct reads (T2) + backend users (T3) / projects (T4) / dashboard+calendar+utilities+generic-delete+contracts (T5) / auth (T6) covers every non-sanctioned site from the grep map.
- Parity: the mapping table (Global Constraints) is applied uniformly; fixture updates preserve assertions; final grep gate (T6.5) proves no stray logic reads remain.
- Risk controls: PDF-frozen `contract-services.js` has an explicit STOP-if-entangled gate; DB-loaded-user reads have a STOP-and-report gate; sanctioned write-sync/derivation explicitly excluded; auth fallback change isolated to its own task with a STOP gate if permission resolution is implicated.
