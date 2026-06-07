# RESUME CHECKPOINT — Dream Studio backend migration

> **Purpose:** a single self-contained handoff file. Open this (plus `PROJECT_STATE.md`,
> `CLAUDE.md`, and `docs/migration/MIGRATION-LOG.md`) in any new session to continue
> the backend migration **exactly where it stopped**, with no re-discovery.
>
> Last updated: **2026-06-07** · Branch: `server-migration` · Working tree: **clean**

---

## 1. One-line status

The **Accounting**, **Calendar**, **Notifications+Utilities**, **Dashboard**, and **Leaf-domains
(questions/sales-stages/reviews)** backend modules are migrated, security-reviewed (+reworked),
verified, and committed. **Contracts (🔒 frozen PDF) is the next to migrate.** Full suite:
**398 tests / 27 files green**. Working tree clean.

---

## 2. Exactly where we stopped (last completed work)

- **Leaf domains BE** — `server/src/modules/{questions,sales-stages,reviews}/`, mounted `/v2/questions`,
  `/v2/sales-stages`, `/v2/reviews`. Build → security review (verdict SAFE; one HIGH reworked) →
  verify → commit → logs. Commit **`e3da3a8`**. Closed unscoped lead-data IDOR (reads access-scope,
  writes mutate-scope via the leads keystone) + reviews OAuth token-leak. **`routes/clients/clients.js`
  DEFERRED** (client-facing aggregator entangled with frozen contracts/image-session + already-migrated
  chat/calendar — do after #6/#7). Renames in §5c.
- **Dashboard BE** — `/v2/dashboard`. Commit **`bf5845b`**. Cross-user metric over-exposure closed.
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
(docs d854be0) → dashboard bf5845b → (docs 6d474c2) → leaf-domains e3da3a8
```
Baseline / rollback point: `9406978` ("merged").

## 4. Modules DONE (BE)

Chat (+FE), site-utility (+FE), Courses/LMS, Leads/clientLead CORE (IDOR keystone),
Users, Projects domain (project+task+update+delivery), **Accounting**, **Calendar**,
**Notifications+Utilities**, **Dashboard**, **Leaf-domains (questions/sales-stages/reviews)**.

## 5. NEXT: Contracts module BE — 🔒 FROZEN PDF (task #6, in_progress)

⚠️ **PDF GENERATION IS LOGIC-FROZEN** (CLAUDE.md §4). The v2 module may only restructure
route→controller→usecase→repository and **wrap the EXISTING contract-PDF service functions via lazy
adapters** — it must NOT change the PDF generation logic, the fragile `__dirname`-relative font loading,
or the output bytes. If you cannot move/wire it without risking behavior change, STOP and report.

Before dispatching the build agent, scope it:
- Legacy: `server/routes/contract/*` (incl. `client-contract.js`, mounted into `routes/clients/clients.js`
  at `/client/contracts`, and any staff/admin contract routes — grep mounts). The PDF code lives in
  `server/services/main/contract/*` (esp. `generateContractPdf.js`), `server/services/utilityServices.js`,
  `server/services/main/client/clientServices.js`, fonts in `server/services/fonts/` — see
  `01-current-audit.md` §3 for the full inventory. **Do NOT move the fonts or the PDF logic;** lazy-import
  the existing service fns.
- Identify PUBLIC client contract endpoints (signing flow) vs authed staff/admin endpoints — keep public
  ones ungated (token-based, like the booking funnel).
- Object scope: a contract belongs to a clientLead — reuse the leads keystone checker for authed routes;
  reads access-scope, writes mutate-scope (the pattern just used in leaf-domains).
- Verify gate: after wiring, generate a contract PDF and confirm it is byte-identical to the legacy output
  (or at least that the SAME service fn produces it unchanged). Run the loop (§6).

(After this: image-sessions #7 🔒PDF+🔒upload-chunk, admin/staff residual #8, then the deferred clients
public surface, then FE.)

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
> (398/27), then continue the migration with the **Contracts** module (🔒 frozen PDF — wrap the
> existing PDF service via lazy adapters, do NOT change PDF logic/fonts/output) using the
> established agent loop (§6 of the checkpoint), backend only."
