# RESUME CHECKPOINT — Dream Studio backend migration

> **Purpose:** a single self-contained handoff file. Open this (plus `PROJECT_STATE.md`,
> `CLAUDE.md`, and `docs/migration/MIGRATION-LOG.md`) in any new session to continue
> the backend migration **exactly where it stopped**, with no re-discovery.
>
> Last updated: **2026-06-10** · Branch: `server-migration` · Working tree: **clean**

---

## 1. One-line status

🎉 **BACKEND MIGRATION COMPLETE** + 🎉 **FE MIGRATION COMPLETE** (every feature now on `/v2`).
**Full-feature FE (screens + data):** chat, site-utility, leads/sales, projects/tasks/updates/delivery,
accounting, calendar, contracts. **FE FOUNDATION (data layer only — screens deferred to the redesign,
per the user's "Option A" decision 2026-06-08):** image-sessions `5a44477`, + (commit `42d62f9`)
dashboard, notifications, utilities, courses/LMS, questions, sales-stages, reviews, users, admin-residual;
FE permission mirror completed `127f414`. Suite **571 tests / 34 files green**; working tree clean.
Reconciliation review (2 agents) over the whole foundation: **no blockers, no should-fixes** — paths/
params/permission-strings/§5c-deltas all correct, nothing frozen/shared touched.

**CURRENT PHASE: UX/UI REDESIGN — IN PROGRESS.** Per the user (2026-06-08, "Option A" + "build straight
through autonomously"): the redesign BUILDS each real screen once, directly on the v2 foundation.
User answers (2026-06-08): charts standardized on **@mui/x-charts**; Reviews = **read-only + "not
configured"** state; pacing = **build straight through, commit per feature**.

REDESIGN PROGRESS:
- ✅ Master plan: `docs/migration/05-ux-plan.md` (commit `2ae94fc`).
- ✅ **Phase 0** (shell + nav + shared primitives + theme tokens) — commit `07e3a5e`. Built:
  `v2/features/shell/` (nav.config.js capability-gated, AppShell = RTL side-nav + TopBar + role chip +
  live NotificationBell), `v2/shared/components/` (PageHeader, SectionCard, DataTablePage, UrlTabs,
  StatusChip, StageStepper, ChartCard, RoleChip + 5 states), `v2/shared/layout/{AuthedAppLayout,
  PublicAppLayout}` (all 19 authed + 3 public feature layouts collapsed to one-liners), theme
  `palette.status.*` + accessible text token, root `<html lang=ar dir=rtl>`, `@mui/x-charts ^8` added.
- ✅ **Phase 1 (Wave A)** — Notifications, Users (+ new `usersDetails` editor), Dashboard. Commit `6ae4cf4`.
- ✅ **Phase 4 (Wave B)** — adminResidual (5 sub-routes + NEW feature-local blob-download helper),
  Reviews (read-only + "غير مُفعّل"), Utilities (global search + user-log + fixed-data). Commit `3c04234`.
- ✅ **Phase 3 (Wave C)** — image-sessions (admin reference CRUD + pros-&-cons reorder; LeadSessionsPanel;
  PUBLIC wizard → signature → frozen PDF), courses/LMS (admin authoring `coursesDetails` + staff learner
  `courses/learner` w/ resumable test-taker). Commit `f7c6a43`.
- ✅ **Phase 2 (Wave D)** — lead-context tools wired into `leadsDetails`: sales-stage header strip,
  SPIN/VERSA tabs, image-sessions session tab. Commit `b63ba3e`.

🎉 **ALL REDESIGN FEATURE BUILDS COMPLETE (Phases 0–4).** Every screen rebuilt on the shell primitives.

- ✅ **Post-redesign FE polish** — the user manually committed a large WIP as `73e7f9d` ("save"):
  **centralized the FE Arabic message resolver** (`v2/data/messages/*` + `data/resolveMessageCode.js`;
  every feature's `*.mutations.js`/`config/*Messages.js` now delegates unknown codes to it) + a **Prisma
  migration-history squash** into a single `20260608105742_init` baseline (⚠️ `schema.prisma` NOT touched —
  schema still 🔒 frozen; only migration history reset → clean on a FRESH DB, re-baseline an existing one).
  Reconciled this session: shared-reviewer verdict **safe, 100% BE↔FE code-parity, no blockers**. Fixed the
  one should-fix (success toasts could render the error-default string) — added `fallback: "تمت العملية"`
  to the success branch of all 17 mutation runners; untracked + gitignored 3 stray run/build logs.
  Commit `6193984`. Suite still **571/34 green**.

✅ **RUNTIME VERIFICATION DONE (2026-06-10, Playwright click-through of all 22 v2 routes as a fresh
ADMIN):** shell/nav/RTL/breadcrumbs + 18 of the screens render and fetch `/v2/*` cleanly (notifications,
chat, leads, tasks, image-sessions, accounting, courses ×2, users + detail, site-utilities, reviews,
utilities, admin ×5, calendar). Unauth API → 401 `UNAUTHORIZED` envelope ✓. 4 blockers were found —
**✅ ALL 4 NOW FIXED (2026-06-10)** via 4 build agents + 1 reconciliation reviewer (verdict: safe to
commit, no token leak, layering respected, behavior preserved) → suite **571/34 green**, BE
`node --check` + FE esbuild parse clean, guarded boot clean:
  1. ✅ **Dashboard infinite refetch loop** — `useRequest`'s `fetchData` depended on `useLoading`'s
     non-memoized `startLoading/stopLoading`, so the `autoFetch` effect refired every render
     ("Maximum update depth exceeded"). Fixed by wrapping both in `useCallback([])`
     (`ui/src/app/v2/hooks/useLoading.js`); fixes `FixedDataList` + all autoFetch consumers
     transitively. (`AdminProjectsView` was NOT actually on this chain — it uses a self-contained
     hook.) Commit **`0cf427a`**.
  2. ✅ **Projects board 500 for admins** — the legacy designers board was 5 per-`type` kanban boards,
     each sending `?type=<dept>`; the v2 board sent none, crashing the legacy service
     (`updatesWhere.OR.push` / `where.projects.some` on undefined, `projectServices.js`). Fixed by FE
     parity (a department selector `PROJECT_TYPES`; `useProjectBoard` forwards `type` for the designers
     board only) + behavior-neutral BE null-guards in `getLeadByPorjects` + `getLeadByPorjectsColumn`
     (no-ops when `type` is present, so no role's rows change). Commit **`ed28386`**.
  3. ✅ **`/v2/contracts/payments` dead nav** — the path fell into dynamic `contracts/[leadId]`
     (`leadId="payments"` → 422). Built the v2 contract-payments page (legacy `ContractPaymentsPage`
     parity — same data/audience/actions — on the redesign shell primitives); a new STATIC route shell
     `(v2-features)/v2/contracts/payments/page.jsx` shadows the dynamic sibling. Endpoint + service +
     codes already existed (data shape uses `limit`/`totalPages`, gated `CONTRACT.PAYMENT_LIST`, manage
     controls gated `CONTRACT.PAYMENT_MANAGE`). Commit **`2d55b84`**.
  4. ✅ **Calendar google/status 500** — repo selected nonexistent `User.googleCalendarConnected`.
     Fixed by selecting the real `googleRefreshToken` and deriving `connected = Boolean(refreshToken)`
     in the usecase (shape `{connected, calendarId, tokenExpired}` unchanged; token never leaves the
     usecase / never logged). Also patched the still-live legacy `routes/calendar/google.js` (same bug
     + it had NO `prisma` import → ReferenceError). Token-leak test updated to the real schema shape.
     Commit **`442d7b2`**.
  Minor (still open, low priority): unauth visit to a v2 route shows a permission-denied dead end
  instead of redirecting to /login; login error toast shows the raw code `INVALID_CREDENTIALS`
  (resolver miss). NOT exercised: public image-session wizard + report PDF downloads (no token/data in
  the fresh dev DB). Two dormant code nits flagged by the reviewer (neither reachable today): a latent
  `useRequest` loop if a caller ever passes a non-memoized `initialParams`; an unguarded
  `staffId`-without-`type` deref in `projectServices.js`.

✅ **MASTER SYNC (2026-06-10, commit `e04dabb`):** master's only commit this week — `fdefbbf`
"edit client register" — cherry-picked + ported onto the relocated modules (legacy funnel files as-is;
`src/.../booking-lead` repo `findByEmail` + relaxed create validation; `src/.../public-lead` register
draft-placeholder defaults + complete-register client name/phone fix-up). Live-probed end-to-end.

⏭️ **CUTOVER PHASE (task #13) — IN PROGRESS (2026-06-11). Gated steps A–E; A–C DONE + runtime-verified,
D scoped (partly blocked), E needs a user checkpoint.**
  - ✅ **Step A — entry flip** (`6d45f0b`) + proxy public-exemption fix (`3a5a82d`): `/` + post-login →
    `/v2/dashboard`; `PROTECTED_PREFIXES` += `/v2`. **Caught+fixed a regression:** the server-side Next
    middleware `ui/src/proxy.js` (named proxy.js, not middleware.js) gates `PROTECTED_PREFIXES` at the edge,
    so adding `/v2` bounced the PUBLIC token surfaces to /login. Added `PUBLIC_V2_PREFIXES`
    (`/v2/booking`, `/v2/contracts-sign`, `/v2/client-image-session`) exempted in proxy.js + constant.js.
  - ✅ **Step B — legacy @role-slot removal** (`189f75b`): deleted `ui/src/app/(auth)/dashboard/` (105 files).
    Kept `(auth)/(auth-group)/login` + `reset`.
  - ✅ **Step C — redirect shells** (`d09ca57` + completion `9d2bd07`): FROZEN services hardcode legacy FE
    PATHS via `OLDORIGIN` (OLDORIGIN/ORIGIN are SEPARATE origins, to be unified later under a base-domain
    model — user decision 2026-06-11). So legacy paths are kept as thin server redirects → v2 (query/token
    preserved), NOT deleted: `/contracts`,`/image-session`,`/booking`,`/dashboard`,`/dashboard/{deals,leads,
    users,tasks,projects,notifications,work-stages/*}`. Work-stages id is a LEAD id → `/v2/leads/{id}`. Added
    `v2/lib/forwardQuery.js` + `v2/lib/safeRedirect.js` (closed a login open-redirect found in review). Kept
    `/chats` (legacy public client-chat — NO v2 equivalent yet).
  - **RUNTIME-VERIFIED (shared-tester, real boot, Redis up):** 15/15 redirect routes correct; public v2
    surfaces 200 (no login bounce) while authed-only → /login; admin login OK (role ADMIN, **123 perms /
    23 modules**), `{items,total,page,pageSize}` shape confirmed. `npm test` 571/34, `next build` clean.
  - ✅ **Step D (backend half) — DONE** (`28ab93b`): unmounted the 4 provably-dead legacy routers
    (`/utility`,`/staff`,`/admin`,`/accountant`) from `app.js` (files left on disk, reversible); **kept
    `/shared`+`/client`+`/v2`**. Decoupled `payments.usecase` backfill off `SECRET_KEY` → fail-closed
    `env.BACKFILL_SECRET`. CORS now allows base-domain + any subdomain via `env.ALLOWED_DOMAINS` (additive,
    inert when unset). Cookie `domain` from `env.COOKIE_DOMAIN` (undefined on ISLOCAL/when unset). `SECRET_KEY`
    kept for the JWT legacy read-shim. Verified: npm test 571/34, boot OK, admin login 200 (no Domain cookie
    locally), `/admin/*`→404, `/shared`→401. **For prod:** set `ALLOWED_DOMAINS`, `COOKIE_DOMAIN`, `BACKFILL_SECRET`.
  - ⛔ **Step D (router removal) + chat — DEFERRED (documented, NOT done): live client-chat migration project.**
    Chat map (Explore, verified): `/v2/chat` already fully covers staff chat (legacy staff chat UI is dead —
    it lived in the deleted dashboard). BUT legacy **`/chats`** is the LIVE public client-chat entry (token
    links `/chats?roomId&token` are shared into the wild via `ChatAccessLinkBox`), and the v2 client-chat
    **backend exists** (`/v2/client/chat`, 1:1) **but has NO v2 FE page**. Also the v2 chat service still calls
    legacy **`/shared/all-related-chat-users`** (`ui/.../v2/features/chat/chat.service.js`). So `/shared` +
    `/client` stay until: (1) build a v2 public client-chat FE page on `/v2/client/chat`; (2) convert `/chats`
    to a redirect shell preserving `?roomId&token` (keeps in-the-wild links alive); (3) repoint
    `ChatAccessLinkBox` to the v2 path; (4) migrate the `all-related-chat-users` directory call to v2; then
    unmount `/shared`+`/client`. NOT done blind because it is live + client-facing and a real room token can't
    be minted to verify a new page end-to-end in a sandbox. Then the now-orphaned legacy
    `UiComponents/DataViewer/chat/*` + the dead legacy `server/routes/**` files can be deleted.
  - 🛑 **Step E — `ui/ → web/` rename + workspaces.** The TRUE-final step (decision #9 ties it to FULL legacy
    retirement, which the chat dependency above still blocks). Deferred: it disrupts the running dev env
    (node_modules/.next/running servers) for a cosmetic rename while legacy isn't fully gone. Low code-impact
    (`@/*` is workspace-local; only root `package.json` workspaces+scripts + the dir move).
  - **Frozen services under `server/services/**` are lazy-imported by v2 and MUST NOT be deleted** (separate
    from the legacy `server/routes/**` routers).

**FOLLOW-UPS surfaced during the build (carry into a polish pass):**
  - `StatusChip` has no `notification`/`user`/`session` domain → Wave A/C used local labelled chips or
    neutral color. Promote to first-class domains in `v2/providers/statusTokens.js` + `shared/config/statusLabels.js`.
  - image-sessions admin reference create/edit submits the bilingual-builder shape under a PLACEHOLDER
    `REFERENCE_LANGUAGE_ID = 1` (`imageSessionsConstants.js`) — confirm the real Arabic `Language` row id
    (or expose a languages reader). Images-tab chunk-uploader left read-only (not ported).
  - Dashboard admin `staffId` re-scope is a free-form numeric input (no shared staff pick-list in the
    dashboard contract) — swap to a searchable picker when a shared staff list exists.
  - Several feature responses (course dashboard fields, getStages/getVersaByCategory shapes, report export
    payload nesting, reviews Google-native shape) are read DEFENSIVELY — re-verify field names against live
    responses during runtime testing.

FE method (the proven loop): build via shared-frontend (study `ui/src/app/v2/features/{chat,leads}` as the
pattern; reuse the foundation in `v2/{hooks,config,lib,shared,providers}`; mount a route shell under
`(v2-features)/v2/<x>/`) → reconciliation review (shared-reviewer vs the BE contract — catches envelope-depth,
path/param, body, capability-name, permission-string, message-code mismatches that esbuild can't) → rework →
verify with esbuild parse+bundle (no FE test runner) → commit. Preserve behavior (NOT a UX redesign);
point at `/v2/*`; gate on `usePermission` × `capabilities.*`; apply §5c deltas; single Arabic/RTL.

---

## 2. Exactly where we stopped (last completed work)

- **Client-facing surface sweep (BE COMPLETE)** — `server/src/modules/leads/client/public-lead/` +
  `server/src/modules/client-portal/{payments,uploads,notes,languages}/` (commit **`e943739`**) and
  `server/src/modules/chat/client/` (commit **`efefedc`**), all mounted `/v2/client/*` (public/token-based).
  Both security-reviewed SAFE. Closed a payment mark-paid IDOR, a notes dynamic-key IDOR, and a serious
  client-chat broken-access IDOR (6/7 legacy endpoints required no token). `routes/client/telegram.js`
  was dead (skipped). Ported public-surface quirks → §5b backlog. **This finished the backend.**
- **Admin/staff residual BE (the last BE DOMAIN module)** — `server/src/modules/admin-residual/` (reports/,
  admin-leads/, commissions/, fixed-data/, model-archive/, admin-projects/, staff/), mounted `/v2/admin`
  (ADMIN-tier) + `/v2/staff`. Build → security review (verdict COMMIT-BLOCKED on one HIGH) → **rework** →
  verify → commit → logs. Commit **`9325e29`**. pdfkit reports WRAPPED only. Closed: a destructive-DELETE
  privilege widening (restored legacy base-role-ADMIN-only), staff latest-calls IDOR, field-update
  mass-assignment. Skipped the already-migrated user-mgmt/courses/image-session admin routes.
- **Image-sessions BE** — `/v2/image-sessions/admin` + `/v2/image-session` + public `/v2/client/image-session`.
  Commit **`4f2baf0`**. Frozen PDF + upload-chunk wrapped; cross-session DELETE-images IDOR + SSRF closed.
- **Contracts BE** — `/v2/contracts` + public `/v2/client/contracts`. Commit **`ef95b73`**. PDF wrapped; IDOR + HIGH SSRF closed.
- **Leaf domains BE** — `/v2/{questions,sales-stages,reviews}`. Commit **`e3da3a8`**.
- **Dashboard BE** — `/v2/dashboard`. Commit **`bf5845b`**.
- **Notifications + Utilities BE** — `/v2/notifications` + `/v2/utilities/*`. Commit **`6cac14e`**.
- **Calendar BE** — `/v2/calendar` + `/v2/calendar-management` + public `/v2/client/calendar`. Commit **`174e8e1`**.
- **Accounting BE** — `/v2/accounting`. Commits **`d2bce49`** / docs **`edb204e`**.
- All details in `MIGRATION-LOG.md` (Stage 4 entries).

## 3. Commit trail on `server-migration` (most recent last)

```
foundation 3c84d5a → chat d980950 → site-utility 38f7bf0 → courses 1dbc181 →
leads c709d14 → users 5cf59ee → validation-fix 934ba69 → projects fe9957b →
(docs ce7a3d9) → accounting d2bce49 → (docs edb204e) → (checkpoint 5465e09) →
calendar 174e8e1 → (docs db76261) → notifications+utilities 6cac14e →
(docs d854be0) → dashboard bf5845b → (docs 6d474c2) → leaf-domains e3da3a8 →
(docs 6a91bab) → contracts ef95b73 → (docs 96fd4b7) → image-sessions 4f2baf0 →
(docs cf6fc9f) → admin-residual 9325e29 → (docs 3943c77) → client-portal e943739 →
client-chat efefedc → (docs 063b101) → web/leads 110948d → (docs dd5749b) →
web/projects 3216f31 → web/accounting ea088f9 → web/calendar 97f0138 →
web/contracts 1fd3f16 → (docs 8ff3b12) → web/image-sessions(foundation) 5a44477 →
web/permissions-mirror 127f414 → web/foundation(dashboard/notifications/utilities/courses/
questions/sales-stages/reviews/users/admin-residual) 42d62f9 → (docs 57a3c00) →
(ux-plan 2ae94fc) → redesign-Phase0(shell+primitives) 07e3a5e → redesign-Wave A
(notifications/users/dashboard) 6ae4cf4 → (docs 68b7666) → Wave B(adminResidual/reviews/
utilities) 3c04234 → Wave C(image-sessions/courses) f7c6a43 → Wave D(lead-context tools) b63ba3e →
(checkpoint 84a1692) → save[user WIP: central msg-resolver + prisma squash] 73e7f9d →
success-toast-fallback fix + untrack logs 6193984 → (docs 11ce5ac) →
master-sync[fdefbbf client-register → migrated funnel] e04dabb
```
Baseline / rollback point: `9406978` ("merged").
✅ FE migration COMPLETE (full features + foundations). NEXT phase = UX/UI redesign.

## 4. Modules DONE (BE) — ALL DOMAINS

Chat (+FE), site-utility (+FE), Courses/LMS, Leads/clientLead CORE (IDOR keystone),
Users, Projects domain (project+task+update+delivery), **Accounting**, **Calendar**,
**Notifications+Utilities**, **Dashboard**, **Leaf-domains (questions/sales-stages/reviews)**,
**Contracts**, **Image-sessions**, **Admin/staff residual**. ← backend domain migration COMPLETE.

## 5. NEXT: the FE migration phase (then UX plan, then Phase 12 cutover)

> **User decision (2026-06-08, REFINED to "Option A"):** Finish the FE migration first — DONE.
> For the remaining heavy features, wire the v2 FOUNDATION now (service→/v2, config, permissions
> mirror, message resolver, route shell, a permission-gated wiring-proof page) but DON'T re-port the
> bespoke legacy screen internals (the ~12k-LOC image-session editors, etc.). The UX REDESIGN then
> builds each NEW screen ONCE on that foundation, so complex screens are built once, not twice.
> Legacy is removed per-screen AS the redesigned screen replaces it (NOT in a big pre-redesign cutover).
> ✅ ALL FE foundations are now built + reviewed (commits `5a44477`, `127f414`, `42d62f9`).
> **NEXT = the UX/UI redesign phase (planner → frontend build → per-screen legacy removal).**


The backend is fully migrated. What remains:

**A. FE migration phase** (`04-frontend-plan.md`) — build `web/features/<x>` (+ `<x>Details`) for the
BE-only modules, each with a `config/` folder: config-driven DataTable lists, `AppForm`+react-hook-form
create/edit modals, the single `useRequest`/`ApiFetch` data layer pointed at `/v2/*`, `usePermission`
gating (same predicate gates nav + page + action) using the `permissions[]`/`capabilities.*` the BE now
emits. Single Arabic/RTL, message-code→Arabic resolution. **Apply the FE-repoint contract deltas in §5c**
(workflow-action renames, `{items,total,page,pageSize}` lists, model pick-list name changes, user-logs
self-scope, image-session DELETE needs `{token}`, contracts/image-session client envelope changes, etc.).
Suggested order (trail each FE feature behind its already-done BE module, per 07 §5): auth/me wiring →
leads/sales → projects/tasks → accounting → calendar → contracts → image-sessions → dashboard →
notifications → courses → questions/sales-stages/reviews → users/admin → website-utilities. Chat +
site-utility already have FE.

**B. Phase 12 cutover** — flip the FE fully to `/v2`, remove the legacy routers + dual-cookie shim,
rename `ui/ → web/`, wire workspaces.

## 5a. HARDENING BACKLOG — raise with the user before/with the FE phase (NOT yet applied)
Verbatim-ported access-control quirks of intentionally-public surfaces + a couple of deferred items;
each CHANGES observable behavior so needs sign-off:
1. **Calendar** availability `DELETE /days/:id` + `/slots/:id` — no ownership/booked-slot guard (any
   `calendar.manage` holder deletes any admin's availability; likely intended shared-studio behavior — confirm).
2. **Calendar/Reviews OAuth `state`** is an unsigned id — sign/nonce it; prefer `req.auth.id` on callback.
3. **Contracts + image-sessions public e-sign** — no transition/replay guard (a token holder can
   re-finalize / move status within the enum).
4. **Public lead funnel** `complete-register/:leadId` — no per-draft ownership token (any caller can
   complete any draft lead); needs a product threat-model decision.
5. **client-portal** — no multer size/MIME limit + no rate-limit on `/pay` & uploads (DoS); `/payment-status`
   returns the full Stripe session (FE relies on it).
6. **client-chat** — positional token→member binding (fine for single-client rooms; revisit if multi-client).

---

## 5c. FE-REPOINT CONTRACT CHANGES (apply when the FE migrates onto these v2 modules)

- **Utilities model pick-lists** (`/v2/utilities/` + `/ids`): the `model=` names CHANGED to real
  Prisma delegates — `image→designImage`, `pattern`/`color→colorPattern`, `imageSession` REMOVED.
  Relation-titled models (`colorPattern`/`space`/`material`/`style`) return `title` as a relation →
  read `title[].text`. `designImage`→`{id,imageUrl}`, `fixedData`→`{id,title}` scalar. Client
  `select`/`include`/`where` are NO LONGER honored (fixed projection only).
- **Notifications**: lists normalized `{data,totalPages,total}`→`{items,total,page,pageSize}`;
  mark-read is now `POST /v2/notifications/actions/mark-read` (no client `:userId`).
- **User-logs** (`/v2/utilities/user-logs`): no longer accept a `userId` param (self-scoped to the
  caller). Admin-on-behalf-of must go through the users module (`USER.VIEW_LOGS`) if needed.
- **Contracts** (`/v2/contracts`): workflow renames — `PATCH /:contractId/cancel`→`POST /:contractId/actions/cancel`;
  `PATCH /:contractId` (gen token)→`POST /:contractId/actions/generate-pdf-token`; payment status/amounts→
  `POST .../actions/change-status|update-amounts`. Public e-sign envelope codes replaced Arabic prose.
- **Image-sessions**: design-images list is now nested under the envelope `data` (was returned top-level);
  **`DELETE /v2/client/image-session/images/:imageId` now REQUIRES `{token}` in the request body** — the FE
  delete button (`ui/.../image-session/client-session/ImageComponent.jsx`) currently sends an empty body and
  must be updated to send the session token, or the delete will 422/404. (Security: this closed an
  unauthenticated cross-session delete-by-id IDOR.)

---

## 5b. HARDENING BACKLOG — to raise with the user (NOT yet applied)

These are **verbatim-ported legacy access-control quirks**, faithfully preserved during migration
(behavior-freeze). They are present identically in the still-live legacy routes, so the v2 commit
did NOT increase attack surface — but they are real and should be decided on with the user, since
fixing them CHANGES observable authorization behavior (needs explicit approval per the rules).

**Calendar (from the security review of `174e8e1`):**
1. **Availability delete has no ownership/booked-slot guard** —
   `availability.repository.js` `DELETE /days/:id` + `/slots/:id`: any holder of `calendar.manage`
   (i.e. every authed role) can delete ANY admin's availability day/slot, cascading even booked
   slots. *Likely intended shared-studio behavior — confirm with user. If not intended: add an
   ownership/admin-tier scope check + restore the service-level booked-slot guard.* (Highest impact.)
2. **OAuth `state` is an unsigned user id** — `googleCalendar.js` `getAuthUrl` sets
   `state = userId`; the callback writes Google tokens onto `parseInt(state)` with no signature/nonce
   → state-tamper account-link confusion. *Fix: sign/HMAC or nonce the `state`; prefer `req.auth.id`.*
3. **`/book` trusts `selectedSlot.id`** without a slot-belongs-to-admin check (data-integrity
   nuisance only; reminder is still the token's own — not cross-tenant). *Optional: add the check.*

## 6. THE LOOP to run per module (established, do not deviate)

1. **Build agent** (`shared-backend`): extract legacy → `server/src/modules/<x>/` layered
   (route→controller→usecase→repository + validation + dto), mount under `/v2/<x>` in
   `server/src/shared/routes.js`. Adapt heavy/side-effecting legacy services via **lazy import
   adapters** (do NOT duplicate logic). Add `*_PERMISSIONS` + `PERMISSIONS.<DOMAIN>` in
   `packages/shared/constants/access/permissions.constants.js`, grant in `role-permissions.js`
   (**preserve the legacy gate exactly — verify against `verifyTokenAndHandleAuthorization`,
   do not widen roles**), add message codes in `packages/shared/messages-codes/<x>/`.
2. **Security review agent** (`shared-security`, READ-ONLY): IDOR/object-scope, role parity,
   mass-assignment (`.passthrough()`→`.strict()`), input/money validation, no PII/hash leak,
   workflow `/actions/*`, language-neutral codes, no double `validate(...,"params")`.
3. **Rework agent** (`shared-backend`): apply the review's fixes.
4. **Verify** (run yourself): root `npm test` (all green), `node --check`, and a guarded boot
   **from the `server/` dir**: `RUN_WORKERS=false RUN_CRON=false PORT=<free> node index.js`.
   Ignore the known `User.allowEmailing` DB-drift line + telegram skip — pre-existing, unrelated.
5. **Commit** the module (bash heredoc for the message — NOT PowerShell here-string).
6. **Update logs**: `MIGRATION-LOG.md` (status row + a Stage-4 changelog entry, most-recent-first)
   and `PROJECT_STATE.md` (commit trail + module lists + test count), then commit docs.
7. Mark the task complete, set the next one in_progress, continue.

**BE module agents run SEQUENTIALLY** — they all edit the same shared files
(`permissions.constants.js`, `role-permissions.js`, `messages-codes/index.js`,
`messages-names.js`, `server/src/shared/routes.js`). Never run two in parallel.

## 7. Remaining BE modules (after calendar)

notifications + utilities (#3), dashboard (#4), small leaf domains — questions/sales-stages/
reviews/clients (#5), contracts (#6, 🔒 FROZEN PDF — split only, byte-identical), image-sessions
(#7, 🔒 FROZEN PDF + 🔒 upload-chunk, largest), admin/staff residual (#8, reports pdfkit frozen,
telegram assign, settings). **FE for all BE-only modules is deferred** (per user: backend only now).

## 8. Hard rules (from CLAUDE.md — never violate)

- 🔒 Prisma schema FROZEN. 🔒 PDF generation LOGIC-FROZEN (split/relocate only, byte-identical;
  fragile `__dirname` font loading). 🔒 Upload chunk mechanism FROZEN. Workers run from server
  bootstrap only.
- Public/client endpoints (booking funnel, `/files/client/*`, client calendar booking) stay PUBLIC.
- `message` is ALWAYS a language-neutral CODE (never Arabic/English prose). Single Arabic UI, no i18n.
- Authorization = authentication + permission code + object scope + status/workflow guard. Never
  role-only, no wildcards. **Preserve the legacy role gate exactly** — widening is a behavior change
  needing explicit user approval.
- Preserve observable API behavior except the sanctioned additive changes (envelope/codes/
  capabilities/pagination/IDOR-hardening/workflow-action renames). Report conflicts, don't guess.
- All messages/docs to the user in **English**; agents write module code (orchestrator reviews/commits).

## 9. How to resume in a new session

> "Read `docs/migration/RESUME-CHECKPOINT.md`, `PROJECT_STATE.md`, `CLAUDE.md`, `docs/migration/
> 04-frontend-plan.md`, and `docs/migration/MIGRATION-LOG.md`. Confirm the working tree is clean and
> `npm test` is green (549/34). The BACKEND is fully migrated and the leads/sales FE feature is done
> (leads/projects/accounting done; suite 571/34) — continue the **FE migration phase** with the
> **calendar** feature next (then contracts, image-sessions, dashboard, notifications, courses,
> questions/sales-stages/reviews, users/admin), using the FE loop in §1 (build via shared-frontend
> [pattern = v2/features/{chat,leads,projects,accounting}] → reconciliation review → rework → esbuild
> verify → commit). Point at `/v2/*`, gate on usePermission × capabilities, apply §5c."
