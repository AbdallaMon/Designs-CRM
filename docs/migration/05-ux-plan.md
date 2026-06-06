# Dream Studio — UX & Layout Improvement Plan

> Forward-looking UX plan to ride alongside the architecture migration. Read-only analysis; no code changed.
> Companion to `docs/migration/01-current-audit.md`. Date: 2026-06-06 · Branch: `server-migration`
> Stack: Next.js 16 App Router · React 19 · MUI v7 · Emotion + `stylis-plugin-rtl` · Arabic-first RTL · custom `ApiFetch` (no axios), custom tables (no MUI X DataGrid).

> **Decision note (added in synthesis):** The project has decided to **drop the bilingual i18n layer** and ship a **single Arabic (RTL)** UI. Where this plan says "i18n keys / `translate()` / next-intl", read it as **"a single-language Arabic string source (message-code map), no language toggle"**. The structural recommendations (role clarity, IA, states) are unaffected. See `04-frontend-plan.md` §5 for the i18n removal plan and `06-reconciliation.md`.

## Executive summary

Dream Studio is a complex multi-role workflow system (admin, super-admin, super-sales, staff, 3D/2D designers, executor, accountant, contact-initiator, plus client-facing) where the dominant UX failure is **role and orientation ambiguity**: users land on a role-specific parallel route with no on-screen statement of who they are, where they are, or what to do next. Navigation is hardcoded per role in English labels inside an Arabic-first RTL app (`layout.jsx:34-288`), switched by a brittle nested ternary, with no permission/capability layer (`usePermission` does not exist yet). The token system is solid (caramel palette in `colors.js`, full MUI theme in `v2/providers/theme.js`) but status colors are fragmented across three maps, and the document root lacks `lang`/`dir`. This plan prioritizes (P0) a role-aware app shell with persistent identity, breadcrumbs, and a config-/permission-driven nav, plus standardized screen states; (P1) per-flow redesign of login, dashboards, leads, contracts, image-sessions, chat; (P2) polish and density. Every recommendation is compatible with the `features/<x>` + `usePermission` model and lands feature-by-feature, not big-bang.

---

## 0. Current state — what exists and where it falls short

**Reusable building blocks (keep and build on):**
- Token system: `ui/src/app/helpers/colors.js` (caramel/cognac palette, status maps) + full MUI theme `ui/src/app/v2/providers/theme.js` (palette, typography scale, shadows, component overrides, custom `xxl` breakpoint).
- v2 feature scaffold: `ui/src/app/v2/features/auth/*` (clean service/validation/constants/components/pages/hooks), `ui/src/app/v2/features/leads/*` (partial), `ui/src/app/v2/shared/form/{AuthForm,FormField}.jsx`, `ui/src/app/v2/hooks/{useRequest,useToast,useLoading,useOverlay,useUpload}.js`, feedback overlays in `ui/src/app/v2/shared/components/feedback/*`.
- Providers: `ui/src/app/v2/providers/*` (Auth, Language, LanguageSwitcher with RTL Emotion cache, MUI, Socket, Toast, Uploading).
- App shell: `ui/src/app/UiComponents/utility/Navbar.jsx` (top AppBar + overflow "More" menu + mobile drawer).

