# Design — Permissions parity with Transaction-app + always-visible denial reasons

- **Date:** 2026-07-01
- **Branch:** `frontend-redesign`
- **Status:** DRAFT — awaiting user review
- **Baseline (behavioral contract):** the **`master`** branch (deployed, working)
- **Reference approach to mirror:** `C:\coding\Transaction-app`

---

## 1. Goal

Make Dream Studio follow the same authorization approach as **Transaction-app**, end-to-end:

> permission codes → per-role profile ("which routes each employee can even see") → route guards on the permission code → object-scope **special checkers** on the route → a `usePermission`/nav layer on the frontend → and **every denial (redirect or in-place error) states the real reason**.

The **observable result must stay identical to `master`** (who can access what, per module, per role, with the same object-level scope). We are *not* redesigning access; we are (a) surfacing reasons, (b) building the frontend permission/nav layer, and (c) auditing the backend guards so they provably equal master.

## 2. Non-goals

- No Prisma schema change (schema is frozen; there are no permission tables — permissions are code-defined).
- No change to PDF generation (logic-frozen).
- No new access grants beyond what master allows (widening requires an explicit decision).
- Not rebuilding the backend permission system — it already exists and is ~90% wired; we extend and audit it.

## 3. Starting state (verified this session)

**Transaction-app (the pattern):** `module.action` permission codes → composable per-role profiles → `requirePermissions` + `requireSpecialChecker` (throw-on-deny) → `auth/me` returns `permissions[]` + `permissionsByModule{canView,canList,…}` + pre-built **`navigationTabs`** → frontend `usePermission` hook + sidebar renders `navigationTabs` → **rich `AppError`** carrying `code`, `translationKey`, `redirectTo`, `redirectText`, `reason`, `details.requiredPermissions`; the client shows the reason + a "back to …" action.

**Current branch — backend (mostly done):**
- Permission codes: `packages/shared/constants/access/permissions.constants.js` (24 modules).
- Per-role profiles: `packages/shared/constants/access/role-permissions.js` (all 9 roles; `SUPER_SALES_EXTRA_PERMISSIONS` for the `isSuperSales` flag; sub-roles unioned in `getEffectivePermissions`).
- Guards: `server/src/shared/middlewares/auth.middleware.js` — `requireAuth`, `requirePermissions(required[], anyOf[])`, `requireSpecialChecker(fn)`. ~279 route decls, ~99 special-checker uses.
- `auth/me` returns `permissions[]` + `permissionsByModule{module:[codes]}`.

**Current branch — gaps (this is the work):**
1. **Denials carry no reason.** `AppError(message, statusCode, details)` is bare; `error-handler.js` emits only `{success, message, details}` — no `code`/`translationKey`/`redirectTo`/`redirectText`/`reason`. `requirePermissions` throws a generic `FORBIDDEN` with **no `requiredPermissions`**.
2. **Frontend gates nothing.** No `usePermission`, no `PermissionGate`, no page-level guard. `AuthProvider` stores `permissions`/`permissionsByModule` but nothing consumes them. The `(dashboard)` layout redirects only when *not logged in*; a wrong-URL for a role renders the page then fails with a generic toast.
3. **No `navigationTabs`.** Nav is a hardcoded **role→links** map (`linksForRole` in `web/src/app/(auth)/dashboard/(dashboard)/layout.jsx`) — it already equals master's nav, but it is role-based, client-owned, and disconnected from the permission system.
4. **Backend guards unaudited vs master.** They *look* faithful (the code comments cite each legacy gate), but there is no proof-artifact that every role's route access + scope equals master, and there are documented intentional divergences (see §7).

**Master (the contract):** coarse role-tag gate `verifyTokenAndHandleAuthorization(req,res,next, "ADMIN"|"SHARED"|"STAFF"|"ACCOUNTANT"|<role>)` + object-scope in the service layer (own-leads, owned+unassigned pool, assigned-projects, accountant-sees-all, country restrictions). Frontend: **role→navLinks** map + parallel-route slots; denials are silent/generic ("Not authorized", blank slot). Per-role nav is fully captured (see appendix A).

## 4. Key architectural insight (drives the whole design)

**Backend API permission ≠ frontend nav visibility.**

On master the API gate was *broad* (`SHARED` = any authenticated role could *call* the leads/projects endpoints; only object-scope differed), but the *sidebar* was *narrowly curated per role*. Consequences the current code already reflects:
- `ACCOUNTANT` **holds** `lead.list` / `project.list` codes (API access was broad) — but master's accountant **sidebar** showed only Payments/Expenses/Rents/Salaries/Chat.

