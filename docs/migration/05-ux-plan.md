# Dream Studio — UX/UI Redesign Master Plan

> Authoritative redesign plan (supersedes the 2026-06-06 forward-looking stub). Aligned with
> `07-decisions-resolved.md`. Date: **2026-06-08** · Branch: `server-migration`.
>
> Stack verified in code: Next.js 16 App Router · React 19 · MUI v7 + Emotion +
> `stylis-plugin-rtl` · single-language **Arabic / RTL** · custom `ApiFetch` (no axios) ·
> MUI `<Table>` (no DataGrid).
>
> **Build philosophy (user "Option A", 2026-06-08):** the 11 foundation features have a
> working, fixed data spine (`service → hook → permission gate → message resolver`) behind a
> deliberate "wiring smoke-screen" UI. The redesign is **purely presentational** on top of a
> fixed contract — no API/wiring/schema changes. Each redesigned screen, when it lands,
> **retires its matching legacy `@<role>` slot** (per-screen legacy removal, not a big cutover).

## 0. Ground truth (what actually exists today)

- **`usePermission()` is built and reads real codes** (`ui/src/app/v2/hooks/usePermission.js`):
  `hasPermission`, `hasAnyPermission`, `hasAllPermissions`, `hasPermissionByModule`, off
  `user.permissions[]` / `user.permissionsByModule{}`. **No role-fallback shim** (decision #4) —
  gate on codes only.
- **The FE permission mirror is complete** for all 23 modules
  (`ui/src/app/v2/config/permissions.js`). Use `PERMISSIONS.<MODULE>.<CODE>`.
- **Seven features have full redesigned-style screens** (the visual/interaction baseline to copy):
  chat, siteUtility, leads (`LeadsPage.jsx` list + `leadsDetails/LeadDetailsPage.jsx` URL-tab
  detail), projects/tasks, accounting (`AccountingPage.jsx` — `?view=` permission-gated tabs),
  calendar (+ `PublicBookingPage.jsx`), contracts (`ContractDetailPage.jsx` +
  `PublicContractSignPage.jsx`).
- **Eleven foundation features have a proven data spine but only "wiring smoke-screen" UI**
  (e.g. `DashboardPage.jsx` renders `JSON.stringify`, `UsersPage.jsx` is a bare table). Each has a
  single-caller `*.service.js`, a `config/constant.js` documenting the exact endpoint contract, a
  `config/*Messages.js` CODE→Arabic resolver, and a permission gate.
- **No app shell exists yet**; v2 feature pages are standalone components **not yet wired into App
  Router `page.jsx` files**. Wiring the shell + routes is net-new work.
- **The legacy IA is 7 parallel `@<role>` route slots**
  (`ui/src/app/(auth)/dashboard/(dashboard)/@admin|@staff|@super_admin|@super_sales|@accountant|@threeD|@twoD|@contact_initiator/...`)
  with hardcoded English link arrays + a nested role ternary. This is what we collapse into ONE
  permission-gated shell.
- **Theme is solid** (`ui/src/app/v2/providers/theme.js` + `ui/src/app/helpers/colors.js`): caramel
  palette, Noto Kufi Arabic type scale, generated shadows, custom `xxl` breakpoint, MUI overrides.
  Gaps: no `theme.palette.status.*`; `primary #d4a574` on white ≈ 1.8:1 (fails text contrast —
  accent/fill only).

### Decisions baked in (from `07`)
- API base is permanent `/v2`; lists return `{ items, total, page, pageSize }`; scoped lists attach
  per-record `capabilities.*`; **gate on permission code + capability, never role**. Display-only
  `activeRole`/`isSuperSales` exist on `auth/me` for the role chip.
- Client surfaces (booking, contracts, image-session) live **in this app under a `(public)` route
  group**, token-based, ungated.
- Collapse the `@<role>` slots into one permission-gated nav **during the shell/foundation step**.

---

## 1. Information architecture & app shell (P0 — unblocks everything)

### 1.1 One capability-driven nav, not seven role slots

Single declarative config `ui/src/app/v2/features/shell/nav.config.js`:
`{ key, labelKey, href, icon, permission|anyPermission[], group, children? }`

- `labelKey` resolves through the Arabic message map (no inline visible strings in logic).
- An item renders **iff** `usePermission().hasPermission(permission)` (or `hasAnyPermission`) — the
  **same predicate that gates the page and the action button**. Nav never offers a 403.
- `group` buckets the side-nav into role-meaningful sections; each persona sees only their groups.

**Proposed groups → items → gate** (codes verified in `permissions.js`):

| Group (Arabic) | Item | Route | Gate |
|---|---|---|---|
| الرئيسية | لوحة التحكم | `/v2/dashboard` | `dashboard.view` |
| | الإشعارات | `/v2/notifications` | `notification.list` |
| | المحادثات | `/v2/chat` | `chat.room.list` |
| المبيعات | العملاء المحتملون | `/v2/leads` | `lead.list` |
| | المشاريع (إدارة) | `/v2/admin/projects` | `admin_residual.project.view` |
| | العمولات | `/v2/admin/commissions` | `admin_residual.commission.view` |
| الإنتاج | المشاريع | `/v2/projects` | `project.list` |
| | المهام | `/v2/tasks` | `task.list` |
| | جلسات الصور | lead tab + `/v2/image-sessions/admin` | `image_session.session.view` / `image_session.admin.view` |
| المالية | المحاسبة | `/v2/accounting` | any `accounting.*` |
| | العقود — الدفعات | `/v2/contracts/payments` | `contract.payment.list` |
| التعلّم | دوراتي | `/v2/my-courses` | `staff_course.view` |
| | إدارة الدورات | `/v2/courses` | `course.view` |
| الإدارة | المستخدمون | `/v2/users` | `user.list` |
| | إعدادات الموقع | `/v2/site-utilities` | `site_utility.pdf_config.view` |
| | المراجعات | `/v2/reviews` | `review.view` |
| | التقارير | `/v2/admin/reports` | `admin_residual.report.generate` |
| | أدوات | `/v2/utilities` | any `utility.*` |

Lead-scoped sub-tools (sales-stages, questions/SPIN/VERSA, image-sessions, contracts) are **not
top-level nav** — they live as **tabs inside the lead/project detail** (matching how
`LeadDetailsPage.jsx` already composes tabs). Biggest IA simplification: production/sales tools
reach the user *in context of the record*, not as orphan menu items.

### 1.2 Shell layout

Persistent **side-nav (start side, RTL = right) + top context bar**, replacing the top-only AppBar
overflow nav (`Navbar.jsx`).

```
RTL (start = right):
+------------------------------------------------------------------+
| TopBar: [logo]   breadcrumb: قسم ‹ صفحة      [bell][roleChip][me] |
+----------------+-------------------------------------------------+
| SideNav        | PageHeader: H1 + roleChip + [primary CTA]       |
| (grouped,      |-------------------------------------------------|
|  capability-   | Content (list / detail-tabs / wizard)           |
|  filtered)     |                                                 |
+----------------+-------------------------------------------------+
```

- Side-nav: full on `lg+`, icon-rail on `md`, temporary `Drawer` on `xs`.
- TopBar identity cluster (end): `NotificationBell` (live unread from `notifications.service`),
  **role chip** (`activeRole` + `isSuperSales`), profile/logout.
- Next `<Link>` client transitions; active state from `usePathname()` exact/segment match.
- `(public)` client surfaces get a **minimal logo-only header** (no nav, no auth).

### 1.3 Persistent orientation (non-negotiable)

Every authed screen answers **who am I / where am I / what now**: (1) role chip in PageHeader;
(2) breadcrumb in TopBar; (3) page H1 in plain Arabic; (4) one primary CTA, header end-aligned,
capability-gated.

---

## 2. Global patterns (build once in `v2/shared/components`, reuse everywhere)

- `<PageHeader title roleChip primaryAction breadcrumbs />`
- `<SectionCard title actions>` (theme `MuiCard`, radius 12)
- `<DataTablePage>` — the leads-list pattern extracted (toolbar search + filter Selects,
  `<Table size="small">`, `<TablePagination labelRowsPerPage="عدد الصفوف">`, capability-gated row
  actions, the five states). **Canonical list pattern** — no parallel table.
- `<UrlTabs>` — the `?tab=`/`?view=` pattern (tab set filtered by capability, active tab in the URL).
- `<StatusChip status domain="lead|contract|payment|task|session" />` — one component reading a new
  `theme.palette.status.*` map (folds scattered `STATUS_COLORS`). Always carries a text label.
- `<StageStepper stages current />` — MUI `Stepper`, RTL-mirrored (lead sales-stages, contract
  lifecycle, image-session steps).
- **Five canonical states** (`v2/shared/components/states/*`): Loading (skeletons matching layout),
  Empty (icon + plain-Arabic explanation + single next-action CTA, role-aware), Error (plain cause +
  retry off `useRequest` error + the resolver), PartialPermission (show what the role can see; block
  actions hidden/disabled-with-reason, never a 403 button), Success (explicit confirmation + next step).
- **Create/edit modal**: `AppForm` + react-hook-form, opened via `useOverlay`, success → toast
  (`useToast` + message-code resolver) → list `refetch()`. Mirror the leadsDetails dialogs.
- **RTL**: logical props only (`ms`/`me`, `paddingInlineStart/End`, `textAlign:'start'`), mirror
  directional icons, `Drawer anchor="right"`.
- **Toast/feedback**: every mutation resolves its envelope `message` CODE → Arabic toast; long ops
  (PDF) show a blocking progress state, not a frozen button.
- **A11y (WCAG 2.2 AA)**: root `<html lang="ar" dir="rtl">`; target size ≥ 24×24px (2.5.8); visible
  focus ring ≥ 3:1 (2.4.13); focus not obscured by sticky TopBar (2.4.11); status/toasts as live
  regions (4.1.3); add an accessible on-light primary-text token (caramel fails 4.5:1).

---

## 3. Per-feature screen inventory (foundation features)

For each: screens, key states, gates (verified), service fns consumed, reusable pattern.
**Bespoke flows flagged ★.**

### 3.1 Dashboard — `/v2/dashboard`
Service `dashboard.service.js` (9 reads, all `dashboard.view`; BE self-scopes; admin may pass `staffId`).
Role-adaptive home, **action-queue-first**: "يحتاج انتباهك" queue (`getLatestLeads` +
`getRecentActivities` + role rows, each a deep link to its next action); KPI cards (`getKeyMetrics`);
leads status (`getLeadsStatus`); designer board (`getDesignerMetrics`); charts (monthly/week/emirates/
overview) tertiary. Filter: date range + (admin) `staffId`. States: skeleton cards; "كل شيء على ما
يرام" empty queue; partial-permission shows only returned scope; per-widget error+retry.

### 3.2 Notifications — `/v2/notifications`
Service `notifications.service.js` (`list`/`listUnread`/`markRead`; self-scoped; paginated).
Dropdown panel (bell) + full list with All/Unread `UrlTabs`. "تحديد الكل كمقروء" (`markRead`, empty
body) gated `notification.mark_read`; row deep-links to source. Unread emphasis; empty "لا توجد
إشعارات"; skeleton rows.

### 3.3 Image-sessions — 3 surfaces ★
Service `imageSessions.service.js`.
1. **Admin reference-data CRUD** `/v2/image-sessions/admin` — `image_session.admin.view/manage`.
   `UrlTabs` (images[paginated]/page-info/colors/spaces/materials/styles), each = `DataTablePage` +
   modal. **★ Pros-&-cons reorder** (drag → `reorderProsCons` `POST /pros-and-cons/order`, optimistic
   + revert-on-error; delete carries `{itemType}`).
2. **Lead-scoped session management** — tab inside lead detail (`?tab=sessions`),
   `image_session.session.view/manage`. `listSessions`/`createSession`/edit/delete; **regenerate
   token** with "نسخ الرابط" + old-link-dies warning. Gate on codes (no `capabilities.*`).
3. **★ Public client image-selection** `(public)/image-session?token=` — UNGATED, token IS auth.
   Stepper wizard via `SESSION_STATUS_FLOW` (`imageSessionsConstants.js`): الألوان → الخامات → الطرز
   → الصور لكل مساحة → معاينة → التوقيع → PDF. Token-authoritative saves; final signature pad →
   `generatePdf({sessionData,signatureUrl,sessionStatus})` with **blocking "جارٍ إنشاء الملف…"**
   (synchronous frozen PDF) → success + download. Mirror `PublicContractSignPage.jsx`.

### 3.4 Courses / LMS — admin authoring + staff learner ★
**Admin** `/v2/courses` (`course.view/manage/access.manage/attempt.manage`): course list +
LMS dashboard; **course editor** (`UrlTabs`: Lessons/Tests/Access; lesson nests videos/video-PDFs/
PDFs/links). **★ Question reorder** (`reorderQuestions`). **★ Access editor** (allowed roles + per-
lesson grant/revoke). **★ Attempts admin** (summaries, +1/−1 attempt, per-answer `approveAnswer`).
**Staff** `/v2/my-courses` (`staff_course.view/take`): catalogue + progress; lesson player →
`markLessonComplete`; homework submit; **★ test-taker** (`startAttempt` → paged `getTestQuestions`,
per-answer `submitAnswer` autosave, optional timer, `endAttempt`, result/"بانتظار التصحيح"; resume
in-progress via `getAttempt`; UI attempt-limit but trust server). Note: the BE preserves the legacy
misspelling `attampts` on some staff/admin paths — the service already encodes it faithfully.

### 3.5 Questions (SPIN + VERSA) — lead-detail tabs ★
Service `questions.service.js` (lead-scoped). **★ SPIN** (`?tab=spin`): type selector
(`getQuestionTypes`), per-type list (`getSessionQuestions`), inline answer (`submitAnswer`) or **bulk**
(`submitBulkAnswers`); custom question (`createCustomQuestion`). **★ VERSA** (`?tab=versa`): category
list (`getVersaCategories`) → steps (`getVersaByCategory`); create (`createVersa`); edit step
(`updateVersaStep`) as an editable objection→response accordion.

### 3.6 Sales-stages — lead-detail header ★
Service `salesStages.service.js` (`sales_stage.view/manage`). **★ Stage stepper** in the lead-detail
header using `SALES_STAGE_TYPES` (10 stages). `advanceStage({key})` = primary CTA "المرحلة التالية:
…"; `rollBackStage({currentStageType})` = secondary "رجوع" (via `POST /:clientLeadId/actions/set-stage`).
`NOT_INITIATED` = pre-first hop.

### 3.7 Reviews — `/v2/reviews`
Service `reviews.service.js` (`review.view/connect`). **Frozen quirk**: OAuth redirect URI is a stale
dev placeholder with empty creds — connect is effectively non-functional. Present read-only: location
picker (`getLocations`) → reviews cards (`getReviews`). Empty/error must explain "الربط مع Google غير
مُفعّل" gracefully.

### 3.8 Users / admin user-management — `/v2/users` ★
Service `users.service.js`. **List** (`listUsers`, paginated, rows carry `capabilities.*`):
`DataTablePage`, search/filter, status chip, capability-gated row actions. **Create** modal
(`createUser`). **★ User editor** (tabs): Profile (`getProfile`/`updateProfile`, self-or-admin);
Account (`updateUser`, `changeStatus`); **Roles editor** (`manageRoles`, added/removed diff);
**★ Auto-assignments** (`get/updateAutoAssignments`, dual-list); Restricted countries
(`updateRestrictedCountries`); Max-leads/per-day (`setMaxLeads`/`setMaxLeadsPerDay`); **staff-extra**
(`setStaffExtra` — `isPrimary`/`isSuperSales` toggles); Logs (`getUserLogs` — `user.view_logs`) +
Last-seen (`getUserLastSeen` — `user.view_last_seen`). Capability-driven states.

### 3.9 Utilities — `/v2/utilities`
Service `utilities.service.js`. **★ Global search** (`search()` cross-model) usable from the TopBar;
fixed-data list (`listFixedData`); daily user-log submit (`submitUserLog`); model/pick-list readers
(`getModel`/`getModelIds`/`readModelLabel`, consumed by other features). Build search + user-log
form; the rest are helpers.

### 3.10 Admin residual — `/v2/admin/*` ★
Service `adminResidual.service.js` (`admin_residual.*`, admin-tier). **★ Report builders**
`/v2/admin/reports` (lead/staff: filter form → `generate*Data` preview → `generate*Excel`/`*Pdf`;
**needs a net-new blob-download helper** around the JSON-only `ApiFetch`; frozen generators
untouched). Admin leads ops (bulk `importLeads` multipart w/ progress, `createNewLead`,
`updateLead`/`updateClient` dynamic edits, admin-only delete — **don't widen**, Telegram create/
assign). Commissions (`listCommissions` + create/edit). Admin projects (`listAdminProjects` + create
project-group). Fixed-data writes + model archive. Reuse `DataTablePage` + `AppForm`.

---

## 4. Role-journey maps (where the old slot UI lost people)

| Persona | Journey | Old pain | Redesign fix |
|---|---|---|---|
| **Staff / Super-sales** | Dashboard "يومي" → leads (mine/due) → lead detail: SPIN/VERSA, stage stepper, calls/notes/offers → contract → image-session link | "Leads vs Deals vs On-hold" unexplained; no next step; super-sales power invisible | Stage stepper names the next action; staff-extra → "مبيعات أول" chip; one self-scoped leads screen |
| **Designer / Executor** | Dashboard "مهامي" (todo/in-progress/blocked/done from `getDesignerMetrics`) → task detail w/ project stepper → advance status | Flat "Work stages", dup icons/typos; no "which blocks"; status change not framed | Kanban-by-status; status advance = primary CTA; project stepper |
| **Accountant** | Finance cards → accounting `?view=` (payments/overdue/paid/expenses/rents/salaries/outcome) → record payment | Landing unlabeled; overdue/paid/outcome scattered | Mostly solved in `AccountingPage.jsx`; add finance-summary cards deep-linking each view |
| **Contact-initiator** | "عملاء بانتظار التواصل" queue → one action/row | One screen, no framing | Role-aware queue copy + one CTA/row |
| **Admin** | Dashboard "يحتاج انتباهك" → grouped nav → reports/commissions/users | Generic dashboard, flat nav, no breadcrumb | Action queue + grouped capability nav + breadcrumb |
| **Client (public)** | Booking / e-sign / image-selection — linear, token-based, RTL | Redirect stub; unframed | Stepper wizards ("الخطوة X من Y") + signature/PDF confirmation + success — pattern proven in `PublicContractSignPage.jsx` |

---

## 5. Phased build order (dependencies first; each redesigned screen retires its legacy slot)

**Phase 0 — Shell & primitives (P0, blocks everything).** `nav.config.js` + `AppShell` (side-nav +
TopBar + role chip + breadcrumbs); wire v2 feature pages into App Router `page.jsx`; `<html lang dir>`;
the five state components; `PageHeader`/`SectionCard`/`StatusChip`/`StageStepper`/`DataTablePage`/
`UrlTabs`; `theme.palette.status.*` + accessible-primary-text token. *Removal trigger:* once a route
renders in the new shell, delete the matching `@<role>` slot.

**Phase 1 — High-traffic, mostly-data screens:** Notifications, Users, Dashboard (action-queue + cards).

**Phase 2 — Lead-context tools** (compose into lead-detail tabs): Sales-stages stepper, Questions
(SPIN + VERSA), lead-scoped Image-sessions tab.

**Phase 3 — Bespoke client + LMS flows:** Image-session client wizard ★, LMS test-taker ★ + admin
authoring/attempts ★. Reuse the public-contract signature/PDF pattern.

**Phase 4 — Admin residual** ★: report builders (+ blob-download helper), bulk import, commissions,
admin-projects, fixed-data/archive. Plus Reviews and Utilities/global-search.

**Per-screen Definition of Done (UX):** (a) user can state role + location from the screen alone;
(b) one obvious primary action; (c) all five states; (d) nav + page + action share one `usePermission`
predicate; (e) RTL logical spacing + AA contrast + ≥24px targets; (f) zero raw visible strings (Arabic
message map); (g) the matching legacy `@<role>` slot is deleted.

---

## 6. Open questions for the user

1. **Charts library** for the dashboard secondary tier — keep the legacy one or standardize?
2. **Canonical Arabic role-chip labels** for each `UserRole` + sub-roles + `isSuperSales`.
3. **Global search** (`utilities.search` in the TopBar) — Phase 1 or Phase 4?
4. **Reviews** — confirm read-only presentation + a graceful "Google link not configured" state
   rather than redesigning the frozen, non-functional OAuth connect.
