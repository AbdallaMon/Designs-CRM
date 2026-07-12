# My Day — profile-scoped work queue + supervisor team lens (Design)

**Date:** 2026-07-12 · **Branch:** `feat/audit-log-sales-admin` · **Status:** approved design, implementation NOT started (user will direct when).

---

## 1. Problem

The Deal Cockpit answers "what should I do on **this** lead?" — but only after the user opens the lead. Nothing answers the prior question: *"across everything I own, what needs my action today, ranked?"* Consequences per profile:

- **Sales / primary-sales:** stale leads die silently; overdue calls and unsigned contracts are discovered by accident.
- **Super-sales:** can browse ALL leads but has no radar for "which rep is stuck, which lead is aging unclaimed."
- **Designers / executor:** contract-generated delivery schedules exist, but nothing warns "you will miss Thursday's delivery" before it happens.
- **Admin:** the Command Center shows KPIs (how the business is doing), not exceptions (what needs unblocking today).

## 2. Goals / non-goals

**Goals (v1):**
1. A personal, prioritized action queue ("My work") for sales tiers and the designer tier.
2. A supervisor rollup ("Team") for super-sales and admins — **exceptions + per-person summaries + drill-down**, deliberately NOT a merged to-do list.
3. Reuse the existing pure engines (`computeCockpit`, `computeWorkStageActions`) so the queue never disagrees with the lead detail.
4. Additive permissions only — no existing access changes (parity-safe vs master).
5. No schema migration — everything derived from existing tables.

**Non-goals (v1, explicitly deferred):**
- Accountant collections queue (user chose sales/designers/admin first; the payload shape anticipates it).
- Morning digest notifications (Telegram/email) — the queue payload is designed to become the digest content later.
- Real team hierarchy (rep → manager). No schema for it; super-sales supervises **all** sales reps.
- Per-tenant/config UI for thresholds — named constants only.

## 3. Locked per-profile behavior (user-confirmed)

| Profile | "My work" (personal queue) | "Team" (supervisor lens) |
|---|---|---|
| NORMAL_SALES / PRIMARY_SALES | ✅ own assigned leads | ❌ |
| SUPER_SALES | ✅ own assigned leads only (deals they personally claimed — NOT all visible leads) | ✅ **sales domain only** (all sales reps) |
| 3D / 2D designer, 2D executor | ✅ own project assignments | ❌ |
| ADMIN / SUPER_ADMIN | ❌ **none — admins do not take assigned leads** (user decision 2026-07-12) | ✅ sales + designers domains, drill-down into anyone |

Key ownership rule: the personal queue contains only records the caller **owns** (`ClientLead.userId = me` / `Assignment.userId = me`). Supervision never injects subordinate items into a supervisor's personal queue — the team lens is a separate, read-oriented surface. This preserves single ownership of every action item.

**Team lens shape (user-confirmed, "exceptions + drill-down"):**
- Default view = threshold breaches only; routine on-track work is invisible.
- Per-person summary cards with counts.
- Clicking a person → their full personal queue, read-only, with intervention CTAs (go to lead, reassign via the existing assign dialog for `lead.assign.other` holders).

## 4. Architecture — hybrid (approved: option C)

- **Personal queue = engine reuse.** Batch-fetch the existing cockpit bundle for the caller's active leads and run the real `computeCockpit` per lead. A user's active-lead count is small and bounded (`User.maxLeadsCounts` caps real workloads); we additionally cap the batch (§7). Guarantees queue ↔ lead-detail consistency.
- **Team lens = aggregate SQL.** Fast indexed `groupBy`/`count` exception queries, command-center style. Coarse counters may lag the engine's per-lead nuance — accepted trade; the drill-down (which re-runs the engine) self-corrects it.
- **Drill-down bridges the two:** the team lens links to the personal-queue computation for a target user — engine-accurate again; no third view is ever built.

Rejected alternatives: engine-everywhere (team fan-out = every rep × every active lead per page load — too heavy); SQL-everywhere (every cockpit rule duplicated in SQL → guaranteed drift).

