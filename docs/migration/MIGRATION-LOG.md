# Migration Log — What's Done & Changed

> Live record of the executed migration (distinct from the *plans* in 01–07).
> Open this + `PROJECT_STATE.md` to see exactly what has been refactored and what remains.
> Branch: `server-migration` · Baseline (rollback point): commit `9406978` ("merged").

## Execution order (decided)

1. **Foundation** — monorepo skeleton + `packages/db` (frozen schema + shims) + `packages/shared` + `server/src` skeleton; app keeps booting.
2. **Infra** — relocate & de-dup v2 infra → `server/src/infra`: prisma, upload (local provider, **chunk mechanism unchanged**), redis (consolidate `ioredis`/`redis`), socket, telegram (single GramJS owner), mail, **workers from server bootstrap**, cron. Drive = dead/schema-only → left untouched.
3. **Auth + permissions** — unify JWT, permission codes + role profiles + scope checkers, `auth/me` emits real `permissions[]`. (Blocks all module work.)
4+. **Modules** — per module a backend+frontend pair (parallel) then a reconciliation review; independent modules run as parallel pairs. Order follows `07-decisions-resolved.md` §5.
**Final** — vitest suite green + build green → commit + stop. (No UI/UX redesign yet.)

## Guardrails (enforced on every agent)

- 🔒 PDF generation logic-frozen (split only). 🔒 Prisma schema frozen. Same observable API behavior.
- Single Arabic UI (no i18n toggle); keep message-code indirection.
- Upload **chunk mechanism must not change**; storage = local provider only for now.
- Workers run from the server bootstrap only.
- App must keep booting at every checkpoint (legacy + v2 coexist until cutover).

---

## Status

| Stage | Status | Notes |
|---|---|---|
| Checkpoint commit | ✅ done | baseline `9406978` + planning docs + WIP committed before structural changes |
| 1. Foundation | ⏳ in progress | |
| 2. Infra | ⬜ not started | |
| 3. Auth + permissions | ⬜ not started | |
| 4+. Modules | ⬜ not started | |
| Final (tests + build + commit) | ⬜ not started | |

---

## Changelog (most recent first)

_(entries appended as each stage completes — file moves, new modules, contract changes, fixes)_