Therefore **`navigationTabs` cannot be derived from permission codes alone.** It must reproduce master's per-role curation. Master's sidebar was **purely role-driven**, so to stay byte-identical:

> **Primary rule (must match master):** a nav item is shown when **the user's role is in the item's `allowedRoles`**. This list is ported 1:1 from master / the current `linksForRole` (appendix A) and is the source of truth for visibility.
>
> **Optional guard (must NOT narrow below master):** an item MAY also declare a `requiredPermission` as defense-in-depth, but only where the `allowedRoles` already implies that permission — it may never hide an item the master sidebar showed. The per-role snapshot test (Phase 5) is the guarantee against accidental narrowing.

This mirrors Transaction-app's `allowedRoles + permission` shape while keeping master's role-driven output exactly. See the `SUPER_SALES`/Users nuance in §7.

## 5. Locked decisions

1. **Extend, don't rebuild.** Build on the existing `server/src` permission scaffold and `packages/shared` codes.
2. **Baseline = master.** Every change is verified to keep observable access identical to master (per role, per module, per scope).
3. **`navigationTabs` computed on the backend** (Transaction-app way), returned by `auth/me`, rendered by the frontend. Sidebar stops using the hardcoded `linksForRole` role map.
4. **Every denial states the reason.** Backend errors carry a machine `code` + human-resolvable `translationKey` + `reason` + (for permission failures) `details.requiredPermissions` + optional `redirectTo`/`redirectText`. The client always shows the reason; redirects are explained, never silent/blank.
5. **`AppError` stays backward-compatible.** We extend it additively (positional signature preserved) so the ~hundreds of existing `new AppError(code, status)` call sites keep working.
6. **Single Arabic message source** for `translationKey` resolution on the client (per project convention — no bilingual layer).

## 6. Architecture

### 6.1 Rich error/redirect contract (foundational — Phase 1)

**`server/src/shared/errors/AppError.js`** — additive, backward-compatible:

```js
export class AppError extends Error {
  // Legacy positional form still works: new AppError(code, 403)
  // New form adds a 4th options bag.
  constructor(message, statusCode = 400, details = null, options = {}) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
    this.code = options.code ?? message;          // machine code (message already IS a code here)
    this.translationKey = options.translationKey ?? null;
    this.redirectTo = options.redirectTo ?? null;
    this.redirectText = options.redirectText ?? null;
    this.dontRedirect = options.dontRedirect ?? false;
    this.reason = options.reason ?? null;          // human-facing "why", always set for denials
  }
}
```

**`server/src/shared/errors/error-handler.js`** — serialize the full envelope:

```js
return res.status(err.statusCode).json({
  success: false,
  message: err.message,          // code (unchanged key the FE already reads)
  code: err.code,
  translationKey: err.translationKey,
  reason: err.reason,            // <- the real cause, always present on denials
  redirectTo: err.redirectTo,
  redirectText: err.redirectText,
  dontRedirect: err.dontRedirect,
  details: err.details,          // e.g. { requiredPermissions: [...] }
  route: `${req.method} ${req.originalUrl}`,
});
```

**`requirePermissions`** — attach the cause:

```js
if (!ok) {
  return next(new AppError(authMessagesCodes.FORBIDDEN, 403, { requiredPermissions: required.length ? required : anyOf }, {
    reason: `Missing required permission(s): ${(required.length ? required : anyOf).join(", ")}`,
  }));
}
```

**Special checkers** already throw specific codes (e.g. `LEAD_ACCESS_DENIED`); Phase 3 enriches each with a `reason` + `redirectTo`/`redirectText` (e.g. "You can only open leads assigned to you", back to `/dashboard/leads`).

**Message-code additions:** any new reason strings live in `packages/shared/messages-codes/*` (codes) resolving to a single Arabic map on the client. No raw Arabic in the backend.

### 6.2 `auth/me` enrichment (Phase 2)

Extend the auth DTO/usecase so `auth/me` additionally returns:
- **`permissionsByModule`** upgraded from `{module:[codes]}` to also expose **action flags** (`{module: {canView, canList, canCreate, …}}`) via a `NAVIGATION_PERMISSION_ACTIONS` map (Transaction-app style) — keeping the raw code array too for direct checks. (Back-compat: existing consumers read the array; new consumers read flags.)
- **`navigationTabs`** — computed from a new **`NAVIGATION` config** in `packages/shared` (`{key, label, href, icon?, allowedRoles[], requiredPermission?, subLinks[]}`), filtered by `role ∈ allowedRoles` (primary rule) and the optional non-narrowing `requiredPermission` guard (see §4). The config is ported 1:1 from the current `linksForRole` sets (appendix A) so output is identical to master.

