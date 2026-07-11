# PROJECT STATE — Dream Studio Migration

> **Open this file in any new chat.** It tells you what we are doing and where we have reached.
> To resume: *"Read `PROJECT_STATE.md`, `CLAUDE.md`, and `docs/migration/`, then tell me where we are and what's next."*
>
> Last updated: **2026-07-10** · Branch: `frontend-redesign` (reorg work on `reorg/ref-alignment`; Sales/Admin feature work on `feat/audit-log-sales-admin`)
>
> **LATEST (2026-07-10) — Sales/Admin feature workstream on branch `feat/audit-log-sales-admin` (off `reorg/ref-alignment`).**
> Three new features, each spec→plan→build→review→verify (specs/plans in `docs/superpowers/`), all following the
> repo's layered conventions. **Full suite 855 green; `next build` exit 0; security + convention reviewed.**
> **(1) Action Audit Log** — new additive `ActionAuditLog` model; non-blocking `recordAction` infra (secret-redacting
> diff) wired into lead/contract/user usecases + auth-event mirror; admin-only `GET /v2/audit-logs` + `audit.log.view`
> (ADMIN/SUPER_ADMIN only) + a config-driven viewer at `/dashboard/audit-logs`.
> **(2) Sales Deal Cockpit** — `GET /v2/leads/:id/cockpit` (pure `computeCockpit` next-best-action engine, object-scoped)
> + a capability-gated cockpit strip on the deal detail (CTAs reuse existing dialogs).
> **(3) Admin Command Center** — admin-only `command_center.view` + `GET /v2/command-center/overview` (pipeline/
> capacity/delivery KPIs) + `/dashboard/command-center` screen with the audit activity feed. **Money boundary preserved:**
> uses ONLY already-admin-visible figures (Invoice revenue, Commission, `averagePrice`); NO Payment/ContractPayment/
> Outcome aggregates (accounting stays ACCOUNTANT-only — widening deferred pending explicit sign-off + parity update).
> Plus tech-debt fixes: chat↔socket import cycle broken (lazy import), `LOCKED_FROM_STATUSES_FOR_NON_ADMIN` deduped,
> notification icon/color key `LEAD_STATUS_CHANGE`→`LEAD_STATUS_CHANGED`, 15 raw `throw new Error(prose)` in the lead
> usecases → `AppError`+message-codes (+ stop swallowing column-status errors), and a stray `oad()` ReferenceError in
> PaymentRow removed. **PENDING (user-run):** apply the audit migration — `npm run db:migrate -- --name add_action_audit_log`
> then `npm run db:generate`, and commit `schema.prisma` + the generated migration together (agent env has no `DATABASE_URL`).
>
> **PRIOR (2026-07-10) — Ref-alignment reorganization (behavior-preserving) on branch `reorg/ref-alignment`.**
> A large file/structure reorg to match the reference monorepos (`Transaction-app` request-flow, `school-system`
> validation). **46 commits, all verified green** (backend `npm test` 733/57, `next build` OK, 0 broken imports).
> DONE: suffix rename `*.repository.js`→`*.repo.js` + `*.routes.js`→`*.route.js`; extracted shared `pagination.js`;
> **decomposed every non-frozen `legacy/` folder into proper module layers** (Prisma repo-only) and **deleted the
> `shared/legacy` barrel**; split the god-files (`admin-services.js` 2246L→10 modules; infra `legacy-notification`
> 1355L + `telegram-functions` 1149L split behind barrels; ~25 frontend god-files split, configs extracted).
> **🔴 Also fixed a real production bug**: the staged services-elimination had **71 broken lazy-import paths** (extra
> `../`) that threw `ERR_MODULE_NOT_FOUND` at runtime — masked by mock-seam tests. **The branch needs a runtime
> server smoke.** Frozen PDF tier (`contracts/legacy`, `image-sessions/legacy/client-services.js`) left AS-IS per
> §4 (no byte-diff harness). **REMAINING (one phase):** the frontend `features/` migration (relocate
> `app/UiComponents/DataViewer/*` → `src/features/*`) — a pure mechanical relocation, not yet done. Full detail:
> `docs/superpowers/plans/2026-07-09-ref-alignment-PROGRESS.md` + `…-reorg-master.md`. NOTE: this reorg is on a
> separate branch and NOT yet merged into `frontend-redesign`.
>
> **LATEST (2026-07-04) — UI language reverted to English (matching `master`).**
> The redesign had introduced ~1050 Arabic UI strings on top of `master`; these were converted back to
> English in 6 `i18n(web): …` commits (`2745493`→`24f1221`). Two surfaces: the message-resolution maps
> (`web/src/app/helpers/messages/authMessages.js` + `maps/*.js` — string VALUES → English, KEYS/codes
> unchanged, `{ success, message, translationKey }` contract intact) and inline component strings across
> `web/src/**`. Method = match `master`'s exact English (`git show master:ui/<path>`; master's FE lives
> under `ui/`, ours under `web/`), keeping only the handful of strings `master` itself has in Arabic
> (contract legal blocks `wittenBlocksData.js`, the client-facing `image-session/*` flow, `constants.js`
> status labels, SalesStage `مراحل البيع` + SalesToolsTabs captions, backend `questions.repository.js`
> SPIN seed, the `payments.stripe.js` bilingual ternary). **Backend needed zero changes** (all Arabic
> there is comments, test fixtures, master's own seed, or bilingual data). Verified: `cd web && npx next
> build` (exit 0) + `npm test` (**733/57 green**); a Unicode scan confirms no `web` file has Arabic
> beyond what `master` itself keeps. **This supersedes the earlier "single Arabic UI" decision** (§2 #5).
>
> **LATEST (2026-07-10) — Action Audit Log (admin-only trail), Tasks 1–5 (implemented on `feat/audit-log-sales-admin`).**
> Additive `ActionAuditLog` model (rich semantic trail, distinct from the authz-only `AuthAuditLog`),
> a non-blocking `recordAction` infra service + `diffFields` redact helper, and a read-only
> `/v2/audit-logs` six-file module gated by the new `audit.log.view` permission (ADMIN/SUPER_ADMIN
> only). Wired in `@dms/shared` (audit-actions codes, permission, role-permissions, profiles, nav).
> **PENDING (user-run):** the additive `ActionAuditLog` migration — `npm run db:migrate -- --name
> add_action_audit_log` then `npm run db:generate`, and commit `schema.prisma` + the generated
> migration together (the model edit is committed; the agent env has no `DATABASE_URL`, and
> `npx prisma generate` could not finish offline because the query-engine dll is locked by the
> running dev servers — backend tests run against the mocked prisma seam meanwhile). Task 6 (wiring
> `recordAction` into lead/contract/user/auth usecases) + Task 7 (frontend viewer) still to do.
> Design/plan: `docs/superpowers/specs/2026-07-10-action-audit-log-design.md`,
> `docs/superpowers/plans/2026-07-10-action-audit-log.md`.
>
> **LATEST (2026-07-03) — DB-relational permissions & switchable profiles (implemented, local-verified; prod pending).**
> Authorization moved from the code-defined role→codes map to DB tables: `PermissionCode`,
> `Profile`, `ProfilePermission`, `UserProfile` (replaces subRoles), + `User.currentProfileId`
> and an `AuthAuditLog` (additive migration `20260703194146_add_relational_permissions`, applied
> to the local dev DB; **no columns dropped** — `role`/`profile`/`isPrimary`/`isSuperSales`/
> `subRoles` retained for rollback). Effective permissions now come from the user's **current
> profile ONLY** (the one intentional divergence from master — multi-role users switch instead of
> holding a subRole union), resolved per request from an in-process **profile→codes cache** (zero
> DB read on the auth hot path; the token carries `currentProfileId` + `profileIds`; a transitional
> legacy-code-map fallback means a deploy never locks anyone out). `isAdminTier`/`isAdminUser` and
> the sidebar now follow the active profile. New: `POST /v2/auth/profile/switch` (self-service,
> audited, re-mints cookies), `PUT /v2/users/:id/profiles` + `GET /v2/users/assignable-profiles`
> (admin assign/remove, audited). `/auth/me` contract preserved + extended (`profiles[]`,
> `currentProfileId`). FE: `AuthProvider` exposes profiles + `refetchMe`; a header **ProfileSwitcher**;
> an admin **ProfileManagerDialog** on the Users page; Arabic message mirror added. Idempotent
> catalog **seed** (`packages/db/prisma/seed.js`) + **user-migration** (`packages/db/scripts/
> migrate-users-to-profiles.js`), both upsert-only. **Full suite 738/57 green**; real-DB e2e verified
> the migrate→resolve→switch flow. **PENDING (user-run):** the prod rollout —
> `docs/superpowers/plans/prod-rollout-db-relational-permissions.md` (migrate deploy → seed →
> user-migration → deploy code; never reset). Design: `docs/superpowers/specs/
> 2026-07-03-db-relational-permissions-design.md`; plan: `docs/superpowers/plans/
> 2026-07-03-db-relational-permissions.md`; parity addendum in `permissions-parity-matrix.md`.
>
> **CURRENT STATUS (2026-07-02) — full detail in §0 below.** The BE+FE migration is COMPLETE (legacy removed; boots `server/src/server.js`; frontend is `web/`). On `frontend-redesign` these forward workstreams are now **DONE**: **(1) DB-migration reconciliation** — schema + migrations reconciled to the deployed production DB, single canonical `packages/db/prisma`, migrations verified (Docker) to build a fresh DB byte-equal to prod; a **user-run** metadata-only prod runbook is pending. **(2) Permissions parity** — rich denial-reason/redirect contract, backend per-role `navigationTabs` + action-flag `permissionsByModule`, frontend `usePermission`/`PermissionGate`/route-guard, audited identical-to-master (0 mismatches). **(3) Frontend review fixes** — Kanban optimistic drag + terminal-transition confirm, lead-detail reload removal + capability-gated status action, SalesStage unified on `LeadDetailsContext`, dead-code removal, design-token harmonization. **(4) Permission profiles — Phases 1–2** — code-defined `PROFILES` in `@dms/shared` (one profile per user), `getEffectivePermissions` resolves via profile (parity-preserved: same access on the old code universe, only 5 additive `lead.*.view` codes), idempotent bootstrap backfill from the RETAINED `isPrimary`/`isSuperSales`, `/auth/me` emits `profile`, FE profile picker; 8 subagent-driven tasks, final whole-branch review clean after 1 blocker fix. **(5) Permission profiles — Phase 3 (the FE sweep)** — the leads area (detail sections → `lead.*.view` codes; kanban admin affordance → `lead.assign.other`; 6 lead-tab action buttons → `lead.capabilities.canAddX`) AND the projects/dashboard/users modules (backend `computeProjectCapabilities` wired onto the designer detail; ProjectDetails/PreviewWorkStage management gates → project capabilities/`project.manage`; project-group/manage-roles/auto-assign/designer-dashboard/telegram admin gates → codes) all moved off scattered `isPrimary`/`isSuperSales`/role branches. Each conversion subagent-driven + independently reviewed. Two accepted simplifications documented (subRole-STAFF hybrids resolve by base profile — narrowing; accountants/full-scope now see the lead-tab create buttons the backend permits — widening) plus one closed authz gap (the auto-assignment dialog was ungated). Vitest **699/699 green**, `web` build 42/42. **Remaining TODOs (documented in code):** no admin-tier `delivery.*` code (delivery gates left as role checks); designer area-only edit has no capability; the JWT/auth-selects still omit `profile` (runtime rides the derived fallback — parity-neutral). **PENDING (user-run):** the additive `User.profile` migration — `npm run db:migrate -- --name add_user_profile` then `npm run db:generate`, and commit `schema.prisma` + the generated migration together (the column edit is currently staged in the working tree; no `DATABASE_URL` in the agent env). Design + plans: `docs/superpowers/specs/2026-07-02-permission-profiles-design.md`, `docs/superpowers/plans/2026-07-02-permission-profiles*.md`. UI redesign continues.
>
> _(Historical server-migration / cutover detail retained below.)_
>
> Migration-cutover snapshot — Last updated: **2026-06-10** · Branch: `server-migration`
>
> **Phase (2026-06-10):** BE + FE migration COMPLETE; UX/UI redesign feature builds (Phases 0–4)
> COMPLETE; post-redesign FE message-resolver centralization (`73e7f9d`) reconciled + fixed (`6193984`).
> **Runtime browser verification DONE (Playwright, all 22 v2 routes)** — 18 screens clean, 4 blockers
> found. **✅ ALL 4 BLOCKERS NOW FIXED (2026-06-10)** — reviewed (no blockers/no token leak),
> full suite **571/34 green**, guarded boot clean: (1) `useLoading` callbacks memoized → dashboard
> refetch loop gone (`0cf427a`); (2) v2 projects board now sends per-type `?type=` + BE null-guards →
> designers board stops 500ing for admins (`ed28386`); (3) built the v2 contract-payments page (legacy
> parity on the redesign shell) → dead `/v2/contracts/payments` nav fixed (`2d55b84`); (4) calendar
> google/status derives `connected` from token presence instead of the phantom `googleCalendarConnected`
> column → 500 gone on both v2 and the still-live legacy route (`442d7b2`). Master's week commit
> `fdefbbf` (client register) ported (`e04dabb`). **CUTOVER (task #13) IN PROGRESS (2026-06-11):**
> Steps **A (entry flip)**, **B (legacy @role-slot removal)**, **C (redirect shells)** DONE + commits
> `6d45f0b`/`189f75b`/`d09ca57` + fixes `9d2bd07`/`3a5a82d`; **runtime-verified** (real boot: 15/15 redirect
> routes, admin login OK ADMIN/123-perms, public v2 surfaces un-gated, npm test 571/34, next build clean).
> Caught+fixed a Step-A regression (the server-side `ui/src/proxy.js` middleware gated `/v2` public surfaces).
> **CUTOVER COMPLETE (2026-06-11).** `ui→web` rename done (`a849f58`); ALL legacy removed (`b107dda`→`4499332`):
> legacy FE (`UiComponents/helpers/providers/fonts`, ~342 files), ALL legacy backend routers (`server/routes/**`,
> 59 files) + the JWT legacy read-shim, and the dead `legacyApiFetch`. Public client-chat migrated to v2
> (`/v2/client-chat`; `/chats` redirects); v2 chat makes zero legacy calls. Verified: npm 571/34, web build 54
> routes, boot + admin login 200, `/v2/users/chat-directory` 200, legacy `/shared`+`/client` → 404. KEPT (not
> legacy): `server/services/**` frozen logic (lazy-imported by modules) + `SECRET_KEY`. The "v2" label is now a
> namespace only (no duality); dropping the literal `/v2` URL/folder is a separate optional cosmetic rename
> (frozen-service redirect bridges + prod API base end in `/v2`). See `docs/migration/RESUME-CHECKPOINT.md`.
> For the authoritative latest state + commit trail see **`docs/migration/RESUME-CHECKPOINT.md`** (this
> file's §3 commit trail below is kept at the FE-features milestone and is not the latest).

---

## 0. Current status — `frontend-redesign` branch (2026-07-02)

Migration is done (see §3 for the historical migration trail). Two workstreams on `frontend-redesign` are now complete; both preserve behavior identical to the deployed `master` baseline.

### ✅ DB-migration reconciliation (COMPLETE)
**Problem:** `master` recorded only 3 Prisma migrations; later schema changes were applied **by hand in MySQL** (chat, telegram, booking-lead, notif enums). The committed `catch_up_full_schema` migration was **broken** (couldn't build a fresh DB — errno 150 on `TextLong`), and `schema.prisma` itself was **drifted from prod + unbuildable** (missing 10 prod columns; an invalid `TextLong→Con` relation). Three duplicate schema/migration locations existed.
**Fix (verified against the prod structure dump `C:\coding\backup\dreamstudiio\drea_studio_db.sql` in a throwaway MariaDB 10.11 Docker container):**
- `prisma db pull` reconciled `packages/db/prisma/schema.prisma` to production (adopted all 10 prod columns; made it buildable) — proven `migrate diff prod↔schema = 0`.
- Regenerated `catch_up_full_schema` as a valid `(3-old → prod)` diff — the migrations now build a fresh DB **byte-equal to prod** (`VERIFY: PASS`, re-run independently).
- Consolidated to the single canonical `packages/db/prisma`; removed the stale `server/prisma/{schema,migrations}` + `server/src/infra/prisma/{schema,model,migrations}` copies (kept the `prisma.js` re-export shims).
- Fixed 2 app call sites in `accountantServices.js` for the renamed inverse relations (behavior-preserving).
- Guardrails: `docs/db-migrations-workflow.md` + a repo verification harness `packages/db/scripts/verify-migrations-against-dump.sh`.
**PENDING (user action):** run the metadata-only prod reconciliation — `docs/superpowers/plans/prod-migration-runbook.md` (backup → `prisma migrate resolve --applied` the 4 migrations → `migrate status`). **The agent does not touch production.**
Design: `docs/superpowers/specs/2026-07-01-prisma-migration-reconciliation-design.md`.

### ✅ Permissions parity + denial reasons (COMPLETE)
Brought authorization to Transaction-app parity, identical-to-master:
- **Error/redirect contract:** `AppError` carries `code/translationKey/reason/redirectTo/redirectText/dontRedirect` (backward-compatible); the error-handler serializes them + `route`; `requirePermissions` emits a specific `PERMISSION_DENIED` + `details.requiredPermissions`; the FE resolves codes to Arabic and shows the reason (no silent failures).
- **`/auth/me`** returns backend-computed per-role **`navigationTabs`** (role-driven, 1:1 with master's `linksForRole`) + action-flag **`permissionsByModule`** (`buildNavigationTabs` + `NAVIGATION` in `@dms/shared`).
- **Frontend layer:** `usePermission` (hasPermission/any/all/hasAction), `<PermissionGate>`, data-layer reason/redirect surfacing, sidebar driven by `navigationTabs` (identical per-role output; dev role-switcher fallback preserved), and a **RouteGuard** that shows an explicit "no access" reason + redirect instead of a silent blank.
- **Audit:** `docs/superpowers/specs/permissions-parity-matrix.md` — **0 real mismatches** vs master across ~200 routes; only 4 **intentional** security tightenings kept (site-utility→admin-only, reviews token-hiding, IDOR object-scope checkers, model allow-lists).
Design: `docs/superpowers/specs/2026-07-01-permissions-parity-and-denial-reasons-design.md`; plan: `docs/superpowers/plans/2026-07-01-permissions-parity.md`.

**Verification:** full vitest suite **619/619 green**; both workstreams whole-branch-reviewed (READY, no critical/important findings). Includes **runtime verification** beyond unit tests: a real **HTTP integration test** (`authz.integration.test.js`) exercising the live chain JWT→`requireAuth`→`requirePermissions`→`errorHandler`→envelope + `/auth/me` navigationTabs per role (403 carries `PERMISSION_DENIED`+`requiredPermissions`; scoped-checker denial carries `redirectTo`/`reason`), and the RouteGuard decision logic extracted to a pure `routeAccess.js` with per-role allow/block unit tests. Commits are on `frontend-redesign` (not merged to master — the user directed staying on this branch).

**Follow-ups / recommendations (not done):**
- **Prod runbook (user):** the metadata-only `migrate resolve --applied` on production — the one blocking real-world step; agent never touches prod.
- **Browser E2E:** the full app was NOT booted (its boot awaits Redis + a live Telegram connection before listening); actual in-browser render of the sidebar/RouteGuard/denial-toasts per role is verified by logic+HTTP tests but not by a running browser. Needs a running app (or a jsdom + @testing-library setup) — left for the user.
- **Per-screen action gating:** `usePermission`/`PermissionGate` + `capabilities.*` (already attached on ~21 module DTOs) should be wired into each screen's buttons as screens are redesigned — not done speculatively (YAGNI).
- **Audit logging:** a real who-did-what audit trail needs a NEW schema table (the existing `UserLog` is time-tracking). Schema is frozen → this is a user decision; NOT added autonomously.

**Next:** run the prod migration runbook (user); continue the UI redesign, wiring the permission primitives into each screen as it's redesigned.

---

## 1. What we are doing — in one paragraph

We are migrating the **entire Dream Studio app** (backend + frontend) from a messy legacy structure into a **clean modular npm-workspaces monorepo** that mirrors a mature reference project, **while preserving identical behavior** (same Prisma schema, same observable APIs). A strangler migration is already underway: `server/index.js` boots `server/v2/server.js`, and legacy + `v2` routers run side-by-side. We **complete the migration from `v2`** (after fixing v2's defects), redesign the weak permissions/auth layer, consolidate workers/cron to run from the server only, and **keep the PDF generation logic byte-for-byte frozen** (split into files only). i18n is dropped (single **English** UI, matching `master` — reverted from the redesign's Arabic on 2026-07-04) but the message-code pattern is kept. A separate, forward-looking UX plan rides alongside, feature-by-feature.

Full operating manual: [`CLAUDE.md`](CLAUDE.md).

---

## 2. Locked decisions (confirmed with the user)

| # | Decision |
|---|---|
| 1 | Target = **monorepo** mirroring the reference: `packages/db` + `packages/shared` + `server` (`src/modules`) + `web` (`features`). |
| 2 | **Prisma schema frozen** — relocated verbatim, not redesigned. |
| 3 | **Same observable API behavior** — restructure + harden, but the frontend contract stays equivalent; real changes tracked explicitly. |
| 4 | 🔒 **PDF generation logic-frozen** — split into files only, identical output. |
| 5 | **Drop bilingual i18n; keep message-code mechanism** resolving to a single **English** source (matching `master`; superseded the earlier "Arabic" decision 2026-07-04). |
| 6 | **Complete from `v2`** after remediating its defects. |
| 7 | **Workers run as a bootstrap from the server only.** |

---

## 3. Where we have reached — STATUS

**Current phase: 🎉 MIGRATION COMPLETE (BE + FE). NEXT = UX/UI REDESIGN.** Backend fully migrated;
frontend fully on `/v2` — 7 features have full screens (chat, site-utility, leads, projects/tasks,
accounting, calendar, contracts); 10 more have the v2 FOUNDATION (data layer: service→/v2, config,
permissions mirror, message resolver, route shell, wiring-proof page) with their real screens deferred
to the redesign (image-sessions, dashboard, notifications, utilities, courses/LMS, questions,
sales-stages, reviews, users, admin-residual). This is the user's **"Option A" (2026-06-08)**: build
each complex screen ONCE — in the redesign — directly on the foundation, instead of a throwaway 1:1
port of the bespoke legacy editors. FE foundation commits `5a44477` (image-sessions) → `127f414`
(permission mirror) → `42d62f9` (9 feature foundations); reviewed by 2 reconciliation agents with
**no blockers/should-fixes**. **Legacy removal is deferred to ride with the redesign** (per-screen, as
each redesigned screen replaces its legacy screen — NOT a big pre-redesign cutover; legacy still serves
the un-redesigned screens + the @role-slot dashboard shell). NEXT: shared-ui-ux-planner → redesign plan
→ shared-frontend builds screens feature-by-feature → per-screen legacy removal.

Commits on `server-migration`: foundation `3c84d5a` → chat `d980950` → site-utility `38f7bf0` → courses `1dbc181` → leads `c709d14` → users `5cf59ee` → validation-fix `934ba69` → projects `fe9957b` → accounting `d2bce49` → calendar `174e8e1` → notifications+utilities `6cac14e` → dashboard `bf5845b` → leaf-domains `e3da3a8` → contracts `ef95b73` → image-sessions `4f2baf0` → admin-residual `9325e29` → client-portal `e943739` → client-chat `efefedc` → web/leads `110948d` → web/projects `3216f31` → web/accounting `ea088f9`. App boots; legacy + `/v2` coexist (strangler). Full suite: **571 tests / 34 files green**. **🎉 BACKEND MIGRATION COMPLETE — every legacy router group now has a `/v2` equivalent (all domains + all client-facing surfaces). FE migration phase now IN PROGRESS — done: chat, site-utility, leads, projects/tasks, accounting; next: calendar.**

**Modules done (BE):** Chat (+FE), site-utility (+FE), Courses/LMS, Leads/clientLead CORE (IDOR keystone), Users (unblocks chat's `/v2/users` directory), Projects domain (project+task+update+delivery; IDOR keystone for designers/executors), Accounting (payment+expense+note+rent+salary+report; ACCOUNTANT-only money module), Calendar (availability+google-oauth+public client-booking), Notifications+Utilities (notifications IDOR-fixed + lookup helpers), Dashboard (9 role-scoped aggregations, IDOR-hardened), Leaf domains (questions+sales-stages+reviews), Contracts (authed CRUD + public e-sign; 🔒PDF wrapped), Image-sessions (admin+shared+public client; 🔒PDF + 🔒upload-chunk wrapped), Admin/staff residual (reports[🔒pdfkit]/commissions/fixed-data/admin-leads/archive/staff — the last BE module). Each went through review (+rework where needed) → verify. Security holes fixed in every module: Courses 2 critical IDOR; Leads 2 HIGH; Users profile-IDOR (full-row+password-hash leak + escalation) + mass-assign; Projects broad-delete IDOR + PII enumeration + mass-assign; Accounting money-validation + `.strict()` mass-assign defense + dropped client-trusted `oldPaymentLevel` + safe-parse filters (role parity ACCOUNTANT-only preserved); Calendar SAFE/0-introduced (client-booking kept public + token-over-body, no Google-token leak, role parity SHARED preserved) — 3 ported access-control quirks logged as a hardening backlog (see `docs/migration/RESUME-CHECKPOINT.md` §5b); Notifications closed an UNAUTH cross-user read/mark-read IDOR + a HIGH user-logs IDOR (self-scoped) + locked an open `prisma[model]` read to fixed pick-list projections; Dashboard closed a cross-user metric/activity over-exposure (non-admins forced to `req.auth.id`, admin-tier preserved 1:1, + non-numeric-id 403 guard); Leaf domains questions/sales-stages were unscoped lead data → reads access-scope + writes mutate-scope via the leads keystone, reviews OAuth token-leak closed; Contracts unscoped contract IDOR → lead-scope via `:contractId→lead` + public e-sign SSRF on `signatureUrl` locked in validation (PDF only wrapped, not modified); Image-sessions public token IDOR + an UNAUTH cross-session DELETE-images IDOR + SSRF closed, admin role-parity enforced, both frozen subsystems only wrapped; Admin-residual restored a base-role-ADMIN narrowing on destructive lead-delete (legacy had it, v2 had widened it) + closed staff latest-calls IDOR + field-update mass-assignment. Shared: validate middleware now emits a CODE not Zod prose.
**Remaining BE:** none — **the entire backend is migrated** (all domain modules + the client-facing sweep: public-lead funnel, client-portal payments/uploads/notes/languages, and client-chat). What's left: the **FE migration phase** (build `web/features/*` for the BE-only modules, applying the FE-repoint contract deltas in `RESUME-CHECKPOINT §5c`), then **Phase 12 cutover** (flip the FE fully to `/v2`, retire the legacy routers, rename `ui/→web/`). Also a small **hardening backlog** to raise with the user (RESUME-CHECKPOINT §5b + the ported public-surface quirks: calendar availability-delete scope, OAuth state, complete-register ownership token, upload/​pay rate-limits, e-sign replay guards). **FE:** the next major phase.
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

---

## Update 2026-07-11 — Lead access, profile signals & claim/kanban fixes

Fixed 7 lead defects (spec/plan: `docs/superpowers/{specs,plans}/2026-07-11-lead-access-profile-signals-and-claim-fixes.*`):
- **Leads scoping moved onto profiles.** The leads module no longer reads the legacy `isSuperSales`/`isPrimary` flags — it reads the active profile (`currentProfileKey` / `isAdminTier`, backfilled for every account at boot). `#isSuperSalesScope`/`#isPrimaryScope`/`isAdminUser` helpers.
- **#6:** `deals()` no longer self-scopes a SUPER_SALES profile (they now see all deals/leads), aligned with `columns()`/`getById`.
- **#7:** kanban `columns` 500 fixed (`filters` defaults to `{}`); the same hardening also landed in `getClientLeadsByDateRange`.
- **#4:** self-claim `assign` schema tolerates `null/0/""` `userId`; FE self-claim posts `{ id }` only.
- **#5:** NEW/ON_HOLD → IN_PROGRESS on claim (extracted `claimStatus`, tested).
- **#1/#2:** `#getStaffDetail` returns `LEAD_CLAIM_REQUIRED` (409) / `LEAD_ACCESS_DENIED` (403) instead of a misleading 404; the preview renders the error in a **closeable dialog** with a Start Deal CTA when claimable.
- **#3:** assign/claim action added to the New Leads card for `ASSIGN_OTHER` holders.

**LOCKED DECISION (2026-07-11): profiles are the sole source of truth for sales tier.** See `CLAUDE.md` §2.8 / §6. A user is super-sales/primary iff their **active profile** is `SUPER_SALES`/`PRIMARY_SALES`; both search-scoping and display derive from the active profile (`currentProfileKey`/`isAdminTier` backend, `user.profile` frontend). The `isSuperSales`/`isPrimary` columns stay in the schema but are read ONLY by (a) the boot backfill/derivation and (b) the user-CRUD write-sync. Reading them anywhere else is a bug.

**Phase-2 flag purge (✅ COMPLETE 2026-07-11):** every application-logic read of `isSuperSales`/`isPrimary` is gone (backend + frontend). Verified by grep gate: the ONLY residual occurrences are the sanctioned write-sync (`user.repo` `setUserProfile` / `user.usecase` `syncLegacyFlags`, writing the columns from profile meta), the `auth.dto` derivation `select` fragments, and `packages/shared` derivation (`deriveProfilesFromLegacy`/`resolveProfileKey`). Backend authorizes on `authUser.currentProfileKey`/`isAdminTier` (acting user) or `user.currentProfile.key` (DB-loaded user); FE reads `user.profile`. Super-sales is treated as ≥ primary-tier consistently (backend `#isPrimaryScope` + FE gates). Per owner decision the `auth.middleware` transitional `legacyIsAdminTier` fallback was DROPPED (un-migrated sessions → `isAdminTier: false`, waived — they self-heal on next token refresh after the boot backfill). Plan: `docs/superpowers/plans/2026-07-11-flags-to-profiles-purge.md`. Tests green (leads/users/projects/dashboard/calendar/contracts/auth/shared; 2 pre-existing projects FIX-3 validation failures are flag-unrelated); FE builds. Final review (opus): READY TO MERGE, 0 critical.
