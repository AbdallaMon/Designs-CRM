# Ref-Alignment Reorganization — Master List

> Date: 2026-07-09 · Branch: `frontend-redesign` · Status: **PLAN / LIST ONLY — no code changed**
> Scope: behavior-preserving reorganization (moves / renames / splits / re-exports only — **no logic changes**).
> Goal: make every backend + frontend file follow ONE system, matching the reference repos
> (`C:\coding\Transaction-app` for request-flow/handling, `C:\coding\school-system` for validation).

## Decisions locked by user (2026-07-09)
1. **Suffixes: match the ref fully** — rename `*.repository.js` → `*.repo.js` and `*.routes.js` → `*.route.js`
   everywhere. (This intentionally overrides the old CLAUDE.md §6 `.repository.js` lock — update CLAUDE.md when executed.)
2. **Frontend: full migration** — relocate all feature UI out of `app/UiComponents/DataViewer/*` into
   `web/src/features/*` with the ref's `pages/ + components/ + config/` shape.
3. **Process:** agents plan → user reviews → agents implement → user reviews. **Nothing is implemented until the user says go.**

## Current-state facts that shape this plan
- **Services elimination (Depth A) is already DONE and staged** in the working tree: `server/services/` is empty;
  every module now has a `legacy/` subfolder holding the old service files verbatim, fronted by lazy
  `import("…/legacy/…")` adapters inside the usecases. See `docs/superpowers/plans/2026-07-09-services-elimination.md`.
- **This plan is the Depth-B follow-up** the services doc explicitly deferred: decompose each `legacy/*.js`
  into the module's `route→controller→usecase→repository→dto` layers, PLUS the suffix rename, god-file splits,
  missing-layer fills, and the frontend `features/` migration.
- **🔒 Frozen invariant (CLAUDE.md §4):** all PDF/Excel generation is LOGIC-FROZEN. Frozen files may only be
  **mechanically relocated/split with byte-identical output**, gated by a PDF/Excel byte-diff. Never decompose
  frozen logic. Never move `infra/pdf/pdf-fonts.js` or `infra/pdf/fonts/` (two loaders hardcode that path).

---

# PART A — BACKEND

## A0. Target shape (from the refs)
`modules/<area>/<entity>/<entity>.{route,controller,usecase,repo,validation,dto}.js` — Prisma ONLY in `.repo.js`,
thin controllers/routes, Zod validation via one `validate` middleware, one response envelope. Shared query
helpers in `shared/utility/` (pagination + filter/search builders). `legacy/` folders disappear as their
contents are decomposed into these layers (frozen PDF stays under a clearly-named frozen file).

## A1. Suffix rename (mechanical, global) — matches ref
- **`*.repository.js` → `*.repo.js`** across all modules; fix every importer.
- **`*.routes.js` → `*.route.js`** — **34 files** to rename (19 already `.route.js`). Full list captured in the
  routes review; importers to update: `src/shared/routes.js` (20 import lines) + the 3 sub-aggregators
  (`accounting.route.js` 7 children, `admin-residual.route.js` 6 children, `site-utility.route.js` 1 child) +
  `calendar.route.js` (children already singular). **Chicken-and-egg:** the 3 sub-aggregators are both renamed
  targets AND importers of renamed children — rename parents+children and fix their import strings in one pass.
  `auth.route.js` is the only default-export router.
- No route file contains logic (verified) — pure `asyncHandler(ctrl.x)` + middleware wiring. Rename is safe.

## A2. Shared query utilities (the biggest consistency gap vs ref)
- Create **`server/src/shared/utility/pagination.js`** (`paginate({page,limit})`) and delete the copy-pasted
  per-controller `paginate()` in `project`, `user`, `lead`, `courses/admin-course`, `accounting/payment` controllers.
