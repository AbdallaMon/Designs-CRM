# Profiles as the single source of truth (+ profile switcher rebuild)

**Date:** 2026-07-17
**Branch:** `feat/workstage-flow-redesign`
**Status:** Design — approved, pending implementation plan

---

## 1. Problem

Two problems, one root cause.

**Symptom (reported):** the tab/button that let a user change their profile/role
"disappeared".

**Investigation:** it did not disappear. `SignInWithDifferentUserRole`
(`web/src/features/users/UserRoles.jsx`) is still mounted in the dashboard toolbar
(`web/src/app/(auth)/dashboard/(dashboard)/layout.jsx:832`), ungated by permissions. It
returns `null` when the user holds `<= 1` profile:

```js
if (!Array.isArray(profiles) || profiles.length <= 1) return null;   // UserRoles.jsx:45
```

The admin account under test (`abdotlos60@gmail.com`) holds exactly **1** profile, so the
control correctly hides. What the user remembers is the pre-`421f5abb` control, which
fetched *every role in the system* from `shared/utilities/roles` and "switched" by writing
`localStorage.setItem("role", role)` — a client-side fake that desynced `user.role` from the
profile-derived `navigationTabs`/permissions and broke route access. It was removed
deliberately and is **not** coming back.

**Real bug (found during investigation):** `role` and the active profile are **two competing
sources of truth**, and they diverge the moment a user switches profile.

- `AuthUseCase.switchProfile` writes `currentProfileId` only; it never touches `User.role`
  (`server/src/modules/auth/auth.usecase.js:96`).
- `AuthSchema.toMe` returns the raw legacy column: `role: user.role` (`auth.dto.js:141`).
- The toolbar label reads that column: `roleLabel(user)` → `user.role`
  (`layout.jsx:552`).

Net effect: on a 2-profile account (`abdalle.webdev@gmail.com`, holds `DESIGNER_3D` +
`DESIGNER_2D`), switching 3D → 2D updates permissions and nav, but the chip still reads
**"3D Designer"**. Permissions follow the profile; the label follows the legacy column.

**Stated goal (user):** everything must depend on `currentProfile` + `profiles`. `role` and
`subRoles` are legacy and must stop being inputs.

---

## 2. Approach: derive, don't delete

Literal removal of `role`/`subRoles` was measured and rejected:

| Surface | Call sites |
|---|---|
| `server/src` reads of `role`/`activeRole` | 122 |
| `server/src` reads of `subRoles` | 64 |
| `web/src` role reads | 118 |
| `NAVIGATION` config | keyed on `allowedRoles` by design |
| Frozen contract tier | `contracts/services/contract-services.js` reads `.role` |
| Schema | `User.role` column + `UserSubRole` table |

~300 call sites, and it breaks three locked decisions: schema frozen (CLAUDE.md §2.2), PDF/
contract tier logic-frozen (§4), parity with `master` as baseline (rule 6). It would also
require a production migration.

**Key insight:** `role` is not purely legacy. Every profile carries a **`baseRole`**
(`Profile.baseRole`, a real `UserRole?` column — `schema.prisma:2408`). The role *concept*
already lives inside the profile model. What is legacy is **`User.role` being the source of
truth**, not the identifier.

So `role` becomes a **derived view** of `currentProfile.baseRole` rather than a stored input.
One change at the auth boundary; all ~240 downstream call sites keep their code but are now
fed by the active profile.

```
BEFORE — two sources, they disagree after a switch
  User.role column  ────────► role ──► nav / chip / 240 sites
  userProfiles      ────────► permissions

AFTER — one source; role is a VIEW of the profile
  userProfiles ─┬─► currentProfile ─┬─► permissions
                │                   └─► baseRole ──► role ──► nav / chip / 240 sites
                └─► profiles ──────────► switcher
```

### Parity evidence

Deriving `role` from `currentProfile.baseRole` equals the stored `User.role` **for every user
who has not self-switched since their last profile assignment** — which is every user in the
database today. Every row currently satisfies `User.role == Profile.baseRole` for its active
profile:

| id | email | role | profile key | baseRole | inSync |
|---|---|---|---|---|---|
| 2 | abdotlos60@gmail.com | ADMIN | ADMIN | ADMIN | ✅ |
| 3 | abdalla.webdev@gmail.com | STAFF | NORMAL_SALES | STAFF | ✅ |
| 4 | abdalle.webdev@gmail.com | THREE_D_DESIGNER | DESIGNER_3D | THREE_D_DESIGNER | ✅ |
| 5 | abdallamon165@gmail.com | STAFF | SUPER_SALES | STAFF | ✅ |
| 6 | info@abdallaabdelsabour.com | TWO_D_DESIGNER | DESIGNER_2D | TWO_D_DESIGNER | ✅ |

