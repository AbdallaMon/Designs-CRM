# Frontend Migration Plan — Dream Studio (DMS)

> **⚠️ Resolved decisions override this doc — see [`07-decisions-resolved.md`](07-decisions-resolved.md).** Notably: API base is permanently `/v2` (no flip); permissions emit real `permissions[]` from FE-auth phase (no role fallback); booking-lead submit is `POST /:leadId/actions/submit`; client flows live in this app under `(public)`; **phase order re-sequenced so each FE feature trails its BE module** (see 07 §5).

> Companion to `01-current-audit.md` (current state) and `02-reference-patterns.md`
> (target patterns from `Cases-Digital-Assets-Managment`). This document plans the
> **frontend** migration only. The backend plan is tracked separately; where the two
> meet (endpoints, message codes, permission codes) this doc states its assumptions
> explicitly so the reconciliation reviewer can cross-check against the backend's
> "API CONTRACT INDEX".
>
> **Status:** PLAN ONLY. No source files are created/moved/modified by this document.
> Date: 2026-06-06 · Branch: `server-migration`

---

## 0. Executive summary & principles

The current frontend (`ui/`) is a Next.js 16 App Router app with two coexisting
layers: a large legacy tree (`ui/src/app/UiComponents/*`, role-sliced dashboard under
`ui/src/app/(auth)/dashboard/(dashboard)/@<role>/*`) and a maturing but partial v2
seed under `ui/src/app/v2/*` (features, hooks, lib, providers, shared). We will
**continue from the v2 seed**, reorganize it to match the reference frontend shape
(`features/<x>` + `features/<x>Details` with a `config/` folder; shared `hooks/`,
`lib/`, `providers/`, `config/`), and migrate the app **route-by-route** under a
strangler-fig strategy.

### Principles (non-negotiable)

1. **Strangler, not big-bang.** Legacy pages and new feature pages coexist in one
   Next app until each route is cut over. A migrated route stops importing
   `UiComponents/*`; an un-migrated route keeps working untouched. No route is
   half-migrated in `master`.
2. **Behavior preserved.** Same screens, same data, same backend calls. The FE keeps
   talking to the backend exactly as today. Where the **backend plan** changes an
   endpoint/contract, this FE plan mirrors it (see §11 for the assumed endpoint set
   per feature, used for reconciliation).
3. **One data layer.** All reads/writes go through `useRequest` / `useMultiRequest`
   over the single `ApiFetch` wrapper. No component calls `fetch` or the api client
   directly. Ad-hoc fetching (legacy `getData`/inline `fetch`) is retired per route.
4. **Config-driven lists.** Columns and filters live in `config/<feature>Columns.js`
   and `config/<feature>Filters.js`; the page wires `DataTable` + `useRequest`. No
   inline column arrays in pages.
5. **Permission-gated UI.** Every action is gated with `usePermission`
   (`hasPermission(CODE)` / `hasAnyPermission`) combined with the record's
   `capabilities.*`. No role-only gating. The server remains the source of truth; UI
   gating is cosmetic.
6. **Single language (Arabic, RTL).** Drop the hand-rolled bilingual dictionary +
   `LanguageSwitcher` toggle. Keep RTL theming (stylis-plugin-rtl + emotion cache)
   and add a correct `<html lang="ar" dir="rtl">`. Backend message **codes** still
   resolve through one Arabic lookup map (indirection kept, second language dropped).

### Recommended final folder name

**Adopt `web/` to match the reference monorepo, but defer the physical rename to the
last phase.** Rationale: the audit shows the backend already lives in `server/` and
the reference uses npm-workspaces `["packages/*", "web", "server"]`. Renaming `ui/` →
`web/` is a mechanical move that touches Next config, import aliases (`@/app/...`),
Dockerfiles, and CI. Doing it early would churn every in-flight branch. Plan: build
the new structure **inside `ui/src/`** (promoting `ui/src/app/v2/*` up to
`ui/src/features`, `ui/src/hooks`, etc.), keep `ui/src/app/` as App-Router segments
only, and perform the `ui/ → web/` directory rename + workspace wiring as the final
cutover step (§7, Phase 8). Until then all paths in this doc use `ui/src/`.

---

## 1. Target frontend layout

Mirror of the reference `web/src/` shape, seeded from today's `ui/src/app/v2/`.
Promote feature/infra code **out of** `app/` so `app/` holds route segments only.