- Create **`server/src/shared/utility/helper.js`** (`buildSearchQuery`, `buildFilterQuery`, `buildDateRangeFilter`,
  `buildOrderBy`, `parseIdList`) — mirror the ref — and route repo `where`-building through it. (Adopt gradually
  as each repo is touched; the goal is one filter/search style, declarative per module, mirroring the FE filter config.)
- Consolidate duplicate helpers: `updateLead`≡`updateALead` → one `lead.repo.js#touchLead`; two `todayRange`
  copies → one `src/shared/date.helpers.js`.

## A3. Dead code to DELETE (zero live importers — verify then delete)
- `modules/chat/chat.middleware.js` (0 lines).
- **Entire `src/infra/socket/handlers/` directory** (call/message/presence/room/typing — orphan duplicates of the
  live `modules/chat/handlers/*`; imported by nothing).
- `admin-residual/legacy/admin-services.js` **dead block** (~18 fns already reimplemented in `user.repo.js` /
  `lead.repo.js` / old image CRUD — `getUser`, `getAllUsers`, `getUserById`, `changeUserStatus`, image/session-item
  CRUD, etc.). Run as a **separate dead-code pass** (removing them changes nothing observable).
- `reviews/legacy/reviews-integration.js` appears to have **no importer** — confirm, then delete or move to infra.
- Legacy chat services (`chat/legacy/chat-*.js`, `utils.js`) are **superseded duplicates** — everything already
  exists as methods on the new `ChatRepository`/`ChatUsecase`; only `addADesginerToAllRelatedProjectsRooms` +
  `addMemberToRoomBySystem` are still live (via `shared/legacy/project-services.js`). Port those two onto the new
  member usecase, repoint that one importer, then retire all `chat/legacy/*`.

## A4. Legacy decomposition (Depth B) — per owner module
Each `legacy/*.js` function → its layer. Summary by file (full per-function maps exist in the review outputs):

