# Admin Command Center — Design

> Status: approved (user delegated full autonomy 2026-07-10). Build #3 of the
> Sales/Admin workstream (Audit ✅ → Sales Deal Cockpit ✅ → **Admin Command Center**).
> Baseline: layered backend, admin-only permission (mirrors `audit.log.view`),
> config-driven FE, English UI, message CODES, **no access widening beyond master**.

## 1. Problem

The admin/consultant lands on the generic `<Dashboard>` — leads-centric analytics with
no single operational cockpit answering: *how healthy is the pipeline, who on the team is
overloaded, what deliveries are late, and what just happened across the studio?* Those
signals live in separate modules (leads, projects/assignments, delivery, audit).

## 2. Goal

An **ADMIN/SUPER_ADMIN-only** Command Center screen at `/dashboard/command-center` with:
- **KPI tiles** — active deals, pipeline value, revenue, commissions, late deliveries.
- **Pipeline by status** — deal counts + `averagePrice` value per `ClientLead_status`.
- **Team capacity** — active-project load per designer and lead load per salesperson,
  with an "overloaded" flag; auto-assign rotation status.
- **Delivery health** — late deliveries / at-risk stages (deadline passed, not completed).
- **Recent activity feed** — the last N `ActionAuditLog` events (reuses Build #1).

Every drill-down links to the owning screen (deal detail, project, users). This is the
"hub" that ties the profiles together.

Non-goals: no new mutations; no ML scoring; **no new money exposure** (see §5); no
cross-tenant (single studio).

## 3. Authorization (no widening)

New admin-only permission code, mirroring `audit.log.view` exactly:
- `command_center.view` — added to `permissions.constants.js`, granted via a
  `COMMAND_CENTER_ADMIN = [P.COMMAND_CENTER.VIEW]` block spread into **ADMIN +
  SUPER_ADMIN only** (role-permissions.js + profiles.js). NOT in `SHARED_AUTHED`, NOT on
  `isSuperSales`. Shared tests assert admin-only.
- Nav row `{ key:"command-center", label:"Command Center",
  href:"/dashboard/command-center", icon:"FiActivity", allowedRoles:[ADMIN,SUPER_ADMIN] }`
  → RouteGuard auto-gates (the segment isn't in `ALWAYS_ALLOWED_SEGMENTS`). FE icon map +
  page-level `usePermission("command_center.view")`.

## 4. Backend — new `command-center` module

New module `server/src/modules/command-center/` (six files), mounted `/v2/command-center`,
reusing Prisma aggregation patterns from the dashboard module but self-contained (Prisma
only in its own repo).

- `command-center.route.js` — `router.use(requireAuth)`; one composite read
  `GET /overview` guarded by `requirePermissions([P.COMMAND_CENTER.VIEW])` +
  `validate(overviewQuery,"query")` (optional `from`/`to` date range, default month-to-now).
- `command-center.controller.js` — thin.
- `command-center.usecase.js` — `getOverview({ query, authUser, now })`: orchestrates the
  repo aggregations + shapes the dto. Admin-tier only (the code gate guarantees it), so
  all aggregations are **global** (no per-user scoping needed — but still no accounting money).
- `command-center.repo.js` — Prisma aggregations:
  - `pipelineByStatus(range)` → `groupBy(["status"], _count, )` + `_sum.averagePrice` per status.
  - `activeDealsCount`, `finalizedValue(range)` (`_sum.averagePrice where status∈{FINALIZED,CONVERTED}`).
  - `revenue(range)` → `invoice.aggregate(_sum.amount)` (already admin-visible).
  - `commissions(range)` → `commission.aggregate(_sum.amount, _sum.amountPaid)` (already admin-visible).
  - `designerLoad()` → for each designer `User` (role∈{THREE_D_DESIGNER,TWO_D_DESIGNER,TWO_D_EXECUTOR}),
    count active projects via `project.count({ where:{ assignments:{some:{userId}}, status:{ notIn:["Completed","Hold","Rejected","To Do"] } } })`.
  - `salesLoad()` → group active leads by `userId` (owner), compare to `User.maxLeadsCounts`.
  - `lateDeliveries()` → `deliverySchedule.findMany({ where:{ deliveryAt:{ lt:now }, stage:{ stageStatus:{ not:"COMPLETED" } } }, include:{ project:{ select:{ id, groupTitle } } } take:N })` + a count.
  - `autoAssignRotation()` → `autoAssignment.findMany({ where:{ isActive:true } })` grouped by type.
- `command-center.validation.js` — Zod `overviewQuery` (optional from/to).
- `command-center.dto.js` — shape `{ kpis, pipeline, capacity, delivery }`, all
  language-neutral (enum names, counts, decimals as numbers). No PII beyond user id+name
  for the capacity list (safe projection).

**Recent-activity feed:** NO new endpoint — the FE calls the existing admin-only
`GET /v2/audit-logs?limit=8` (Build #1). One extra call, zero new backend.

Response `data` shape:
```jsonc
{
  "kpis": { "activeDeals": 42, "pipelineValue": 1875000, "finalizedValue": 640000,
            "revenue": 512000, "commissions": 48000, "lateDeliveries": 3 },
  "pipeline": [ { "status": "NEGOTIATING", "count": 9, "value": 420000 }, ... ],
  "capacity": {
    "designers": [ { "userId": 12, "name": "Sara", "role": "THREE_D_DESIGNER", "activeProjects": 7, "overloaded": true }, ... ],
    "sales": [ { "userId": 5, "name": "Omar", "activeLeads": 38, "maxLeads": 50, "overloaded": false }, ... ],
    "autoAssign": [ { "type": "SALES", "activeUsers": 4 }, ... ]
  },
  "delivery": { "lateCount": 3, "items": [ { "projectId": 88, "title": "Villa 12 — 3D", "deliveryAt": "2026-07-06T...", "overdueDays": 4 }, ... ] }
}
```

## 5. Money exposure — DELIBERATE BOUNDARY

The repo has a **locked decision**: `Payment`/`ContractPayment`/`Outcome` accounting
aggregates are **ACCOUNTANT-only**; ADMIN/SUPER_ADMIN do NOT hold `ACCOUNTING_*` codes
(documented behavior-preserving parity with master). Therefore the Command Center's money
figures use **only** what admins can already see today via the dashboard:
`Invoice._sum.amount` (revenue), `Commission` aggregates, and `ClientLead.averagePrice`
(pipeline/finalized value). It does **NOT** aggregate `Payment.amountLeft`/`amountPaid`,
`ContractPayment`, overdue receivables, or `Outcome`.

A fuller receivables/overdue/cash-flow tile for admins is a **future, explicit widening**
that requires the user's sign-off + a parity-matrix update (`docs/superpowers/specs/
permissions-parity-matrix.md`). It is intentionally out of scope here; flagged, not guessed.

## 6. Frontend — `features/command-center/`

- Route `web/src/app/(auth)/dashboard/(dashboard)/command-center/page.jsx` — `"use client"`,
  `usePermission("command_center.view")` gate (mirror `audit-logs/page.jsx`).
- `features/command-center/CommandCenter.jsx` — the composed screen: fetches
  `/v2/command-center/overview` (via `getData` in a `useEffect`, matching the dashboard-card
  pattern) and the activity feed via the audit surface.
- Widgets (reuse existing dashboard card/tile conventions + MUI v7 theme + status colors):
  - `KpiTilesRow.jsx` — reuse `KeyMetricFinancialTile`/`KeyMetricSecondaryTile` styling.
  - `PipelineByStatus.jsx` — status → count/value (reuse `LeadStatusChart` styling or a
    compact bar list; follow the dataviz conventions if a chart is added).
  - `TeamCapacityPanel.jsx` — designer + sales load lists with an "overloaded" chip; rows
    link to the user detail.
  - `DeliveryHealthPanel.jsx` — late-delivery list, rows link to the project.
  - `ActivityFeed.jsx` — compact recent `ActionAuditLog` list (actor · action · time),
    "View all" → `/dashboard/audit-logs`. Reuses the audit English copy from Build #1.
- English UI; empty/loading/error states per widget; capability-safe (admin-only screen).

## 7. Testing & verification

- Backend: usecase test (mock repo → dto shape, overloaded-flag logic, date range),
  repo query correctness where feasible, integration `GET /v2/command-center/overview`
  403 for STAFF/ACCOUNTANT/designers, 200 for ADMIN/SUPER_ADMIN.
- Shared: `command_center.view` present for ADMIN/SUPER_ADMIN only; nav tab admin-only.
- Frontend: `cd web && npx next build` exit 0; screen renders with tiles/panels/feed.
- Full suite `npx vitest run` green. Review: shared-reviewer + shared-security (confirm
  no accounting-money exposure; admin-only gate; capacity list no PII leak).

## 8. Files summary

Backend: new `command-center` module (6 files) + tests; `@dms/shared`
`command_center.view` + `COMMAND_CENTER_ADMIN` + nav + `COMMAND_CENTER_FETCHED` message
code; shared tests. Frontend: `command-center/page.jsx`, `features/command-center/*`
(CommandCenter + 5 widgets), nav icon map, English copy. Reuses the audit endpoint for the
feed; reuses dashboard tile/chart styling.