**Where it falls short (cited):**
- **No role/orientation signal.** `(auth)/dashboard/(dashboard)/layout.jsx:289-360` selects a parallel route by role via a deeply nested ternary, renders `Navbar` + content, but nothing tells the user their role, name, or current location. `if (!user || !user.activeRole) return null;` (line 303) renders a blank screen during auth validation — no loading state.
- **Nav is hardcoded, English, role-coupled.** `layout.jsx:34-288` defines `adminLinks`, `staffLinks`, etc. as static English arrays ("Dashboard", "Work stages", "Quantity calcualtion department" [sic]) in an Arabic-first RTL app. Role→links and role→content are two separate ternaries that can drift.
- **No permission layer on the FE.** Grep for `usePermission|hasPermission|capabilities` returns nothing. Visibility is role-string only — incompatible with the audit's permission-code target (§6) and impossible to gate per-action.
- **Anchor-based nav** (`component="a"` / `href`) causes full reloads instead of client transitions; active state is `pathname.includes(link.active)` (fragile substring match) — `Navbar.jsx:99`.
- **Overflow nav by pixel math.** `Navbar.jsx:59-77` estimates 140px/link to decide overflow — unreliable for variable-length Arabic labels.
- **`console.log(user, "suer")` left in the layout** (`layout.jsx:302`).
- **Client app is a redirect stub** — `ClientPage.jsx` just `window.location.href = "https://ahmadmobayed.com/"`; the client-facing booking/contract/image-session flows live elsewhere and need their own role-clarity treatment.
- **Status color fragmentation:** `STATUS_COLORS`, `NotificationColors`, `contractLevelColors` are three separate hex maps in `colors.js` outside the theme, none tied to `theme.palette`.
- **Root `<html>` lacks `lang`/`dir`** (audit §1) — RTL applied only at Emotion/MUI layer, hurting SSR/screen-reader correctness.

---

## 1. Per-role journey maps & "what do I do now?" moments

For every role, the shell must always answer: **Who am I? Where am I? What's my job here? What's next?** Below: each role's primary job, where they get lost today, and the target guided moment.

### 1.1 Admin / Super-Admin
- **Primary job:** oversee the pipeline — leads → deals → contracts → projects/work-stages → payments; manage users; read reports.
- **Gets lost:** lands on a generic dashboard with no "what needs me now"; nav has ~9 top items + nested work-stage sublinks with near-identical icons (`FiBriefcase` repeated) and typo labels; no breadcrumb when deep in `deals/[id]` or `work-stages/study`.
- **Target moment:** dashboard opens with an **"Needs your attention"** action queue (unassigned leads, contracts awaiting countersign, overdue payments, stalled projects), each row a one-click deep link. Persistent breadcrumb + section title on every inner page.

### 1.2 Super-Sales / Staff (sales)
- **Primary job:** work assigned leads through sales stages, log calls/notes, push toward contract.
- **Gets lost:** "Leads" vs "Deals" vs "On hold" vs "All deals" distinction is unexplained; no indication which leads are *mine and due today*. Super-sales differs from staff only by an extra "Users" link (`superSalesLinks`, `layout.jsx:194-197`) — the elevated capability is invisible.
- **Target moment:** dashboard = **"My day"**: leads needing a call today, leads with no activity in N days, next scheduled meetings. Each lead detail header states the **current sales stage** and the single next action ("Log call outcome" / "Send price offer").

### 1.3 3D / 2D Designers & Executor
- **Primary job:** progress assigned work-stages/tasks (study, 3D, modification, final plan, quantity) to the next status.
- **Gets lost:** designer nav is a flat "Work stages" with sub-departments; no sense of *which task is blocking* or *what's assigned to me vs the team*. Status transitions aren't framed as "your next step."
- **Target moment:** dashboard = **"My tasks"** grouped by status (To do / In progress / Blocked / Done) with the primary CTA being the status advance. Task detail shows a stage stepper so the designer sees where the project is in the pipeline.

