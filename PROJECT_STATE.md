# PROJECT STATE — Dream Studio Migration

> **Open this file in any new chat.** It tells you what we are doing and where we have reached.
> To resume: *"Read `PROJECT_STATE.md`, `CLAUDE.md`, and `docs/migration/`, then tell me where we are and what's next."*
>
> Last updated: **2026-06-07** · Branch: `server-migration`

---

## 1. What we are doing — in one paragraph

We are migrating the **entire Dream Studio app** (backend + frontend) from a messy legacy structure into a **clean modular npm-workspaces monorepo** that mirrors a mature reference project, **while preserving identical behavior** (same Prisma schema, same observable APIs). A strangler migration is already underway: `server/index.js` boots `server/v2/server.js`, and legacy + `v2` routers run side-by-side. We **complete the migration from `v2`** (after fixing v2's defects), redesign the weak permissions/auth layer, consolidate workers/cron to run from the server only, and **keep the PDF generation logic byte-for-byte frozen** (split into files only). i18n is dropped (single Arabic UI) but the message-code pattern is kept. A separate, forward-looking UX plan rides alongside, feature-by-feature.

Full operating manual: [`CLAUDE.md`](CLAUDE.md).

---

## 2. Locked decisions (confirmed with the user)

| # | Decision |
|---|---|
| 1 | Target = **monorepo** mirroring the reference: `packages/db` + `packages/shared` + `server` (`src/modules`) + `web` (`features`). |
| 2 | **Prisma schema frozen** — relocated verbatim, not redesigned. |
| 3 | **Same observable API behavior** — restructure + harden, but the frontend contract stays equivalent; real changes tracked explicitly. |
| 4 | 🔒 **PDF generation logic-frozen** — split into files only, identical output. |
| 5 | **Drop bilingual i18n; keep message-code mechanism** resolving to a single **Arabic** source. |
| 6 | **Complete from `v2`** after remediating its defects. |
| 7 | **Workers run as a bootstrap from the server only.** |

---

## 3. Where we have reached — STATUS

**Current phase: EXECUTION (modules). Foundation + infra + auth/permissions DONE & committed; modules in progress.**

Commits on `server-migration`: foundation `3c84d5a` → chat `d980950` → site-utility `38f7bf0` → courses `1dbc181` → leads `c709d14` → users `5cf59ee` → validation-fix `934ba69` → projects `fe9957b` → accounting `d2bce49` → calendar `174e8e1` → notifications+utilities `6cac14e` → dashboard `bf5845b` → leaf-domains `e3da3a8`. App boots; legacy + `/v2` coexist (strangler). Full suite: **398 tests / 27 files green**.

**Modules done (BE):** Chat (+FE), site-utility (+FE), Courses/LMS, Leads/clientLead CORE (IDOR keystone), Users (unblocks chat's `/v2/users` directory), Projects domain (project+task+update+delivery; IDOR keystone for designers/executors), Accounting (payment+expense+note+rent+salary+report; ACCOUNTANT-only money module), Calendar (availability+google-oauth+public client-booking), Notifications+Utilities (notifications IDOR-fixed + lookup helpers), Dashboard (9 role-scoped aggregations, IDOR-hardened), Leaf domains (questions+sales-stages+reviews). Each went through review (+rework where needed) → verify. Security holes fixed in every module: Courses 2 critical IDOR; Leads 2 HIGH; Users profile-IDOR (full-row+password-hash leak + escalation) + mass-assign; Projects broad-delete IDOR + PII enumeration + mass-assign; Accounting money-validation + `.strict()` mass-assign defense + dropped client-trusted `oldPaymentLevel` + safe-parse filters (role parity ACCOUNTANT-only preserved); Calendar SAFE/0-introduced (client-booking kept public + token-over-body, no Google-token leak, role parity SHARED preserved) — 3 ported access-control quirks logged as a hardening backlog (see `docs/migration/RESUME-CHECKPOINT.md` §5b); Notifications closed an UNAUTH cross-user read/mark-read IDOR + a HIGH user-logs IDOR (self-scoped) + locked an open `prisma[model]` read to fixed pick-list projections; Dashboard closed a cross-user metric/activity over-exposure (non-admins forced to `req.auth.id`, admin-tier preserved 1:1, + non-numeric-id 403 guard); Leaf domains questions/sales-stages were unscoped lead data → reads access-scope + writes mutate-scope via the leads keystone, reviews OAuth token-leak closed. Shared: validate middleware now emits a CODE not Zod prose.
**Remaining BE:** contracts (frozen PDF), image-sessions (frozen PDF), admin/staff residual; + the deferred **clients** public-facing aggregator (after contracts+image-sessions, since it wires them in). **FE:** deferred (features for the BE-only modules).
**Key finding:** the legacy code's leaf domains (questions, notes, sales-stages, client-payments) are **entangled with the `clientLead` keystone**, so they migrate with/after **Leads** (the biggest module + the IDOR/security keystone). Reviews = thin Google-OAuth integration (no FE).
**Next targets:** remaining standalone domains (courses/LMS, calendar) + the **Leads keystone**, then its dependents, then the frozen-PDF contract/image-session flows, then accounting/dashboard/notifications, then cutover.

### ✅ Done
- **Audit of the current app** → `docs/migration/01-current-audit.md`
- **Reference patterns distilled** → `docs/migration/02-reference-patterns.md`
- **Backend migration plan** → `docs/migration/03-backend-plan.md`
- **Frontend migration plan** → `docs/migration/04-frontend-plan.md`
- **UX / layout improvement plan** → `docs/migration/05-ux-plan.md`
- **Reconciliation of all plans** → `docs/migration/06-reconciliation.md`
- **All 10 decisions resolved** → `docs/migration/07-decisions-resolved.md` (authoritative addendum)
- **CLAUDE.md** (operating manual) + **PROJECT_STATE.md** (this file)

### ⏳ Pending before implementation
- A detailed, step-by-step **implementation plan** (the user will direct the next step). The natural start is BE Phase 0 + FE Phase 0.

### ▶️ Not started
- Any code changes, file moves, scaffolding, or package restructuring. (Planning was explicitly plans-only.)

---

## 4. Migration roadmap (from the plans)

> Phase ordering between BE and FE has a known inversion (Leads) — see decision #5 in §5.

### Backend phases (`03-backend-plan.md`)
0. Monorepo skeleton + `packages/db` (frozen schema, singleton client) + `packages/shared` seed
1. Relocate `server/v2` infra → `server/src`, kill duplicate infra, mount under `/api/v1`
2. v2 remediation: one repo suffix, fix broken pdf worker, server-owned workers/cron, unify JWT, add `requirePermissions` + scope checkers
3. Low-risk leaf modules (languages, notes, reviews, site, questions, users)
4. Leads & sales core hub (keystone for the IDOR/permission fix)
5. Projects, tasks, delivery, updates
6. Contracts + contract PDF (🔒 logic-frozen, byte/visual diff gate)
7. Image sessions + session PDF + working pdf queue
8. Accounting (invoice, payment, salary, expense; Stripe)
9. Courses / LMS
10. Calendar + Google
11. Reports PDF (🔒 pdfkit) + dashboard + notifications
12. Cutover: flip FE to `/api/v1`, remove aliases + dual-JWT shim, retire legacy

### Frontend phases (`04-frontend-plan.md`)
0. Foundation (promote v2, DataTable/AppForm, upgrade `useRequest`, `usePermission`, RTL theme)
1. i18n removal + providers consolidation (`AppProviders`, Arabic message map)
2. Auth (finalize `features/auth`, AuthProvider exposes permissions)
3. Booking (public) + Leads/Sales
4. Chat
5. Contracts + Image-sessions (+ client public flows)
6. Projects, Tasks, Payments, Accounting, Users; collapse role slots into permission-gated nav
7. Calendar, Notifications, Website-utilities, Courses
8. Cutover & cleanup (delete legacy, rename `ui/ → web/`, wire workspaces)

### UX rollout (`05-ux-plan.md`)
- **P0** App shell (side-nav + persistent role chip + breadcrumbs), `usePermission`, shared screen-state components, a11y root fix (`<html lang dir>`), theme `status.*` palette.
- **P1** Feature-by-feature redesign in migration order: Leads → Contracts → Image-sessions → Dashboards → Chat (role clarity, 5 states, capability-gated actions).
- **P2** Polish & density.

---

## 5. Decisions — ALL RESOLVED ✅ (authoritative: `07-decisions-resolved.md`)

1. **API base** — permanently `/v2`; **no `/api/v1`**, no cutover flip.
2. **Pagination** — `{items,total,page,pageSize}` normalized (contract change, approved).
3. **`capabilities.*`** — every scoped list/detail response attaches per-record capability booleans (dto-computed).
4. **Permissions** — built fresh: codes in `@dms/shared`, role→profiles seeded BE Phase 2, `auth/me` emits real `permissions[]` from then; **no role-fallback shim**. Role/sub-role exposed for display only.
5. **Phase order** — re-sequenced so each FE feature trails its BE module (see 07 §5 roadmap).
6. **Booking-lead** — `submit` → `POST /:leadId/actions/submit`; `PATCH /:leadId` for draft edits.
7. **Client app** — booking/contract/image-session flows stay in THIS app under a `(public)` group (not separate).
8. **Drive subsystem** — dead/schema-only (no live endpoints); models stay (frozen schema), no Drive module.
9. **`ui`→`web` rename** — at the final cutover step (Phase 12).
10. **Telegram + upload contracts** — enumerated (07 §10).

---

## 6. Known landmines (verified)

- 🔒 **PDF logic must not change** — two subsystems (pdf-lib + pdfkit); fragile `__dirname` font loading. See `CLAUDE.md` §4.
- **Auth is the weakest area** — two parallel JWT systems, role-only checks, no object scope = broad IDOR surface. The leads module is the keystone fix.
- **Workers don't run in-process today**; the pdf worker has a **broken import**; telegram workers run detached. Target: all from the server bootstrap.
- **Duplicated v2 infra** — prisma/mail/socket/telegram each implemented twice; chat has both `chat.repo.js` and `chat.repository.js`; queues/workers split across `services/` and `v2/infra/`. Redundant redis clients (`ioredis` + `redis`).
- Stray `console.log`s in live v2 (`auth.controller.js`).

---

## 7. Doc index

- [`CLAUDE.md`](CLAUDE.md) — operating manual & conventions
- [`docs/migration/01-current-audit.md`](docs/migration/01-current-audit.md)
- [`docs/migration/02-reference-patterns.md`](docs/migration/02-reference-patterns.md)
- [`docs/migration/03-backend-plan.md`](docs/migration/03-backend-plan.md)
- [`docs/migration/04-frontend-plan.md`](docs/migration/04-frontend-plan.md)
- [`docs/migration/05-ux-plan.md`](docs/migration/05-ux-plan.md)
- [`docs/migration/06-reconciliation.md`](docs/migration/06-reconciliation.md)
- [`docs/migration/07-decisions-resolved.md`](docs/migration/07-decisions-resolved.md) — **authoritative; overrides 03/04/05 where they differ**

---

## 8. Next step

The planning + documentation phase is **done and awaiting the user's direction**. The user said they will state the next step. The natural next move is: settle open decisions 1–6 (§5), then produce a detailed implementation plan starting with **Backend Phase 0** (monorepo skeleton + `packages/db` + `packages/shared`) in lockstep with **Frontend Phase 0**.
