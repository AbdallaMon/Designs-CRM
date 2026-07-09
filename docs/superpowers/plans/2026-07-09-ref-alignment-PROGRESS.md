# Ref-Alignment Reorg — Progress Log

> Branch: `reorg/ref-alignment` (off `frontend-redesign`). Every commit verified GREEN:
> `npm test` (vitest) = **733 passing / 57 files**, and `next build` OK for frontend commits.
> Master plan: `2026-07-09-ref-alignment-reorg-master.md`.

## DONE (committed, verified green)
1. **Baseline** captured (733 tests, web build OK).
2. **B0** — deleted dead code: `chat.middleware.js` (0L) + orphan `infra/socket/handlers/` (5 files).
3. **B1** — suffix rename to match ref: `*.repository.js`→`*.repo.js` (31), `*.routes.js`→`*.route.js` (34) + all importers. Routes barrel resolves.
4. **B2** — extracted `shared/utility/pagination.js`; repointed 9 identical controller `paginate()` copies (courses' distinct variant left).
5. **B3** legacy decomposed (each module's `legacy/` folder eliminated, Prisma repo-only, lazy adapters → direct calls):
   - **accounting** (accountant-services 893L → payment/note/expense/rent/report/salary layers; frozen money throw-strings preserved)
   - **client-portal** (payments + uploads → proper layers)
   - **reviews** (reviews-integration → `infra/integrations/google-business/`)
   - **calendar** (calendar-services/client-calendar → layers; google-calendar → `infra/google/`)
   - **image-sessions** (non-frozen CRUD → 8 admin per-entity repos + session/client; **frozen `client-services.js` left untouched**)
   - **chat** (5 superseded `legacy/*` retired; 2 live fns → `chat/system-rooms.js`)
6. **🔴 CRITICAL FIX** — corrected **71 broken legacy import paths** (extra `../`) across 16 files. The staged Depth-A migration was **broken at runtime** (ERR_MODULE_NOT_FOUND) for contracts/admin-residual/leads/users/image-sessions/accounting-salary; tests hid it via mock seams. Now 0 broken, 132 resolvable.
7. **B4** (barrel, partial): removed dead `sales-stage-services`; decomposed `delivery-services` → `projects/delivery` (seam preserved for tests, defaults repo-backed).
8. **F0** — deleted 3 dead frontend files (Old-cal.jsx 1057L, test.js, MediaSlider.jsx); fixed 6 misspelled paths (dashbaord→dashboard, RecenteActivity, ProjectDeilverySchedule, SignatureComponet, ChipWIthIcon, "ImageLoader .jsx"). Left `eslint.config..js` alone (renaming would activate broken lint + break build).

## REMAINING (best done with agents — heavy/tangled)
- **shared/legacy cluster** (barrel `shared/legacy/index.js` still exports 8 files): `lead-services` (1212L), `project-services` (1497L), `dashboard-services` (1009L), `task-services` (308L), `update-services` (158L), `note-services` (222L), `payment-services` (159L), `shared-utility-services` (311L, splits across leads/users/projects-update/image-sessions). Interdependent (cross-`import()` between these files) → decompose as ONE coordinated projects+leads+dashboard pass, then delete the barrel.
- **leads own legacy**: `leads/legacy/staff-services.js` (536L), `client-leads-service.js` (132L → `backfillLeadCodes` to `src/bootstrap/`).
- **utilities**: `utilities/legacy/utility.js` (989L grab-bag) → mostly `infra/auth`, `infra/prisma/prisma-error`, `infra/upload`; `searchData` → utilities module.
- **admin-residual**: `admin-services.js` (2246L → 10 modules) — 5 FROZEN pdfkit/Excel reports (keep frozen), ~18-fn DEAD block (delete), cross-module CRUD → owner modules. Plus missing repos across accounting/admin-residual sub-resources.
- **infra god-files** (barrel-preserving split): `legacy-notification.js` (1355L), `telegram-functions.js` (1149L).
- **B5 frozen tier** (conservative, byte-diff gated): contracts PDF (`generate-contract-pdf.js` 2332L keep frozen), `witten-blocks-data.js` safe barrel split, `pdf-fonts.js` in-place split (DO NOT move file/fonts), `image-sessions/legacy/client-services.js` frozen PDF extract.
- **Frontend F1**: introduce `web/src/features/`, migrate out of `app/UiComponents/DataViewer/*`, extract inline column/input configs → `config/`, split ~20 god-files (ViewContract 1975L, ContractUtility 1313L, MediaRender 1218L…), unify data-fetching off `getDataAndSet`.
- **Docs**: update PROJECT_STATE.md + CLAUDE.md §6 (the `.repository.js` lock was superseded → now `.repo.js`).

## RESUME NOTE
Legacy-import scan/fix scripts are in the session scratchpad (`scan-legacy-imports.mjs`, `fix-legacy-imports.mjs`).
The whole staged Depth-A migration needs a **runtime server smoke** before trust — the green test suite did NOT catch the 71 broken runtime paths.
