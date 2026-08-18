# Master ↔ Current Authorization Parity Matrix

**Task 7 (Phase 3), Permissions Parity plan.** Analysis-first: this document verifies that
the CURRENT authorization (v2 modules) reproduces the MASTER (deployed) authorization
role-for-role, module-for-module, and isolates the four user-confirmed INTENTIONAL
tightenings from any genuine MISMATCH.

## How to read this

- **Roles (9):** `ADMIN`, `SUPER_ADMIN`, `SUPER_SALES`, `STAFF`, `THREE_D_DESIGNER`,
  `TWO_D_DESIGNER`, `TWO_D_EXECUTOR`, `ACCOUNTANT`, `CONTACT_INITIATOR`.
- **"master-allowed?"** — could a user of that role reach the surface on the deployed app
  (from the master scan summarized in the task brief).
- **"current grants?"** — does the role hold the code the route requires, derived from
  `packages/shared/constants/access/role-permissions.js` (base role map +
  `SUPER_SALES_EXTRA_PERMISSIONS` layered by the `isSuperSales` flag + the sub-role union in
  `getEffectivePermissions`) crossed with the route's `requirePermissions([...])`.
- **"object-scope rule"** — the row-level rule the usecase enforces AFTER the code gate
  (the code is authorization; scope is the row-level guarantee).
- **Verdict** — `MATCH` (current == master), `INTENTIONAL` (a user-confirmed tightening,
  never a defect), or `MISMATCH` (a real divergence to fix).

### The two admin-tier unions (used throughout)

- **isAdmin union** = base role `ADMIN`/`SUPER_ADMIN` **OR** `isSuperSales` flag **OR** an
  `ADMIN`/`SUPER_ADMIN` sub-role. This is the legacy `verifyTokenAndHandleAuthorization(...,
  "ADMIN")` gate. In current code it is reproduced by granting the admin codes to
  `ADMIN`/`SUPER_ADMIN` base + layering them on via `SUPER_SALES_EXTRA_PERMISSIONS`
  (isSuperSales) + the automatic sub-role union in `getEffectivePermissions`.
- **lead/project object-scope full-scope set** = `ADMIN`/`SUPER_ADMIN`/`isSuperSales`
  (`isAdminUser()` in the usecases), plus `ACCOUNTANT` for lead + project READ, plus
  `CONTACT_INITIATOR` for lead detail READ (`includeContactInitiator`). Verified in
  `leads/lead/lead.repository.js` `FULL_SCOPE_ROLES = ["ADMIN","SUPER_ADMIN","ACCOUNTANT"]`
  + `hasFullScope()`, and `projects/project/project.usecase.js` `isAdminUser()` /
  `buildAuthUserProjectWhere`.

### Corroborating tests

Every role→code assertion below is backed by a passing test. Shared map tests:
`packages/shared/__tests__/permissions.test.js`, `accounting-permissions.test.js`,
`admin-residual-permissions.test.js`, `calendar-permissions.test.js`,
`course-permissions.test.js`, `dashboard-permissions.test.js`,
`leaf-domains-permissions.test.js`, `notifications-utilities-permissions.test.js`,
`projects-permissions.test.js`. Object-scope tests:
`server/src/modules/**/__tests__/*.usecase.test.js` (leads, projects, contracts,
image-sessions, questions, sales-stages, dashboard, users, accounting, calendar,
courses, reviews, notifications-utilities). Full suite: **610 passing (40 files)**.

---

## Module-by-module matrix

Where a whole surface admits **all 9 authenticated roles identically** (the legacy SHARED
gate), the per-role rows are collapsed into one "ALL 9 roles" row for readability — the
grant is proven by the tests to hold for every role. Where roles split, each is listed.

### 1. Auth (`/v2/auth`) — `auth.routes.js`

`GET /me` → `AUTH.ME`, `POST /logout` → `AUTH.LOGOUT` (in `SHARED_AUTHED`). login /
refresh / password-reset are PUBLIC (no code).

