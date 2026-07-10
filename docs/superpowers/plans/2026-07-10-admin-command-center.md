# Admin Command Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** An ADMIN/SUPER_ADMIN-only Command Center hub (KPIs, pipeline, team capacity, delivery health, activity feed) with no new money exposure.

**Architecture:** New admin-only permission `command_center.view`; a new `command-center` backend module with one composite `GET /overview`; a config-driven FE screen reusing dashboard tiles + the existing audit feed.

**Tech Stack:** Express 4, Prisma 6, Zod 4, `@dms/shared`, Next 16, MUI v7, `getData`/`useDataFetcher`, Vitest.

## Global Constraints

- Layering route→controller→usecase→repo→validation→dto; Prisma ONLY in `*.repo.js`; suffixes `*.route.js`/`*.repo.js`.
- Envelope `{ success, message, data, translationKey }`; `message` a CODE; `AppError` errors; JS/ESM only.
- **No access widening:** ONLY already-admin-visible money (Invoice revenue, Commission, `ClientLead.averagePrice`). NO `Payment`/`ContractPayment`/`Outcome` aggregates (accounting is ACCOUNTANT-only, locked). 
- `command_center.view` granted to ADMIN + SUPER_ADMIN ONLY (mirror `audit.log.view`) — never SHARED_AUTHED, never isSuperSales.
- FE verify `cd web && npx next build`; BE verify `npx vitest run`.

---

### Task 1: `@dms/shared` permission + nav wiring

**Files:**
- Modify: `packages/shared/constants/access/permissions.constants.js` (`COMMAND_CENTER_PERMISSIONS = { VIEW: "command_center.view" }` + `PERMISSIONS.COMMAND_CENTER` + `ALL_PERMISSIONS`)
- Modify: `role-permissions.js` (`COMMAND_CENTER_ADMIN = [P.COMMAND_CENTER.VIEW]`, spread into ADMIN + SUPER_ADMIN only)
- Modify: `profiles.js` (add to ADMIN + SUPER_ADMIN sets)
- Modify: `navigation.js` (nav row, `allowedRoles:[...ADMIN_SET]`, near Reports/Audit Log)
- Test: `packages/shared/__tests__/` (admin-only assertions + nav)

- [ ] **Step 1:** Failing shared test — `command_center.view` ∈ ADMIN & SUPER_ADMIN, ∉ every other role/profile; nav "Command Center" admin-only.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement all four edits (mirror the `audit.log.view` / `AUDIT_ADMIN` wiring exactly).
- [ ] **Step 4:** Run → PASS. Commit `feat(shared): command_center.view permission + nav (admin-only)`.

---

### Task 2: `command-center` backend module + overview endpoint

**Files:**
- Create: `server/src/modules/command-center/command-center.{route,controller,usecase,repo,validation,dto}.js`
- Modify: the v2 router registrar (`server/src/shared/routes.js`) to mount `/v2/command-center`
- Modify: `@dms/shared` messages-codes (`COMMAND_CENTER_FETCHED`) + FE resolver map
- Test: `server/src/modules/command-center/__tests__/command-center.usecase.test.js`, `command-center.route.integration.test.js`

**Interfaces:**
- Produces: `GET /v2/command-center/overview` → `{ success, message:"COMMAND_CENTER_FETCHED", data:{ kpis, pipeline, capacity, delivery }, translationKey }`.
- Repo methods (Prisma only): `pipelineByStatus(range)`, `activeDealsCount(range)`, `finalizedValue(range)`, `revenue(range)`, `commissions(range)`, `designerLoad()`, `salesLoad()`, `lateDeliveries(now, take)`, `autoAssignRotation()`.

