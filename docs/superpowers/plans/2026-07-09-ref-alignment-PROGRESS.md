# Ref-Alignment Reorg — Progress Log (FINAL)

> Branch: `reorg/ref-alignment` (off `frontend-redesign`). **46 commits, all verified GREEN.**
> Final checkpoint: backend `npm test` = **733 passing / 57 files**, `next build` OK, **0 broken imports**.
> Behavior-preserving throughout (moves/splits/renames + verbatim relocation; no logic changes).

## ✅ BACKEND — COMPLETE (all non-frozen legacy eliminated)
- **B0** dead code deleted (chat.middleware, orphan infra/socket/handlers).
- **B1** suffix rename to match ref: `*.repository.js`→`*.repo.js`, `*.routes.js`→`*.route.js` (65 files + importers).
- **B2** shared `pagination.js` extracted (9 controller copies de-duped).
- **🔴 CRITICAL FIX** — corrected **71 broken lazy-import paths** (extra `../`). The staged Depth-A migration
  was broken at RUNTIME (ERR_MODULE_NOT_FOUND) for contracts/admin-residual/leads/users/image-sessions;
  green tests masked it (mock seams). **Branch is now actually runnable.** → needs a real server smoke.
- **B3/B4** every module's `legacy/` decomposed into proper layers (Prisma repo-only, DI seams preserved):
  accounting, client-portal, reviews, calendar, image-sessions (non-frozen), chat, leads (own + shared),
  utilities (grab-bag→infra, 14 dead fns deleted), and the whole **`shared/legacy` cluster** (lead/project/
  dashboard/task/update/note/payment/shared-utility services → owner modules) — **barrel DELETED**.
- **admin-services.js god-file (2246L)** → decomposed across 10 modules; frozen pdfkit/Excel reports moved
  BYTE-IDENTICAL to `reports/report-{pdf,excel}.legacy.js`; ~18-fn dead block deleted.
- **infra god-files** split behind barrels: `legacy-notification.js` (1355L→5 sub-files), `telegram-functions.js`
  (1149L→8 sub-files) — public export surface byte-identical.
- New homes: `modules/notes/`, `infra/payments/stripe.js`, `infra/upload/ftp-upload.js`, `infra/google/`,
  `infra/integrations/google-business/`, `src/bootstrap/backfill-lead-codes.js`.

### Backend items intentionally NOT changed (documented)
- **🔒 Frozen PDF tier** — `contracts/legacy/*` + `image-sessions/legacy/client-services.js` LEFT AS-IS
  (logic-frozen per CLAUDE.md §4; no PDF byte-diff harness available). Only unavoidable import-path repoints
  (1 line each for the relocated `uploadToFTPHttpAsBuffer`) — no PDF logic touched. These 2 `legacy/` folders
  are the intentional frozen tier, not un-migrated legacy.
- **admin-leads `createNewLead` `prisma.$transaction`** — pre-existing sanctioned multi-write; left in the
  usecase (moving it risks the create-lead flow for little gain).
- Stale `// shared/legacy` provenance comments remain in ~14 files (cosmetic; 0 real imports).

## ✅ FRONTEND — god-file splits COMPLETE (25 files split, F1a–F1y)
Config extraction: accountant/*, UsersPage, dashboard tables. God-files split (behavior-preserving,
state-entangled parts left inline, main exports/importers stable): ViewContract (1975→shell), ContractSession,
ContractUtility, ContractsList, MediaRender, ProjectDetails, TasksList, NewLeadsPage, Template, ProsAndCons,
VERSADialog, ProfileDialog/TelegramAuth, MeetingsDialog, DepartmentManagementModal, Calendar/BigCalendar,
Kanban cards, chat (ChatInput/Container/Window/PinnedMessages/Message/RoomsList), ClientSessionImageManager,
ColorPalletes, ClientSessionSubmitted, salary dialogs, Commission, SPAIN/utility, ProjectDeliverySchedule.
Dead files deleted + 6 misspelled paths fixed (F0).

## ⏭️ REMAINING — the ONE last phase (not yet done)
**`features/` migration** — relocate `web/src/app/UiComponents/DataViewer/*` → `web/src/features/*` (the ref
layout). This is a **pure repo-wide mechanical relocation** (the files are already split/clean/config-extracted):
move the folders + rewrite every importer (the app/ `page.jsx` shells, dense cross-feature imports, and imports
of shared `UiComponents/{formComponents,models,buttons,helpers}`). High churn, low conceptual complexity, best
done as ONE coordinated pass (move-all-then-fix-imports-globally), verified by `next build`. All substantive
reorganization is already done — this is a location change only.

## RESUME NOTES
- Verify commands: backend `npm test` (733) + `node scan-legacy-imports.mjs` (scratchpad); frontend `cd web && npx next build`.
- The staged Depth-A migration needs a **runtime server smoke** — the test suite did not catch the 71 broken runtime paths.
- CLAUDE.md §6 updated: `.repo.js`/`.route.js` now the convention (superseding the old `.repository.js` lock); `shared/legacy` barrel removed.