They are equal because the **admin** user-CRUD write-sync (§2.8-sanctioned,
`user.usecase.js:445` — `role: currentProfile.baseRole`) sets the column at profile-assignment
time. Crucially, the **self-service** `switchProfile` does **not** re-sync `role` — it writes
`currentProfileId` only (`auth.usecase.js:96`). So the two agree only until a user self-
switches, at which point the stored column goes stale and the derivation gives the correct
(switched) role. That divergence *is* the bug; the derivation is a no-op for un-switched users
and the fix for switched ones.

**Consistency with in-flight work (`user.repo.js`, uncommitted).** The same principle was just
applied to the directory/picker query: `findDirectory` now matches on
`userProfiles.some.profile.baseRole` instead of the write-synced `role` column alone
(`user.repo.js`, `matchClausesForRole`), so a 3D+2D designer stops appearing/disappearing from
pickers by switching profile. That change is **complementary and out of this spec's file set** —
this spec must not touch `user.repo.js`. Both changes share one thesis: `User.role` reflects the
*active* profile and is unreliable as an identity; the held profiles are the truth.

---

## 3. Scope

### 3.1 Backend — `server/src/modules/auth/auth.dto.js`

`toMe`: `role` and `activeRole` derive from the active profile's `baseRole`; `subRoles`
becomes `[]`.

```js
// role is now a VIEW of the active profile, not the legacy column.
// Fallback to the legacy column ONLY when the user holds no profile
// (0 users today; keeps unmigrated accounts from being locked out).
const derivedRole = baseRole ?? user.role;

return {
  ...
  role: derivedRole,
  activeRole: derivedRole,
  subRoles: [],
  profile: currentProfileKey,
  currentProfileId,
  profiles,
  ...
};
```

`baseRole` is already computed in `toMe` (`auth.dto.js:115`) as
`user.currentProfile?.baseRole ?? user.baseRole`.

`toTokenPayload`: same derivation — `role`/`activeRole` from the active profile's `baseRole`,
`subRoles: []`. The payload keeps `currentProfileId` + `profileIds` unchanged.

**⚠ Derivation must follow the RESOLVED `currentProfileId`, not `user.currentProfile`.**
`login` and `refreshTokens` call `resolveValidCurrentProfileId(user)` and may *correct* a
stale/dangling `currentProfileId` (`auth.usecase.js:44-48`, `:66-69`) — but the eagerly-loaded
`user.currentProfile` object still points at the **old** profile. Deriving `role` from
`user.currentProfile.baseRole` in that path would yield the wrong role. The derivation must
resolve `baseRole` for the *effective* id. Two options for the plan to pick:

- **(a)** Add `baseRole: true` to `USER_PROFILES_SELECT` (`auth.dto.js:15` — it currently
  selects `{id, key, label, family, isAdminTier}`, **no `baseRole`**) and look the id up in
  `user.userProfiles`. Keeps `auth.dto.js` free of cache imports.
- **(b)** Resolve via `profileCache.resolve(currentProfileId).baseRole` — the pattern
  `switchProfile` already uses (`auth.usecase.js:93`, `:108-113`).

`CURRENT_PROFILE_SELECT` already carries `baseRole` (`auth.dto.js:12`), so the uncorrected
path works either way; only the correction path needs this. Recommend **(a)**: it keeps the
DTO pure and the select is the natural place for the field.

**Note on `navRole`:** the existing `SUPER_SALES` special case
(`currentProfileKey === "SUPER_SALES" ? "SUPER_SALES" : baseRole`, `auth.dto.js:122-127`) is
**retained** — it is profile-driven, not legacy. The `SUPER_SALES` profile has
`baseRole = STAFF`, so nav needs the profile key to select the super-sales sidebar.

### 3.2 Backend — `packages/shared/helpers.js`