| Role | master-allowed? | current grants? | object-scope | Verdict |
|---|---|---|---|---|
| ALL 9 roles | yes (any authed) | yes — `AUTH.ME`/`AUTH.LOGOUT` via SHARED_AUTHED | self-session only | MATCH |

### 2. Chat (`/v2/chat`) — `chat.routes.js`

Codes `CHAT.ROOM_*` / `MEMBER_MANAGE` / `MESSAGE_*` (all in `SHARED_AUTHED`).

| Role | master-allowed? | current grants? | object-scope | Verdict |
|---|---|---|---|---|
| ALL 9 roles | yes (any authed) | yes — CHAT.* via SHARED_AUTHED | room-membership checker on `:roomId` routes | MATCH |

Client chat (`client/client-chat.route.js`) is PUBLIC by design (token-based) — no code. MATCH.

### 3. Upload (`/v2/files`) — `upload.routes.js`

`POST /single`,`/chunks` → `UPLOAD.FILE_UPLOAD` (SHARED_AUTHED). `/client/*` PUBLIC.

| Role | master-allowed? | current grants? | object-scope | Verdict |
|---|---|---|---|---|
| ALL 9 roles | yes (any authed) | yes — UPLOAD.FILE_UPLOAD via SHARED_AUTHED | none | MATCH |

### 4. Leads (`/v2/leads`) — `lead.routes.js`

Codes `LEAD_AUTHED` (LIST/VIEW/ASSIGN_SELF/CONVERT/EDIT/CHANGE_STATUS/CALL/MEETING/
PRICE_OFFER/PAYMENT/FILE/NOTE/REMINDER/COUNTRY) granted to **every** role; admin-tier
`LEAD.ASSIGN_OTHER` (bulk-convert + assign-to-another) to isAdmin union only. `PUT /`
gate is `requirePermissions([], [ASSIGN_SELF, ASSIGN_OTHER])` (any-of) — every role holds
ASSIGN_SELF, so all pass; the usecase `isAdminUser()` enforces the self-vs-other split.

Object-scope (`checkIfUserCanAccessLead`/`MutateLead` + `buildAuthUserLeadWhere`):
full-scope READ = ADMIN/SUPER_ADMIN/ACCOUNTANT/isSuperSales (+ CONTACT_INITIATOR on detail);
scoped users READ = own `userId` + unassigned NEW pool; WRITE = own only. Country
restriction (`LIST_FULL_ROLES = SUPER_ADMIN/ADMIN/SUPER_SALES/CONTACT_INITIATOR`) skips
those four; applies to all others.

| Role | master-allowed? | current grants? | object-scope | Verdict |
|---|---|---|---|---|
| ADMIN / SUPER_ADMIN | yes, ALL leads + admin actions | LEAD_AUTHED + LEAD.ASSIGN_OTHER | full scope; no country restriction | MATCH |
| SUPER_SALES | yes, ALL leads (isSuperSales gives admin actions) | LEAD_AUTHED; ASSIGN_OTHER only via isSuperSales flag | full scope (via isSuperSales) / owned when flag off; no country restriction (LIST_FULL_ROLES) | MATCH |
| ACCOUNTANT | yes, ALL leads (read) | LEAD_AUTHED; no ASSIGN_OTHER | full READ scope; country restriction applies (not in LIST_FULL_ROLES) | MATCH |
| CONTACT_INITIATOR | yes (own + NEW pool; detail read broad) | LEAD_AUTHED; no ASSIGN_OTHER | detail-read full scope (`includeContactInitiator`); no country restriction | MATCH |
| STAFF / THREE_D / TWO_D / TWO_D_EXECUTOR | yes (own + unassigned NEW pool) | LEAD_AUTHED; no ASSIGN_OTHER | own `userId` + NEW pool (read), own only (write); country restriction applies | MATCH |