### 1.4 Accountant
- **Primary job:** track payments (paid/overdue/3D-status), expenses, rents, salaries, monthly outcome.
- **Gets lost:** landing route is `/dashboard` = "Payments" (`accountantLinks[0]`, `layout.jsx:266`) but the heading won't say so; overdue vs paid vs outcome are separate pages with no summary roll-up.
- **Target moment:** dashboard = **financial summary cards** (overdue total, due this week, this month's outcome) each linking to its filtered list; clear "Record payment" primary action.

### 1.5 Contact-Initiator
- **Primary job:** the narrowest role — initiate first contact on new leads (single nav item, `contactInitiatorLinks`, `layout.jsx:191-193`).
- **Gets lost:** with one screen and no framing, it's unclear this is a triage queue.
- **Target moment:** a focused **"New leads to contact"** queue with one action per row; explicit empty state ("No new leads right now").

### 1.6 Client (client-facing app)
- **Primary job:** complete a booking, review/sign a contract, complete an image/design session.
- **Gets lost:** currently a redirect stub; the real flows (booking lead, contract signing → PDF, image-session approval → PDF) need a guided, linear, RTL experience with explicit progress and a single CTA per step.
- **Target moment:** a **stepper-driven wizard** ("Step 2 of 4 — Choose your style") with a persistent "what happens after I submit" line, signature/PDF confirmation, and a clear success screen ("Your contract is signed — a copy has been emailed to you").

> **Cross-role principle:** every dashboard's hero is an **action queue / "needs you" list**, not a passive chart wall. Charts are secondary.

---

## 2. Information architecture & app shell

### 2.1 Target IA model: capability-driven, not role-coupled
Replace the two role ternaries (`layout.jsx`) with **one declarative nav config** filtered by permission capabilities. Keep the existing parallel-route structure if desired, but drive *visibility* from capabilities so the model matches the backend permission migration (audit §6).

Proposed shape (lives in `v2/features/shell/nav.config.js` or per-feature `*.nav.js` merged at the shell):
```
{ key, labelKey, href, icon, capability, children?, group }
```
- `labelKey` → single-language Arabic string key (never a raw inline string), resolved via the message-code map.
- `capability` → checked by a new `usePermission()` hook (see §8). If absent, item is hidden — same predicate that gates the page and the action button, so nav never offers something the user can't do.
- `group` → section grouping in the side nav (e.g. "Sales", "Production", "Finance", "Admin").

### 2.2 App shell layout (P0)
Move from a top-only AppBar to a **persistent side-nav + top context bar** shell — standard for dense multi-role tools and far better for an 9-item admin nav than horizontal overflow math.

```
RTL (start = right):
+----------------------------------------------------------+
|  TopBar: [logo]      breadcrumb > section > item   [bell][role][profile]|
+--------------+-------------------------------------------+
| SideNav      |  Page header: H1 + role chip + primary CTA |
| (grouped,    |-------------------------------------------|
|  capability- |  Content (list / detail / wizard)          |
|  filtered)   |                                            |
|  - Sales     |                                            |
|  - Production|                                            |
|  - Finance   |                                            |
+--------------+-------------------------------------------+
```
- **Side nav** is the primary IA; collapses to icon-rail on `md`, to a temporary drawer on `xs` (reuse the existing `Drawer` pattern from `Navbar.jsx:488`).
- **TopBar** holds: logo (start), breadcrumb (center-start), and identity cluster (end): notifications (`NotificationIcon`), role switcher (`SignInWithDifferentUserRole`, currently hidden for ADMIN — `Navbar.jsx:480`), profile, logout.
- Use Next `<Link>` (client transitions), not `component="a"` — fixes full reloads.
- Active state from `usePathname()` + exact/segment match, not `.includes(substring)`.

### 2.3 Persistent identity & orientation (the non-negotiable, P0)
At all times the shell shows:
1. **Role chip** in the page header (e.g. "محاسب" / "مدير") — derived from `user.activeRole`, with the active sub-role / `isSuperSales` reflected so elevated capability is visible.
2. **Breadcrumb** in the TopBar reflecting section > subsection > item.
3. **Page H1** naming the screen in plain Arabic.
4. **Primary CTA** top-end of the header, one per screen, capability-gated.

---

## 3. Key screen redesign directions (structure, not pixels) + states

Standardize **five states** for every data screen via shared components (`v2/shared/components/states/*`): `Loading`, `Empty`, `Error`, `PartialPermission`, `Success`. These replace the current `return null` blank screens.

### 3.0 Standard state contract (reusable, P0)
- **Loading:** skeletons matching final layout (table rows / card grid / form), never a blank or a bare spinner. Replace `layout.jsx:303 return null` with a shell skeleton.
- **Empty:** icon + plain-Arabic explanation + the single primary action ("لا توجد عملاء محتملون بعد — أضف أول عميل"). Role-aware copy.
- **Error:** what failed + a retry button; uses the `useRequest`/toast error path already present.
- **Partial-permission:** show what the user *can* see; for blocked actions render a disabled control with a tooltip reason, or hide entirely (never a dead button). Drives off the same `usePermission` predicate.
- **Success:** explicit confirmation + the next step ("تم التوقيع — أُرسلت نسخة إلى بريدك").

### 3.1 Login / Auth (`v2/features/auth/*`) — mostly there, P1
- Current `LoginForm.jsx` uses English `title="Login"` / `submitLabel="Login"` — switch to Arabic strings. Wrap in `AuthLayout` with the studio logo and a one-line value statement.
- States: idle, submitting (disable + spinner on button), error (field + form-level message from the envelope `message`/`translationKey`, audit §api-contract), locked/too-many-attempts (rate-limited path exists in `auth.middleware`). After success → role-appropriate dashboard with a brief "Welcome, {name}" toast.

### 3.2 Role dashboards (`UiComponents/DataViewer/dashbaord/Dashboard.jsx`, currently shared via `@admin/page.jsx`) — P1
- Restructure to: **(1) "Needs your attention" action queue** (top, role-specific), **(2) summary KPI cards** (secondary), **(3) charts** (tertiary). Each queue item deep-links with the next action.
- States: loading (card skeletons), empty ("All clear — nothing needs you right now"), partial-permission (only the cards the role's capabilities allow), error (retry).

### 3.3 Leads / Booking flow — P1 (highest sales traffic)
- **Staff list:** one config-driven table (custom table, since no MUI X DataGrid) with **status chips from a single token map** (§7), owner, last-activity age, and a row-level next-action. Filters: my leads / due today / stage. Reuse `v2/features/leads` constants (`bookingLeadFieldLabels.js`).
- **Lead detail:** header = client name + **sales-stage stepper** + current-stage chip + single primary CTA ("سجّل نتيجة المكالمة" / "أرسل عرض السعر"); tabs for notes, calls, files, payments.
- **Client booking wizard:** linear stepper, one decision per step, "Step X of Y" + "what happens next", explicit submit confirmation.
- States: empty ("لا توجد عملاء محتملون"), partial-permission (staff sees only assigned leads; the unassigned bucket hidden unless capability), error, success (lead created → "تم — العميل أُسند إلى …").

### 3.4 Contract + PDF flow — P1 (high stakes PDF)
- **Contract detail:** a **stage progress header** (draft → sent → signed → countersigned) so both staff and client always see where the contract is. Payment schedule, drawings, special items in clearly separated sections. Primary CTA changes with status ("أرسل للعميل" → "بانتظار توقيع العميل" (disabled, informational) → "وقّع واعتمد").
- **Client signing:** focused page — contract summary, scroll-to-sign affordance, signature pad, explicit "By signing you agree…" line; on submit show a **blocking progress state** ("جارٍ إنشاء العقد الموقّع…") because PDF generation is currently inline/synchronous (audit §3A) — the user must not think it hung.
- States: generating-PDF (long-running, informative progress, not a frozen button), error ("Couldn't generate the document — retry"), success ("تم التوقيع — أُرسلت نسخة إلى بريدك") with download links, partial-permission (client sees sign action only when it's their turn).

### 3.5 Image / Design sessions — P1
- **Client session:** stepper across spaces (materials → style → color pattern → images per space), live "selections so far" summary, progress indicator. Final approval → signature → PDF, same long-running/success pattern as contracts.
- **Admin/staff gallery** (`@admin/image-sessions`): filterable grid with session-status chips and a clear per-session next action.
- States: loading (image-grid skeletons), empty per space ("لم تختر بعد"), error (image load fallback + retry), success (session approved → PDF), partial-permission.

### 3.6 Chat — P1 (feature dir exists but empty: `v2/features/chat`)
- Standard 3-pane RTL layout (rooms list · message thread · optional details), mirrored for RTL (list on the right). Empty state when no room selected ("اختر محادثة للبدء"). Clear unread/typing/presence affordances. Reuse `SocketProvider`.
- States: connecting (socket), empty (no rooms / no messages), error (reconnecting banner — there is reconnect logic server-side per commit `5c05183`), success (sent/delivered/read ticks).

---

## 4. Role-clarity patterns (apply everywhere)

1. **Role chip + name** persistent in the page header; reflects `activeRole` and elevated flags (`isSuperSales`, active sub-role).
2. **Breadcrumbs** on every inner route (section > subsection > item).
3. **Status chips from one token map** (§7) — every workflow entity (lead, contract, project/task, payment, session) shows its status the same way everywhere.
4. **One primary action per screen**, top-end of the header, plain-language, capability-gated; secondary actions de-emphasized (text/outlined).
5. **Stage steppers** on lead, contract, project, and session detail so the user always sees *where the entity is* and *what comes next*.
6. **Capability-aware affordances:** if `usePermission` says no, hide the item or disable-with-reason — never a button that errors. Same predicate gates nav, page, and button (single source of truth).
7. **Role-aware empty states** that name the role's next action.
8. **Next-step confirmations** in every success state.

---

## 5. Layout, visual hierarchy & RTL density

- **Hierarchy:** action-first dashboards (queue > KPIs > charts); detail pages lead with identity + status + next action, then secondary detail in tabs/sections.
- **Spacing scale:** standardize on the MUI 8px spacing unit already in `theme.js`; page padding `p: 3` desktop / `p: 2` mobile; section gap `gap: 3`; card content `p: 2`. Tables: comfortable default row height; offer a compact density toggle for data-heavy accountant/admin lists.
- **Logical properties for RTL:** use MUI logical `sx` (`ms`/`me`, `paddingInlineStart/End`, `textAlign: 'start'`) — not hardcoded `ml`/`mr`/`left`/`right` (the current `Navbar.jsx` uses `mr`, `ml`, and `anchor="left"`, which are LTR-biased even with the rtl plugin). Mirror directional icons (chevrons) for RTL.
- **Typography:** keep `Noto Kufi Arabic`; honor the existing type scale in `theme.js`; ensure numerals/dates render consistently (dayjs already present) and currency via a shared `formatAED` helper.
- **MUI alignment:** continue using theme component overrides; promote shared cards/sections/state components into `v2/shared/components` so features compose rather than re-style.

---

## 6. Accessibility & RTL correctness (WCAG 2.2 AA)

- **P0 — Document root:** set `<html lang="ar" dir="rtl">` in `layout.js` (audit §1 notes it's missing) so SSR, screen readers, and native form controls get direction right, not just Emotion.
- **Contrast:** verify caramel-on-white and chip text. `primary #d4a574` on white is ~1.8:1 — **fails** for text/icons; only use it as a fill behind dark text or for large/decorative elements, and define a dedicated accessible "primary action text" token. Audit `textMuted #9a8e82` on light backgrounds (borderline). Status chips must meet 4.5:1 for their label.
- **Focus:** visible focus ring on all interactive elements (the anchor-based nav and icon buttons need verification); logical focus order in RTL; trap focus in dialogs/wizard steps.
- **Keyboard:** the hover-only submenu in `Navbar.jsx:103-127` is mouse-dependent — submenus must open/close and be navigable via keyboard. Move to `<Link>`-based, keyboard-operable disclosure.
- **Target size:** 24×24 CSS px min (2.2 AA); ensure icon buttons in the top cluster and table row actions meet it.
- **Forms:** every field labeled (not placeholder-only); errors announced via `aria-describedby`; tie to the envelope `translationKey`.
- **Status not by color alone:** chips carry text labels (already true in `BookingLeadDetailsCard.jsx`), keep that everywhere.
- **Live regions:** chat messages, toast, and long-running PDF progress announced politely.

---

## 7. Design-system / token direction

- **Single source of truth:** fold the scattered status maps into the theme. Add a `theme.palette.status.*` (lead statuses, contract statuses, payment statuses, task statuses) and a `theme.palette.contractLevel.*`, deriving from semantic tokens where possible instead of raw arbitrary hex (`STATUS_COLORS`/`NotificationColors` currently use generic Material hexes unrelated to the caramel brand). Provide one `<StatusChip status={…} domain="lead|contract|payment|task" />`.
- **Spacing/radius/elevation:** already coherent in `theme.js` (radius 8, cards 12, shadow scale generated). Keep; document the scale; stop ad-hoc `boxShadow` strings in components (e.g. the literal shadows in `Navbar.jsx:255`) in favor of `theme.shadows`.
- **Typography tokens:** the `theme.js` scale is good; enforce via variants, ban inline `fontSize` overrides in features.
- **Component variants:** define canonical variants once — `PageHeader`, `SectionCard`, `StatusChip`, `ActionQueueItem`, `Stepper`, `EmptyState`, `DataTable` wrapper — in `v2/shared/components`, all theme-driven. Goal: rebuilt features add **zero** new one-off styles.
- **Color-contrast remediation token:** add an accessible on-light primary text color so brand caramel can be used as accent without failing contrast.

---

## 8. Phased rollout (rides the architecture migration) + compatibility

**Compatibility contract:** every item below is additive and feature-scoped. It uses the existing `features/<x>` folder shape, `useRequest`/`ApiFetch`, the providers, and the theme; it introduces `usePermission` to match the backend permission migration (audit §6) without removing the role model. No big-bang.

### P0 — Shell & primitives (do first, unblocks every feature)
1. `usePermission()` + `capabilities` hook in `v2/hooks` (reads capabilities from `auth/me`; falls back to role mapping during transition so nothing breaks before backend permission codes land).
2. Capability-/config-driven `nav.config` + new **AppShell** (side-nav + TopBar) replacing the dual ternary in `layout.jsx`; persistent role chip + breadcrumbs; Next `<Link>` transitions; remove `console.log` and the `return null` blank.
3. Shared **state components** (`Loading/Empty/Error/PartialPermission/Success`) + `PageHeader`, `StatusChip`, `EmptyState`, `SectionCard`.
4. A11y root fix: `<html lang dir>`; contrast remediation tokens; theme `status.*` palette.

### P1 — Feature-by-feature redesign (in migration order)
For each feature as its backend module migrates, rebuild the screen on the new primitives, in this priority: **Leads/Booking → Contracts/PDF → Image-sessions → Dashboards (per role) → Chat**. Each delivers: role-clarity header, the five states, capability-gated actions, RTL logical layout.

### P2 — Polish & density
Density toggle for data-heavy lists; keyboard/focus pass per screen; motion/reduced-motion; consolidate remaining ad-hoc shadows/font-sizes; remove legacy `Navbar.jsx` once all roles are on AppShell.

**Per-feature definition of done (UX):** (a) user can state their role and location from the screen alone; (b) one obvious primary action; (c) all five states implemented; (d) actions/nav/page gated by the same `usePermission` predicate; (e) RTL logical spacing + AA contrast; (f) zero raw visible strings (single Arabic string source).

---

## Open questions for the user

1. **Side-nav vs keep top-nav?** Recommended: a persistent grouped side-nav for the dense admin/accountant roles; confirm you're open to changing the shell from the current top-only AppBar.
2. **Permission model timing:** is a capabilities list expected on `auth/me` soon, or should `usePermission` ship with a role→capability fallback map until the backend permission codes land?
3. **Client-facing app scope:** the client app is currently a redirect stub (`ClientPage.jsx`) — are the booking/contract/image-session client flows in this same `ui/` app (under different routes) or a separate frontend? This determines where the client wizards live.
4. **i18n target:** RESOLVED — drop i18n, single Arabic string source (message-code map), no language toggle. (Originally an open question; decided in brainstorming.)
5. **Charts:** keep the existing dashboard charts (which lib?) as secondary, or is the action-queue-first dashboard a full replacement?
6. **Role labels:** confirm the canonical Arabic display names for each `UserRole` (incl. sub-roles and `isSuperSales`) for the role chip.

Relevant files: `ui/src/app/(auth)/dashboard/(dashboard)/layout.jsx`, `ui/src/app/UiComponents/utility/Navbar.jsx`, `ui/src/app/helpers/colors.js`, `ui/src/app/v2/providers/theme.js`, `ui/src/app/v2/providers/AuthProvider.jsx`, `ui/src/app/v2/features/auth/components/LoginForm.jsx`, `ui/src/app/v2/features/leads/components/BookingLeadDetailsCard.jsx`, `ui/src/app/v2/lib/constant.js`, `ui/src/app/UiComponents/client-page/ClientPage.jsx`.
