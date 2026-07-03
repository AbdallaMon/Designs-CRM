# DB-Relational Permissions & Switchable Profiles — Design

> **Status:** Approved design (brainstormed 2026-07-03). Supersedes the code-defined
> profile model in `2026-07-02-permission-profiles-design.md` (that work — the
> `User.profile` string column + code-map `PROFILES` — becomes the *seed source* and
> rollback path for this one; it is **not** deleted).
>
> **Baseline for parity = deployed `master`.** This design contains ONE deliberate,
> documented divergence from master (the current-profile-only rule, §2.2); everything
> else preserves observable behavior. The app is **in production** — see §7 for the
> prod-safe rollout (additive migration, seed, data-migration; **never a reset**).

---

## 1. Goal & summary

Replace the 100%-code-defined authorization model (permission codes as strings, a
role→codes map computed at request time, "profiles" as a code map + a dead
`User.profile` string column) with a **database-relational** model mirrored on the
reference app `C:\coding\Transaction-app`, adapted to our conventions and extended
with a **switchable current profile**.

After this change:

- Permission **codes**, **profiles**, and **profile→code** links are **DB rows**.
- A user is assigned **one or more profiles** (a `User ↔ Profile` many-to-many that
  **replaces `subRoles`**); an admin adds/removes profiles.
- The user has a **single active `currentProfile`**. **Effective permissions = the
  current profile's codes ONLY** (not the union of all assigned profiles — the
  deliberate divergence). The user can **switch** their current profile; switching
  changes which permissions apply, which nav shows, and their object-scope power.
- The `/auth/me` contract the frontend depends on is **preserved** (`permissions[]`,
  `permissionsByModule{}`, `navigationTabs[]`, `role`, `profile`) and only **extended**
  (adds `profiles[]` + `currentProfileId`), so the entire FE gating layer is untouched.

### Divergence from the reference app
The reference (`Transaction-app`) uses the **union** of all a user's assigned profiles
and has **no** current/active-profile concept and **no** switch UI. We deliberately
add `currentProfile` + switching and resolve from the **current profile only**. We also
**omit** the reference's `UserPermission` (direct per-user code grants) — it is dead for
gating there, and the user's requirement is explicitly "assign/remove **profiles**, not
direct permissions."

---

## 2. Data model

### 2.1 New Prisma tables (all additive)

Names adapted to our vocabulary ("permission codes", "profiles"):

```prisma
// One row per permission code — seeded from ALL_PERMISSIONS.
model PermissionCode {
  id          Int      @id @default(autoincrement())
  code        String   @unique @db.VarChar(191)   // "lead.view"  (191 = utf8mb4 index-length safe)
  module      String   @db.VarChar(64)            // "lead"       (splitPermissionCode(code).module)
  label       String?  @db.VarChar(191)           // optional Arabic label
  description String?  @db.Text
  createdAt   DateTime @default(now())
  profileLinks ProfilePermission[]
  @@index([module])
}

// One row per profile — seeded from PROFILE_META.
model Profile {
  id           Int      @id @default(autoincrement())
  key          String   @unique @db.VarChar(64)   // "ADMIN","NORMAL_SALES",... (== PROFILE_KEYS)
  label        String   @db.VarChar(191)          // Arabic label
  family       String?  @db.VarChar(64)           // ADMIN/SALES/DESIGN/FINANCE (PROFILE_META.family)
  baseRole     UserRole?                          // legacy role this profile syncs to / falls back to
  isAdminTier  Boolean  @default(false)           // drives object-scope power (§4) — set for ADMIN/SUPER_ADMIN/SUPER_SALES
  sortOrder    Int      @default(0)               // switcher ordering
  isAssignable Boolean  @default(true)            // hide deprecated profiles from the picker
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  permissionLinks ProfilePermission[]
  userLinks       UserProfile[]
  currentForUsers User[] @relation("CurrentProfile")
}

// Profile ↔ PermissionCode — what each profile grants.
model ProfilePermission {
  id               Int @id @default(autoincrement())
  profileId        Int
  permissionCodeId Int
  profile          Profile        @relation(fields: [profileId], references: [id], onDelete: Cascade)
  permissionCode   PermissionCode @relation(fields: [permissionCodeId], references: [id], onDelete: Cascade)
  createdAt        DateTime @default(now())
  @@unique([profileId, permissionCodeId])
  @@index([permissionCodeId])
}

// User ↔ Profile — assignment. REPLACES subRoles. A user may hold many.
model UserProfile {
  id               Int @id @default(autoincrement())
  userId           Int
  profileId        Int
  assignedByUserId Int?                            // audit: who assigned it
  user             User    @relation("UserProfiles", fields: [userId], references: [id], onDelete: Cascade)
  profile          Profile @relation(fields: [profileId], references: [id], onDelete: Restrict)
  assignedBy       User?   @relation("UserProfileAssignedBy", fields: [assignedByUserId], references: [id])
  createdAt        DateTime @default(now())
  @@unique([userId, profileId])
  @@index([profileId])
  @@index([assignedByUserId])
}

// Minimal audit — the repo's first authz audit pattern.
model AuthAuditLog {
  id           Int      @id @default(autoincrement())
  actorUserId  Int                                 // who did it
  targetUserId Int?                                // whom it affected (self for a switch)
  action       String   @db.VarChar(64)            // PROFILE_SWITCH / PROFILE_ASSIGN / PROFILE_REMOVE
  detail       Json?
  createdAt    DateTime @default(now())
  @@index([targetUserId])
  @@index([actorUserId])
}
```