Execute the cleanup the file already documents ("removed once profiles are the sole source
in Phase 4", `helpers.js:38-43`):

- `getEffectivePermissions`: drop the `subRoles` union and the `isSuperSales` union
  (`helpers.js:65-73`). The resolved profile's codes become the sole source.
- `navRoleFor`: drop the `role === STAFF && isSuperSales → SUPER_SALES` legacy fallback
  (`helpers.js:177`). `user.navRole` (profile-derived) already wins when present.

Update the JSDoc on both (`helpers.js:34-56`, `helpers.js:192`) to stop advertising
`isSuperSales`/`subRoles` as inputs.

**Why removing the unions is safe — they cannot fire on any live path.** Verified:

- **Main request path never calls `getEffectivePermissions` at all.** `requireAuth` resolves
  permissions from the profile cache — `resolved.permissions`, sourced from the DB
  `ProfilePermission` links — and returns early (`auth.middleware.js:77-93`). This change does
  not touch those links, so every user's effective permissions are byte-identical.
- **`getEffectivePermissions` runs only in two fallback branches**
  (`auth.middleware.js:101`, `auth.dto.js:98`), both reached only when a token has no
  resolvable `currentProfileId` (unmigrated user / pre-profile token / deleted profile).
  0 such users today.
- **The `isSuperSales` union cannot fire even there:** `isSuperSales` is deliberately **not
  carried in the token** (`auth.dto.js:160-161`), and both fallbacks are fed the token
  payload. So the branch is unreachable in production regardless of the column's value.
  This matters because `abdallamon165@gmail.com` (id 5) **does** have `isSuperSales = 1` — its
  super-sales access comes from the `SUPER_SALES` profile's DB permission links, not from this
  union.
- **The `subRoles` union is fed by the token (which does carry `subRoles`), so it *could* fire
  in a fallback — but `UserSubRole` has 0 rows.** This is the one union whose safety rests on
  data rather than unreachability, and it is why the prod row-count check in §5 is required.

Removing the `isSuperSales` read here also *advances* CLAUDE.md §2.8, which permits exactly
two reads of the legacy flags (boot backfill + user-CRUD write-sync). This call site is a
third; deleting it brings the code back in line with the locked decision.

### 3.3 Frontend — new `web/src/features/users/ProfileSwitcher.jsx`

The profile chip **becomes** the switcher trigger. Replaces the current
`[chip] + [Switch role button]` pair, which say the same thing twice.

```
BEFORE                                AFTER
┌─ toolbar ───────────────────┐      ┌─ toolbar ───────────────┐
│ (Admin) [⇄ Switch role] │🔔 │      │ ( 🛡 Admin ⌄ )      │🔔 │
└─────────────────────────────┘      └─────────────────────────┘
  ^chip    ^button = same thing               │ click
                                              ▼
                                  ┌──────────────────────┐
                                  │ SWITCH PROFILE       │
                                  │ 🛡 Admin    ✓ active │
                                  │ 🎨 3D Designer       │
                                  └──────────────────────┘
```

- **Data source:** `profiles[]` from `/auth/me`, each `{id, key, label, family, isAdminTier}`
  (served by `profileCache.resolveMeta`, `server/src/infra/auth/profile-cache.js:41`).
  Label and family icon/colour come from there — **zero legacy reads**.
- **Behaviour:** caret + clickable menu only when `profiles.length > 1`; a plain static chip
  otherwise (single-profile users see a correct label rather than nothing — an improvement on
  today, where they see a chip fed by the legacy column).
- **Presentation:** MUI `Menu` anchored under the chip, caramel identity from
  `web/src/app/helpers/colors.js` (`primaryAlt` selected state, `border`, `shadow`). Family
  icon per row, check on the active one. No centered modal.
- **Switch:** `POST auth/profile/switch` → `refetchMe()`. Server contract unchanged — it
  already validates the target is held, audits `PROFILE_SWITCH`, and re-mints both tokens.
- **Fallback:** when `profiles` is empty (unmigrated account), fall back to today's
  `roleLabel(user)` output so nothing regresses.

### 3.4 Frontend — `layout.jsx`

- `roleLabel()` (`layout.jsx:552`) reads the active profile's label from `profiles[]` instead
  of `user.role`. Note that after §3.1 `user.role` is itself profile-derived, so this is
  belt-and-braces — but reading the profile's own `label` gives the better string
  (e.g. "Super sales" straight from `Profile.label`) and removes the hardcoded
  `STAFF → "Super Sales"/"Sales"` branch.
- `DrawerUserFooter` (`layout.jsx:729`) shares the same label, so drawer and chip agree after
  a switch.
- Swap the `SignInWithDifferentUserRole` import + render site (`layout.jsx:50`, `:832`) for
  the chip-based `ProfileSwitcher`; the standalone chip at `:820-831` is absorbed into it.

### 3.5 Delete

`web/src/features/users/UserRoles.jsx` — replaced, not kept alongside.

---

## 4. Explicitly out of scope

- **`User.role` / `UserSubRole` columns.** Not dropped. Schema stays frozen (§2.2); no
  migration; production untouched.
- **The frozen contract/PDF tier** (§4). `contracts/services/contract-services.js` keeps
  reading `.role` from the DB row directly and is unaffected by an auth-boundary derivation.
- **The boot backfill (`deriveProfilesFromLegacy`/`resolveProfileKey`) and the user-CRUD
  legacy write-sync.** These are the two sanctioned column reads under §2.8 and must keep
  working — the write-sync is what keeps the derivation a no-op.
- **`ProfileDialogTrigger` and `Logout`.** A full consolidated account menu was considered and
  rejected as a wider blast radius than the switcher warrants.
- **Stale-token propagation.** `/auth/me` is deliberately DB-free and builds `profiles` from
  the token's `profileIds` (`auth.middleware.js:80`). After an admin edits your profiles, your
  existing token is stale until refresh or re-login (`auth.usecase.js:71` re-mints from the
  DB). Forcing a refresh on admin save is a users-module change and is deferred.

---

## 5. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Prod has `UserSubRole` rows **and** users whose token hits the fallback branch → dropping the subRole union narrows access | **Medium** | **User must verify on prod before ship** (query below). Local DB has 0 rows. Needs *both* conditions to bite; if prod has rows, re-scope the union removal. |
| Prod has users with no profiles → derivation falls back / nav empties | **Medium** | **User must verify on prod** (query below). Local DB has 0 such users. The `?? user.role` fallback covers them and `navRoleFor` still returns the plain role — but this is the branch the subRole risk above also depends on. |
| Derivation reads a stale `user.currentProfile` on the correction path → wrong role in token | **Medium** | Real, and easy to get wrong. Resolve `baseRole` from the *effective* id — see the ⚠ note in §3.1. Cover with a test where the stored `currentProfileId` is dangling. |
| `User.role` drifts out of sync with `baseRole` for some account | Low | Verified `inSync` for all 5 local users (§2). The §2.8 write-sync maintains it. Add a test asserting the derivation. |
| `isSuperSales` union removal narrows super-sales access | **None** | Unreachable — the flag is not carried in the token; see §3.2. Permissions come from the profile's DB links, untouched. |
| Derivation changes observable behavior vs `master` | Low | Derived == stored for every user today (§2). Existing ~970-test suite is the parity gate. |

**Every residual risk is either a production data check the user runs, or covered by a test.
This design does not touch production.**

```sql
SELECT COUNT(*) FROM UserSubRole;
SELECT COUNT(*) FROM User u LEFT JOIN UserProfile up ON up.userId = u.id WHERE up.id IS NULL;
```

Both must return `0` for the design as written to be safe.

---

## 6. Testing

**Unit (backend)**
- `toMe` derives `role`/`activeRole` from `currentProfile.baseRole`, not `user.role` — assert
  with a fixture where the two deliberately disagree.
- `toMe` returns `subRoles: []` even when the input row carries subRole rows.
- `toMe` falls back to `user.role` when the user holds no profile.
- `toTokenPayload` derives the same way.
- **Correction path:** a user whose stored `currentProfileId` is dangling (not in their held
  set) and whose eagerly-loaded `user.currentProfile` points at that stale profile ⇒ the
  minted token's `role` reflects the **corrected** profile's `baseRole`, not the stale one.
  Guards the ⚠ trap in §3.1.
- `getEffectivePermissions` ignores `subRoles` and `isSuperSales`.
- `navRoleFor` returns `navRole` when present; no `isSuperSales` branch.
- **Regression for the reported bug:** `switchProfile` 3D → 2D ⇒ `toMe().role` becomes
  `TWO_D_DESIGNER` and `navigationTabs` follow. This test fails on today's code.

**Parity gate**
- Full existing suite (~970 tests) green.

**Frontend**
- `cd web && npx next build` (the `web/` eslint config is broken in this repo; build is the
  verification path).
- Manual: on `abdalle.webdev@gmail.com` (2 profiles) the chip shows a caret, the menu lists
  both, switching 3D → 2D updates chip + drawer + sidebar together. On a 1-profile account the
  chip renders static with no caret.

---

## 7. Files

| File | Change |
|---|---|
| `server/src/modules/auth/auth.dto.js` | Modify — derive `role`/`activeRole`; `subRoles: []` |
| `packages/shared/helpers.js` | Modify — drop subRole/isSuperSales unions + nav fallback |
| `web/src/features/users/ProfileSwitcher.jsx` | **Create** — chip-as-trigger switcher |
| `web/src/app/(auth)/dashboard/(dashboard)/layout.jsx` | Modify — `roleLabel` from profile; swap render site |
| `web/src/features/users/UserRoles.jsx` | **Delete** |
| `server/src/modules/auth/__tests__/*` | Add — derivation + switch regression tests |
| `packages/shared/__tests__/profiles.test.js` | Modify — drop union expectations |
