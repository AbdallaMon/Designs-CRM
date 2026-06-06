# Decisions Resolved — Authoritative Addendum

> This doc records the FINAL resolution of the 10 open items raised in `06-reconciliation.md`.
> Where this doc conflicts with 03/04/05, **this doc wins.** Date: 2026-06-06 · Branch: `server-migration`
> Source: user decisions (items 1–3, 6 directed; 4–5, 7–10 decided here with evidence/best-practice as the user instructed).

---

## 1. API base path — **`/v2` is permanent; there is NO `/api/v1`**

The whole API stays under `/v2`. The earlier backend-plan idea of renaming `/v2 → /api/v1` and flipping the frontend base at cutover is **cancelled**.
- `03-backend-plan.md` has been updated to reflect `/v2` everywhere (§1 tree, Phase 1, Phase 12, §11, §12).
- The frontend was already on `/v2`, so **there is no base-path flip**. Phase 12 cutover only removes legacy routers, route aliases, and the dual-JWT shim.
- New modules mount under `/v2/<plural-kebab>`; legacy prefixes (`/shared /staff /admin /accountant /client`) stay aliased only until each module is migrated, then are removed.

## 2. Pagination shape — **normalized, approved as a contract change**

All list endpoints return `data: { items, total, page, pageSize }`. Added as CONTRACT CHANGE #7 in `03-backend-plan.md` §12. Legacy list shapes varied; this is a deliberate, FE-relied-upon change. The FE `useRequest` upgrade (`04-frontend-plan.md` §4) extracts exactly these keys.

## 3. Per-record `capabilities.*` — **yes, mandatory on scoped responses**

Every scoped list/detail response attaches a per-record `capabilities.{...}` object of FE-facing booleans (e.g. `{ canEdit, canDelete, canApprove }`), computed in the **dto** via `@dms/shared/helpers.js`. Added as CONTRACT CHANGE #8 in `03-backend-plan.md` §12. The FE gates row/detail actions on these (`05-ux-plan.md` §4.6, `04-frontend-plan.md` §6).

## 4. Permissions model & timeline — **DECIDED (no prior system existed)**

The legacy app had no real permission system (role-string checks only). We build it fresh, properly, with **no temporary role-fallback shim** (avoids tech debt):