### 2.1.1 `User` additive changes
- Add `currentProfileId Int?` + relation `currentProfile Profile? @relation("CurrentProfile", fields: [currentProfileId], references: [id], onDelete: SetNull)`.
- Add back-relations: `userProfiles UserProfile[] @relation("UserProfiles")`, `assignedProfiles UserProfile[] @relation("UserProfileAssignedBy")`.
- **Kept, never dropped** (migration/rollback + display): `role`, `profile` (string), `isPrimary`, `isSuperSales`, `subRoles`.

### 2.2 The current-profile-only rule (the deliberate divergence)

**Effective permissions = the codes of `user.currentProfile` ONLY.** Not the union of
all assigned profiles; not `role ∪ subRoles ∪ superSalesExtras` (today's formula). A
multi-profile user sees one profile's power at a time and **switches** to change it.

**Parity impact:** for any user who resolves to a single profile and has **no
subRoles**, the active code set is byte-identical to master → parity preserved. Behavior
changes ONLY for users who today depend on **subRole unions** (they switch instead of
holding both at once). The plan will quantify how many prod users have subRoles so the
blast radius is explicit; the divergence is intentional and recorded here + in the parity
matrix.

### 2.3 What happens to `role`
`role` is reduced to **display + rollback + profile→baseRole sync**. It **stops gating**;
admin-tier / object-scope power moves to `currentProfile.isAdminTier` (§4). `role` is kept
in sync when a profile is assigned (via `Profile.baseRole`), exactly as the string-column
design already does, so rollback to the old code is clean.

---

## 3. Resolution: token + cached profile map (zero per-request user DB read)

Chosen mechanism: **the JWT carries `currentProfileId`; a server-side cache resolves
that id → codes.** This keeps today's architecture (the auth middleware does **no** DB
read on the hot path).

### 3.1 `ProfilePermissionCache` (new — `server/src/infra/auth/profile-cache.js`)
- At boot, load every `Profile` → `{ id, key, isAdminTier, baseRole, codes: Set<string> }`
  into an in-process `Map` keyed by `profileId` (one query with `permissionLinks.permissionCode`).
- Expose `resolve(profileId) -> { permissions: string[], isAdminTier, baseRole, key } | null`.
- `reload()` / `invalidate()` — called after seed and after any profile-edit write. Profiles
  are few and stable, so the cache is tiny and rarely changes.
- Loaded via a repository (Prisma only in repos); the cache object is a thin infra singleton.

### 3.2 Token + middleware
- `toTokenPayload(user)`: embed `currentProfileId` (+ keep `id, email, name, role, isActive`
  for display/legacy). Stop embedding `subRoles`/`isSuperSales` **for resolution** (scope
  now comes from the profile).
- `requireAuth`: verify token → `currentProfileId` → `profileCache.resolve(id)` →
  `req.auth = { ...payload, permissions, permissionsByModule, isAdminTier, currentProfileId, currentProfileKey, baseRole }`.
  Still **zero DB hit** (cache lookup only). If `resolve` returns null (profile deleted),
  treat as unauthorized → forces a refresh.
- **`permissionsByModule`** is built by a **pure** shared helper `buildPermissionsByModule(codes)`
  (the module-grouping + `NAVIGATION_PERMISSION_ACTIONS` flag logic lifted out of the
  current `getEffectivePermissions`). Same output shape as today.

### 3.3 Staleness / invalidation
The access token trusts its `currentProfileId` for its TTL — **exactly** as today's token
trusts its embedded role/permissions. Propagation of changes:
- **Switch endpoint** re-mints access+refresh cookies immediately.
- **Refresh flow** (already re-reads the user from DB) re-validates that `currentProfileId`
  is still an assigned profile; if not, it falls back to a held profile (base-role profile,
  else first assigned) and re-mints.
- An admin removing a user's current profile therefore takes effect within one access-token
  TTL — the **same staleness contract as master**. No new `profileVersion` column is needed.

