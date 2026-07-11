# Lead access, profile signals & claim/kanban fixes — Design

**Date:** 2026-07-11
**Branch:** `feat/audit-log-sales-admin`
**Status:** Design (awaiting user approval)
**Related:** `2026-07-02-permission-profiles-design.md`, `2026-07-03-db-relational-permissions-design.md`, `permissions-parity-matrix.md`

---

## 1. Problem

A batch of related lead defects, all rooted in the sales-scoping logic still keying off the
legacy `isSuperSales` / `isPrimary` **boolean flags** on the user, while the system has moved to
a **profile** model (`SUPER_SALES`, `PRIMARY_SALES`, `NORMAL_SALES`, …) as the intended source of
truth.

Observed (production, non-admin roles):

1. **Preview → `LEAD_NOT_FOUND`.** Opening a NEW/unassigned lead returns a misleading 404.
2. **Error is invisible / not closeable.** The preview renders the failure as a bare container
   *outside* the dialog — no Close button, easy to miss.
3. **Super-sales assign.** A SUPER_SALES profile should assign/reassign a lead like an admin, and
   for NEW leads needs an assign entry point reachable *without* opening the lead.
4. **"Start a deal" → `VALIDATION_ERROR` (`userId` must be > 0).** Self-claim fails validation.
5. **Claim should move NEW → IN_PROGRESS** (and leave any non-NEW status unchanged).
6. **Super-sales can't see all deals/leads** — only their own.
7. **Kanban `columns` → 500** on every column when no `filters` param is sent.

### Owner's directive

> No reliance on `isSuperSales` / `isPrimary` in our logic. These become **profiles**
> (`SUPER_SALES`, `PRIMARY_SALES`). The account backfill is my responsibility; everything relies
> on the profiles.

---

## 2. Key finding — the migration infra already exists

The feared "very big task" (new profile + prod account migration) is **already built**:

- **`PRIMARY_SALES` profile is defined and seeded.** `PROFILE_META.PRIMARY_SALES`
  (`packages/shared/constants/access/profiles.js:60`, `baseRole: STAFF`) is seeded as a real
  `Profile` row by `packages/db/prisma/seed.js` (it iterates all of `PROFILE_META`), with its
  permissions diff-synced (`PROFILES.PRIMARY_SALES = NORMAL_SALES ∪ LEAD_SECTION_PRIMARY`).
- **The account backfill exists, is idempotent/prod-safe, and runs at boot.**
  `runUserProfileMigration` (`packages/db/scripts/migrate-users-to-profiles.js`) derives the
  profile set from `role + isPrimary + isSuperSales + subRoles` via `deriveProfilesFromLegacy`,
  upserts `UserProfile` rows, and sets `currentProfileId` **only when null**. It is invoked at
  server boot (`server/src/server.js:26`, `runProfileBackfill`). So on every prod deploy, existing
  accounts are migrated automatically: `isSuperSales → SUPER_SALES`, `isPrimary → PRIMARY_SALES`,
  else `NORMAL_SALES` for STAFF.
- **The auth boundary already resolves the active profile.** `requireAuth`
  (`server/src/shared/middlewares/auth.middleware.js`) resolves `currentProfileKey`, `baseRole`,
  `isAdminTier`, `permissions` from the token's `currentProfileId` via the in-process profile
  cache.

**Therefore the remaining work is a code refactor, not a data/infra build:** switch our *logic*
from reading the flags to reading the resolved profile — plus the 7 fixes.

---

## 3. Decisions (from owner)

| # | Decision |
|---|---|
| D1 | Preview shows a **meaningful, closeable** message + CTA; details stay hidden until the lead is claimed. |
| D2 | Profiles are the **sole source of truth**. No reliance on `isSuperSales`/`isPrimary` in our logic. |
| D3 | External assign/claim action lives on the **New Leads list card**. |
| D4 | **Profiles only, no transition shim.** Deploy is gated on the owner running the backfill (which also runs at boot). Un-migrated sessions are explicitly out of concern. |

