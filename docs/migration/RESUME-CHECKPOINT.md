# RESUME CHECKPOINT — Dream Studio backend migration

> **Purpose:** a single self-contained handoff file. Open this (plus `PROJECT_STATE.md`,
> `CLAUDE.md`, and `docs/migration/MIGRATION-LOG.md`) in any new session to continue
> the backend migration **exactly where it stopped**, with no re-discovery.
>
> Last updated: **2026-06-07** · Branch: `server-migration` · Working tree: **clean**

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

**NEXT PHASE: UX/UI REDESIGN.** Per the user (2026-06-08, "Option A"): the redesign BUILDS each real
screen once, directly on the v2 foundation (no throwaway 1:1 port of the bespoke legacy editors).
Order: (1) shared-ui-ux-planner → redesign plan (app shell/nav, role clarity, per-feature screens);
(2) shared-frontend → implement screens feature-by-feature on the foundation; (3) remove legacy
per-screen AS each redesigned screen replaces it (NOT before — legacy still serves the un-redesigned
screens + the @role-slot dashboard shell). Commit before & after each step.

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
questions/sales-stages/reviews/users/admin-residual) 42d62f9
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