```
ui/                                  # → renamed to web/ in the final phase
  next.config.*  jsconfig.json       # @ alias retargeted to ui/src (then web/src)
  src/
    app/                             # App Router: SEGMENTS ONLY (layouts + page shells)
      layout.js                      # <html lang="ar" dir="rtl">; root providers
      (auth)/
        login/page.jsx               # thin: renders features/auth LoginPage
        reset/page.jsx
        dashboard/
          layout.jsx                 # dashboard shell (nav from permission map)
          leads/page.jsx             # renders features/leads list page
          leads/[id]/page.jsx        # async params (Next 16) → leadsDetails
          contracts/page.jsx
          contracts/[id]/page.jsx
          image-sessions/page.jsx
          image-sessions/[id]/page.jsx
          chat/page.jsx
          projects/...  tasks/...  payments/...  users/...  accounting/...
      (public)/                      # client-facing flows (booking, client contract, client session)
    features/
      auth/                          # (already seeded) service/validation/constants/components/pages/hooks
        config/  components/  pages/  hooks/
      leads/
        config/{constant.js, leadsColumns.js, leadsFilters.js, fields.js}
        components/{CreateLead.jsx, ...}
        pages/{LeadsListPage.jsx}
      leadsDetails/                  # detail screen is its OWN feature folder
        config/  components/{tabs/*}  pages/{LeadDetailsPage.jsx}
      contracts/        contractsDetails/
      imageSessions/    imageSessionsDetails/
      chat/             # chat is a single rich feature (not list+details)
      projects/         projectsDetails/
      tasks/            tasksDetails/
      payments/         accounting/
      users/            usersDetails/
      websiteUtilities/ courses/ calendar/ notifications/
    shared/
      components/
        tables/DataTable.jsx PaginationWithLimit.jsx
        forms/{AppForm.jsx, FormDialog.jsx, PageHeader.jsx, rhf/*}
        display/{StatusChip.jsx, ...}
        feedback/{Toast.jsx, LoadingOverlay.jsx, UploadOverlay.jsx}  # already seeded
        index.js                     # barrel
      workflow/                      # cross-feature action dialogs/menus (status actions)
      data/messages.js               # single-language Arabic message-code → string map
    hooks/
      request/{useRequest.js, useMultiRequest.js}
      socket/{useSocket.js, useSocketEvent.js}
      usePermission.js
      useDebounce.js useLoading.js useOverlay.js useToast.js useUpload.js
    lib/
      api/{ApiFetch.js, handleRequestSubmit.js, getData.js, getDataAndSet.js}
      config.js  constant.js  toast/
    providers/
      AppProviders.jsx               # composes the set (see §3)
      AuthProvider.jsx ThemeProvider.jsx ToastProvider.jsx
      SocketProvider.jsx UploadingProvider.jsx theme.js
    config/
      permissions.js                 # FE mirror of backend permission codes
      navigation.js                  # permission-gated dashboard nav map
      constants.js
    utils/helpers.js                 # (fix typo from v2/utlis)
```

Notes:
- The typo folder `ui/src/app/v2/utlis/` becomes `ui/src/utils/`.
- The two legacy auth provider files and their dead code (audit §4) are removed.
- `app/(auth)/dashboard/(dashboard)/@<role>/*` parallel-route role slots collapse into
  a **single** permission-gated dashboard: one `dashboard/<feature>/` route tree,
  navigation filtered by `usePermission` instead of by role-named slot folders.

---

## 2. Feature map

Maps current route areas / legacy components to target feature folders. "v2 seed"
column notes what already exists under `ui/src/app/v2/features` and its completeness.

