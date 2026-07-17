# courses-web Phase 2 — Reorg to web/ conventions + theme unification — Design

**Date:** 2026-07-17
**Depends on:** Phase 1 (`2026-07-17-courses-web-port-phase1-design.md`) — complete.
**Scope:** Behavior-preserving reorganization of `courses-web` into `web/`'s `features` + `shared/components` layout, plus theme unification (adopt web/'s `colors.js` + `MUIContext.jsx`). No behavior, API, route, or URL changes.

---

## 1. Goal & rationale

courses-web was ported verbatim in Phase 1 (everything under `src/app/`, a flat `UiComponents/` dumping-ground). Phase 2 restructures it to mirror **dms `web/`** — which is already the school-system-style `features/<domain>` + `shared/components` organization and is the eventual merge target. Mirroring web/ satisfies both "organize like school-system" and "keep it close to web/ for a future move" at once.

Decided in brainstorming (2026-07-17):
1. **Target = web/'s conventions** (not the stricter school-system triad).
2. **Structure + theme only** — relocate courses-web's own components; do NOT dedup against web/'s shared components (web/ isn't a package; cross-workspace imports are painful). That convergence is a later step.
3. **Copy web/'s theme into courses-web now** (byte-identical `colors.js` + `MUIContext.jsx`); extracting a shared theme package is deferred to the actual merge.

Secondary benefit: the move fixes latent case-sensitivity bugs in current imports (`FormComponents` vs `formComponents`; `@/app/UiComponents/models/*` which points at a path that doesn't exist) that only resolve on Windows' case-insensitive FS and would break on Linux/CI.

---

## 2. Target structure (mirror web/)

`src/app/helpers/` and `src/app/providers/` already match web/ and **stay put**. Three sibling roots after the move: `src/app/` (routes + helpers + providers + fonts + globals), `src/features/`, `src/shared/`.

### Move map (behavior-preserving)

| Current path | Target path |
|---|---|
| `app/UiComponents/buttons/*` | `shared/components/buttons/*` |
| `app/UiComponents/feedback/loaders/taost/toast/ToastUpdate.js` | `shared/components/feedback/loaders/toast/ToastUpdate.js` *(fix `taost`→`toast`)* |
| `app/UiComponents/feedback/loaders/*` (DotsLoading, FullscreenLoader, LoadingOverlay, DotsLoader.module.css) | `shared/components/feedback/loaders/*` |
| `app/UiComponents/formComponents/**` (incl. `MUIInputs/`, `forms/`) | `shared/components/formComponents/**` |
| `app/UiComponents/utility/{Navbar,NotificationIcon,TabsWithLinks}` | `shared/components/utility/*` |
| `app/UiComponents/DataViewer/AdminTable.jsx` | `shared/components/common/AdminTable.jsx` |
| `app/UiComponents/DataViewer/PaginationWithLimit.jsx` | `shared/components/common/PaginationWithLimit.jsx` |
| `app/models/*` | `shared/components/models/*` |
| `app/UiComponents/DataViewer/courses/{admin,staff}/*` | `features/courses/{admin,staff}/*` |
| `app/UiComponents/DataViewer/lessons/{admin,staff}/*` | `features/lessons/{admin,staff}/*` |
| `app/UiComponents/DataViewer/test/{admin,staff}/*` | `features/tests/{admin,staff}/*` *(rename `test`→`tests`)* |
| `app/UiComponents/DataViewer/dashboard/*` | `features/dashboard/*` |

### Cleanups folded in (still behavior-preserving)
- `test/admin/TestAttempts;.jsx` → `features/tests/admin/TestAttempts.jsx` (drop the stray `;` in the filename).
- Normalize all import casings to the real path (`formComponents`, not `FormComponents`).
- Fix the wrong `@/app/UiComponents/models/*` specifiers → `@/shared/components/models/*`.

### Stays under `app/`
Route tree (`(auth)/(auth-group)/*`, `(auth)/dashboard/(dashboard)/{@admin,@staff}/**`, layouts), `helpers/**`, `providers/**`, `fonts/`, `layout.js`, `page.js`, `page.module.css`, `globals.css`. Route page files stay where Next needs them; only their imports are rewritten. The `(auth)`/`@admin`/`@staff` parallel-route structure is unchanged (no URL changes).

### Import rewrite rules (deterministic prefix map, applied across all `src/**`)
```
@/app/UiComponents/DataViewer/courses/    → @/features/courses/
@/app/UiComponents/DataViewer/lessons/    → @/features/lessons/
@/app/UiComponents/DataViewer/test/       → @/features/tests/
@/app/UiComponents/DataViewer/dashboard/  → @/features/dashboard/
@/app/UiComponents/DataViewer/AdminTable          → @/shared/components/common/AdminTable
@/app/UiComponents/DataViewer/PaginationWithLimit → @/shared/components/common/PaginationWithLimit
@/app/UiComponents/feedback/loaders/taost/toast/  → @/shared/components/feedback/loaders/toast/
@/app/UiComponents/feedback/               → @/shared/components/feedback/
@/app/UiComponents/formComponents/         → @/shared/components/formComponents/   (case-insensitive on the source prefix)
@/app/UiComponents/buttons/                → @/shared/components/buttons/
@/app/UiComponents/utility/                → @/shared/components/utility/
@/app/UiComponents/models/                 → @/shared/components/models/
@/app/models/                              → @/shared/components/models/
```

---

## 3. Theme unification

Overwrite `courses-web/src/app/helpers/colors.js` and `courses-web/src/app/providers/MUIContext.jsx` with web/'s versions (byte-identical copy). Both are dependency-compatible: MUIContext uses only `createTheme`/`ThemeProvider` + `colors` (no new deps; web/'s RTL/stylis wiring lives in web/'s root layout and is NOT needed here). This makes courses-web render in web/'s caramel theme.

Risk: courses components import named exports from `colors.js` (`COLORS`, `ROLE_COLORS`, `LEVEL_COLORS`, `USER_ROLES`?). web/'s `colors.js` is a superset but names must line up — verified by `next build` (a missing named export is a build error). Any courses-only named export absent from web/'s file is re-added to the copied file.

---

## 4. What is explicitly NOT changed

- **No component dedup** — courses keeps its own `formComponents`/`models`/tables (relocated, not replaced by web/'s).
- **No behavior/API/logic changes** — Phase 1's `/v2` wiring, message codes, profile logic all intact.
- **No route/URL changes.**
- **No `web/` changes** (theme is copied INTO courses-web).

---

## 5. Execution & verification

Grouped, behavior-preserving moves via `git mv` + a scripted import-rewrite pass, in commit groups:
1. `shared/components` (buttons, feedback, formComponents, utility, models, common) + rewrite all importers.
2. `features/` (courses, lessons, tests, dashboard) + rewrite all importers + route-page imports.
3. Theme swap (colors.js + MUIContext.jsx).

**Gate after each group (source of truth = `next build`; courses-web has no working lint):**
- `npm run build -w courses-web` compiles.
- Grep gate: no remaining `@/app/UiComponents`, no `@/app/models`, no `taost`, no `DataViewer` specifiers, no capital-`FormComponents`.

**Final:** full `next build` for courses-web + web/ (web/ untouched, sanity), and the Phase-1 screen-smoke checklist (unchanged behavior — same screens must still load).

---

## 6. Success criteria

- courses-web tree matches web/'s `app`/`features`/`shared` layout; `UiComponents/` and `app/models/` are gone.
- `next build` green; grep gate clean (no legacy specifiers, no `taost`, no case bugs).
- Every screen renders as before, now in web/'s theme.
- Zero behavior/API/URL changes; `web/` untouched.