- **Permission codes** in `dot.case`, owned in `packages/shared/constants/permissions.constants.js` (single source of truth). The FE mirrors them in `config/permissions.js` (imported from `@dms/shared`).
- **Role → permission profiles** are designed and **seeded in BE Phase 2** (the auth/remediation phase), covering every existing role and sub-role (incl. `isSuperSales`).
- **`auth/me` emits real `permissions[]` + `permissionsByModule{}` from BE Phase 2 onward.** Because FE Phase 2 (auth) trails BE Phase 2, the FE consumes real permission codes from the start — **no role→capability fallback is needed or sanctioned.** `05-ux-plan.md` Open Question #2 is resolved this way.
- **Authorization = authentication + permission code (`requirePermissions`) + object-scope checker (throws on denial) + status/workflow guard.** Never role-only, never wildcards.
- **Display flags:** `auth/me` still exposes `activeRole` and elevated flags (`isSuperSales`, active sub-role) for the UI role chip — these are display-only; all gating is by permission code, not role.
- Per-record `capabilities.*` (decision #3) are the action-level gate derived from the same permission + scope logic.

## 5. Phase re-sequencing — **BE drives; each FE feature trails its BE module**

The FE-Leads-before-BE-Leads inversion and the FE Phase 6 straddle are fixed. The **backend module order is the driver**; a frontend feature is built only after its backend module ships. Authoritative interleaved roadmap:

| Step | Backend (03) | Frontend (04) — starts only after its BE module | Notes |
|---|---|---|---|
| 0 | Monorepo skeleton + `packages/db` + `packages/shared` | Foundation (promote v2, DataTable/AppForm, `useRequest` upgrade, `usePermission`, RTL theme) | parallel |
| 1 | Relocate v2 infra → `server/src`, de-dup, mount `/v2` | i18n removal + providers consolidation (`AppProviders`, Arabic message map) | parallel |
| 2 | Remediation: repo suffix, fix pdf worker, server-owned workers/cron, **unify JWT, build permissions (codes + profiles + scope checkers), `auth/me` emits real permissions** | Auth (finalize `features/auth`; AuthProvider exposes real `permissions[]`) | FE trails BE |
| 3 | Leaf modules: languages, notes, reviews, site, questions, **users** | *(no new FE feature yet; Users FE deferred to step 8b)* | |
| 4 | **Leads & sales** (keystone scope/IDOR fix) | **Booking (public)** + **Leads/Sales** list+details | FE Leads now AFTER BE Leads ✅ |
| — | *(chat already migrated in v2)* | **Chat** (socket-driven against `/v2/chat`) | can land any time after FE foundation |
| 5 | Projects, tasks, delivery, updates | **Projects + Tasks** (+ delivery) | |
| 6 | Contracts + contract PDF 🔒 | **Contracts** (+ client signing flow) | |
| 7 | Image sessions + session PDF 🔒 | **Image-sessions** (+ client flow) | |
| 8 | Accounting (invoice/payment/salary/expense) | **Payments + Accounting**; **Users** (8b, BE module from step 3) | FE Phase 6 split here ✅ |
| 9 | Courses / LMS | **Courses** | |
| 10 | Calendar + Google | **Calendar** | |
| 11 | Reports PDF 🔒 + dashboard + notifications | **Dashboards (per role)** + **Notifications** | |
| 12 | Cutover: remove legacy routers + dual-JWT shim | Cleanup: delete legacy pages, **rename `ui/ → web/`**, wire workspaces | no base-path flip |

**Collapse the `@<role>` parallel-route slots into one permission-gated nav** during the FE foundation/auth steps (UX plan P0), not at the end.

## 6. Booking-lead endpoints — **best practice applied**

Verified live routes: `POST /client/booking-leads`, `GET /:leadId`, `PATCH /:leadId`, `PUT /:leadId/submit`.
- **Resolution:** `submit` is a workflow transition → it becomes **`POST /client/booking-leads/:leadId/actions/submit`** (matches the `/actions/<kebab>` convention). `PATCH /:leadId` (draft edit) stays.
- All four are now listed in `03-backend-plan.md` §12. The FE booking flow mirrors the renamed submit endpoint.

## 7. Client-facing app location — **in THIS Next app, under `(public)`**

Evidence: client flows already live in this app as top-level segments `ui/src/app/{booking, contracts, image-session}`; `UiComponents/client-page/ClientPage.jsx` is only the dashboard-home redirect stub.
- **Resolution:** client booking/contract/image-session flows stay in **this** frontend; during migration they move into a `(public)` route group (no auth shell). **Not** a separate frontend. `05-ux-plan.md` Open Question #3 resolved.

## 8. Drive / file-tree subsystem — **dead / schema-only; out of scope**

Evidence: `server/services/drive.js` exists but is **imported by nothing**; `DriveNode` / `DriveAcl` / `DrivePublicShare` appear **only** in the Prisma schema (`server/v2/infra/prisma/drive.prisma`), with **no routes/usecases/controllers**.
- **Resolution:** Drive has **no live API surface**. The schema models stay (schema is frozen) but **no Drive module is created** and `services/drive.js` is treated as dead code (left untouched, not migrated). If a Drive feature is wanted later, it's a separate future project.

## 9. Workspaces `"ui" → "web"` rename — **at the final cutover step (Phase 12)**

BE Phase 0 may create the root `package.json` with a temporary `"ui"` workspace entry; it transitions to `["packages/*", "web", "server"]` when the frontend folder is renamed `ui/ → web/` at Phase 12. This is a single coordinated edit; until then `"ui"` is intentionally temporary.

## 10. Telegram + Upload contracts — **enumerated (verified from v2 code)**

**Telegram** (all require auth + `ADMIN`):
- `GET /v2/telegram/current`
- `POST /v2/telegram/auth/init`
- `POST /v2/telegram/auth/verify-code`
- `POST /v2/telegram/auth/verify-password`

**Upload (files):**
- `POST /v2/files/single` (authed, single file)
- `POST /v2/files/chunks` (authed, chunked)
- `POST /v2/files/client/single` (public, single file)
- `POST /v2/files/client/chunks` (public, chunked)

Both are now in `03-backend-plan.md` §12.

---

## Status after these resolutions

All 10 open items are **closed**. Planning is complete. The plans (01–06), this addendum (07), `CLAUDE.md`, and `PROJECT_STATE.md` are the authoritative migration package. Next action is the user's to direct — the natural start is **BE Phase 0 + FE Phase 0** (monorepo skeleton + packages), per the step-0 row above.