| Current area (legacy) | Legacy source | Target feature(s) | v2 seed today | Completeness |
|---|---|---|---|---|
| Auth (login/reset) | `app/(auth)/(auth-group)/{login,reset}`, `UiComponents/formComponents/forms/AuthForm.jsx` | `features/auth` | `features/auth/*` (service, validation, constants, components: LoginForm/RequestReset/ResetPassword/AuthCard/AuthGuard/AuthLayout; pages; `hooks/useAuthHooks`) | **~Complete** — reorganize into `config/`, retire LanguageProvider usage |
| Booking (public lead intake) | `app/booking/page.jsx`, client-page components | `features/booking` (public) | `features/leads/components/BookingLeadDetailsCard.jsx`, `constants/bookingLeadFieldLabels.js` | **Partial** — detail card + labels only; no list/intake page wired |
| Leads / deals / sales | `UiComponents/DataViewer/leads/{core,dialogs,features,leadUpdates,pages,panels,payments,shared,tabs}`, `PreviewLeadDialog.jsx`; dashboard `@*/leads`, `@*/deals`, `all-deals`, `on-hold-deals` | `features/leads` (list) + `features/leadsDetails` (tabs: updates, payments, panels) | none (only booking-lead detail card) | **New build** on v2 patterns; richest feature |
| Contracts | `UiComponents/DataViewer/contracts/{ContractsList,CreateContract,CloneContract,ViewContract,client,payments,shared,ContractUtilityPage}`; `app/contracts/page.jsx` | `features/contracts` + `features/contractsDetails` (stages, payments, drawings, special items, PDF) + `features/contractUtilities` | none | **New build**; PDF is backend-rendered, FE only triggers + links |
| Image / design sessions | `UiComponents/DataViewer/image-session/{admin,client-session,users}`; `app/image-session/page.jsx` | `features/imageSessions` + `features/imageSessionsDetails`; client flow under `(public)` | none | **New build** |
| Chat | `UiComponents/DataViewer/chat/{ChatContainer,components,hooks,utils}`; dashboard `@*/chat`; `app/chats/page.jsx` | `features/chat` (single rich feature, socket-driven) | `features/chat` directory exists but **empty** | **New build**; backend chat already in `v2/modules/chat` |
| Projects | dashboard `@*/projects`, `@*/work-stages`, `@threeD/modification`, `@twoD/{final-plan,quantity,study}` | `features/projects` + `features/projectsDetails` | none | **New build** |
| Tasks | dashboard `@*/tasks` | `features/tasks` + `features/tasksDetails` | none | **New build** |
| Payments | dashboard `@*/payments` | `features/payments` | none | **New build** |
| Accounting | `@accountant/{deals,operational-expenses,outcome,payments,rents,salaries}` | `features/accounting` (sub-views: invoices, payments, salaries, rents, expenses, outcome) | none | **New build** |
| Users / identity | `@admin/users`, `@super_sales/users`, `UiComponents/pages/UsersPage.jsx`, `models/CreateModal` etc. | `features/users` + `features/usersDetails` | none | **New build** |
| Calendar / meetings | `@*/calendar` | `features/calendar` | none | **New build** (later phase) |
| Notifications | `@*/notifications` | `features/notifications` | none | **New build** |
| Website / site utilities | `@admin/website-utilities`, `@super_admin/website-utilities` | `features/websiteUtilities` | none | **New build** |
| Courses / LMS | (legacy courses screens) | `features/courses` | none | **New build** (last; lowest priority) |
| Reports | `@admin/report` | belongs to `features/leads`/`accounting` as report actions (PDF download links) | none | Folded into owning features |

Shared legacy components to migrate into `shared/components/*` (structural, see §8):
`UiComponents/DataViewer/AdminTable.jsx` + `PaginationWithLimit.jsx` →
`shared/components/tables/DataTable.jsx`; `UiComponents/models/{Create,Edit,Delete,Confirm}Modal.jsx`
→ `shared/components/forms/FormDialog.jsx`; `UiComponents/formComponents/{MUIInputs,
FilterSelect,DateFilterComponent,DateRangeFilter,SearchComponent,SimpleFileInput,
MulitFileInput}` → `shared/components/forms/rhf/*` + `shared/components/forms/filters/*`.

---

## 3. Providers & app-shell plan

Today's v2 providers (audit §4): `AuthProvider`, `LanguageProvider`,
`LanguageSwitcherProvider`, `MUIProvider`, `MuiAlertProvider`, `SocketProvider`,
`ToastProvider`, `UploadingProvider`, `theme.js`. Legacy providers delegate to these.

**Target composition** — one `providers/AppProviders.jsx` composes, outermost→innermost:

1. `ThemeProvider` — merges today's `MUIProvider` + `LanguageSwitcherProvider` RTL
   plumbing into one. Keeps the `muirtl` emotion cache (`createCache({ key: "muirtl",
   stylisPlugins: [rtlPlugin] })`) but **fixed to RTL only** — no `ltrCache`, no `lng`
   state, no language toggle. Drops the brittle hardcoded class selectors in
   `LanguageSwitcherProvider` (`& .muirtl-1v3caum`). Theme `direction: "rtl"`.
2. `ToastProvider` — keep v2 `ToastProvider` + `Toast.jsx`; this is where message
   **codes** resolve to Arabic strings (§4, §5). Replaces `MuiAlertProvider`.
