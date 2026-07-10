# Claude Project Instructions — Dream Studio

This file is the operating manual for any Claude/agent session in this repo. It reflects the **actual** state of the code and the migration in progress. When this file or the migration docs conflict with what is in the code, **stop and report the conflict** instead of guessing.

> **New session? Read [`PROJECT_STATE.md`](PROJECT_STATE.md) first** — it tells you what we are doing and where we have reached. For the migration background read [`docs/migration/`](docs/migration/); for the most recent work (DB-migration reconciliation + permissions parity) read [`docs/superpowers/specs/`](docs/superpowers/specs/) and [`docs/superpowers/plans/`](docs/superpowers/plans/).

---

## 1. Project identity

**Dream Studio** — a design/project-management system for a UAE luxury interior-design studio. Covers: leads/sales pipeline, contracts (with signed-PDF generation), image/design sessions, projects/tasks/work-stages, accounting, an LMS (courses), real-time chat, and a Telegram integration.

- **Single-language UI: English** (matching `master`; NOT bilingual). The `frontend-redesign` branch reverted the redesign's Arabic UI back to English on 2026-07-04; only the handful of Arabic strings `master` itself keeps remain (contract legal blocks, the client image-session flow, SPIN sales-script seed, a couple of captions). RTL/layout mechanics are unchanged (it was a text-only revert). See §5.
- Roles: admin / super-admin, super-sales, staff (sales), 3D/2D designers, executor, accountant, contact-initiator, and client-facing users.

---

## 2. Where the project is now

The backend + frontend migration into a **clean, modular npm-workspaces monorepo** (mirroring `C:\coding\Cases-Digital-Assets-Managment`) is **COMPLETE**. `server/index.js` boots `server/src/server.js`; there is **no `server/v2/` and no legacy router duality** — the legacy `server/routes/**` were removed at cutover. What remains of the old code is `server/services/**` (the frozen PDF/business logic, lazy-imported by modules). The frontend is `web/` (the `ui/→web/` rename is done). Observable behavior was preserved throughout.

**Current branch: `frontend-redesign`.** On top of the finished migration we run forward work:
- **UI redesign** (collapsed, role-agnostic feature pages; leftover English UI is acceptable on this branch).
- **✅ DB-migration reconciliation (COMPLETE):** the Prisma migration history was drifted (3 real migrations + hand-applied MySQL); `schema.prisma` was also drifted from prod and unbuildable. It was reconciled to the deployed production DB via `prisma db pull`, the baseline `catch_up_full_schema` regenerated so the migrations build a fresh DB byte-equal to prod (verified in Docker), and everything consolidated to a single canonical `packages/db/prisma`. Prod history is reconciled by a metadata-only runbook (`docs/superpowers/plans/prod-migration-runbook.md`) the **user** runs. See `docs/superpowers/specs/2026-07-01-prisma-migration-reconciliation-design.md`.
- **✅ Permissions parity (COMPLETE):** rich error/redirect contract (denials carry a real reason + redirect), backend-computed per-role `navigationTabs` + action-flag `permissionsByModule` on `/auth/me`, a frontend `usePermission`/`PermissionGate`/route-guard layer, and an audit proving access is **identical to master** (0 mismatches; 4 documented intentional security tightenings). See `docs/superpowers/specs/2026-07-01-permissions-parity-and-denial-reasons-design.md` and `docs/superpowers/specs/permissions-parity-matrix.md`.