Admin-tier lead actions (assign-to-another, bulk-convert) = isAdmin union → ASSIGN_OTHER
on ADMIN/SUPER_ADMIN base + isSuperSales. **MATCH.** Public booking/new-lead
(`client/booking-lead`, `client/public-lead`) PUBLIC — no code. MATCH.

### 5. Projects / tasks / updates / delivery (`/v2/projects` etc.)

Codes `PROJECT_AUTHED` (PROJECT/TASK/UPDATE/DELIVERY reads+writes) to **every** role;
admin-tier `PROJECT.MANAGE` (assign/remove designer) to the isAdmin union only. Work-stage
status movement uses `PROJECT.EDIT`: `master` exposed it to an assigned 2D/3D designer,
so it remains assignment-scoped and retains the non-admin terminal-status lock.
Object-scope (`checkIfUserCanAccessProject`/`MutateProject`): full-READ =
ADMIN/SUPER_ADMIN/ACCOUNTANT/isSuperSales; full-WRITE = ADMIN/SUPER_ADMIN/isSuperSales
(ACCOUNTANT read-only carve-out); everyone else = assigned-only.

| Role | master-allowed? | current grants? | object-scope | Verdict |
|---|---|---|---|---|
| ADMIN / SUPER_ADMIN | yes, ALL + manage | PROJECT_AUTHED + PROJECT.MANAGE | full read + write | MATCH |
| SUPER_SALES | yes (isSuperSales → all + manage) | PROJECT_AUTHED; MANAGE via isSuperSales | full via isSuperSales / assigned when off | MATCH |
| ACCOUNTANT | yes, designer detail READ | PROJECT_AUTHED; no MANAGE | full READ; assigned-only WRITE | MATCH |
| STAFF / THREE_D / TWO_D / TWO_D_EXECUTOR | yes, ASSIGNED only | PROJECT_AUTHED; no MANAGE | assigned-only read + write | MATCH |
| CONTACT_INITIATOR | yes (authed surface) | PROJECT_AUTHED; no MANAGE | assigned-only (no assignments → sees none) | MATCH |

**2026-08-18 designer activity addendum.** The designer work-stage detail remains scoped
by project assignment. On that already-scoped lead only, active `DESIGNER_3D` and
`DESIGNER_2D` profiles may add notes, schedule/update calls, and upload files, matching the
`master` UI and routes. This narrow activity fallback is not ordinary lead mutation scope;
lead fields/status/offers/payments/contracts still require the existing lead checker.

### 6. Accounting (`/v2/accounting`) — `accounting.routes.js` + sub-routers

Codes `ACCOUNTING_ALL` granted to **ACCOUNTANT base role ONLY**. No object scope (global
financial records; the code is the gate — payment checker enforces existence 404, not 403).

| Role | master-allowed? | current grants? | object-scope | Verdict |
|---|---|---|---|---|
| ACCOUNTANT | yes (only base ACCOUNTANT) | yes — ACCOUNTING_ALL | none (global) | MATCH |
| ADMIN / SUPER_ADMIN | **no** (gate falls to `role !== "ACCOUNTANT"`) | no (not granted; isSuperSales does not layer accounting) | — | MATCH |
| SUPER_SALES / STAFF / THREE_D / TWO_D / TWO_D_EXECUTOR / CONTACT_INITIATOR | no | no | — | MATCH |

Explicitly verified: `accounting-permissions.test.js` asserts non-accountant roles (incl.
ADMIN/SUPER_ADMIN) and `isSuperSales` get **zero** accounting codes.

### 7. Admin surfaces — users management + admin-residual + telegram

