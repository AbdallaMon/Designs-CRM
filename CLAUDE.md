# Claude Project Instructions — Dream Studio

This file is the operating manual for any Claude/agent session in this repo. It reflects the **actual** state of the code and the migration in progress. When this file or the migration docs conflict with what is in the code, **stop and report the conflict** instead of guessing.

> **New session? Read [`PROJECT_STATE.md`](PROJECT_STATE.md) first** — it tells you what we are doing and where we have reached. Then read the relevant doc(s) under [`docs/migration/`](docs/migration/).

---

## 1. Project identity

**Dream Studio** — a design/project-management system for a UAE luxury interior-design studio. Covers: leads/sales pipeline, contracts (with signed-PDF generation), image/design sessions, projects/tasks/work-stages, accounting, an LMS (courses), real-time chat, and a Telegram integration.

- **Single language: Arabic (RTL).** This app is NOT bilingual. (The reference project is ar/en; we deliberately do **not** copy that — see §5.)
- Roles: admin / super-admin, super-sales, staff (sales), 3D/2D designers, executor, accountant, contact-initiator, and client-facing users.

---

## 2. What we are doing (the migration)

We are migrating the entire app — backend and frontend — from a legacy structure into a **clean, modular npm-workspaces monorepo** that mirrors a mature reference project (`C:\coding\Cases-Digital-Assets-Managment`), **while preserving identical observable behavior**.

A partial migration already exists under `server/v2/` and `ui/src/app/v2/`, and **`server/index.js` already boots from `server/v2/server.js`** (legacy + v2 routers run side-by-side — a strangler migration). We complete the migration *from* v2.

### Locked decisions (do not relitigate without the user)
1. **Target = monorepo mirroring the reference:** `packages/db` + `packages/shared` + `server` (`src/modules`) + `web` (`features`). npm workspaces.
2. **Schema is frozen.** `server/prisma/schema.prisma` is the data contract — relocated verbatim to `packages/db`, not redesigned.
3. **Same observable API behavior.** We restructure (route→controller→usecase→repository) and harden security, but what the frontend receives stays equivalent. Real contract changes are explicitly tracked (see `03-backend-plan.md` §12 and `06-reconciliation.md`).
4. **PDF generation is LOGIC-FROZEN.** 🔒 See §4.
5. **Drop the bilingual i18n layer; keep the message-code mechanism** resolving to a **single Arabic** string source. (Borrow the *pattern* from the reference, not its ar/en translations.)
6. **Complete from v2** — but remediate v2's known defects first.
7. **Workers run as a bootstrap from the server only** (no detached worker processes).

---

## 3. Tech stack (actual — verified 2026-06-06)

ESM throughout (`"type": "module"`). **JavaScript only** in source.

### Frontend (`ui/`, to become `web/`)
- Next.js **16.0.7** (App Router) · React **19.2.1** · MUI **v7** (`@mui/material`)
- react-hook-form 7 · socket.io-client 4.8 · Emotion + `stylis-plugin-rtl` (RTL)
- Custom `ApiFetch` data layer (no axios); custom tables (no MUI X DataGrid)

### Backend (`server/`, to become `server/src`)
- Node + **Express 4.21** (note: reference uses Express 5) · JWT · `cookie-parser` · `cors`
- **Zod 4** validation
- **BullMQ 5.54** + Redis. ⚠️ Both `ioredis` **and** `redis` are dependencies (redundant client — consolidate during migration).
- Socket.IO 4.8 (server)
- **PDF: `pdf-lib` 1.17 + `@pdf-lib/fontkit`** (contracts / image-sessions) **and `pdfkit` 0.17** (lead/staff reports) — two subsystems, both logic-frozen.
- `multer` 1.4 + `sharp` 0.34 (upload/preview) · `nodemailer`

### Database
- **MySQL via Prisma 6.9** (reference uses Prisma 7). Schema at `server/prisma/schema.prisma` (~120 models, ~40 enums, ~2478 lines). IDs and all relations are FROZEN.

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

---

## 6. Target architecture & conventions

### Backend layering (strict)
`route → controller → usecase → repository` (+ `validation`, + `dto`) — the six-file module shape.
- Routes only wire middleware. Controllers stay thin (coerce input, call a usecase, respond). **All business logic lives in usecases.** **Prisma lives ONLY in repositories** (sanctioned `prisma.$transaction` escape hatch for multi-repo writes).
- File suffix is **`.repository.js`** (the repo's existing convention; the reference uses `.repo.js` — we keep `.repository.js`).

### API contract & message codes
- One envelope everywhere: `{ success, message, data, translationKey }`. `message` is **always a language-neutral CODE**, never Arabic prose.
- Codes owned in `packages/shared/messages-codes/*`; the frontend mirrors resolution in a **single Arabic** map. Errors use `AppError`.
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

1. **Plans before code.** The migration is currently in the **planning** phase. Do not implement, move files, or scaffold until the user approves the plans and the open decisions in `06-reconciliation.md` are settled.
2. **Never change PDF behavior** (§4).
3. **Never change the Prisma schema** as part of this migration unless explicitly told.
4. **Preserve observable API behavior**; if you must change a contract, record it in `03-backend-plan.md` §12 and mirror it on the frontend.
5. **Report conflicts**, don't guess.
6. **Update `PROJECT_STATE.md`** whenever the migration status changes (what's done / in-progress / next).
7. All messages/docs the user reads should be in **English** (the user's stated preference), even though they may write to you in Arabic. App UI strings are **Arabic**.
