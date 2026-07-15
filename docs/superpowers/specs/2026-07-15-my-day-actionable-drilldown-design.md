# My Day — actionable drill-down (design)

**Date:** 2026-07-15
**Branch:** `feat/audit-log-sales-admin`
**Status:** Design — awaiting implementation plan

## 1. Problem

The My Day **team lens** (supervisor view) states problems but doesn't let you act on them:

- **Exceptions are dead text.** Lines like *"admin has 1 overdue call(s)"* or *"3 new lead(s) unclaimed for 2+ days"* have no link — you can't tell **which** lead or **which** call, and clicking does nothing.
- **The person drawer looks empty.** A person card shows *"1 active"*, but opening the drawer shows *"All clear — nothing needs you right now."* The card counts **all** active work; the drawer reuses the at-risk queue engine (`computeCockpit`, filtered to `signals.length > 0`) and drops healthy leads — so the two disagree and the drawer gives no detail.
- **Nav placement.** The *My Day* sidebar item falls into the bottom **General** group (it has no entry in `SECTION_BY_KEY`), instead of sitting under **Overview** with the Dashboard.

## 2. Goal

Make My Day **actionable**: every count and every exception drills down to the exact leads/calls behind it, and each leaf row deep-links to that record. One consistent drill-down surface (the person drawer), with exceptions as shortcuts into it. Object-scope, permissions, and the money boundary are unchanged.

## 3. Non-goals

- No change to the **personal** "My work" tab (`GET /v2/my-day`, `MyWorkQueue`). Its purpose — *"what needs my action today, ranked"* — is correctly at-risk-only. Only the **supervisor** drill-down and team lens change.
- No new accounting exposure. The money boundary (never read Payment/ContractPayment/Outcome) stays.
- No widening of who can see whose queue. Admin sees all; super-sales sees sales-tier only — unchanged.

## 4. Design

### 4.1 Nav move (trivial)

Add `"my-day": "overview"` to `SECTION_BY_KEY` in
`web/src/app/(auth)/dashboard/(dashboard)/layout.jsx` so *My Day* renders in the **Overview** group, right under Dashboard. No backend change.

### 4.2 Person drawer → the rep's real, itemized queue

Replace the empty-prone drawer body (currently `MyWorkQueue` with a `userId`) with a new view fed by an enriched drill-down endpoint. It shows a **single severity-sorted list of the rep's attention-worthy + active leads**, each row carrying **issue chips** and a deep link. A flat list (rather than disjoint sections) is used deliberately: a lead can have two problems at once (e.g. stale **and** an overdue call), and a flat list with per-lead chips shows that without double-listing, while keeping each chip-count equal to the matching person-card count.

Each row: client name + status + issue chips (**☎ N overdue calls** · **⚠ stale** · **✎ unsigned contract**) or **"On track"**, sorted overdue-calls → stale/unsigned → on-track, then oldest-touched first. The row links to `/dashboard/deals/:leadId` (with `?tab=calls` when it has overdue calls). The item set is the rep's **active leads** unioned with any lead that has an overdue call or unsigned contract (so every counted issue appears even if the lead's status isn't "active").

For a **DESIGNER** target the drawer keeps the work-stage queue but is **not** filtered to at-risk — on-track stages are listed too (empty `signals` → "On track"), each linking to `/dashboard/work-stages/:leadId`. Empty state appears only when the rep truly has zero active work.

The chip counts come from the **same** queries that feed the person-card counts, so the card ("1 active", "3 stale") and the drawer always agree.

**Endpoint (shape change, drill-down only):** `GET /v2/my-day/users/:userId` returns

```
{
  user: { id, name },
  family: "SALES" | "DESIGNER",
  generatedAt,
  counts: { active, stale, overdueCalls, unsigned },           // SALES
  items: [
    { leadId, clientName, status, sortAt,
      flags: { overdueCalls: <int>, stale: <bool>, unsigned: <bool> },
      severity: "critical" | "warning" | "info" },
    ...
  ],
}
```

For DESIGNER the `items` keep the existing work-stage shape (`{ projectId, leadId, clientName, projectType, level, deliveryAt, signals }`) with on-track stages included. The personal-tab endpoint `GET /v2/my-day` and `MyWorkQueue` are **untouched** (different endpoint, different component), so this shape change carries no risk to the personal queue.

### 4.3 Exceptions → clickable entry points

Each exception row in `TeamLens` gains a visible affordance (chevron / "View") and an `onClick` that routes to the exact items:

| Exception | Has today | Action |
|---|---|---|
| `CALL_OVERDUE_TEAM` | `userId`, `count` | open that rep's drawer, focused on **Overdue calls** |
| `LEAD_STALE_TEAM` | `userId`, `count` | open that rep's drawer, focused on **Stale leads** |
| `REP_OVER_CAPACITY` | `userId`, counts | open that rep's drawer |
| `CONTRACT_SIGNING_STALLED` | `leadId`, `clientName` | deep-link `/dashboard/deals/:leadId` |
| `LEAD_UNCLAIMED_AGING` | `count` only | open the new **Unclaimed leads** drawer |
| `DELIVERY_OVERDUE_TEAM` / `DELIVERY_DUE_SOON_TEAM` | `projectId`, `leadId` | deep-link `/dashboard/work-stages/:leadId` |