**Users management** (`users/user.routes.js`, admin codes `USER_ADMIN`): LIST/VIEW_LOGS/
VIEW_LAST_SEEN/CREATE/UPDATE/MANAGE_ROLES/MANAGE_RESTRICTED_COUNTRIES/
MANAGE_AUTO_ASSIGNMENTS/SET_MAX_LEADS/MANAGE_STAFF_EXTRA.
**Admin-residual** (`admin-residual/*`, codes `ADMIN_RESIDUAL_*`): reports, admin lead
import/create/edit/delete, client edit, telegram-manage, fixed-data writes, commissions,
admin projects, model-archive.
Both = isAdmin union (ADMIN/SUPER_ADMIN base + isSuperSales + admin sub-roles).

Directory + self-profile (`USER.DIRECTORY`/`PROFILE_VIEW`/`PROFILE_EDIT`) are broad (all
authed, SHARED_AUTHED) with a self-OR-admin-tier object-scope checker (IDOR fix).

| Role | master-allowed? | current grants? | object-scope | Verdict |
|---|---|---|---|---|
| ADMIN / SUPER_ADMIN | yes (isAdmin) | USER_ADMIN + ADMIN_RESIDUAL base | admin field-edit; lead-scoped writes use lead checker | MATCH |
| SUPER_SALES + isSuperSales | yes (isAdmin admits isSuperSales) | USER_ADMIN + ADMIN_RESIDUAL via SUPER_SALES_EXTRA | isSuperSales may only create/edit STAFF (usecase rule) | MATCH |
| Any role + ADMIN/SUPER_ADMIN sub-role | yes (isAdmin) | via sub-role union | same | MATCH |
| Plain STAFF / THREE_D / TWO_D / TWO_D_EXECUTOR / ACCOUNTANT / CONTACT_INITIATOR / base SUPER_SALES | no | no admin codes; only DIRECTORY/PROFILE_* (broad) | self-profile only (self-OR-admin checker) | MATCH |

**Telegram** (`telegram/auth/telegram.routes.js`, router-level `TELEGRAM.MANAGE`):

| Role | master-allowed? | current grants? | object-scope | Verdict |
|---|---|---|---|---|
| ADMIN / SUPER_ADMIN | yes (ADMIN-only gate) | yes — TELEGRAM_ADMIN | none | MATCH |
| all other 7 roles | no | no (not granted; not in SHARED_AUTHED; isSuperSales does not layer it) | — | MATCH |

> NOTE — master baseline says telegram is **ADMIN only**. Current grants `TELEGRAM.MANAGE`
> to both `ADMIN` and `SUPER_ADMIN` base roles. This is **NOT a divergence**: legacy
> `requireRole(["ADMIN"])` runs through `verifyTokenAndHandleAuthorization`, whose isAdmin
> early-return admits `SUPER_ADMIN` (and admin sub-roles / isSuperSales via that same
> union) as an ADMIN-equivalent. SUPER_ADMIN is the studio's super-admin and was always
> admitted where "ADMIN" was required. Test `permissions.test.js` pins MANAGE to exactly
> {ADMIN, SUPER_ADMIN} and denies the other seven. Note isSuperSales is deliberately NOT
> granted telegram here (SHARED_AUTHED/SUPER_SALES_EXTRA omit it) — a narrower-than-legacy
> choice, but it does not widen access, and the FE telegram surface is admin-only, so it is
> not flagged. Verdict for the ADMIN/SUPER_ADMIN rows: MATCH.

### 8. Courses

**Admin courses** (`courses/admin-course.routes.js`, `COURSE_*`): isAdmin union.
**Staff courses** (`courses/staff-course.routes.js`, `STAFF_COURSE.VIEW/TAKE`): all authed.

| Role | master-allowed? (admin) | current grants (admin) | master (staff) | current (staff) | Verdict |
|---|---|---|---|---|---|
| ADMIN / SUPER_ADMIN | yes | COURSE_* base | yes | STAFF_COURSE via SHARED_AUTHED | MATCH |
| SUPER_SALES + isSuperSales | yes (isAdmin) | COURSE_* via SUPER_SALES_EXTRA | yes | yes | MATCH |
| STAFF / designers / executor / accountant / CI / base SUPER_SALES | no (admin) | no COURSE_* | yes | STAFF_COURSE.* (course-role + attempt-scope gate object access) | MATCH |

