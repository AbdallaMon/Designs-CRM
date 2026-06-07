# RESUME CHECKPOINT — Dream Studio backend migration

> **Purpose:** a single self-contained handoff file. Open this (plus `PROJECT_STATE.md`,
> `CLAUDE.md`, and `docs/migration/MIGRATION-LOG.md`) in any new session to continue
> the backend migration **exactly where it stopped**, with no re-discovery.
>
> Last updated: **2026-06-07** · Branch: `server-migration` · Working tree: **clean**

---

## 1. One-line status

The **Accounting** backend module is migrated, security-reviewed, hardened, verified, and
committed. **Calendar is the next module to migrate.** Full suite: **177 tests / 17 files green**.

---

## 2. Exactly where we stopped (last completed work)

- **Accounting domain BE** — `server/src/modules/accounting/{payment,expense,note,rent,salary,report}/`,
  mounted `/v2/accounting`. Done through the full loop (build → security review → rework → verify → commit → logs).
- Commits: code **`d2bce49`**, docs **`edb204e`**.
- Key facts recorded in `MIGRATION-LOG.md` (Stage 4 — Accounting): ACCOUNTANT-only role parity
  (verified), money Zod validation, workflow `/actions/*` renames, `.strict()` schemas, dropped
  client-trusted `oldPaymentLevel`, safe-parse `filters`, language-neutral codes.

## 3. Commit trail on `server-migration` (most recent last)

```
foundation 3c84d5a → chat d980950 → site-utility 38f7bf0 → courses 1dbc181 →
leads c709d14 → users 5cf59ee → validation-fix 934ba69 → projects fe9957b →
(docs ce7a3d9) → accounting d2bce49 → (docs edb204e)
```
Baseline / rollback point: `9406978` ("merged").

## 4. Modules DONE (BE)

Chat (+FE), site-utility (+FE), Courses/LMS, Leads/clientLead CORE (IDOR keystone),
Users, Projects domain (project+task+update+delivery), **Accounting**.

## 5. NEXT: Calendar module BE (task #2, in_progress)

**Legacy source files** (all under `server/routes/calendar/`):
| File | Endpoints | Mounted at | Notes |
|---|---|---|---|
| `calendar.js` | 8 | `/shared/calendar` **and** `/shared/calendar-management` (same router mounted twice — preserve both) | staff calendar |
| `client-calendar.js` | 6 | `/client/calendar` (via `routes/clients/clients.js`) | client-facing; check which endpoints are PUBLIC vs authed |
| `google.js` | 5 | (resolve mount — likely sub-router of `calendar.js`) | **Google OAuth integration** — treat tokens/secrets carefully |
| `old-call.js` | 4 | (resolve mount) | legacy call scheduling |
| `new-calendar.js` | ~419 lines (router style differs — uses `prisma.availableSlot`/`availableDay` directly) | (resolve mount) | availability/slot scheduling; **Prisma must move to a repository** |

Services live under `server/services/main/` (grep for the imported service fns in each route file).

**Watch-outs specific to calendar:**
- **Google OAuth**: do NOT log/leak tokens; keep secret handling identical (frozen behavior).
- **Public vs authed**: `client-calendar.js` may have public client booking-style endpoints —
  do NOT gate those (same rule as the booking funnel / `/files/client/*`).
- `new-calendar.js` writes Prisma inline → in the module, Prisma goes ONLY in `*.repository.js`.
- Resolve the real mount of `google.js` / `old-call.js` / `new-calendar.js` before writing routes
  (grep their imports across `routes/`), so `/v2/calendar` mirrors observable behavior 1:1.

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
> `docs/migration/MIGRATION-LOG.md`. Confirm the working tree is clean and `npm test` is green,
> then continue the migration with the **Calendar** module using the established agent loop
> (§6 of the checkpoint), backend only."