## 5. Backend — new `my-day` module

Six-file shape (`my-day.route.js` / `controller` / `usecase` / `repo` / `validation` / `dto`), modeled on `command-center` (the sanctioned precedent for a cross-domain, aggregate repo). Prisma only in repos.

### 5.1 Endpoints

| Route | Permission | Behavior |
|---|---|---|
| `GET /v2/my-day` | `my_day.view` | Personal queue for the **caller**, dispatched on `authUser.currentProfileKey` (sales-tier vs designer-tier engine path). Admins do not hold this code. |
| `GET /v2/my-day/team` | `my_day.team.view` | Supervisor rollup. Domain scoping enforced server-side by profile: SUPER_SALES → `sales` block only; ADMIN/SUPER_ADMIN → `sales` + `designers`. |
| `GET /v2/my-day/users/:userId` | `my_day.team.view` + object-scope check | Drill-down: the personal queue computed **for the target user**. Scope checker: SUPER_SALES may only target users whose active profile is a sales tier (403 `MY_DAY_TEAM_SCOPE_DENIED` otherwise); ADMIN/SUPER_ADMIN may target anyone. Never widens data beyond what the supervisor's team lens already implies. |

All responses use the standard `{ success, message, data, translationKey }` envelope with language-neutral message CODES. New codes live in `packages/shared/messages-codes/*`.

### 5.2 Personal queue computation

**Sales tiers (incl. SUPER_SALES):**
1. `lead.repo` gains `findCockpitBundlesForUser({ userId, statuses, take })` — a batch variant of `findCockpitBundle` (same `COCKPIT_BUNDLE_SELECT`, plus `updatedAt: true` — see LEAD_STALE), `where: { userId, status: { in: ACTIVE-ish set } }`, capped.
2. Usecase runs `computeCockpit(bundle, now, { profileKey })` per lead (clock injected once for the whole request — deterministic + testable).
3. Flatten to items; drop leads with zero actions.

**Designer tier:** `my-day.repo` fetches the caller's `Assignment` rows on active projects with deadline data (`Project.deliveryTime`, linked `ContractStage.endDate`, `DeliverySchedule.deliveryAt` via `ContractStage.deliverySchedule`). Usecase runs `computeWorkStageActions` (extended — §5.3).

### 5.3 New pure rules (same engine files, same conventions: pure, injected clock, language-neutral)

**In `lead.cockpit.js` (SALES rule set):**
- **`LEAD_STALE`** (warning) — status in `ACTIVE_STATUSES`, no future call/meeting reminder, and `now − updatedAt ≥ STALE_LEAD_DAYS`. Params: `{ daysSinceActivity }`. Bundle gains `updatedAt`. **Intentional side effect:** the existing per-lead cockpit strip will also start showing this signal — desired (one source of truth). `NO_UPCOMING_TOUCH` stays (it fires earlier, without the age dimension); FE copy differentiates them.

**In `lead.workstage-cockpit.js` (assignment input gains `deliveryAt: Date|null`, resolved as `DeliverySchedule.deliveryAt ?? ContractStage.endDate ?? Project.deliveryTime`):**
- **`DELIVERY_OVERDUE`** (critical) — deadline passed, stage not completed. Params: `{ projectType, level, deliveryAt, overdueDays }`.
- **`STAGE_DUE_SOON`** (warning) — deadline within `DELIVERY_SOON_HOURS`. Params: `{ projectType, level, deliveryAt, hoursLeft }`.
- `WORK_STAGE_ASSIGNED_TO_YOU` unchanged. **Back-compat:** the existing `workStageActionsForLead` adapter passes no `deliveryAt` → new rules simply never fire on the lead-detail surface (no behavior change there in v1).

### 5.4 Team-lens aggregates (`my-day.repo`, all indexed reads)