### 9. Image-sessions

**Admin reference-data** (`image-sessions/admin/*`, `IMAGE_SESSION.ADMIN_VIEW/MANAGE`):
isAdmin union. **Shared session** (`image-sessions/session/*`, `SESSION_VIEW/MANAGE`):
all authed, lead-scoped via the leads checker. `/ids` model-read allow-listed.

| Role | master (admin ref-data) | current (admin) | master (session) | current (session) | Verdict |
|---|---|---|---|---|---|
| ADMIN / SUPER_ADMIN | yes | ADMIN_VIEW/MANAGE base | yes | SESSION_* via SHARED_AUTHED | MATCH |
| SUPER_SALES + isSuperSales | yes (isAdmin) | ADMIN_* via SUPER_SALES_EXTRA | yes | yes | MATCH |
| all other roles / base SUPER_SALES | no (admin) | no ADMIN_* | yes | SESSION_* (lead-scoped by parent-lead checker) | MATCH |

### 10. Staff latest-calls (`/v2/staff`) — `admin-residual/staff/staff.routes.js`

`STAFF.LATEST_CALLS_VIEW` granted to EXACTLY the five legacy STAFF-gate base roles.

| Role | master-allowed? | current grants? | object-scope | Verdict |
|---|---|---|---|---|
| STAFF / THREE_D_DESIGNER / TWO_D_DESIGNER / TWO_D_EXECUTOR / ACCOUNTANT | yes | yes — STAFF_GATE on those five | none | MATCH |
| ADMIN / SUPER_ADMIN / SUPER_SALES / CONTACT_INITIATOR | no | no (not in SHARED_AUTHED; isSuperSales does not layer it) | — | MATCH |

Verified: `admin-residual-permissions.test.js` grants to exactly the five, denies the four,
and asserts isSuperSales does NOT layer it.

### 11. Dashboard / calendar / notifications / questions / sales-stages / reviews / contracts / utilities (SHARED = all authed)

Each surface's code(s) are in `SHARED_AUTHED`, so **every one of the 9 roles** holds them;
row-level data scope is enforced in the usecase (no role split at the code layer).

| Surface (code group) | master-allowed? | current grants? | object-scope | Verdict |
|---|---|---|---|---|
| Dashboard (`DASHBOARD.VIEW`) | ALL 9 | ALL 9 via SHARED_AUTHED | non-admin forced to own `staffId`; isAdmin-tier may pass any/global | MATCH |
| Calendar (`CALENDAR.VIEW/MANAGE/GOOGLE_*`) | ALL 9 | ALL 9 via SHARED_AUTHED | no per-owner row scope in legacy (code is gate); Google self-scoped to req.auth.id | MATCH |
| Notifications (`NOTIFICATION.LIST/MARK_READ`) | ALL 9 | ALL 9 via SHARED_AUTHED | self-scoped to req.auth.id (IDOR fix) | MATCH |
| Questions (`QUESTION.*`) | ALL 9 | ALL 9 via SHARED_AUTHED | global config by code; lead-scoped rows via lead checker | MATCH |
| Sales-stages (`SALES_STAGE.VIEW/MANAGE`) | ALL 9 | ALL 9 via SHARED_AUTHED | lead-scoped via lead checker | MATCH |
| Reviews (`REVIEW.VIEW/CONNECT`) | ALL 9 | ALL 9 via SHARED_AUTHED | frozen OAuth service; v2 never returns tokens | MATCH |
| Contracts (`CONTRACT.*`) | ALL 9 | ALL 9 via SHARED_AUTHED | lead-scoped via lead checker; grouped payments list role-scoped in frozen service | MATCH |
| Utilities (`UTILITY.*`) | ALL 9 | ALL 9 via SHARED_AUTHED | generic-model reads allow-listed + fixed projections | MATCH |