The drawer accepts an optional `focus` (a section key) so an exception can scroll to / highlight its group. No exception param shapes need to change except that the frontend now **uses** the `userId` / `leadId` already present.

### 4.4 Unclaimed leads drawer (new)

`LEAD_UNCLAIMED_AGING` has no owner (the leads are unassigned), so it can't route to a person. A new **read** lists the specific aging unclaimed leads:

`GET /v2/my-day/unclaimed` → `{ generatedAt, items: [{ leadId, clientName, createdAt, agingDays }] }`

Each row links to `/dashboard/deals/:leadId` (where the lead can be claimed/assigned through the existing lead UI). Gated by `my_day.team.view` (same as the team overview); sales-scope only. Returns the same leads the `unclaimedAgingCount` counts, so the exception count and the drawer list match.

### 4.5 Backend additions (repo + usecase + dto)

New **repository** reads (Prisma-only, safe projections, same money boundary):

- `overdueCallsForRep(userId, now)` → actual overdue `CallReminder` rows: `{ clientLeadId, client name, time }`.
- `staleLeadsForRep(userId, now)` → actual stale `ClientLead` rows (same predicate as `staleLeadsByRep`, scoped to one rep): `{ id, client name, status, updatedAt }`.
- `unclaimedAgingLeads(now, take)` → actual unclaimed aging `ClientLead` rows: `{ id, client name, createdAt }`.
- `signingStalledForRep(userId, now)` → the rep's stalled unsigned contracts: `{ clientLeadId, client name }`.
- `activeLeadsForRep(userId)` → the rep's active leads (`{ id, status, client name, updatedAt }`) for the base item set + `active` count.

`getQueueForTarget` (SALES) unions the active leads with any lead surfaced by the overdue-call / unsigned reads, attaches `flags` + a derived `severity`, and sorts. `counts` are the lengths of the matching reads (so they equal the person-card counts).

`getQueueForTarget` is rewritten to assemble the grouped `sections` shape from these reads + `computeCockpit` (unfiltered). A new usecase method `getUnclaimedLeads({ authUser })` backs `GET /v2/my-day/unclaimed`, reusing the caller's admin/super-sales branch (sales scope). DTOs whitelist the new fields; no raw rows leak.

### 4.6 Object-scope, permissions, money boundary

- `GET /v2/my-day/users/:userId` keeps its existing `checkIfUserCanViewMyDayOf` special-checker (admin → anyone; super-sales → sales-tier only). Unchanged.
- `GET /v2/my-day/unclaimed` is gated by `my_day.team.view` and is inherently global-sales-scoped (unclaimed leads have no owner). No per-record owner to scope.
- No new money sources. The new reads touch `CallReminder`, `ClientLead`, `Contract.sessionStatus` only — never Payment/ContractPayment/Outcome.

## 5. Components touched

**Backend** (`server/src/modules/my-day/`)
- `my-day.repo.js` — 3–4 new itemized reads.
- `my-day.usecase.js` — rewrite `getQueueForTarget` to grouped sections; add `getUnclaimedLeads`.
- `my-day.dto.js` — `toTargetQueue` (grouped) + `toUnclaimed`.
- `my-day.route.js` / `my-day.controller.js` / `my-day.validation.js` — add `GET /unclaimed`.

**Frontend** (`web/src/features/my-day/`)
- `PersonQueueDrawer.jsx` — render grouped sections (new drawer body) + accept `focus`.
- new `TargetQueueSections.jsx` (or inline) — the grouped, linked list.
- new `UnclaimedLeadsDrawer.jsx`.
- `TeamLens.jsx` — exception rows become clickable, route per the table in §4.3; wire the unclaimed drawer.
- `config/myDayCopy.jsx` — copy for section headers + keep exception copy.
- `web/src/app/(auth)/dashboard/(dashboard)/layout.jsx` — nav grouping one-liner (§4.1).

## 6. Testing

- **Usecase:** `getQueueForTarget` returns each section with the right items; counts match the person-card counts; empty sections omitted; DESIGNER target lists on-track stages. `getUnclaimedLeads` returns the aging unclaimed rows and matches `unclaimedAgingCount`.
- **Authorization (IDOR):** super-sales drill-down into a designer target still 403s; `/unclaimed` 403s without `my_day.team.view`.
- **DTO:** no non-whitelisted fields leak.
- **Frontend:** exception rows are clickable and route to the right target; drawer renders sections with working lead links; a rep with only healthy active leads shows the **On track** section (not an empty state).

## 7. Rollout

Additive: one endpoint shape change (drill-down, consumed only by the drawer we update in the same change) + one new endpoint. No schema/migration. No parity impact (My Day is a post-master additive surface).