- [ ] **Step 1: Failing usecase test** — mock repo methods; assert `getOverview` composes `{ kpis, pipeline, capacity, delivery }`, computes `overloaded` (designer activeProjects > threshold [config const, e.g. 6]; sales activeLeads > `maxLeads`), and `lateDeliveries → overdueDays` from `now`. `now` injected.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement repo (Prisma aggregations per spec §4 — reuse dashboard patterns: `groupBy(["status"], _count, _sum:{averagePrice})`, `invoice.aggregate`, `commission.aggregate`, `project.count` with `assignments:{some:{userId}}` + status `notIn`, `clientLead.groupBy(["userId"])`, `deliverySchedule.findMany` with `deliveryAt<now` + `stage.stageStatus != COMPLETED`, `autoAssignment.findMany`). Do NOT query Payment/ContractPayment/Outcome.
- [ ] **Step 4:** Implement validation (`overviewQuery`: optional `from`/`to`), controller (thin), usecase (compose + dto), route (`requirePermissions([P.COMMAND_CENTER.VIEW])` + validate). Add `COMMAND_CENTER_FETCHED` code + English resolver. Mount the router.
- [ ] **Step 5: Integration test** — 403 for STAFF/ACCOUNTANT/designer, 200 for ADMIN/SUPER_ADMIN, `data` has kpis/pipeline/capacity/delivery.
- [ ] **Step 6:** Run `npx vitest run` → PASS. Commit `feat(command-center): admin overview endpoint (no accounting-money exposure)`.

---

### Task 3: Frontend Command Center screen

**Files:**
- Create: `web/src/app/(auth)/dashboard/(dashboard)/command-center/page.jsx`
- Create: `web/src/features/command-center/CommandCenter.jsx`, `KpiTilesRow.jsx`, `PipelineByStatus.jsx`, `TeamCapacityPanel.jsx`, `DeliveryHealthPanel.jsx`, `ActivityFeed.jsx`
- Modify: `web/src/app/(auth)/dashboard/(dashboard)/layout.jsx` (add `command-center` → icon in `ICON_BY_KEY`)

**Interfaces:**
- Consumes: `GET /v2/command-center/overview` (via `getData`); `GET /v2/audit-logs?limit=8` for the feed; `usePermission("command_center.view")`.

- [ ] **Step 1:** `page.jsx` — `"use client"`, gate on `usePermission().hasPermission("command_center.view")` (mirror `audit-logs/page.jsx`), render heading + `<CommandCenter/>`.
- [ ] **Step 2:** `CommandCenter.jsx` — fetch overview via `getData({ url:"command-center/overview", setLoading })`; fetch the activity feed from the audit surface; compose the widgets in an MUI Grid.
- [ ] **Step 3:** Widgets — `KpiTilesRow` (reuse `KeyMetricFinancialTile`/`KeyMetricSecondaryTile` styling), `PipelineByStatus` (compact bar/list with status colors), `TeamCapacityPanel` (designer + sales load lists, "overloaded" chip, rows link to `/dashboard/users/:id`), `DeliveryHealthPanel` (late list, rows link to `/dashboard/projects/:id`), `ActivityFeed` (actor · action · time; "View all" → `/dashboard/audit-logs`). English copy, per-widget loading/empty/error states.
- [ ] **Step 4:** Add the `command-center` icon mapping in `layout.jsx`.
- [ ] **Step 5:** `cd web && npx next build` exit 0. Commit `feat(web): admin command center screen`.

---

### Task 4: Review + verify

- [ ] `npx vitest run` green; `cd web && npx next build` exit 0.
- [ ] shared-security (confirm NO Payment/ContractPayment/Outcome aggregation; admin-only gate; capacity list exposes only id+name+role+counts) + shared-reviewer (layering, envelope, no Prisma outside repo, reuse of audit feed, config-driven FE). Fix criticals/should-fixes. Commit. Update `PROJECT_STATE.md`.

## Self-Review
- Spec §3 → Task 1 ✅; §4 → Task 2 ✅; §5 (no money widening) → Task 2 constraint + Task 4 security ✅; §6 → Task 3 ✅; §7 → each task + Task 4 ✅.
- Types: `getOverview({query,authUser,now})`, repo method names, `COMMAND_CENTER_FETCHED`, `command_center.view` consistent throughout.