Public client surfaces (`contracts/client`, `calendar/client`, `image-sessions/client`,
`client-portal/*`) are PUBLIC/token-based by design — no code. MATCH.

---

## Intentional tightenings (NOT mismatches)

These four were user-confirmed to KEEP. They tighten (never widen) relative to master.

### T1 — Site-utility → ADMIN/SUPER_ADMIN only

`site-utility/site-utility.routes.js` + `contract-utility/contract-utility.routes.js`.
Codes `SITE_UTILITY_ADMIN` (PDF_CONFIG_*, PAYMENT_CONDITION_*, CONTRACT_UTILITY_*) granted
to ADMIN + SUPER_ADMIN only.

| Role | master-allowed? | current grants? | Verdict |
|---|---|---|---|
| ADMIN / SUPER_ADMIN | yes (SHARED = all authed) | yes — SITE_UTILITY_ADMIN | INTENTIONAL (tighter) |
| all other 7 roles | yes (master: SHARED) | **no** (denied) | INTENTIONAL |

Justification: legacy `/site-utilities` sat behind SHARED auth (any authed role could
read/mutate PDF config, payment conditions, contract boilerplate); the FE pages are
@admin/@super_admin. Deliberate security fix, documented in `permissions.constants.js` and
`role-permissions.js`. Does not widen — it removes access from 7 roles.

### T2 — Reviews OAuth token exposure closed

`reviews/reviews.route.js` role grants are unchanged (all 9 authed, MATCH above). The
tightening is response-shape only: the legacy OAuth callback returned the raw `tokens`
object; v2 returns `{ connected: true }`. INTENTIONAL — not a role/access change, a
data-exposure fix. No matrix row changes.

### T3 — Object-scope checkers added where master had none (IDOR fixes)

leads / projects / contracts / image-sessions / questions / sales-stages / notifications /
dashboard / users self-profile. These NARROW row-level access for scoped roles that legacy
left open (e.g. legacy `/:id/...` sub-resources had no scope check; dashboard trusted a
client `staffId`; notifications trusted a client `userId`; self-profile had no ownership
check). Admin-tier behavior is preserved 1:1 (admins keep full scope), so no role that
master allowed is denied at the code layer — only cross-object IDOR reach is closed.
INTENTIONAL. Each is asserted by a usecase test (e.g. `projects.security-fixes.test.js`,
`user.usecase.test.js`, `dashboard.usecase.test.js`, `notifications-utilities.usecase.test.js`).

### T4 — Generic-model read/archive allow-lists

`UTILITY_MODEL_ALLOWLIST` + `UTILITY_MODEL_PROJECTIONS` (utilities generic reads) and
`ADMIN_ARCHIVE_MODEL_ALLOWLIST` (admin model-archive). Legacy did open `prisma[model]`
mass-read/mass-mutate on any client-supplied model name; v2 restricts to a fixed set of
global image-session reference tables with fixed projections. INTENTIONAL — closes a
mass-assignment/mass-read hole; the permission code and role grants are unchanged.

---

## Result

- **MATCH rows:** every module surface for every applicable role (see tables above) —
  all authenticated-surface, admin-tier, accountant-only, and staff-gate splits reproduce
  master exactly.
- **INTENTIONAL:** T1 (site-utility admin-only, 7 roles tightened), T2 (reviews token
  hiding), T3 (object-scope IDOR checkers across 9 domains), T4 (model allow-lists).
- **MISMATCH:** **ZERO.** No role that master allowed is denied by current code, and no
  role is granted access master denied, outside the four intentional tightenings.

### Evidence for the zero-mismatch conclusion