The legacy flag *columns* remain in the schema (owner's call); they are simply **no longer read by
our logic**. They still feed the boot backfill's derivation — that is their only remaining role.

---

## 4. Design

### 4.1 Profile signals (replace all flag reads in the leads module)

Because the boot backfill guarantees every user has a `currentProfileId`, `authUser.currentProfileKey`
and `authUser.isAdminTier` are reliably populated. We introduce three small, well-named signals and
replace every `authUser.isSuperSales` / `user.isPrimary` read in the leads module with them.

Add to `lead.usecase.js` (and mirror the two the repo needs into `lead.repo.js`):

```js
// Admin-tier lead operator: ADMIN / SUPER_ADMIN / SUPER_SALES profiles (profile-authoritative).
isAdminUser(authUser) {
  return Boolean(authUser?.isAdminTier);
}
// Full read-scope over ALL leads (not just owned/claimable).
#isSuperSalesScope(authUser) {
  return authUser?.currentProfileKey === "SUPER_SALES";
}
// Primary-tier lead visibility carve-out (SUPER_SALES ⊇ PRIMARY_SALES).
#isPrimaryScope(authUser) {
  return authUser?.currentProfileKey === "SUPER_SALES" ||
         authUser?.currentProfileKey === "PRIMARY_SALES";
}
```

Repo `hasFullScope` / `buildAuthUserLeadWhere` switch from `isSuperSales` to a
`currentProfileKey`-based predicate (accepting the same authUser shape).

**Read-mapping table (leads module):**

| Location | Was | Becomes |
|---|---|---|
| `lead.usecase.js` `isAdminUser` | `role ∈ {ADMIN,SUPER_ADMIN} ‖ isSuperSales` | `authUser.isAdminTier` |
| `lead.usecase.js` `columns()` self-scope + `isAdmin` | `!isSuperSales` / `Boolean(isSuperSales)` | `!#isSuperSalesScope` / `#isSuperSalesScope` |
| `lead.usecase.js` `deals()` self-scope guard (**bug #6**) | `role !== "SUPER_SALES"` | `!#isSuperSalesScope(authUser)` |
| `lead.usecase.js` `#getDetail` privileged + carve-outs | `isSuperSales` | `#isSuperSalesScope` |
| `lead.usecase.js` `#getStaffDetail` primary carve-out | `!user.isPrimary` | `!#isPrimaryScope(user)` |
| `lead.assign-status.usecase.js` (`user.isPrimary` read) | `isPrimary` | profile-key equivalent |
| `lead.repo.js` `hasFullScope` | `isSuperSales` | `currentProfileKey` predicate |
| `lead.dto.js` `computeLeadCapabilities` | `isSuperSales` | `isAdminTier` / `currentProfileKey` |

> **Note on `deals()`’ verbatim-legacy `isAdmin` expression** (`role !== "SUPER_SALES"`): it is left
> intact — for a SUPER_SALES *profile* (baseRole STAFF) it already evaluates truthy, giving them the
> admin aggregation path. The only bug is the *self-scope* guard above, which we fix.

**Scope boundary:** this pass refactors the **leads module** (where all 7 defects live). Other
modules and display-only DTOs that still surface the flags (`projects`, `dashboard`,
`image-sessions`, `auth.dto` display fields, tests, …) are a **tracked follow-up sweep** listed in
§7 — not required for these fixes, and lower-risk since the boot backfill already makes profiles
authoritative for every user.

### 4.2 Fix #7 — Kanban `columns` 500

`getClientLeadsColumnStatus` (`lead.assign-status.usecase.js:371`): default `filters` to `{}` so the
later non-optional reads (`filters.id`, `filters.contractLevel`) never dereference `undefined`.

```js
const filters =
  (searchParams.filters && searchParams.filters !== "undefined" && JSON.parse(searchParams.filters)) || {};
```

No other logic change — behavior with a real `filters` payload is unchanged.

### 4.3 Fix #4 — "Start a deal" self-claim validation

**Root cause:** the FE self-claim buttons (`createADeal(lead)` in `LeadSliderCard.jsx`,
`LeadDialogHeader.jsx`, `MoreActionsMenu`, `PreviewLeadDialog.jsx`) POST the **entire lead object**.
For a NEW lead `lead.userId` is `null`, which the assign schema coerces to `0` and rejects with
`positive()` → `VALIDATION_ERROR (userId > 0)`.

**Backend (robust, covers all call sites):** in `lead.validation.js`, preprocess `userId` so an
absent/empty/non-positive value becomes `undefined` (self-claim), keeping the admin
`assign-to-other` path (a real positive id) intact:

```js
static assign = z.object({
  id: z.coerce.number().int().positive(),
  userId: z.preprocess(
    (v) => (v === "" || v === null || Number(v) <= 0 || Number.isNaN(Number(v)) ? undefined : v),
    z.coerce.number().int().positive().optional(),
  ),
}).passthrough();
```

The usecase already treats `userId == null` as self-claim (`assign()`), so no usecase change.

**Frontend (tidy):** self-claim buttons send `{ id: lead.id }` instead of the whole lead. The
backend preprocess is the authoritative fix; the FE tidy avoids shipping irrelevant fields.

### 4.4 Fix #1/#2 — meaningful, closeable preview error

**Backend:** add a new message code `LEAD_CLAIM_REQUIRED` (`packages/shared/messages-codes/leads/leads.js`).
In `#getStaffDetail`, when the detail query returns nothing, distinguish the cases instead of a blanket
`LEAD_NOT_FOUND`:

- Lead exists but is **NEW / unassigned** (the claimable pool the view-gate allowed) → throw
  `AppError(LEAD_CLAIM_REQUIRED, 409)` with a `reason` + redirect metadata describing "claim as a deal".
- Lead exists but is **owned by another** user → throw `AppError(LEAD_ACCESS_DENIED, 403)`.
- Genuinely missing → keep `LEAD_NOT_FOUND` (404).

Detection uses the already-available `findUnassignedNew` / `findOnHoldOwner` repo reads (no extra
round-trips beyond what the method already does). The gate `checkIfUserCanAccessLead` is unchanged
(it correctly allows the claimable pool for the *preview* surface).

**Frontend (`PreviewLead.jsx`):**
- `getData` must surface the error envelope (code + resolved message + redirect meta) to the
  component, not silently drop it. Capture it into local state.
- Render the not-allowed / claim-required state **inside** the `Dialog` (modal mode) with a **Close**
  button — never as a bare container. In page mode keep the inline card, also with the resolved copy.
- Show the resolved message via `describeApiError`/`resolveMessage`; when the code is
  `LEAD_CLAIM_REQUIRED` and the viewer can claim, render a **Start Deal** CTA (same
  `createADeal({ id })` path) that, on success, re-opens the lead.

Add the FE resolution for `LEAD_CLAIM_REQUIRED` in `web/src/app/helpers/messages/maps/leadsMessages.js`.

### 4.5 Fix #6 — SUPER_SALES sees all deals/leads

Covered by §4.1: `deals()` self-scope guard becomes `!#isSuperSalesScope(authUser)`, matching
`columns()` and `getById`. A SUPER_SALES profile is then no longer self-scoped and receives the full
aggregation.

### 4.6 Fix #3 — external assign/claim on the New Leads card

On the New Leads list card (`web/src/features/leads/pages/NewLeadsPage.jsx` / its card):
- For `ASSIGN_OTHER` holders (admin / super-sales) → an **Assign** action (reuse
  `AssignNewStaffModal`, relabelled for the NEW-lead case) to assign to a staff member without
  opening the lead.
- For a non-admin staff member who can claim → a **Start Deal** action (self-claim `{ id }`).

Gating is permission/profile-based (`usePermission(LEAD_CODES.ASSIGN_OTHER)`), consistent with the
existing in-detail modal.

### 4.7 Fix #5 — NEW → IN_PROGRESS

No change required: `assignLeadToAUser` already sets `status: NEW|ON_HOLD → IN_PROGRESS`, else keeps
the current status (`lead.assign-status.usecase.js:105`). Covered by a verification test only.

---

## 5. Error contract additions

| Code | HTTP | Meaning | translationKey / redirect |
|---|---|---|---|
| `LEAD_CLAIM_REQUIRED` | 409 | Lead is NEW/unassigned; must be claimed as a deal to view details | `reason` + `redirectText` "Start deal"; `dontRedirect` handled by FE CTA |

`LEAD_ACCESS_DENIED` (existing) is reused for the owned-by-another case. Envelope shape unchanged
(`{ success, message, data, translationKey, reason, redirectTo, redirectText, dontRedirect }`).

---

## 6. Testing

**Backend (usecase / validation):**
- `columns()` with **no** `filters` param → no 500, returns columns (regression for #7).
- assign schema: `userId` absent / `null` / `0` / `""` → parses as self-claim; a real positive id →
  assign-to-other (regression for #4).
- `#getStaffDetail`: NEW/unassigned → `LEAD_CLAIM_REQUIRED` 409; owned-by-another → `LEAD_ACCESS_DENIED`
  403; missing → `LEAD_NOT_FOUND` 404 (#1).
- `deals()` scope: SUPER_SALES profile is **not** self-scoped; NORMAL_SALES **is** (#6).
- Profile signals: `#isSuperSalesScope` / `#isPrimaryScope` / `isAdminUser` resolve off
  `currentProfileKey` / `isAdminTier` (D2).
- assign on a NEW lead → status becomes `IN_PROGRESS`; on a non-NEW lead → unchanged (#5).

**Frontend:**
- Preview modal renders the claim-required / access-denied state inside a closeable dialog with the
  resolved copy + Start Deal CTA when claimable (#1/#2).
- New Leads card shows Assign (admin/super-sales) vs Start Deal (claimant) (#3).

**Parity:** re-run the permissions parity matrix; confirm 0 new mismatches. Super-sales/primary
authorization must remain equivalent to master (now expressed via profiles rather than flags).

---

## 7. Scope boundaries & follow-up

**In scope (this spec):** the leads module refactor to profile signals, the 7 fixes, the new
message code + FE resolution, the New Leads card action, and the tests above.

**Explicit non-goals / tracked follow-up:**
- **Codebase-wide flag purge.** ~50 server + ~27 web files still read `isSuperSales`/`isPrimary`
  (many are tests or display-only DTOs). Sweeping `projects`, `dashboard`, `image-sessions`,
  `auth.dto` display fields, FE role helpers, etc. onto profile signals is a separate cleanup — the
  boot backfill already makes profiles authoritative for every user, so this is low-risk hygiene, not
  a correctness gap. Track as "flags→profiles sweep (phase 2)".
- **Removing the legacy flag columns from the schema.** Owner has chosen to keep them; out of scope.

---

## 8. Risks

- **Parity drift** if a profile signal doesn't perfectly reproduce a flag read. Mitigation: the
  read-mapping table (§4.1) is 1:1; parity matrix + scope tests gate it.
- **Preview data leakage.** The claim-required path must not return lead *details* — only the
  domain error. Mitigation: the error is thrown before any detail payload is returned; FE shows copy
  only.
- **`getData` behavior change.** Surfacing the error envelope must not regress other callers.
  Mitigation: additive (return the error object) without changing the 200 path.