Computation is pure (a `buildNavigationTabs(user, effectivePermissions)` helper in `packages/shared/helpers.js`) and unit-tested per role.

### 6.3 Backend guard/profile audit vs master (Phase 3)

Module-by-module, produce a **master↔current parity table** proving, for each role:
- which routes it can reach (permission code present ⇔ master role-tag admitted it), and
- the object-scope rule matches master (own-leads / owned+unassigned / assigned-projects / accountant-all / admin-all / country restrictions).

Deliverable: `docs/superpowers/specs/permissions-parity-matrix.md` (the evidence). Fix any true mismatch (missing code, wrong scope, missing checker). Enrich each checker's thrown error with a specific `reason`.

Modules: auth, leads (+calls/meetings/price-offers/payments/files/notes/reminders), contracts, projects/tasks/updates/delivery, accounting, courses (admin+staff), image-sessions (admin+session), chat, telegram, users (directory/admin/self-profile), dashboard, notifications, calendar, questions, sales-stages, reviews, utilities, site-utility, admin-residual, staff, upload.

### 6.4 Frontend permission layer (Phase 4)

- **`usePermission()`** hook: `hasPermission(code)`, `hasAnyPermission([])`, `hasAllPermissions([])`, `hasAction(module, flag)` — reads from `AuthProvider`.
- **`<PermissionGate required|anyOf>`** component for action-level show/hide.
- **`ApiFetch` / `apiClient` error handling:** on `401` → redirect to `/login` (store return path) with a clear reason toast; on `403` → show the `reason` (resolved via `translationKey`) and, if `redirectTo` present and `!dontRedirect`, offer/perform the "back to …" navigation using `redirectText`. **No silent failures.** (Replaces today's generic "An error occurred while fetching …".)

### 6.5 Per-role navigation + page guards (Phase 5)

- **Sidebar** renders `user.navigationTabs` (from `auth/me`) instead of `linksForRole`. Output must be byte-identical per role to today (snapshot test) — i.e. identical to master.
- **Page-level route guard:** a small guard (in the `(dashboard)` layout or a shared `RouteGuard`) checks the current path against `navigationTabs`/permissions. If the user isn't allowed on that route, instead of rendering-then-failing, it shows an explicit **"You don't have access to X — <reason>"** screen and redirects to the user's default landing (their first `navigationTabs` entry), matching each role's master landing (e.g. accountant → Payments, contact-initiator → Leads). Keep the existing not-logged-in → `/login` redirect, but with a clear reason.
- Remove/retire the hardcoded role→links map once nav is server-driven (keep a thin fallback only if needed during rollout).

## 7. Known intentional divergences from master (NEED USER CONFIRMATION)

The migrated backend deliberately **tightened** a few things vs master. Under a strict "identical to master" reading these are behavior changes; all are security-positive. Recommendation: **keep them** (they only restrict/secure, and the frontend nav already matches). Please confirm during review:

1. **site-utility (PDF config + contract payment conditions + contract-utility):** master served these to *any authenticated role* (`SHARED`); current restricts to **ADMIN/SUPER_ADMIN**. The master sidebar already showed "Website utilities" only to admins, so the *nav* matches; only the raw API surface is tightened. → **Keep (recommended).**
2. **reviews OAuth callback:** master returned raw tokens in the response body; current returns only `connected:true`. → **Keep (recommended).**
3. **Object-scope checkers (IDOR fixes):** master's `/:id` sub-resource routes (leads, projects, contracts, image-sessions, questions, sales-stages, notifications, dashboard, self-profile) had **no** object-scope check; current adds throw-on-deny checkers. This *closes holes* without changing legitimate access. → **Keep (recommended).**
4. **Generic-model read/archive allow-lists:** master allowed open `prisma[model]` access; current adds allow-lists. → **Keep (recommended).**

If any of these must instead match master *exactly* (i.e. loosen back), that's a one-line note per item and we adjust the profile/guard.

**Nav nuance — `SUPER_SALES` + Users:** master's sidebar shows "Users" for the `SUPER_SALES` role (and `STAFF`+`isSuperSales`) purely by role, but the master *API* required the `isAdmin` union (role admin OR `isSuperSales` OR admin sub-role) — so a hypothetical flagless `SUPER_SALES` would see the link and get 403 on click. Per §4 the nav stays role-driven (shows Users for `SUPER_SALES`, matching master); we do **not** add a narrowing `requiredPermission` there. If in practice every `SUPER_SALES` also has `isSuperSales`, this is moot. **Confirm:** keep master's role-driven behavior (recommended) vs. hide Users when the user lacks user-management permission.

## 8. Phases (each independently planned, implemented, verified)

| Phase | Deliverable | Verify |
|---|---|---|
| **1. Error/redirect contract** | Rich `AppError` (back-compat) + error-handler envelope + `requirePermissions` reason + message codes | Existing calls still work; a 403 now returns `reason` + `details.requiredPermissions`; unit test |
| **2. `auth/me` enrichment** | `permissionsByModule` action-flags + `navigationTabs` + pure `buildNavigationTabs` helper | Per-role unit test: `navigationTabs` equals appendix-A sets exactly |
| **3. Backend audit vs master** | Parity matrix doc + fixed mismatches + enriched checker reasons | Matrix reviewed; targeted usecase/scope tests; no access widened |
| **4. Frontend permission layer** | `usePermission`, `PermissionGate`, `ApiFetch` reason/redirect handling | Denials show reason + explained redirect; no silent blanks |
| **5. Nav + page guards** | Sidebar from `navigationTabs`; route guard with explicit reason + role landing | Per-role nav snapshot identical to today; wrong-URL shows reason + redirects |

## 9. Global acceptance criteria

- For each of the 9 roles (and the `isSuperSales` flag + sub-roles), the set of reachable routes and the object-level scope is **identical to master** (proven by the Phase-3 matrix + tests), except the confirmed §7 divergences.
- Per-role sidebar is identical to today's `linksForRole` output (snapshot).
- **Every** denial — 401, 403 permission, 403 scope, wrong-route — shows the **actual reason** (resolved from `translationKey`) and, where applicable, an explained redirect. No silent blank pages, no generic "an error occurred".
- No Prisma schema change; no PDF behavior change; no TypeScript in app source.

## 10. Risks & mitigations

- **Changing `AppError` breaks call sites** → additive positional signature; run the suite; grep call sites.
- **`navigationTabs` drifts from master** → port `allowedRoles` 1:1 from appendix A; snapshot test per role.
- **Over-tightening via nav requiredPermission** → require only codes the role already holds under master; the `allowedRoles` list is the real curation.
- **Large surface** → strict phase order; each phase is behavior-preserving and independently verifiable; Phase 1 is the low-risk foundation.

## Appendix A — Master per-role navigation (the nav contract, from `linksForRole`)

- **ADMIN / SUPER_ADMIN:** Dashboard, Users, Leads, Deals (Current/On-hold/All), Work stages (All projects, Plan study, 3D, Final plan, Quantity, Archived, 3D Modification), Reports (Leads/Staff), Image sessions gallery, Calendar, Payments, Website utilities.
- **STAFF (sales):** Dashboard, Leads, Deals (Current/On-hold/All), Calendar, Payments.
- **STAFF + isSuperSales (Super Sales):** staff links + Users.
- **SUPER_SALES (base role):** same as Super Sales set (staff + Users).
- **THREE_D_DESIGNER:** Dashboard, Work stages (3D, Modification, Archived).
- **TWO_D_DESIGNER:** Dashboard, Work stages (Plan study, Final plan, Quantity, Archived).
- **TWO_D_EXECUTOR:** Leads, Work stage.
- **CONTACT_INITIATOR:** Leads.
- **ACCOUNTANT:** Payments, Operational Expenses, Rents, Salaries, Outstanding Payments (+ Chat via widget).

> Note: the current app also mounts Chat as a floating `ChatWidget` (not a sidebar item) and Notifications in the AppBar — available to all authed roles, matching master's SHARED chat/notifications.

## Appendix B — Roles & flags

`UserRole`: ADMIN, SUPER_ADMIN, STAFF, THREE_D_DESIGNER, TWO_D_DESIGNER, TWO_D_EXECUTOR, ACCOUNTANT, SUPER_SALES, CONTACT_INITIATOR.
Flags: `isSuperSales` (layers admin-tier codes via `SUPER_SALES_EXTRA_PERMISSIONS`), `isPrimary` (informational), `subRoles[]` (unioned in `getEffectivePermissions`), `isActive` (login gate), `notAllowedCountries` (lead country scope).