### 3.4 Shared helpers (stay pure, reused)
`splitPermissionCode`, `buildPermissionsByModule(codes)`, `buildNavigationTabs`,
`computeCapabilities`, `hasPermission` remain pure and are fed DB-sourced codes. The
code-defined `PROFILES`/`PROFILE_META`/`ROLE_PERMISSIONS`/`ALL_PERMISSIONS` are **retained
as the seed source** (§5) and rollback definition; they stop being the *runtime* source.

### 3.5 `/auth/me` contract (preserved + extended)
Unchanged keys the FE depends on: `id, email, name, role, permissions[], permissionsByModule{},
navigationTabs[], profile` (now = `currentProfileKey`). **Added:**
`profiles: [{ id, key, label, family, isAdminTier }]` (the user's assigned profiles) and
`currentProfileId`. Backward-compatible — no FE gating change required.

---

## 4. Scope follows the current profile

The two central admin-tier helpers change source only:
- `isAdminTier(authUser)` (`server/src/modules/users/user/user.dto.js:35`)
- `isAdminUser(authUser)` (`server/src/modules/projects/project/project.usecase.js:46`)

From `role==='ADMIN' || role==='SUPER_ADMIN' || isSuperSales` → **`Boolean(authUser.isAdminTier)`**
(sourced from `currentProfile.isAdminTier` by the middleware). Seed sets `isAdminTier=true`
for `ADMIN`, `SUPER_ADMIN`, and `SUPER_SALES` profiles (matching today's `isSuperSales`
admin-tier grant). All ~87 object-scope checker call sites consume `authUser`, so they
inherit the new source with **no per-site edits**. An Admin who switches to a Sales profile
drops to sales-level object scope — the switch is total and coherent.

---

## 5. Seed (registered as `prisma.seed`, idempotent)

The code-defined constants are the **seed source**; the DB is authoritative at runtime; an
admin-edit UI for profile contents is a **future phase**, not this one.

- **`PermissionCode`** ← `ALL_PERMISSIONS`: upsert by `code`, `module = splitPermissionCode(code).module`.
- **`Profile`** ← `PROFILE_META`: upsert by `key` (label, family, baseRole, `isAdminTier`
  derived = key ∈ {ADMIN, SUPER_ADMIN, SUPER_SALES}).
- **`ProfilePermission`** ← the code-defined `PROFILES` map: resolve each profile's codes to
  ids and **diff-sync** join rows (add missing, remove stale) inside a `$transaction`, so
  re-running makes the DB match the constants exactly. This is how a profile's contents are
  edited until an admin UI exists.

Seeds ONLY the catalog — never `UserProfile` or user data. Fully upsert-based (safe on prod).

---

## 6. User-migration (idempotent, prod-safe, no truncation)

New `deriveProfilesFromLegacy(user)` (extends the single-value `deriveProfileFromLegacy`):
returns `{ profiles: string[], current: string }` from `role` + `isPrimary` + `isSuperSales`
+ `subRoles`:
- base `role` → its profile (becomes `current`),
- each `subRole` → its profile,
- STAFF sales flags → NORMAL / PRIMARY / SUPER_SALES.

For each user: upsert a `UserProfile` per derived profile (on `@@unique[userId, profileId]`),
and set `currentProfileId` **only if null** (re-runs never clobber a user-switched or
admin-reassigned current). Purely additive — never deletes a `UserProfile`. Runs as a data
step / one-off script — **never a reset**.

The boot `runProfileBackfill` is **repointed** to this relational logic (idempotent), so it
also acts as an ongoing safety net for users missing assignments. The old string-column
backfill stays as dead-but-kept code for rollback.

---

## 7. Production rollout order (data before code; never reset)

1. **Migrate** — `prisma migrate deploy` ships the new tables + `User.currentProfileId`
   (nullable FK). The reconciled baseline `catch_up_full_schema` is handled with
   `prisma migrate resolve --applied` per `docs/superpowers/plans/prod-migration-runbook.md`.
   **Zero column drops.**
2. **Seed** — upsert PermissionCode / Profile / ProfilePermission (safe on prod).
3. **User-migration** — assign `UserProfile` + set `currentProfileId` (idempotent upsert).
4. **Deploy code** that resolves from `currentProfile` (cache + middleware + `toMe` + switch
   + admin assign). Steps 1–3 guarantee every user already has a current profile when it
   goes live.
5. **Rollback** = redeploy old code (reads role/JWT). Retained `role`/`profile`/`subRoles`
   columns make it a clean revert; data columns are never dropped.

Local dev may `prisma migrate dev` / reset freely (known gotchas: the ContractPaymentCondition
191-length fix, and the FK-naming drift between the reconciled baseline and the real DB → on
prod we resolve+deploy, never reset). This ordered checklist ships as a prod note next to the
runbook.

---

## 8. Backend surfaces (strict layering: route→controller→usecase→repo→validation→dto)

### 8.1 Self-service profile switch
`POST /v2/auth/profile/switch` `{ profileId }`:
- Verify the caller holds `profileId` in `userProfiles`; else `AppError(PROFILE_NOT_ASSIGNED, 403)`.
- Set `User.currentProfileId`, write `AuthAuditLog{ action: PROFILE_SWITCH }`, re-mint
  access+refresh cookies, return the `/auth/me`-shaped payload.

### 8.2 Admin assign / remove profiles
`PUT /v2/users/:userId/profiles` `{ profileIds: number[], currentProfileId?: number }`
(or granular `POST`/`DELETE /:profileId`):
- Gated by the existing `user.manage_roles` code + object-scope + admin-tier check.
- Repo diff-applies `UserProfile` rows; if the removed profile was the target's current,
  fall back to another held profile (base-role profile, else first assigned).
- Writes `AuthAuditLog{ action: PROFILE_ASSIGN | PROFILE_REMOVE }`.
- Keeps `role`/`isPrimary`/`isSuperSales` synced from the current profile's `baseRole`/meta
  (rollback safety), reusing the existing `applyProfileToBody` sync path.

### 8.3 New message codes
`PROFILE_NOT_ASSIGNED`, `PROFILE_NOT_FOUND`, `PROFILE_SWITCHED`, `PROFILES_UPDATED`
(language-neutral CODEs + Arabic resolution, per the message-code contract).

---

## 9. Frontend

- **`usePermission` / `PermissionGate` / capabilities — unchanged** (contract preserved).
- **`AuthProvider`** — read `profiles[]` + `currentProfileId` from `/auth/me` into context.
- **Profile switcher** in the dashboard AppBar (`web/src/app/(auth)/dashboard/(dashboard)/layout.jsx`
  ~`:643–658`, beside the role chip / existing `SignInWithDifferentUserRole`): a dropdown of
  `user.profiles`; on select → `POST auth/profile/switch` → refetch `/auth/me` → context
  updates → the whole app re-gates (nav, buttons, capabilities). Hidden/disabled when the
  user holds one profile.
- **Admin profile manager** — the Users page's single `profile` select / `RoleManagerDialog`
  (subRoles today) is replaced by a **multi-select of profiles + a "current" radio**, posting
  to §8.2. `web/src/app/helpers/permissionCodes.js` mirror is untouched.

---

## 10. Testing (Vitest)

- **Shared (pure):** `buildPermissionsByModule(codes)`; nav-from-codes.
- **Cache/resolver:** `profileCache.resolve(id)` returns correct codes + `isAdminTier`;
  middleware attaches them to `req.auth`.
- **Parity:** single-profile users → effective set == old formula (role×flag matrix, mirroring
  the existing parity test). Multi-profile → switching changes the set (assert the intended
  divergence).
- **Scope:** `isAdminTier` follows current profile (admin-on-sales-profile loses admin object
  scope).
- **Endpoints:** switch rejects an unheld profile + re-mints + audits; admin assign/remove
  authz + audit; **seed idempotency**; **user-migration idempotency + correctness**.

---

## 11. File/impact map (for the plan)

**Schema/DB:** `packages/db/prisma/schema.prisma` (5 new models + User fields); one additive
migration; `packages/db/prisma/seed.js` (new/registered); a user-migration script under
`packages/db/scripts/`.

**Shared:** `packages/shared/helpers.js` (extract `buildPermissionsByModule`; nav from codes);
`packages/shared/constants/access/profiles.js` (add `deriveProfilesFromLegacy`); keep
`permissions.constants.js` / `role-permissions.js` / `profiles.js` as seed source; barrel exports.

**Server:** `server/src/infra/auth/profile-cache.js` (new) + its repository; `auth.middleware.js`
(resolve via cache); `auth.dto.js` (`toTokenPayload`/`userAuthSelect`/`toMe` add profile data);
`auth.usecase.js` (login/refresh embed `currentProfileId`, refresh re-validates); new
`auth` switch route/controller/usecase; `users/user/*` admin assign-remove; `user.dto.js` +
`project.usecase.js` (`isAdminTier`/`isAdminUser` read `authUser.isAdminTier`); `server.js`
(load cache on boot; repoint backfill); new `AuthAuditLog` repo + message codes.

**Frontend:** `AuthProvider.jsx` (profiles into context); a `ProfileSwitcher` component in the
dashboard AppBar; Users-page admin profile manager (replaces `RoleManagerDialog` usage);
`permissionApi.js`/`usePermission.js` unchanged.

---

## 12. Non-goals (YAGNI)
- No `UserPermission` / direct per-user code grants (profiles only).
- No admin UI to edit a profile's **contents** (ProfilePermission rows) — seed/constants own
  that for now.
- No per-request DB permission read; no `profileVersion` column; no Redis on the auth hot path.
- No dropping of `role`/`profile`/`subRoles` columns (rollback safety).