1. Every route `requirePermissions([...])` code (33 route files, ~200 routes) maps to a
   code in `role-permissions.js`, and every code's grant set equals its documented legacy
   gate (the behavior-preserving comments in `permissions.constants.js` +
   `role-permissions.js` are the migration team's per-code legacy-route record).
2. The object-scope full-scope sets in the usecases match master: leads/projects full-scope
   = isAdmin union + ACCOUNTANT read (+ CONTACT_INITIATOR lead-detail read); accounting has
   no scope; dashboard/notifications/self-profile force self for non-admins.
3. All 9 shared role→code test files + the per-module usecase-scope tests pass, pinning the
   grants (incl. the negative assertions: accounting denied to ADMIN/isSuperSales; staff
   latest-calls denied to ADMIN/SUPER_ADMIN/SUPER_SALES/CONTACT_INITIATOR; telegram pinned
   to ADMIN/SUPER_ADMIN only; admin-residual denied to plain non-admin roles).
4. Full suite: **610 passing / 40 files** (baseline unchanged — no code fix was required).

**No `role-permissions.js` or checker change was needed:** the current authorization already
matches master role-for-role, with only the four confirmed intentional tightenings applied.

---

## Addendum (2026-07-03) — DB-relational permissions & switchable profiles

The authorization SOURCE moved from the code-defined role→codes map to DB tables
(`PermissionCode`/`Profile`/`ProfilePermission`/`UserProfile`), resolved from the user's
**current profile** via an in-process cache. The `/auth/me` contract is unchanged
(`permissions[]`, `permissionsByModule{}`, `navigationTabs[]`, `role`, `profile`) and only
extended (`profiles[]`, `currentProfileId`). Design: `2026-07-03-db-relational-permissions-design.md`.

**Parity preserved for single-profile users.** The catalog seed builds `ProfilePermission`
from the SAME code-defined `PROFILES` map that master resolved, so a user who resolves to one
profile (every user with no `subRoles`) has a byte-identical active code set. The middleware
also keeps a TRANSITIONAL legacy fallback: a token minted before `currentProfileId` existed, an
unmigrated user, or a missing cache entry resolves via the old code-map (so a deploy never
locks anyone out; the next refresh mints a currentProfile-bearing token).

**One intentional divergence — current-profile-only.** Effective permissions are the CURRENT
profile's codes, NOT the union of `role ∪ subRoles ∪ superSalesExtras`. A multi-role user (base
role + `subRoles`) now holds one profile per role and **switches** between them instead of
holding both sets at once; admin-tier object scope (`isAdminTier`/`isAdminUser`) and the sidebar
follow the active profile too. This changes the at-any-moment set ONLY for users who today rely
on a `subRole` union. Quantify the blast radius on prod before/after rollout:

```sql
SELECT COUNT(*) AS users_with_subroles
FROM (SELECT userId FROM UserSubRole GROUP BY userId) t;
```

If that count is 0 (or those users accept switching), observable access is identical to master.
The divergence is a deliberate, documented product decision (the switchable-profile model), not a
regression.

**Tests.** Full monorepo suite **738 passing / 57 files** after the change, incl. the shared
role→code parity files, the `getEffectivePermissions` old-universe parity matrix, the profile
cache resolver, the middleware fallback, and the switch/assign authorization tests. A real-DB
end-to-end check confirmed a STAFF+subRole(ACCOUNTANT) user migrates to `[PRIMARY_SALES,
ACCOUNTANT]` (current PRIMARY_SALES, 91 codes) and switching to ACCOUNTANT yields 105 codes incl.
`accounting.salary.view`.

---

## Addendum 2026-07-12 — My Day work queue (additive; no parity impact)

Two NEW permission codes were added for the My Day feature (`docs/superpowers/specs/2026-07-12-my-day-work-queue-design.md`). Both are **purely additive** — a brand-new surface with no master equivalent — so they do not change any existing role's access:

- **`my_day.view`** — the personal action queue. Granted to NORMAL_SALES, PRIMARY_SALES, SUPER_SALES (+ SUPER_SALES_BASE) and the three designer profiles (DESIGNER_3D / DESIGNER_2D / EXECUTOR_2D). **NOT granted to ADMIN/SUPER_ADMIN** (admins take no assigned leads → no personal queue), nor to ACCOUNTANT / CONTACT_INITIATOR.
- **`my_day.team.view`** — the supervisor team lens + drill-down. Granted to SUPER_SALES (+ SUPER_SALES_BASE) and ADMIN / SUPER_ADMIN only.