3. `AuthProvider` — keep v2 `AuthProvider` (validates session via `GET auth/me`,
   `onAuthFailure` → redirect). **Extend** its user object to expose `permissions[]`
   and `permissionsByModule{}` (§6), consumed by `usePermission`.
4. `SocketProvider` — keep v2 `SocketProvider`; connect after auth resolves; provides
   `useSocket` for chat + upload/lifecycle events.
5. `UploadingProvider` — keep v2 `UploadingProvider` + `UploadOverlay`.

Removed providers: `LanguageProvider`, `LanguageSwitcherProvider` (language-toggle
parts), `MuiAlertProvider`, and **both** legacy `app/providers/Language*.jsx`
(including the unreachable dead code noted in audit §4).

`app/layout.js` sets `<html lang="ar" dir="rtl">` (audit §1 flags this is missing
today) and mounts `<AppProviders>`. Keep `Noto_Kufi_Arabic` font + Arabic metadata.

---

## 4. Data layer

**Canonical primitives** (under `hooks/request/`):
- `useRequest({ url, method, isPaginated, autoFetch, isPublic, initialData, initialParams })`
  — the single fetch hook. Wraps `lib/api/ApiFetch.js`.
- `useMultiRequest` — CRUD helper bound to one base URL for create/update/delete +
  refetch, for list+modal features.

**Gap to close (important):** today's v2 `useRequest`
(`ui/src/app/v2/hooks/useRequest.js`) returns only `{ data, isLoading, error,
fetchData, refetch }` — it has **no** `page/setPage/pageSize/setPageSize/total/
filters/setFilters/triggerRefetch` state, even though `ApiFetch.getPaginated` +
`_buildPaginatedPath` already accept `{ page, limit, filters, search, sort, others }`.
The migration must **upgrade `useRequest`** to own pagination + filter state and to
read the envelope's `{ items, total, page, pageSize }` for paginated GETs, matching
the reference contract in `02-reference-patterns.md §5`. This is the one data-layer
behavior change; it is additive and does not alter the wire contract.

**List pagination/filtering flow:**
1. Page calls `useRequest({ url: LEADS_URL, isPaginated: true, autoFetch: canList })`.
2. `useRequest` holds `page/pageSize/filters/search/sort`, syncs filters to URL query
   params, and calls `ApiFetch.getPaginated(url, { page, limit, filters, search,
   sort })`. The query is serialized by the existing `_buildPaginatedPath`.
3. Response data `{ items, total, page, pageSize }` feeds `DataTable`.
4. Filter bar from `config/<feature>Filters.js` calls `setFilters`; `DataTable`
   pagination controls call `setPage/setPageSize`.

**Mutations + toasts via message codes:**
- Writes go through `handleRequestSubmit({ data, setLoading, path, method, type,
  toastMessage })` (already in `lib/api/handleRequestSubmit.js`) or `useMultiRequest`.
- On success/error the response envelope carries `{ success, message (CODE),
  data, translationKey }`. `ToastProvider` resolves `(translationKey, code)` →
  Arabic string via `shared/data/messages.js` and toasts it. `dontRedirect` chooses
  toast vs redirect (reference §3). `shouldAutoToast` flag controls auto-toasting on
  mutations.
- **Cleanup:** remove the `logToMd` / `localStorage("debug-log-md")` debug logger
  left in `ApiFetch.js` (audit §4/§8); retire `legacyApiFetch` once all routes use
  the v2 base.

---

## 5. i18n removal plan

The app is Arabic-first/RTL with an **optional** ar↔en runtime toggle implemented as a
hand-rolled dictionary — **not** a real i18n library (audit §1). We collapse to a
single language (Arabic, RTL).

**Remove (FE):**
- `ui/src/app/providers/LanguageProvider.jsx` and
  `ui/src/app/providers/LanguageSwitcherProvider.jsx` (legacy).
- `ui/src/app/v2/providers/LanguageProvider.jsx` and the language-toggle parts of
  `ui/src/app/v2/providers/LanguageSwitcherProvider.jsx` (keep only its RTL emotion
  cache, folded into `ThemeProvider`).
- The dictionary indirection `translate(text)` / `dictionary[text]` in
  `ui/src/app/helpers/constants.js`, and any `LanguageSwitcher` UI control.
- All `lng` state, `localStorage("lng")`, and `?lng=` URL syncing.

**Keep / add:**
- RTL stays correct via: `<html lang="ar" dir="rtl">` in `app/layout.js` (new),
  `theme.direction = "rtl"`, and the `muirtl` emotion cache with `stylis-plugin-rtl`
  (folded into `ThemeProvider`, fixed RTL — no conditional ltr cache).
