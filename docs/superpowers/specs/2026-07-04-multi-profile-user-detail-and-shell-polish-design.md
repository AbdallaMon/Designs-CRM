# Multi-profile user-detail page + dashboard-shell polish

**Date:** 2026-07-04
**Branch:** `frontend-redesign`
**Scope:** Frontend only (`web/`). No backend / auth / profile-logic changes.

Two focused UI tasks:
- **Task A** — polish the `/dashboard` shell (AppBar + SideNav), refine-in-place.
- **Task B** — rebuild the user-detail page (`/dashboard/users/:id`) to be multi-profile.

All new/changed UI **chrome** text is English. Backend-supplied data (e.g. Arabic
profile labels) is rendered as-is — this is not an Arabization/translation pass.

---

## Background: authorization is DB-relational

A user holds one or more **profiles** (roles) with one **active** profile.
`/auth/me` → `data.user = { id, name, email, role, profiles:[{id,key,label,family,isAdminTier}],
currentProfileId, permissions[], permissionsByModule{}, navigationTabs[] }`.

Gating uses `usePermission()` / `PermissionGate` against permission codes
(`USER_CODES.MANAGE_ROLES = "user.manage_roles"`, `MANAGE_AUTO_ASSIGNMENTS`), never role alone.

### Key backend reality (drives Task B data fetching)

Verified against `server/src/modules/users/user`:

| FE call | Backend | Returns |
|---|---|---|
| `admin/users/:id/profile` | `GET /v2/users/:id/profile` (self/admin scope) | full User row incl. `currentProfileId`, `isActive`, `lastSeenAt`, `maxLeadsCounts`, `maxLeadCountPerDay`, `telegramUsername`, `role`, `subRoles`, `isSuperSales`, `capabilities.canEditProfile` — **but NOT `userProfiles`** |
| `admin/users?filters={userId:id}` | `GET /v2/users/` (`user.list`) | one item via `MANAGEMENT_SELECT` incl. **`userProfiles:[{profileId,profile:{id,key,label}}]`** + `currentProfileId` + identity + `capabilities` |
| `admin/users/assignable-profiles` | `GET /v2/users/assignable-profiles` (`user.manage_roles`) | `{ items:[{id,key,label,family,baseRole}] }` |
| `PUT admin/users/:id/profiles` | `PUT /v2/users/:id/profiles` (`user.manage_roles`) | body `{ profileIds:number[]≥1, currentProfileId? }` |

**Conflict noted & resolved frontend-only:** the task assumed a by-id read returns
`userProfiles`; it does not. The held-profile set comes only from the **list filtered by
`userId`** (`user.repository.js` honors `filters.userId`). That list requires only
`user.list` (which any viewer reaching this page already holds) → **no backend change.**
Caveat: the management list excludes admin-tier rows and the viewer themselves; those aren't
reachable via the users-list "View" button, so the page degrades gracefully (identity from
`/profile`, a subtle "full role list unavailable" note) only for a directly-typed URL.

---

## Task A — dashboard shell polish (refine in place)

Files: `web/src/app/(auth)/dashboard/(dashboard)/layout.jsx`,
`web/src/app/UiComponents/utility/SideNav.jsx`,
`web/src/app/UiComponents/DataViewer/users/UserRoles.jsx` (the AppBar switcher).

**MUST NOT change:** the `navigationTabs`-driven nav (icon-by-key mapping, `resolveLinks`,
RouteGuard) — nav stays backend/profile-driven, no client role/localStorage logic.

- **AppBar** — normalize the right cluster spacing/alignment; keep a compact English role
  chip (current role) as the always-present role indicator; make the profile switcher
  compact + English; keep breadcrumb title, notifications, profile menu, logout. English
  aria-labels (hamburger).
- **SideNav** — keep collapsible rail + tooltips + mobile drawer + auto-open-active-section;
  add a clearer active affordance (inline-start accent border, RTL-safe `borderInlineStart`);
  English aria-labels/tooltips ("Open menu"/"Close menu"/"Expand"/"Collapse"); tidy spacing.
- **UserRoles.jsx** — English chrome ("Switch role" / "Choose your role" / "Current" /
  "Cancel"); compact trigger. Still hidden when the user holds ≤1 profile. Server-side switch
  via `auth/profile/switch` + `refetchMe()` unchanged.

## Task B — multi-profile user-detail page

Files: `web/src/app/(auth)/dashboard/(dashboard)/users/[id]/page.jsx` (thin wrapper) →
new `web/src/app/UiComponents/DataViewer/users/UserDetails.jsx` (client) +
new `web/src/app/UiComponents/DataViewer/users/UserProfilesPanel.jsx` (inline editor).
Add optional `hideIdentity` prop to `Dashboard.jsx` (default false → unchanged elsewhere).

**Data (in `UserDetails`):** `getData('admin/users', {filters:{userId}})` → row (userProfiles,
currentProfileId, identity, isActive, lastSeen) **merged with** `getData('admin/users/:id/profile')`
→ maxLeads*, capabilities. Expose `refetch()`; loading + `error` (getData surfaces denial reason) states.

**Overview tab**
- *Identity card:* avatar, name, email, telegram chip, **status** chip (Active/Banned),
  online/last-seen (`<LastSeen>`); admin edit-identity (reuse `EditModal`, gated by
  `capabilities.canEditProfile`).
- *Roles & profiles card:* all held profiles as chips, **active one clearly marked**; admins
  (`hasPermission(USER_CODES.MANAGE_ROLES)`) get an inline `UserProfilesPanel` (reveal-in-place,
  not a modal) to assign/remove + set active via `assignable-profiles` + `PUT :id/profiles`;
  on success **refetch** (not full reload), and `refetchMe()` if editing self.
- *Management tools card:* Project Auto-Assignments (self-gates on `MANAGE_AUTO_ASSIGNMENTS`);
  and for staff targets (role STAFF or STAFF subRole, mirroring the old page): Restricted
  Countries, Max-leads (×2), Commissions, "View current deals", Activity Logs. Reuse existing
  components (RestrictedCountries already normalizes its response to an array).

**Performance tab:** `<Dashboard staffId={id} staff={false} hideIdentity />` — the existing
per-user analytics, unchanged.

Tabs via MUI `<Tabs>` (local state). English chrome; `getData`/`handleRequestSubmit`,
`usePermission`/`PermissionGate`, AppForm/RHF for forms.

---

## Verification
`cd web && npx next build` (web eslint is broken — build is the check). Commit in two logical
chunks: (1) shell polish, (2) user-detail rebuild.
