# Navbar Drawer (SideNav) Consistency Pass — Design

**Date:** 2026-07-12
**Status:** Approved by user (full consistency pass + identity-only footer)
**Scope:** `web/src/shared/components/utility/SideNav.jsx` + `web/src/app/(auth)/dashboard/(dashboard)/layout.jsx`. Frontend-only; no API/backend change.

## Problem

The dashboard side drawer is functional but visually inconsistent:

1. **Icon collisions** — "Deals", "Work stages", and "Payments" all render `FiDollarSign`; every work-stage sub-link renders `FiBriefcase`. Icons carry no scanning value.
2. **Flat structure** — standalone links and collapsible sections mix in one list with no grouping, so long role menus (admin) read as a wall.
3. **Broken sub-link indent** — sub-items use `ms`/`me` sx shorthands that MUI does not support (silently ignored), then `mx: 0` — so sub-links are not actually indented.
4. **Mixed metrics** — sub-link icon size props vary (18/20), and there is no drawer footer; user identity lives only in the AppBar.

## Decision

Presentation-only redesign. The backend `navigationTabs` (from `/auth/me`) stays the single source of truth for **which** links exist (parity with `RouteGuard` preserved). The client adds a display-grouping layer keyed by tab `key`.

Rejected alternative: adding a `section` field to backend `navigationTabs` — an observable contract change (mirror + document) for a purely visual feature.

## Design

### 1. Grouped sections (client map in `layout.jsx`)

`SECTION_BY_KEY` assigns each `navigationTabs.key` to a display group; groups render in a fixed order — Overview → Sales → Projects → Finance → Admin (day-to-day work first, admin utilities last; user decision 2026-07-12). Links inside a group keep their backend order:

- **Overview**: `dashboard`, `command-center`
- **Sales**: `leads`, `contact-initiator-leads`, `executor-leads`, `deals`
- **Projects**: `work-stages`, `image-sessions`, `calendar`, `executor-work-stage`
- **Finance**: `payments`, `accountant-payments`, `operational-expenses`, `rents`, `salaries`, `outcome`
- **Admin**: `users-admin`, `users-super-sales`, `reports`, `website-utilities`
- Unknown keys fall back to a **General** group.

Rendering: small uppercase overline label above each group, shown **only when the role has ≥ 2 groups** (an accountant with only Finance links sees no redundant label). In the collapsed rail, labels become thin dividers between groups.

`SideNav` receives `groups` (`[{ key, label, items }]`) instead of a flat `links` prop, plus an optional `footer` ReactNode. The flat list is still derived in the layout for the AppBar breadcrumb (`resolveCurrentPage`), unchanged.

### 2. Distinct icons (`ICON_BY_KEY` in `layout.jsx`)

- `work-stages` → `FiLayers` (was `FiDollarSign`)
- `payments`, `accountant-payments` → `FiCreditCard` (was `FiDollarSign`)
- `website-utilities` → `FiGlobe` (was `FiHome`, colliding with `rents`)
- `salaries` → `FiUserCheck` (was `FiUsers`, colliding with users links)
- Everything else unchanged, including the designer-dashboard `FiTarget` exception (parity).

The legacy exported link arrays (`adminLinks` etc.) are untouched — they are the dev role-override fallback shape, not the live nav.

### 3. Sub-links as a tree

Sub-items drop their per-item icons (7 identical briefcases add nothing). Instead: an indented container with a vertical guide line (`borderInlineStart`, RTL-safe CSS logical properties with explicit px — **not** the unsupported `ms`/`me` sx shorthands), each row a 36px-tall button with a small dot marker (muted; primary-colored + bold text when active). `SUB_ICON_BY_HREF` / `resolveSubIcon` are removed.

### 4. Unified metrics

Top-level items: 44px min-height, icon 20, radius 2, same paddings collapsed/expanded. Sub-items: 36px. Active treatment everywhere = soft `primaryAlt` background + inline-start `primary` accent bar (top-level) / dot (sub-level).

### 5. Identity footer

Pinned to the drawer bottom (above nothing — replaces the current dangling bottom `Divider`): avatar with initials + user name + role label. Clicking opens the existing `ProfileDialog` with the same `profileOpen` query-param behavior as the AppBar trigger (which stays untouched). Collapsed rail: avatar only, with tooltip. Implemented as a small `DrawerUserFooter` component in `layout.jsx` (it needs `ProfileDialog` from `features/users`, which `SideNav` — a shared utility — must not import); passed into `SideNav` via the `footer` prop.

## Out of scope

- Label typos ("Modifcation", "Quantity calcualtion") come from backend `navigationTabs` labels and exist in master; fixing them is a contract change needing a separate decision.
- Dead code in `layout.jsx` (`mapLegacyLink`, `isRoleOverrideActive`, legacy link arrays) — left as-is.

## Verification

`cd web && npx next build` (repo's eslint config is broken; build is the verification gate). Manual pass over roles via the dev role-switcher for grouping sanity.