- The **message-code indirection is kept** (reference §8): backend returns
  `message` as a CODE + `translationKey` namespace; the FE resolves it through a
  **single-language** Arabic map `shared/data/messages.js`
  (`messages[translationKey][code] -> "نص عربي"`), not an `{ ar, en }` split. RHF
  `rules` and any client validation reference these **keys/codes**, never prose.
- Hardcoded Arabic literals scattered in legacy components (audit §1) are migrated to
  plain Arabic strings or, where they correspond to backend codes, to the message map.

**Coordination with backend:** message codes resolve to Arabic on the FE map. The
backend plan must keep emitting language-neutral codes + `translationKey` (no raw
prose). Any code the backend emits must have an entry in `shared/data/messages.js`
(reconciliation: the message-code namespaces are shared between plans).

---

## 6. Permission gating

Replace today's **role-only** gating (audit §6: legacy role-string allow-lists; v2
`requireRole(activeRole||role)`; role-named dashboard slot folders) with
permission-code + capability gating, aligned to the backend permission codes.

- **`hooks/usePermission.js`** derives `{ hasPermission, hasAnyPermission,
  hasAllPermissions, hasPermissionByModule, hasAction }` from `user.permissions[]` /
  `user.permissionsByModule{}` exposed by `AuthProvider` (populated from `GET
  auth/me`). The backend auth DTO must flatten role-profile + direct permissions into
  these fields (reference `auth.dto.js mapUserWithPermissions`).
- **`config/permissions.js`** is the FE mirror of the backend permission-code
  constants (`dot.case`, e.g. `leads.view`, `contracts.edit`,
  `image_session.approve`), imported as `PERMISSIONS.<DOMAIN>.<ACTION>`. It must stay
  in sync with the backend's `permissions.constants.js` (single source of truth is the
  backend; the FE copy mirrors it — reconciliation point).
- **Capabilities.** Action buttons combine the permission code with the record's
  computed `capabilities.*` (backend-computed per row): e.g.
  `const canEdit = hasPermission(PERMISSIONS.LEADS.EDIT) && item.capabilities?.canEdit;`
  then `onEdit={canEdit ? handleEdit : undefined}`. UI gating is cosmetic; the server
  still enforces.
- **Navigation.** `config/navigation.js` is a permission-gated nav map; the dashboard
  shell renders only entries the user has a permission for. This **replaces** the
  `@<role>` parallel-route slot folders (`@admin`, `@staff`, `@accountant`,
  `@threeD`, `@twoD`, `@super_admin`, `@super_sales`, `@contact_initiator`).
- **Detail tabs** are permission/capability-gated: the tab set is filtered, tab state
  lives in the URL (`?tab=`), and each tab fetches lazily via a loading-sequence flag.

---

## 7. Migration phases / milestones

Ordered to align with the backend module order (auth → booking-leads → chat are
already the v2 modules; then leads/sales, contracts, image-sessions, etc.). Each phase
ships migrated routes that fully stop importing `UiComponents/*`.

**Phase 0 — Foundation / scaffolding.** Promote `v2/*` to `src/{features,hooks,lib,
providers,shared,config,utils}`. Build `shared/components/tables/DataTable.jsx`,
`forms/{AppForm,FormDialog,PageHeader,rhf/*}`, upgrade `useRequest` with
pagination/filter state (§4), add `usePermission` + `config/permissions.js`, fold RTL
into one `ThemeProvider`, set `<html lang dir>`. *Acceptance:* a throwaway demo list
page renders via `DataTable` + paginated `useRequest`; permission gating + RTL verified
in-app; no language toggle remains.

**Phase 1 — i18n removal + providers consolidation.** Remove Language providers +
dictionary; wire `AppProviders`; add `shared/data/messages.js`; resolve message codes
in `ToastProvider`. *Acceptance:* app boots single-language Arabic/RTL; toasts resolve
codes; no `lng`/dictionary references remain (grep clean).

**Phase 2 — Auth.** Finalize `features/auth` into the new structure; AuthProvider
exposes permissions; AuthGuard uses `usePermission`. *Acceptance:* login/reset/me/
logout/refresh flow works against `/v2/auth/*`; protected routes redirect on 401.

**Phase 3 — Booking + Leads/Sales.** Public `features/booking` intake; `features/leads`
list + `features/leadsDetails` tabs (updates, payments, panels). *Acceptance:* list
pagination/filter/search via config; create/edit via AppForm+FormDialog; every action
permission+capability gated; legacy `DataViewer/leads/*` no longer imported by these
routes.

