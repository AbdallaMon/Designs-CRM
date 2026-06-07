# RESUME CHECKPOINT — Dream Studio backend migration

> **Purpose:** a single self-contained handoff file. Open this (plus `PROJECT_STATE.md`,
> `CLAUDE.md`, and `docs/migration/MIGRATION-LOG.md`) in any new session to continue
> the backend migration **exactly where it stopped**, with no re-discovery.
>
> Last updated: **2026-06-07** · Branch: `server-migration` · Working tree: **clean**

---

## 1. One-line status

The **Accounting**, **Calendar**, **Notifications+Utilities**, and **Dashboard** backend modules are
migrated, security-reviewed (+reworked), verified, and committed. **Leaf domains (questions,
sales-stages, reviews, clients) are the next to migrate.** Full suite: **360 tests / 23 files green**.
Working tree clean.

---

## 2. Exactly where we stopped (last completed work)

- **Dashboard BE** — `server/src/modules/dashboard/`, mounted `/v2/dashboard` (9 read-only role-scoped
  aggregations). Build → security review (verdict SAFE) → small hardening rework → verify → commit → logs.
  Commit **`bf5845b`**. Closed a cross-user metric/activity over-exposure (non-admins forced to
  `req.auth.id`; admin-tier preserved; + non-numeric-id 403 guard). Excluded `/staff/dashboard/latest-calls`
  (leads/staff-residual). Contract deltas recorded in `03-backend-plan.md` §12.
- **Notifications + Utilities BE** — `/v2/notifications` + `/v2/utilities/*`. Commit **`6cac14e`**.
  Closed an UNAUTH cross-user notification IDOR + a HIGH user-logs IDOR + locked an open `prisma[model]`
  read. `/utility/upload*` left on legacy. **FE-repoint contract changes in §5c.**
- **Calendar BE** — `/v2/calendar` + `/v2/calendar-management` + **public** `/v2/client/calendar`. Commit **`174e8e1`**.
- **Accounting BE** — `/v2/accounting`. Commits **`d2bce49`** / docs **`edb204e`**.
- All details in `MIGRATION-LOG.md` (Stage 4 entries).

## 3. Commit trail on `server-migration` (most recent last)

```
foundation 3c84d5a → chat d980950 → site-utility 38f7bf0 → courses 1dbc181 →
leads c709d14 → users 5cf59ee → validation-fix 934ba69 → projects fe9957b →
(docs ce7a3d9) → accounting d2bce49 → (docs edb204e) → (checkpoint 5465e09) →
calendar 174e8e1 → (docs db76261) → notifications+utilities 6cac14e →
(docs d854be0) → dashboard bf5845b
```
Baseline / rollback point: `9406978` ("merged").

## 4. Modules DONE (BE)

Chat (+FE), site-utility (+FE), Courses/LMS, Leads/clientLead CORE (IDOR keystone),
Users, Projects domain (project+task+update+delivery), **Accounting**, **Calendar**,
**Notifications+Utilities**, **Dashboard**.

## 5. NEXT: Leaf domains BE — questions, sales-stages, reviews, clients (task #5, in_progress)

Not yet scoped in detail. Before dispatching the build agent(s), scope each:
- Grep `server/routes/` for: `routes/questions/*` (mounted `/shared/questions` behind SHARED gate),
  sales-stages, reviews (`routes/` — the reviews are a thin Google-OAuth review integration per
  PROJECT_STATE), and `routes/clients/clients.js` (mounted `/client`). Resolve every mount + auth gate.
- **Entanglement note (from PROJECT_STATE §3):** some leaf domains (questions, notes, sales-stages,
  client-payments) are coupled to the `clientLead` keystone — most of clientLead is already migrated
  (leads module), so these should now extract cleanly, but verify the shared service fns.
- `routes/clients/*` is the CLIENT-FACING surface (mounted `/client`) — check which endpoints are
  PUBLIC (client booking/contract/image-session flows) vs authed; keep public ones ungated.
- Watch for the client-calendar sub-router already migrated under `/v2/client/calendar` — don't
  re-migrate it; clients.js mounts it at `/client/calendar`.
- These are small; you can run them as separate sequential module passes (BE agents are SEQUENTIAL —
  they share the same shared files) OR one combined pass if they're tightly coupled. Run the loop (§6) per pass.

(After this: contracts #6 🔒PDF, image-sessions #7 🔒PDF+🔒upload, admin/staff residual #8.)

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

> "Read `docs/migration/RESUME-CHECKPOINT.md`, `PROJECT_STATE.md`, `CLAUDE.md`, and
> `docs/migration/MIGRATION-LOG.md`. Confirm the working tree is clean and `npm test` is green
> (360/23), then continue the migration with the **leaf domains** (questions, sales-stages,
> reviews, clients) using the established agent loop (§6 of the checkpoint), backend only."