### Locked decisions (do not relitigate without the user)
1. **Monorepo layout (done):** `packages/db` + `packages/shared` + `server` (`src/modules`) + `web`. npm workspaces.
2. **Schema is frozen** as a redesign target — the canonical schema is **`packages/db/prisma/schema.prisma`** (reconciled to production; the old `server/prisma/` + `server/src/infra/prisma/` copies were removed). Change it ONLY via `prisma migrate dev`, never by hand in MySQL.
3. **Same observable API behavior.** route→controller→usecase→repository + hardening; the frontend contract stays equivalent. Real contract changes are tracked (`03-backend-plan.md` §12, `06-reconciliation.md`).
4. **PDF generation is LOGIC-FROZEN.** 🔒 See §4.
5. **Single-language UI = English (matching `master`), no bilingual i18n; keep the message-code mechanism** resolving to one English source. (Superseded the earlier "single Arabic" decision on 2026-07-04; only master's own handful of Arabic strings remain.)
6. **Baseline for parity = the deployed `master` branch.** New work must keep observable behavior identical to master unless a change is explicitly decided + documented.
7. **Workers run as a bootstrap from the server only** (no detached worker processes).

---

## 3. Tech stack (actual)

ESM throughout (`"type": "module"`). **JavaScript only** in source.

### Frontend (`web/`)
- Next.js **16** (App Router) · React **19** · MUI **v7** (`@mui/material`)
- react-hook-form 7 · socket.io-client 4.8 · Emotion + `stylis-plugin-rtl` (RTL)
- Custom `apiClient`/`getData`/`handleRequestSubmit` data layer (no axios); custom tables (no MUI X DataGrid)
- Message CODEs resolved to English via `web/src/app/helpers/messages/resolveMessage.js`

### Backend (`server/src`)
- Node + **Express 4.21** · JWT (single cookie scheme: `access_token` + `refresh_token`) · `cookie-parser` · `cors`
- **Zod 4** validation
- **BullMQ 5.54** + Redis
- Socket.IO 4.8 (server)
- **PDF: `pdf-lib` 1.17 + `@pdf-lib/fontkit`** (contracts / image-sessions) **and `pdfkit` 0.17** (lead/staff reports) — two subsystems in `server/services/**`, both logic-frozen.
- `multer` 1.4 + `sharp` 0.34 (upload/preview) · `nodemailer`

### Database
- **MySQL/MariaDB via Prisma 6.19.** Canonical schema at **`packages/db/prisma/schema.prisma`** (~120 models, reconciled to production). Migrations at `packages/db/prisma/migrations` (3 originals + a regenerated `catch_up_full_schema` baseline). IDs and all relations are FROZEN. Client is `@dms/db` (singleton; `server/prisma/prisma.js` + `server/src/infra/prisma/prisma.js` are thin re-export shims). **Never apply SQL by hand** — see `docs/db-migrations-workflow.md`.

---

## 4. 🔒 PDF generation is logic-frozen

The PDF code's **behavior must never change**. It may only be **split into files / relocated** with identical logic and identical output, verified by a byte/visual diff of generated PDFs. The exact files are inventoried in `docs/migration/01-current-audit.md` §3. Watch the **fragile `__dirname`-relative font loading** — any move must keep fonts resolving. If you cannot move it without risking behavior change, **stop and report**.

PDF file groups (see audit for the full list):
- pdf-lib subsystem: `server/services/main/contract/*` (esp. `generateContractPdf.js`), `server/services/utilityServices.js`, `server/services/main/client/clientServices.js`, fonts in `server/services/fonts/`.
- pdfkit subsystem: `server/services/main/admin/adminServices.js` (lead-report.pdf, staff-report.pdf).

---

## 5. Source-of-truth docs

Before changing anything non-trivial, read the relevant doc(s) under [`docs/migration/`](docs/migration/):

| Doc | What it is |
|---|---|
| `01-current-audit.md` | Map of the CURRENT legacy + v2 state (routes, services, PDF, workers, permissions, schema, security). |
| `02-reference-patterns.md` | The target architecture/patterns distilled from the reference monorepo. |
| `03-backend-plan.md` | Backend migration plan (module map, phases, layering, API contract index, permissions, PDF split, workers). |
| `04-frontend-plan.md` | Frontend migration plan (feature map, data layer, i18n removal, permission gating, phases). |
| `05-ux-plan.md` | Forward-looking UX/layout plan (role clarity, IA, screen states) — rides alongside the architecture migration. |
| `06-reconciliation.md` | Cross-check of 03↔04↔05 (decisions now resolved in 07). |
| `07-decisions-resolved.md` | **Authoritative addendum** — final resolution of all 10 open items. **Overrides 03/04/05 where they differ.** |

If docs conflict (with each other or the code), **07 wins for resolved decisions**; otherwise **stop and report**.

**Recent-work docs (post-migration, on `frontend-redesign`):**

| Doc | What it is |
|---|---|
| `docs/superpowers/specs/2026-07-01-prisma-migration-reconciliation-design.md` | DB-migration reconciliation design (drift diagnosis + fix). |
| `docs/superpowers/plans/2026-07-01-prisma-migration-reconciliation.md` | Its implementation plan (6 tasks). |
| `docs/superpowers/plans/prod-migration-runbook.md` | **User-run** metadata-only prod reconciliation (`migrate resolve --applied`). |
| `docs/db-migrations-workflow.md` | Going-forward migrations workflow (canonical `packages/db`, `migrate dev`, no manual MySQL) + drift check. |
| `docs/superpowers/specs/2026-07-01-permissions-parity-and-denial-reasons-design.md` | Permissions-parity design (error/redirect contract, navigationTabs, FE layer). |
| `docs/superpowers/plans/2026-07-01-permissions-parity.md` | Its implementation plan (5 phases / 12 tasks). |
| `docs/superpowers/specs/permissions-parity-matrix.md` | Master↔current per-role authorization parity evidence (0 mismatches + 4 intentional tightenings). |

---

## 6. Target architecture & conventions

### Backend layering (strict)
`route → controller → usecase → repository` (+ `validation`, + `dto`) — the six-file module shape.
- Routes only wire middleware. Controllers stay thin (coerce input, call a usecase, respond). **All business logic lives in usecases.** **Prisma lives ONLY in repositories** (sanctioned `prisma.$transaction` escape hatch for multi-repo writes).
- File suffix is **`.repo.js`** and **`.route.js`** (matching the reference repos). *(Updated 2026-07-10 on `reorg/ref-alignment`: the old `.repository.js`/`.routes.js` were renamed to `.repo.js`/`.route.js` per user decision. The former `.repository.js` lock is superseded.)*
- The old `server/src/shared/legacy/` cross-module barrel has been **dissolved** — its services were decomposed into their owner modules' layers; there is no `shared/legacy` anymore. The remaining `legacy/` folders are only the **frozen PDF tier** (`contracts/legacy`, `image-sessions/legacy/client-services.js`) + the barrel-split `infra/notifications/legacy/` sub-files.

### API contract & message codes
- One envelope everywhere: `{ success, message, data, translationKey }`. `message` is **always a language-neutral CODE**, never user-facing prose.
- Codes owned in `packages/shared/messages-codes/*`; the frontend mirrors resolution in a **single English** map. Errors use `AppError`.
- Paginated lists return `data: { items, total, page, pageSize }`.

### Permissions (the weak point being fixed)
- **Never authorize on role alone. No wildcards.** Authorization = authentication + permission code + object scope + status/workflow guard.
- `requirePermissions` route guard + object-scope checkers (`checkIfUserCanAccessX` / `MutateX`) that **throw** on denial. `auth/me` returns flattened `permissions[]` + `permissionsByModule{}`; scoped list/detail dtos attach per-record `capabilities.*`.
- System-managed status changes go through dedicated **`POST /:id/actions/<kebab>`** endpoints — never a generic PATCH.

### Frontend
- `features/<x>` + `features/<x>Details`, each with a `config/` folder. Config-driven tables. `AppForm` + react-hook-form. Single `useRequest`/`ApiFetch` data layer. `usePermission` gating (same predicate gates nav + page + action).

### Auth
- Unify the two parallel JWT systems into one cookie scheme (dual-cookie only during the transition window).

---

## 7. Working rules for this repo

1. **Plan non-trivial work before coding.** The migration itself is done; for substantial new work brainstorm → spec → plan (see `docs/superpowers/`) before implementing. Small, well-scoped changes can proceed directly.
2. **Never change PDF behavior** (§4).
3. **Never change the Prisma schema by hand.** The canonical schema is `packages/db/prisma/schema.prisma`; change it only via `prisma migrate dev` (never manual MySQL). Migrations must keep building a fresh DB equal to production. See `docs/db-migrations-workflow.md`. **Never touch production** — prod migration steps are a user-run runbook.
4. **Preserve observable API behavior**; baseline = the deployed `master`. If you must change a contract, record it and mirror it on the frontend.
5. **Authorization changes** follow the model in §6 (permission code + object-scope checker; never role-alone/wildcards) and must not widen access beyond master; run the parity matrix / permission tests.
6. **Report conflicts**, don't guess.
7. **Update `PROJECT_STATE.md`** whenever the status changes (what's done / in-progress / next).
8. All messages/docs the user reads should be in **English** (the user's stated preference), even though they may write to you in Arabic. App UI strings are **English** (matching `master`; see §1/§5) — except master's own handful of Arabic strings.