**Phase 4 — Chat.** `features/chat` over `SocketProvider`/`useSocket` against
`/v2/chat/*`. *Acceptance:* rooms list, messages, members, files, reactions, read
receipts work; realtime events received.

**Phase 5 — Contracts + Image-sessions.** `features/contracts(+Details)`,
`features/contractUtilities`, `features/imageSessions(+Details)`, client flows under
`(public)`. *Acceptance:* CRUD + stage/payment tabs; PDF trigger returns links (FE
only triggers/links — rendering stays backend); session approval flow works.

**Phase 6 — Projects, Tasks, Payments, Accounting, Users.** Build remaining
dashboard features; collapse `@<role>` slots into the permission-gated nav.
*Acceptance:* each feature list+detail migrated; nav driven by `config/navigation.js`;
role-slot folders deleted.

**Phase 7 — Calendar, Notifications, Website-utilities, Courses (LMS).** Lowest
priority remaining areas. *Acceptance:* migrated and gated; no `UiComponents/*`
imports remain anywhere.

**Phase 8 — Cutover & cleanup.** Delete legacy `UiComponents/*`, legacy providers,
`legacyApiFetch`, `logToMd` debug logger. Rename `ui/ → web/`; wire npm workspaces
(`["packages/*", "web", "server"]`); retarget `@` alias, Next config, CI. *Acceptance:*
build is green from `web/`; no `app/v2/` or `UiComponents/` paths exist.

---

## 8. Component / design-system notes (structural only)

Deep UX/visual redesign is a **separate UX plan**; this section is structure +
consistency only.

- **MUI theme** stays MUI v7 + Emotion v11, `direction: "rtl"`, `Noto_Kufi_Arabic`.
  Consolidate the two theme sources (`v2/providers/theme.js` + the legacy MUI context)
  into one `providers/theme.js`. No new palette/typography here.
- **Tables.** One canonical `shared/components/tables/DataTable.jsx` (from
  `DataViewer/AdminTable.jsx` + `PaginationWithLimit.jsx`), config-driven via
  `columns`/`filterConfig`, with `renderViewLink(item) => "/dashboard/<feature>/<id>"`
  and caller-gated per-action callbacks. `@mui/x-data-grid` is **not** a dependency
  (audit §9) — keep the custom MUI table.
- **Forms.** `shared/components/forms/{AppForm,FormDialog,PageHeader}` + `rhf/*`
  inputs built from `UiComponents/formComponents/MUIInputs` + the `models/*Modal`
  dialogs. Column descriptors derive form fields (`getFormFieldsFromColumns`).
- **Filters.** `FilterSelect`, `DateFilterComponent`, `DateRangeFilter`,
  `SearchComponent` → `shared/components/forms/filters/*`, consumed by
  `config/<feature>Filters.js`.
- **File inputs.** `SimpleFileInput`/`MulitFileInput` →
  `shared/components/forms/rhf/RHFFile*`, wired to `useUpload`/`UploadingProvider`.
- **Barrel.** `shared/components/index.js` re-exports PascalCase components.

---

## 9. Testing strategy

The reference has no automated runner (reference §6); the recommendation is to **add**
one. For the FE:

- **Runner:** Vitest + React Testing Library (jsdom). Add a `test` script in
  `ui/package.json` (later `web/`).
- **Permission-gated rendering** (highest value): render list pages/action menus with
  mocked `useAuth` permission sets and assert buttons appear/disappear and gated
  callbacks are `undefined` when `hasPermission`/`capabilities.*` are false. This is
  the FE analogue of the backend's "throw, don't return false" scope test.
- **Form validation:** RHF + Zod-mirrored `rules` — assert required/format errors
  render and that submit builds the exact API payload; assert message **codes** (not
  prose) drive messages.
- **Data-layer behavior:** unit-test the upgraded `useRequest` — pagination/filter
  state, URL sync, paginated envelope extraction (`items/total/page/pageSize`), and
  error→toast vs error→redirect via `dontRedirect`. Mock `ApiFetch`, assert the
  serialized paginated path.
- **End-to-end smoke (manual runbook):** per migrated route, verify against the real
  backend that the screen renders the same data and the same mutations succeed, with a
  before/after legacy comparison. Capture as a per-phase checklist.

---

## 10. Risks & cutover