| Legacy file | Lines | Owner | Decompose into |
|---|---:|---|---|
| `leads/legacy/client-leads-service.js` | 132 | leads | reads→`lead.repo`; `backfillLeadCodes`→`src/bootstrap/backfill-lead-codes.js` |
| `leads/legacy/staff-services.js` | 536 | leads | split across NEW sub-entities: `call-reminder/`, `meeting-reminder/`, `note/`, `price-offer/`, `file/` (usecase+repo each); tz logic→`leads/shared/reminder-time.helpers.js` |
| `shared/legacy/lead-services.js` | 1212 | leads | reads→`lead.repo`, kanban/detail shaping→`lead.dto`, assign/convert/status→`lead.usecase` |
| `shared/legacy/payment-services.js` | 159 | leads | NEW `leads/payment/` usecase+repo; Stripe→`infra/payments/stripe.js` |
| `shared/legacy/project-services.js` | 1497 | projects | reads→`project.repo`, `groupProjects`/sort→`project.dto`, seed/assign/update→`project.usecase`, `PROJECT_TYPES`→`project.constants.js` |
| `shared/legacy/task-services.js` | 308 | projects/task | CRUD→`task.usecase`+`task.repo`; `getArchivedProjects`→`project.repo`+`project.dto` |
| `shared/legacy/update-services.js` | 158 | projects/update | reads→`update.repo`, rules→`update.usecase` |
| `shared/legacy/delivery-services.js` | 98 | projects/delivery | reads/writes→`delivery.repo`, logic→`delivery.usecase`; 2 meeting reads→`leads/meeting-reminder.repo` |
| `shared/legacy/note-services.js` | 222 | shared/leads/generic-delete | `getNotes`/`addNote`/`deleteNote`→notes usecase+repo; `deleteAModel`→`generic-delete.usecase`+repo (calendar cleanup=infra) |
| `shared/legacy/dashboard-services.js` | 1009 | dashboard | raw queries→`dashboard.repo`, metric computation→`dashboard.usecase`, filter helpers→`dashboard.filters.js` |
| `shared/legacy/sales-stage-services.js` | 55 | sales-stages | reads→`sales-stages.repo`, forward/back logic→`sales-stages.usecase` |
| `shared/legacy/shared-utility-services.js` | 311 | **split 4 owners** | next-calls/meetings/fixed-data→utilities; user-log/roles/admins→users; `updateALead`→leads; update reads→projects/update; image reads→image-sessions |
| `shared/legacy/index.js` (barrel) | 11 | — | delete after all siblings dissolve; repoint 12 consumers |
| `utilities/legacy/utility.js` | 989 | **mostly infra** | auth/jwt→`infra/auth/token.js`+`auth.middleware.js`; prisma-error→`infra/prisma/prisma-error.js`; uploads→`infra/upload`/upload module; notifications→notifications module; `searchData`→`utilities/utility.usecase`+`utility.repo`; `getPagination`→`shared/http/pagination.js` |
| `accounting/legacy/accountant-services.js` | 893 | accounting | 19 fns → payment/note/expense/rent/report/salary repos+usecases+dtos (see A6). **Frozen money throw-strings** (#2,#5,#17) keyed by `accounting.legacy-errors.js` must stay byte-exact |
| `admin-residual/legacy/admin-services.js` | 2246 | **10 modules** | see A5 (god-file) + A6 + A3 dead block + A7 frozen reports |
| `calendar/legacy/calendar-services.js` | 667 | calendar | slots→`availability` repo+usecase; month-view/reminders→new sub-usecase+repo |
| `calendar/legacy/google-calendar.js` | 330 | calendar/**infra** | Google API→`infra/google/google-calendar.client.js`; DB writes→`google.repo` |
| `calendar/legacy/client-calendar-service.js` | 162 | calendar/client | logic→`client-calendar.usecase`; create MISSING `client-calendar.repo` |
| `image-sessions/legacy/image-session-services.js` | 1660 | image-sessions | per-entity admin repos (space/template/material/style/color/design-image/page-info/pros-cons) + session/client repos+usecases (NO sharp here — pure CRUD) |
| `image-sessions/legacy/client-image-services.js` | 47 | image-sessions/client | 3 fns→`client-image-session.repo` |
| `client-portal/payments/legacy/client-payments-service.js` | 141 | client-portal/payments | Stripe→`payments.stripe.js`, writes→`payments.repo`, pure→`payments.dto`; delete file |
| `reviews/legacy/reviews-integration.js` | 68 | infra | Google-Business OAuth→`infra/integrations/google-business/` (or delete if dead) |

## A5. Backend god-file splits (behavior-preserving; keep a barrel so importers don't move)
- **`chat/chat.usecase.js` (1102)** → `room/`, `message/` (+reaction/pin), `member/`, `file/`, `call/`, `presence/`
  usecases; shared emit helpers→`chat.emit.js`. **`chat.repository.js` (842)** → mirror split; keep an aggregate
  `ChatRepository` barrel. `chat.helpers.js` stays (home for the date/grouping helpers duplicated in legacy).
- **`admin-residual/legacy/admin-services.js` (2246)** — fans out to 10 modules; do LAST, atomic per cross-module fn.
- **`infra/notifications/legacy-notification.js` (1355)** → `legacy/{lead,lead-activity,project,course}-notifications.js`
  + `legacy/payment-emails.js` (isolates ~670 lines of bilingual email templating); keep `legacy-notification.js` as a re-export barrel (15 consumers unchanged).
- **`infra/telegram/telegram-functions.js` (1149)** → `functions/{telegram-channels,telegram-members,telegram-uploads,telegram-messages,telegram-lead-data,telegram-notifiers,telegram-notification-dispatch,util}.js`; keep barrel (13 consumers).
- **`courses/admin-course/*` (usecase 559, repo 404, routes 346, validation 220)** → split by sub-resource
  (course/lesson/lesson-media/lesson-access/test/question/attempt/dashboard). **`courses/staff-course/staff-course.usecase.js` (579)** → course/attempt/dashboard.
- **`leads/lead/lead.usecase.js` (546)** → core + call-reminder/meeting-reminder/file/note/price-offer/payment usecases (aligns with A4 sub-entities). `lead.repo.js` (479) shrinks as sub-entity repos are created.
- **`users/user/user.usecase.js` (438)** → `user.usecase` (CRUD) + `user-profile.usecase` + `user.permissions.js` (scope checkers); consider a `user-log` sub-entity.
- **`dashboard-services.js` (1009)** decomposition (A4) is itself the split.
- **`site-utility/site-utility.usecase.js` (140)** → `pdf-config/` + `payment-conditions/` sub-resources.

## A6. Missing layer files to CREATE (fill the six-file shape)
- **accounting:** `note/note.repo.js`; `expense/expense.repo.js`; `report/report.repo.js` + `report.dto.js` + `report.validation.js`; `salary/salary.repo.js` (+ optional `salary.dto.js`).
- **admin-residual:** `admin-projects/admin-projects.repo.js` + `.dto.js`; `commissions/commissions.repo.js`;
  `fixed-data/fixed-data.repo.js`; `model-archive/model-archive.repo.js`; `reports/reports.repo.js` + `.dto.js`
  (keep the 5 frozen Excel/PDF generators + `drawTable` in dedicated frozen `reports/*.legacy.js` — mechanical split only).
- **calendar:** `client/client-calendar.repo.js`.
- **image-sessions/admin:** per-entity repos (see A4).
- **client-portal/uploads:** `uploads.usecase.js` + `uploads.repo.js` (or `infra/storage` adapter) + `uploads.validation.js`;
  move hardcoded prod upload paths + import-time `mkdirSync` into env config; controller returns data (not `res.json` inside the service).

## A7. 🔒 Frozen tier — mechanical only, byte-diff gate (do NOT decompose)
- `contracts/legacy/generate-contract-pdf.js` (2332) — **keep frozen as-is** (at most extract 3 pure leaf helpers, gated).
- `contracts/legacy/witten-blocks-data.js` (780) — safe mechanical split into text-blocks/label-maps/enums via barrel (Arabic labels are byte-load-bearing; `reverseString` travels with them). Gate.
- `infra/pdf/pdf-fonts.js` (195) — **do NOT move the file.** In-place split of the pure helpers (image-io/text-shaping/format) into siblings + barrel; the `__dirname` font-buffer block stays put. `infra/pdf/fonts/` — keep as-is, don't move/prune.
- `image-sessions/legacy/client-services.js` (1669) — extract frozen `generateImageSessionPdf` + its font block to a **same-directory-depth** `generate-image-session-pdf.js` (relative font path must keep resolving); tail (`approveSession`, email, languages) is relocatable non-frozen.
- `contracts/legacy/pdf-utilities.js` (264) — **misnamed: it's the contract-signed EMAIL service** → rename/decompose as `contract-email` templates+repo+usecase; caveat: its import line lives in the frozen renderer → do under the gate or leave path as-is.
- `contracts/legacy/contract-services.js` (1441) — mostly non-frozen CRUD but already usecase-fronted; mechanical section split only for now (PDF-seam fns gated).
- `admin-residual/legacy/admin-services.js` frozen reports: `generateExcelReport`, `generatePDFReport`, `generateStaffExcelReport`, `generateStaffPDFReport`, `drawTable` → frozen `reports/*.legacy.js`, keep `(req,res)` signature.
- Note: `contracts/legacy/rules.js` **does not exist** (ignore that earlier reference).
- **Byte-diff harness** required before/after for: AR+EN contract PDF, image-session PDF, `lead-report.pdf`, `staff-report.pdf`.

## A8. Barrel dissolution + misc moves
- `shared/legacy/index.js` barrel → dissolve into owner modules (mapping in A4); repoint all 12 lazy consumers.
- Move `telegram/telegram.validation.js` + `telegram.constant.js` (module root) → `telegram/auth/`.
- Move `accounting/accounting.legacy-errors.js` → beside the frozen service (`accounting/legacy/`) or `shared/errors/`; update 4 importers (keep throw-string maps byte-exact).
- Promote `accounting/salary/accounting-users.routes.js` (second router in the salary folder) → its own `accounting/users/` sub-resource.
- Fix prefix drift in `leads/client/booking-lead/` (`booking-lead.*` vs `booking-leads.*`; `.email.js` vs `.emails.js`).
- Watch the dynamic-import cycle `note↔task↔project↔shared-utility` — after decomposition they become normal cross-module repo calls; verify no static cycle is introduced.

## A9. Behavior-preservation flags (DO NOT "fix" during the reorg — carry verbatim)
Typos to preserve: `bulkAssignLeadTsoAUser`, `getLeadByPorjects*`, `editSalesSage`, `coonnectToTelegramV2`, `ProjectDeilverySchedule`; the `SalesStage` bare-identifier bug; empty Google OAuth creds + `localhost:4000` redirect; `remindUserToPay` hardcoded AR strings; error-swallowing try/catches; latent chat bugs in the legacy chat files (already fixed in the new usecase — just retire legacy, don't port). Log each as a follow-up, never change it in a move.

---

# PART B — FRONTEND

## B0. Target shape (from the refs)
`web/src/features/<x>/` = `pages/` + `components/` + `config/` (`constant.js` URLs, `<x>Columns.js`, `<x>Filters.js`);
`app/<route>/page.jsx` stays a thin shell that re-exports the feature page; one data layer
(`apiClient`/`getData`/`useDataFetcher`/`handleRequestSubmit`) + one `AdminTable` + `MainForm`.

## B1. Introduce `web/src/features/` and migrate (the headline change)
- Move all feature UI out of `app/UiComponents/DataViewer/*` (and `UiComponents/pages/`) into `web/src/features/<x>/`.
- Use the existing well-structured `leads/` feature as the template shape for the others.
- Keep `app/.../page.jsx` shells; only repoint their import to the new `features/<x>/pages/...`.
- Standardize feature-folder names to camelCase; replace ad-hoc/role-based vocab (`Kanban/{staff,accountant}`,
  `meeting/{SPAIN,VERSA}`, `utility/`, `shared/*Kit.jsx`) with the structural `pages/components/config` shape.
- Resolve nesting: promote `work-stages/projects/*` to a top-level `projects` feature; move
  `leads/leadUpdates/KanbanUpdateSection.jsx` into the Kanban area; remove the shadow `work-stages/WorkStageKanban.jsx`.

## B2. Extract inline config → `config/` files
- Every inline `columns` / `inputs` / endpoint string moves to `features/<x>/config/<x>Columns.js`,
  `<x>Filters.js`, `constant.js`. Worst offenders: `accountant/*` (Rents/Salaries/OperationalExpenses/Outcome/
  payments), `pages/UsersPage.jsx` (~120-line inline `columns` + `inputs`), `dashboard`, `contracts` (needs a `config/`,
  move `wittenBlocksData.js`).

## B3. Frontend god-file splits (>600 lines, split into per-component/section files)
- `contracts/ViewContract.jsx` (1975, 22 inline components) → `view/{ContractBasics,StagesSection,PaymentsSection,SpecialItemsSection,DrawingsSection}.jsx`; helpers→`contracts/shared/contractHelpers.js`.
- `contracts/ContractUtilityPage/ContractUtility.jsx` (1313) → `dialogs/{StageClauses,SpecialClauses,LevelClauses,Obligations}Dialog.jsx`.
- `utility/Media/MediaRender.jsx` (1218) → `Media/renderers/*` + `Media/fileTypes.js`.
- `leads/pages/NewLeadsPage.jsx` (1277) → move `LeadSliderCard`/`LeadCard`/`SearchForALead` to `core/`, `useSummary` to a hook, panels to `pages/panels/`.
- `image-session/{users/ClientSessionImageManager (1139), admin/shared/Template (1136), admin/shared/ProsAndCons (772)}`, `meeting/calendar/{Calendar (1091), BigCalendar (1030)}`, `meeting/VERSA/VERSADialog (934)`, `chat/components/{ChatInput (935), ChatWindow (822), ChatContainer (750), ChatMessage (680)}`, `Kanban/work-stages/WorkStageKanbanCard (750)`, `users/profile/ProfileDialog (774)`, `contracts/client/ContractSession (1014)`, `work-stages/projects/ProjectDetails (999)` — all split per the review (styled-components→`styles.js`, dialogs/sections→own files).

## B4. Unify data fetching
- Route **every** list through `useDataFetcher` + `AdminTable`. Remove the ad-hoc `getDataAndSet` path
  (30 files / 66 sites) and hand-rolled `<Table>` layouts (contracts, users, dashboard, commission, website-utilities).
- Collapse `getData.js` + `getDataAndSet.js` to one read path.

## B5. Dead files + misspellings (quick wins)
- **Delete dead:** `meeting/calendar/Old-cal.jsx` (1057), `work-stages/test.js` (30), `utility/Media/MediaSlider.jsx` (0).
- **Fix misspelled paths:** `dashbaord/`→`dashboard/`, `RecenteActivity`→`RecentActivity`, `ProjectDeilverySchedule`→`ProjectDeliverySchedule`,
  `SignatureComponet`→`SignatureComponent`, `ChipWIthIcon`→`ChipWithIcon`, `CreatTaskModel`→`CreateTaskModal`,
  `ImageLoader .jsx` (trailing space)→`ImageLoader.jsx`, `eslint.config..js`→`eslint.config.js`.

## B6. Naming/barrel policy
- Component files PascalCase, config/util camelCase, route folders kebab — enforce consistently. Decide a single barrel policy.

## B7. Verification (web lint is broken — do NOT rely on it)
- Verify frontend changes with **`cd web && npx next build`** after each batch (per the `web-lint-broken-use-build` memory).

---

# PART C — Suggested sequencing (lowest-risk first)

**Backend**
1. Dead-code deletes (A3) — zero importers.
2. Suffix rename (A1) — mechanical, global, one coordinated pass + build/test.
3. Shared utilities extraction (A2).
4. Missing layer files for trivial CRUD (A6: note/expense/fixed-data/model-archive repos).
5. Legacy decomposition per module (A4), non-frozen first; barrels keep importers stable.
6. God-file splits (A5) + barrel dissolution (A8).
7. 🔒 Frozen tier (A7) LAST, each behind the byte-diff gate; on any diff → KEEP-IN-PLACE + report.
8. `admin-services.js` (2246) cross-module fns last of all, atomic per function.

**Frontend**
1. Dead files + misspellings (B5).
2. Stand up `features/` + migrate feature-by-feature (B1), each: move → fix imports → `next build`.
3. Extract configs (B2) + split god-files (B3) per feature as it migrates.
4. Unify data fetching (B4).

# Verification gates (every batch)
- Backend: `npm test` (vitest, ~699 green baseline) + import-resolution smoke (`await import()` each touched routes barrel) + PDF/Excel byte-diff for frozen tier. Record the baseline BEFORE touching anything.
- Frontend: `cd web && npx next build`.
- Grep sweep: zero stale references to any renamed/moved path.

# Open items for the user to decide "what's next"
1. **Batch size / order:** run the whole Part A then Part B, or interleave? Which slice first?
2. **Depth per module now:** full Depth-B decomposition of `legacy/*`, or start with the mechanical wins
   (suffix rename + dead code + missing repos + god-file splits) and decompose legacy per-module afterward?
3. **Isolation:** dedicated branch (`reorg/ref-alignment`) with checkpoint commits per batch — confirm.
4. **Frozen tier:** confirm we have (or should build) the PDF/Excel byte-diff harness before touching A7.
5. **`admin-services.js` dead block (A3):** delete now as part of the reorg, or keep for a separate dead-code pass?