`sales` block:
- Stale leads per rep (active status, `updatedAt < now − STALE_LEAD_DAYS`, no future reminder — documented approximation of the engine rule).
- Unclaimed NEW leads aging ≥ `UNCLAIMED_NEW_DAYS` (`userId = null`).
- Overdue `CallReminder`s (`status = IN_PROGRESS`, `time < now`) grouped by user.
- Contracts in `sessionStatus = SIGNING` for ≥ `UNSIGNED_CONTRACT_DAYS` (by `updatedAt`).
- Reps over capacity: active-lead count (command-center's `ACTIVE_LEAD_STATUSES`) vs `User.maxLeadsCounts`.

`designers` block:
- Deliveries overdue / due < `DELIVERY_SOON_HOURS`, grouped by assigned designer (via `Assignment`), stage not completed.
- Active stage count per designer (reuses command-center's `DESIGNER_ROLES` / `INACTIVE_PROJECT_STATUSES` vocabularies — imported, not re-declared).

**Money boundary preserved:** like command-center, this repo never touches `Payment` / `ContractPayment` / `Outcome` aggregates for admin surfaces. (The engine-computed personal queue for sales includes only the payment *signals* the per-lead cockpit already shows those roles today.)

### 5.5 DTO shapes

```js
// GET /v2/my-day  (and /users/:userId)
data: {
  profileKey, generatedAt, truncated,          // truncated=true when the batch cap was hit
  items: [
    { kind: "LEAD", leadId, clientName, status,
      signals: [{ type, severity, params, cta }] },          // engine output verbatim
    { kind: "WORK_STAGE", projectId, leadId, clientName, projectType, level, deliveryAt,
      signals: [{ type, severity, params, cta }] },
  ],
}
// item order: max signal severity (critical > warning > info), then oldest-first
```

```js
// GET /v2/my-day/team
data: {
  generatedAt,
  domains: {
    sales?:     { exceptions: [{ type, severity, params }], people: [{ userId, name, profileKey, activeCount, staleCount, overdueCount, atRiskCount }] },
    designers?: { exceptions: [...],                        people: [...] },
  },
}
// exception types: LEAD_STALE_TEAM, LEAD_UNCLAIMED_AGING, CALL_OVERDUE_TEAM,
//                  CONTRACT_SIGNING_STALLED, DELIVERY_OVERDUE_TEAM, DELIVERY_DUE_SOON_TEAM,
//                  REP_OVER_CAPACITY  — all language-neutral, params carry userId/userName/count/age
```

Only safe display fields on people/exceptions (id, name, profile, counts) — no PII beyond what supervisors' existing screens (kanban, command-center) already show.

## 6. Thresholds — one shared source

`MY_DAY_THRESHOLDS` in `@dms/shared` (placed alongside the existing shared constants; exact file per current conventions at implementation time):

```js
{ STALE_LEAD_DAYS: 5, UNCLAIMED_NEW_DAYS: 2, UNSIGNED_CONTRACT_DAYS: 3, DELIVERY_SOON_HOURS: 48 }
```

Consumed by BOTH the pure rules and the team-lens SQL so the two lenses breach at the same moment. Values user-approved as defaults; tunable in one place.

## 7. Performance & caps

- Personal queue: one batch bundle query, capped at **50 leads** ordered by `updatedAt asc` (oldest-touched first — the most-at-risk leads survive the cap). `truncated: true` + FE notice "showing the 50 most at-risk" — **no silent truncation**.
- Designer queue: assignments on active projects — inherently small.
- Team lens: ~8 aggregate queries on indexed columns (`status`, `time`, `deliveryAt`, `stageStatus`, `userId`). No pagination in v1; exceptions list carries counts, not row dumps.

## 8. Permissions, nav, seed (all additive)

- New codes in `@dms/shared`: **`my_day.view`** (NORMAL_SALES, PRIMARY_SALES, SUPER_SALES, THREE_D_DESIGNER, TWO_D_DESIGNER, TWO_D_EXECUTOR) and **`my_day.team.view`** (SUPER_SALES, ADMIN, SUPER_ADMIN). Profile names per the existing profile catalog; designer-tier keys as defined there.
- Wired into: code-defined profile map, the idempotent DB seed (`packages/db/prisma/seed.js` — upsert-only), `NAVIGATION` (a "My Day" tab; shown to any holder of either code), and role-permissions parity notes.
- Authorization on every route = permission code + (for drill-down) an object-scope checker (`checkIfUserCanViewMyDayOf(targetUserId)`) that throws `AppError` with a reason + redirect per the denial contract. **Never role-alone, no wildcards.**
- Sales tier is read from the **active profile** (`authUser.currentProfileKey` / `isAdminTier`) — never `isSuperSales`/`isPrimary` (locked decision 2026-07-11).

## 9. Frontend — `features/myDay`, page `/dashboard/my-day`

- Feature folder with `config/`; data via `useRequest`; RouteGuard allows holders of `my_day.view` OR `my_day.team.view`.
- **Tabs:** "My work" (needs `my_day.view`) and "Team" (needs `my_day.team.view`). Admins therefore see only Team; sales/designers only My work; super-sales both. URL-driven tab param, consistent with existing detail pages.
- **My work:** severity-grouped list (critical/warning/info). Item = client/project name + signal chips + relative time + CTA deep-linking to the existing lead-detail tab (`cta.tabKey`) or work-stage surface (`GOTO_WORKSTAGE`). Copy resolved from signal `type + params` in the existing `cockpitActions.jsx` copy map — new English entries for `LEAD_STALE`, `DELIVERY_OVERDUE`, `STAGE_DUE_SOON`. Empty state: "All clear — nothing needs you right now."
- **Team:** exceptions list (severity-sorted) on top; person cards below; clicking a person opens a drawer fetching `/my-day/users/:userId`; intervention CTAs = open lead + reassign (reuses the existing assign dialog, itself gated by `lead.assign.other`).
- All states designed: loading skeletons, empty ("all clear" / "no exceptions"), error (standard envelope surfacing), partial permission (single-tab rendering).

## 10. Testing

- **Pure rules:** unit tests with injected clocks — `LEAD_STALE` (boundary at exactly 5 days; suppressed when a future touch exists or status inactive), `DELIVERY_OVERDUE`/`STAGE_DUE_SOON` (boundary at 48h; completed stages silent; null deadlines silent; adapter back-compat = no new signals without `deliveryAt`).
- **Usecase:** mocked repos — profile dispatch (sales vs designer path), sorting, cap + `truncated`, zero-action leads dropped, admin calling personal path never happens (no code).
- **Route integration (the permission matrix — the critical part):** sales → `/team` = 403 `PERMISSION_DENIED`; super-sales → `/team` payload has NO `designers` block; super-sales → `/users/:designerId` = 403 with reason; admin → both domains + any drill-down; unauthenticated = 401.
- **FE:** `cd web && npx next build` (lint is broken repo-wide — build is the gate).

## 11. Implementation order (high level — full plan via writing-plans when user green-lights)

1. `@dms/shared`: threshold constants + permission codes + nav + message codes (+ seed wiring).
2. Pure rules: `LEAD_STALE` + work-stage deadline rules, TDD.
3. Repos: `findCockpitBundlesForUser` (lead.repo) + `my-day.repo` (designer queue + team aggregates).
4. `my-day` module: usecase/controller/route/validation/dto + scope checker, TDD + integration tests.
5. Frontend `features/myDay` (page, tabs, copy entries, drawer).
6. Whole-branch verify: full vitest suite + `next build`; parity note in `permissions-parity-matrix.md` (additive codes).

## 12. Open items / future

- Accountant collections queue (same personal-queue shape; `ACCOUNTANT` ruleset already exists in the engine).
- Morning digest (Telegram/email) — reuse the personal-queue payload; blocked on the Telegram-integration direction.
- Real team hierarchy (schema change; user decision).
- Threshold tuning after real usage.