| Risk | Mitigation |
|---|---|
| Two auth/JWT schemes coexist (audit §6: `SECRET_KEY` vs new access/refresh, `currentMainTokenName` shim) | FE talks only to `/v2/auth/*` (`ApiFetch._refreshToken` already hits `auth/refresh`). Backend must finish the cookie consolidation; FE assumes one cookie scheme post-Phase 2. |
| Permission codes not yet emitted by backend | Backend permission model is the source of truth; FE `config/permissions.js` mirrors it. Until backend emits `permissions[]`/`permissionsByModule` in `auth/me`, gate optimistically off role as a **temporary** shim per feature, removed when codes land (reconciliation flag). |
| `useRequest` upgrade changes hook return shape | Additive: existing fields kept; new pagination fields added. Migrate consumers route-by-route; legacy routes untouched. |
| Endpoint drift vs backend plan | §11 lists assumed endpoints; reconciliation reviewer cross-checks against backend "API CONTRACT INDEX". Any backend path change is mirrored in feature `config/constant.js`. |
| `ui/ → web/` rename churn | Deferred to Phase 8; done as one mechanical move with alias/CI update. |
| RTL regressions after dropping ltr cache | Keep `stylis-plugin-rtl` + `muirtl` cache; add `<html dir="rtl">`; smoke-test key screens. |
| Legacy + new in one Next app | Strangler isolation: a route imports either `UiComponents/*` OR `features/*`, never both; CI grep gate per migrated route. |

**Cutover:** route-by-route per phase; a route is "done" when its `app/.../page.jsx`
renders a `features/*` page and imports zero `UiComponents/*`. Final cutover (Phase 8)
deletes legacy and renames `ui/ → web/`.

---

## 11. FEATURE → ENDPOINTS map

Method + path the FE consumes per feature. Paths reflect what the v2 backend exposes
today (confirmed in `server/v2/shared/routes.js` and module route files); areas not yet
in v2 are listed against their **assumed** target v2 paths and flagged so the backend
plan can confirm/rename. v2 API base is mounted at `/v2` (audit §4); the FE `ApiFetch`
base points at the v2 root.

**Auth** (`server/v2/modules/auth/auth.routes.js` — confirmed):
- `POST /v2/auth/login`
- `POST /v2/auth/refresh`
- `GET  /v2/auth/me`
- `POST /v2/auth/logout`
- `POST /v2/auth/request-password-reset`
- `POST /v2/auth/reset-password`

**Booking (public lead intake)** (`booking-leads.routes.js` mounted at
`/v2/client/booking-leads` — confirmed):
- `POST  /v2/client/booking-leads`
- `GET   /v2/client/booking-leads/:leadId`
- `PATCH /v2/client/booking-leads/:leadId`
- `PUT   /v2/client/booking-leads/:leadId/submit`

**Chat** (`chat.routes.js` mounted at `/v2/chat` — confirmed):
- `GET    /v2/chat/rooms` · `POST /v2/chat/rooms` · `GET /v2/chat/rooms/:roomId`
  · `PUT /v2/chat/rooms/:roomId` · `DELETE /v2/chat/rooms/:roomId`
- `POST   /v2/chat/rooms/create-chat` · `POST /v2/chat/rooms/lead-rooms`
- `PUT    /v2/chat/rooms/:roomId/update-room-settings`
- `POST   /v2/chat/rooms/:roomId/manageClient` · `POST /v2/chat/rooms/:roomId/regenerateToken`
- `GET    /v2/chat/rooms/:roomId/messages` · `GET /v2/chat/rooms/:roomId/messages/:messageId/page`
  · `GET /v2/chat/rooms/:roomId/pinned-messages`
- `POST   /v2/chat/rooms/read-all` · `POST /v2/chat/rooms/:roomId/read`
- `POST   /v2/chat/messages/:messageId/reactions` · `DELETE /v2/chat/messages/:messageId/reactions/:emoji`
- `GET    /v2/chat/rooms/:roomId/members` · `POST /v2/chat/rooms/:roomId/members`
  · `PUT /v2/chat/rooms/:roomId/members/:memberId` · `DELETE /v2/chat/rooms/:roomId/members/:memberId`
- `GET    /v2/chat/rooms/:roomId/files` · `GET /v2/chat/rooms/:roomId/files/stats`
- (realtime: Socket.IO chat events via `SocketProvider`)

**Files / uploads** (mounted at `/v2/files` — confirmed):
- `POST /v2/files` (and provider-specific upload endpoints — confirm in backend plan)