Object scope on the drill-down (`GET /v2/my-day/users/:userId`): a `requireSpecialChecker` throws `MY_DAY_TEAM_SCOPE_DENIED` (403) when a SUPER_SALES supervisor targets a non-sales-tier user; admins may target anyone. No existing route's guard changed. Money boundary preserved (the team lens never reads Payment/ContractPayment/Outcome — same as command-center).

---

## Addendum 2026-07-15 — Productivity pass (2 additive grants + 1 documented contract change + 1 display truth fix)

Spec: `docs/superpowers/specs/2026-07-15-my-day-preview-productivity-pass-design.md`.

1. **`my_day.view` → ACCOUNTANT profile/role (additive, no data widening).** The accountant collections queue in My Day. Accountants already hold **full lead read scope** (`FULL_SCOPE_ROLES` in `lead.repo.js`) — this adds a *surface* (a queue view over leads with DUE `ContractPayment`s via the engine's dormant ACCOUNTANT ruleset), not new data. Nav `my-day` row gains ACCOUNTANT.
2. **`my_day.view` → CONTACT_INITIATOR profile/role (additive, no data widening).** The first-touch queue: their OWN claimed leads + the unclaimed NEW pool (which initiators already read via the lead view scope's claimable-pool clause). Nav row gains CONTACT_INITIATOR.
   - `my_day.team.view` unchanged for both (still SUPER_SALES + admins only; route-tested 403).
   - **Deploy note:** the DB-relational `ProfilePermission` rows come from the idempotent seed — run `node packages/db/prisma/seed.js` after deploy so the two profiles pick up the code (the code-map fallback covers un-migrated environments meanwhile).
3. **⚠️ Contract change (intentional, D2 "required with escape"):** `PUT shared/client-leads/call-reminders/:id` and `.../meeting-reminders/:id` — marking `DONE`/`MISSED` on the **last** future touchpoint of an **ACTIVE** lead now requires `next: {type,time,reason?}` (atomically schedules the follow-up) or `noFollowUp: {reason}` (persisted as a lead note), else **422 `NEXT_TOUCH_REQUIRED`**. Master allowed silent closes. Exemptions: non-active lead statuses, non-last touchpoints. FE (`CallResultDialog`) ships the new section in the same change; no other caller exists (verified: only the lead routes reach these usecases; the public booking site books via the calendar module).
4. **Display truth fix:** the preview's payment chip no longer renders the inert `ClientLead.paymentStatus` (never updated by app code — study G2); it renders the `ContractPayment`-derived `health.payment` (and is hidden pre-contract). The dead `PAYMENT_OVERDUE` engine predicate was replaced by a real date-based rule (`ContractPayment.dueDate`). `health.paymentStatus` stays in the payload for back-compat.

Verification: full suite **988/988** green (incl. updated nav-parity fixtures documenting the two nav rows) + `next build` compiled OK.

---

## Addendum 2026-08-18 — audited contract-stage repair (additive; no parity impact)

`contract.stage.override_status` was added for the new dedicated
`POST /v2/contracts/:contractId/stages/:stageId/actions/override-status` data-repair action.
It is present only in the `ADMIN` and `SUPER_ADMIN` profiles through `ALL_PERMISSIONS`; it is
absent from `SHARED_AUTHED` and `SUPER_SALES_EXTRA_PERMISSIONS`, so no existing shared-contract
role gains the action. The endpoint also retains lead mutate-scope and stage-to-contract ownership
checks, requires a repair reason, and writes `CONTRACT_STAGE_STATUS_OVERRIDDEN` to the action audit
trail. The normal stage edit remains limited to delivery-day fields.