**Telegram** (mounted at `/v2/telegram` — confirmed; admin-only connect/manage):
- `/v2/telegram/*` (auth + manager actions — confirm exact paths in backend plan)

> The areas below are **not yet migrated to v2**. They currently run on legacy routers
> (`/shared`, `/admin`, `/staff`, `/accountant`, `/client`, `/contract`,
> `/image-session`, etc. — audit §2). The FE plan **assumes** the backend plan migrates
> each to a `/v2/<feature>` module exposing list (`GET`, paginated), get-by-id,
> create, update, and `POST /:id/actions/<kebab>` for workflow status (reference §2 —
> no generic PATCH on system status). The reconciliation reviewer must confirm these
> against the backend "API CONTRACT INDEX".

**Leads / Sales (assumed `/v2/leads`):**
- `GET /v2/leads` (paginated, filters/search/sort) · `GET /v2/leads/:id`
- `POST /v2/leads` · `PATCH /v2/leads/:id`
- `POST /v2/leads/:id/actions/<assign|convert|hold|...>` (workflow)
- `GET/POST /v2/leads/:id/updates` · `GET/POST /v2/leads/:id/payments`
- (report PDF download: `GET /v2/leads/report` or `/v2/leads/:id/report`)

**Contracts (assumed `/v2/contracts`):**
- `GET /v2/contracts` · `GET /v2/contracts/:id` · `POST /v2/contracts` · `PATCH /v2/contracts/:id`
- `POST /v2/contracts/:id/actions/<clone|...>`
- `POST /v2/contracts/:id/pdf-session-token` (generate) → returns AR/EN PDF links
- contract payments/stages/drawings/special-items sub-resources under `/v2/contracts/:id/*`
- client contract signing (public): `POST /v2/client/contracts/:token/sign`

**Image / Design sessions (assumed `/v2/image-sessions`):**
- `GET /v2/image-sessions` · `GET /v2/image-sessions/:id` · `POST` · `PATCH`
- `POST /v2/image-sessions/:id/actions/approve` (→ PDF, backend-rendered)
- client session flow (public): `GET/POST /v2/client/image-sessions/:token/*`

**Projects (assumed `/v2/projects`):**
- `GET /v2/projects` · `GET /v2/projects/:id` · `POST` · `PATCH`
- `POST /v2/projects/:id/actions/<advance-stage|...>` · `GET /v2/projects/:id/updates`

**Tasks (assumed `/v2/tasks`):**
- `GET /v2/tasks` · `GET /v2/tasks/:id` · `POST` · `PATCH` · `POST /v2/tasks/:id/actions/<status>`

**Payments / Accounting (assumed `/v2/accounting/*`):**
- `GET/POST /v2/payments` · `GET /v2/invoices` · `GET/POST /v2/salaries`
  · `GET/POST /v2/rents` · `GET/POST /v2/operational-expenses` · `GET /v2/outcome`

**Users (assumed `/v2/users`):**
- `GET /v2/users` · `GET /v2/users/:id` · `POST` · `PATCH`
  · `POST /v2/users/:id/actions/<activate|deactivate|set-permissions>`

**Notifications (assumed `/v2/notifications`):**
- `GET /v2/notifications` (paginated) · `POST /v2/notifications/:id/read` · `POST /v2/notifications/read-all`

**Website utilities (assumed `/v2/site-utilities`):**
- `GET /v2/site-utilities` · `PATCH /v2/site-utilities/:key`

**Calendar / meetings (assumed `/v2/calendar`):**
- `GET /v2/calendar/meetings` · `POST /v2/calendar/meetings`
  · `GET /v2/calendar/availability` · Google sync endpoints (confirm in backend plan)

**Courses / LMS (assumed `/v2/courses`):**
- `GET /v2/courses` · `GET /v2/courses/:id` · lessons/tests/progress sub-resources

> **Cross-cutting assumptions the backend plan must satisfy:**
> (1) `GET /v2/auth/me` returns `user.permissions[]` + `user.permissionsByModule{}`
> and per-record `capabilities.*` on list/detail payloads.
> (2) Paginated GETs return `data: { items, total, page, pageSize }`.
> (3) All responses use the `{ success, message(CODE), data, translationKey }`
> envelope; codes are language-neutral and every code has an Arabic entry in the FE
> `shared/data/messages.js`.
> (4) Workflow/status changes are `POST /:id/actions/<kebab>`, not generic PATCH.
> (5) One JWT cookie scheme post-cutover; `auth/refresh` is the refresh endpoint.

---

*End of frontend migration plan.*
