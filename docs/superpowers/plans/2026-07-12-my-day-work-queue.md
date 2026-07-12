# My Day — Work Queue + Team Lens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `GET /v2/my-day` (personal action queue for sales tiers + designers), `GET /v2/my-day/team` (supervisor exception rollup for super-sales + admins), `GET /v2/my-day/users/:userId` (supervisor drill-down), and the `/dashboard/my-day` page — per the approved spec `docs/superpowers/specs/2026-07-12-my-day-work-queue-design.md`.

**Architecture:** Hybrid (spec §4). Personal queue batch-runs the EXISTING pure engines (`computeCockpit`, `computeWorkStageActions`) over the caller's own records; team lens is aggregate Prisma queries (command-center style); drill-down reuses the personal-queue computation for a target user behind an object-scope checker. New backend module `server/src/modules/my-day/` (six-file shape), two new additive permission codes, no schema migration.

**Tech Stack:** Express 4 + Zod 4 + Prisma (`@dms/db` singleton) backend; Next.js 16 App Router + MUI v7 frontend; vitest (run from repo root).

## Global Constraints

- Envelope everywhere: `{ success, message, data, translationKey }`; `message` is always a language-neutral CODE (spec §5.1).
- **No schema migration** — everything derived from existing tables (spec §2).
- **Never read `isSuperSales`/`isPrimary`** in new logic — sales tier comes from `authUser.currentProfileKey` / `authUser.isAdminTier`, with role-only fallback for un-migrated sessions (CLAUDE.md §2.8).
- Prisma ONLY in repos; business logic in usecases; controllers thin (CLAUDE.md §6).
- Authorization = permission code + object-scope checker for the drill-down; never role-alone (spec §8).
- Admins hold `my_day.team.view` ONLY — **no personal queue for admins** (spec §3, user decision 2026-07-12).
- All additive — no existing access changes (parity-safe).
- UI strings: English. All new signal types/params language-neutral end-to-end.
- Tests run from the **repo root**: `npm test -- <path-or-substring>`. Frontend gate is `cd web && npx next build` (lint is broken repo-wide).
- Thresholds are single-source module constants (repo convention — no shared thresholds file): `STALE_LEAD_DAYS=5` exported from `lead.cockpit.js`, `DELIVERY_SOON_HOURS=48` from `lead.workstage-cockpit.js`, `UNCLAIMED_NEW_DAYS=2` + `UNSIGNED_CONTRACT_DAYS=3` from `my-day.repo.js`.
- **Spec adaptation (verified against schema):** `Contract` has NO `updatedAt` column → the "signing stalled" exception uses `createdAt` (documented approximation; spec §5.4 said `updatedAt`).
- PDF code untouched; production untouched.

---

### Task 1: `@dms/shared` wiring — permission codes, roles, profiles, navigation, message codes

**Files:**
- Modify: `packages/shared/constants/access/permissions.constants.js` (~line 718, after `COMMAND_CENTER_PERMISSIONS`; and the `PERMISSIONS` aggregate ~line 721)
- Modify: `packages/shared/constants/access/role-permissions.js` (~line 178, after `COMMAND_CENTER_ADMIN`; and the role arrays ~lines 379–424)
- Modify: `packages/shared/constants/access/profiles.js` (imports line 4–9; profile arrays lines 15–33)
- Modify: `packages/shared/constants/access/navigation.js` (insert new entry immediately AFTER the `command-center` entry, ~line 238)
- Create: `packages/shared/messages-codes/my-day/my-day.js`, `packages/shared/messages-codes/my-day/index.js`
- Modify: `packages/shared/messages-codes/index.js` (add barrel line), `packages/shared/messages-names.js` (~line 28)
- Test: `packages/shared/__tests__/my-day-permissions.test.js`

**Interfaces:**
- Produces: `PERMISSIONS.MY_DAY = { VIEW: "my_day.view", TEAM_VIEW: "my_day.team.view" }`, `MY_DAY_PERSONAL`/`MY_DAY_TEAM` block arrays, `myDayMessagesCodes = { MY_DAY_FETCHED, MY_DAY_TEAM_FETCHED, MY_DAY_PROFILE_UNSUPPORTED, MY_DAY_TEAM_SCOPE_DENIED, MY_DAY_TARGET_NOT_FOUND }`, `messagesNames.myDayMessages`, a `my-day` NAVIGATION entry. Consumed by Tasks 6–8. Seed picks codes up automatically (data-driven from `ALL_PERMISSIONS` + `PROFILES` — no seed.js edit).

- [ ] **Step 1: Write the failing test**

Create `packages/shared/__tests__/my-day-permissions.test.js`. Mirror the import style of the existing `packages/shared/__tests__/command-center-permissions.test.js` (open it first and copy its exact import lines — same source module):

```js
// my_day.view / my_day.team.view wiring — additive codes for the My Day work queue.
// Sales tiers + designers get the personal queue; SUPER_SALES + ADMIN/SUPER_ADMIN get
// the team lens; admins deliberately have NO personal queue (spec §3).
import { describe, it, expect } from "vitest";
// >>> copy the exact import lines used by command-center-permissions.test.js, importing:
// PERMISSIONS (as P), ALL_PERMISSIONS, ROLE_PERMISSIONS, PROFILES, USER_ROLES, NAVIGATION,
// myDayMessagesCodes, messagesNames

const VIEW = P.MY_DAY.VIEW;
const TEAM = P.MY_DAY.TEAM_VIEW;
const R = USER_ROLES;

describe("my_day permission wiring", () => {
  it("registers both codes in the aggregate + ALL_PERMISSIONS", () => {
    expect(VIEW).toBe("my_day.view");
    expect(TEAM).toBe("my_day.team.view");
    expect(ALL_PERMISSIONS).toContain(VIEW);
    expect(ALL_PERMISSIONS).toContain(TEAM);
  });

  it("grants the personal queue to sales + designer base roles (legacy fallback map)", () => {
    for (const role of [R.STAFF, R.SUPER_SALES, R.THREE_D_DESIGNER, R.TWO_D_DESIGNER, R.TWO_D_EXECUTOR]) {
      expect(ROLE_PERMISSIONS[role]).toContain(VIEW);
    }
  });

  it("grants the team lens to ADMIN/SUPER_ADMIN/SUPER_SALES roles ONLY", () => {
    for (const role of [R.ADMIN, R.SUPER_ADMIN, R.SUPER_SALES]) {
      expect(ROLE_PERMISSIONS[role]).toContain(TEAM);
    }
    for (const role of [R.STAFF, R.THREE_D_DESIGNER, R.TWO_D_DESIGNER, R.TWO_D_EXECUTOR, R.ACCOUNTANT, R.CONTACT_INITIATOR]) {
      expect(ROLE_PERMISSIONS[role]).not.toContain(TEAM);
    }
  });

  it("admins have NO personal queue (team lens only)", () => {
    expect(ROLE_PERMISSIONS[R.ADMIN]).not.toContain(VIEW);
    expect(ROLE_PERMISSIONS[R.SUPER_ADMIN]).not.toContain(VIEW);
    expect(PROFILES.ADMIN).not.toContain(VIEW);
    expect(PROFILES.SUPER_ADMIN).not.toContain(VIEW);
    expect(PROFILES.ADMIN).toContain(TEAM);
  });

  it("profiles: sales tiers + designers hold the personal queue", () => {
    for (const key of ["NORMAL_SALES", "PRIMARY_SALES", "SUPER_SALES", "SUPER_SALES_BASE", "DESIGNER_3D", "DESIGNER_2D", "EXECUTOR_2D"]) {
      expect(PROFILES[key]).toContain(VIEW);
    }
  });

  it("profiles: only SUPER_SALES tiers + admins hold the team lens", () => {
    for (const key of ["SUPER_SALES", "SUPER_SALES_BASE", "ADMIN", "SUPER_ADMIN"]) {
      expect(PROFILES[key]).toContain(TEAM);
    }
    for (const key of ["NORMAL_SALES", "PRIMARY_SALES", "DESIGNER_3D", "DESIGNER_2D", "EXECUTOR_2D", "ACCOUNTANT", "CONTACT_INITIATOR"]) {
      expect(PROFILES[key]).not.toContain(TEAM);
    }
  });

  it("accountant + contact-initiator are out of scope (v1)", () => {
    expect(PROFILES.ACCOUNTANT).not.toContain(VIEW);
    expect(PROFILES.CONTACT_INITIATOR).not.toContain(VIEW);
  });

  it("NAVIGATION carries the My Day tab for the five in-scope roles", () => {
    const tab = NAVIGATION.find((t) => t.key === "my-day");
    expect(tab).toBeTruthy();
    expect(tab.href).toBe("/dashboard/my-day");
    expect(tab.allowedRoles).toEqual(
      expect.arrayContaining([R.ADMIN, R.SUPER_ADMIN, R.STAFF, R.SUPER_SALES, R.THREE_D_DESIGNER, R.TWO_D_DESIGNER, R.TWO_D_EXECUTOR]),
    );
    expect(tab.allowedRoles).not.toContain(R.ACCOUNTANT);
    expect(tab.allowedRoles).not.toContain(R.CONTACT_INITIATOR);
  });

  it("registers the my-day message codes + translation bucket", () => {
    expect(myDayMessagesCodes.MY_DAY_FETCHED).toBe("MY_DAY_FETCHED");
    expect(myDayMessagesCodes.MY_DAY_TEAM_SCOPE_DENIED).toBe("MY_DAY_TEAM_SCOPE_DENIED");
    expect(messagesNames.myDayMessages).toBe("myDayMessages");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run (repo root): `npm test -- packages/shared/__tests__/my-day-permissions.test.js`
Expected: FAIL — `P.MY_DAY` is undefined / import error for `myDayMessagesCodes`.

- [ ] **Step 3: Implement the shared wiring**

**(a)** `permissions.constants.js` — after `COMMAND_CENTER_PERMISSIONS` (~line 718):

```js
// ── my-day (profile-scoped work queue + supervisor team lens) ─────────────────
// VIEW = the personal "what needs my action" queue (sales tiers + designers).
// TEAM_VIEW = the supervisor rollup + drill-down (SUPER_SALES sales-domain-only;
// ADMIN/SUPER_ADMIN all domains). Admins deliberately do NOT hold VIEW — they take
// no assigned leads (spec 2026-07-12-my-day-work-queue-design.md §3).
export const MY_DAY_PERMISSIONS = {
  VIEW: "my_day.view", // GET /v2/my-day (own queue)
  TEAM_VIEW: "my_day.team.view", // GET /v2/my-day/team + /v2/my-day/users/:userId
};
```

And register in the `PERMISSIONS` aggregate (alongside `COMMAND_CENTER`):

```js
  MY_DAY: MY_DAY_PERMISSIONS,
```

**(b)** `role-permissions.js` — after `COMMAND_CENTER_ADMIN` (~line 178):

```js
// My Day — personal queue for the working tiers; team lens for supervisors. Additive
// (new surface, no legacy equivalent). Admins get TEAM only (no personal queue).
export const MY_DAY_PERSONAL = [P.MY_DAY.VIEW];
export const MY_DAY_TEAM = [P.MY_DAY.TEAM_VIEW];
```

Role arrays (the legacy fallback map — needed for un-migrated sessions + integration tests, which sign role-only tokens):
- `[USER_ROLES.ADMIN]` and `[USER_ROLES.SUPER_ADMIN]`: append `...MY_DAY_TEAM,` (after `...COMMAND_CENTER_ADMIN,`).
- `[USER_ROLES.STAFF]`, `[USER_ROLES.THREE_D_DESIGNER]`, `[USER_ROLES.TWO_D_DESIGNER]`, `[USER_ROLES.TWO_D_EXECUTOR]` (lines 418–421): append `...MY_DAY_PERSONAL` inside the array.
- `[USER_ROLES.SUPER_SALES]` (line 423): append `...MY_DAY_PERSONAL, ...MY_DAY_TEAM`.
- Leave `ACCOUNTANT` and `CONTACT_INITIATOR` untouched.

**(c)** `profiles.js` — add `MY_DAY_PERSONAL, MY_DAY_TEAM` to the import from `./role-permissions.js`, then:

```js
const NORMAL_SALES = dedupe([...SHARED_AUTHED, ...LEAD_AUTHED, ...PROJECT_AUTHED, ...STAFF_GATE, ...LEAD_SECTION_ANALYSIS, ...MY_DAY_PERSONAL]);
const PRIMARY_SALES = dedupe([...NORMAL_SALES, ...LEAD_SECTION_PRIMARY]);
const SUPER_SALES = dedupe([...PRIMARY_SALES, ...SUPER_SALES_EXTRA_PERMISSIONS, ...MY_DAY_TEAM]);
```

(PRIMARY_SALES inherits VIEW via NORMAL_SALES composition.) Then:
- `ADMIN` block: append `...MY_DAY_TEAM,` (do **NOT** add `MY_DAY_PERSONAL`).
- `DESIGNER`: `const DESIGNER = dedupe([...SHARED_AUTHED, ...LEAD_AUTHED, ...PROJECT_AUTHED, ...STAFF_GATE, ...MY_DAY_PERSONAL]);`
- `SUPER_SALES_BASE`: `const SUPER_SALES_BASE = dedupe([...SHARED_AUTHED, ...LEAD_AUTHED, ...PROJECT_AUTHED, ...MY_DAY_PERSONAL, ...MY_DAY_TEAM]);`
- Leave `ACCOUNTANT` / `CONTACT_INITIATOR` untouched.

**(d)** `navigation.js` — insert immediately AFTER the `command-center` entry (~line 238):

```js
  // My Day — profile-scoped work queue (additive screen, 2026-07-12). Sales tiers +
  // designers get the personal queue; SUPER_SALES + admins additionally get the Team tab
  // (tab visibility inside the page is permission-gated; this row only lists the roles
  // that can reach the screen at all).
  {
    key: "my-day",
    label: "My Day",
    href: "/dashboard/my-day",
    icon: "FiSunrise",
    allowedRoles: [
      R.ADMIN,
      R.SUPER_ADMIN,
      R.STAFF,
      R.SUPER_SALES,
      R.THREE_D_DESIGNER,
      R.TWO_D_DESIGNER,
      R.TWO_D_EXECUTOR,
    ],
  },
```

**(e)** Create `packages/shared/messages-codes/my-day/my-day.js`:

```js
// my-day surface message CODES (language-neutral; FE resolves to English).
export const myDayMessagesCodes = {
  MY_DAY_FETCHED: "MY_DAY_FETCHED",
  MY_DAY_TEAM_FETCHED: "MY_DAY_TEAM_FETCHED",
  // The caller's profile has no queue family (defensive — route gates should prevent this).
  MY_DAY_PROFILE_UNSUPPORTED: "MY_DAY_PROFILE_UNSUPPORTED",
  // A SUPER_SALES supervisor tried to drill into a non-sales user (403).
  MY_DAY_TEAM_SCOPE_DENIED: "MY_DAY_TEAM_SCOPE_DENIED",
  MY_DAY_TARGET_NOT_FOUND: "MY_DAY_TARGET_NOT_FOUND",
};
```

Create `packages/shared/messages-codes/my-day/index.js`:

```js
export * from "./my-day.js";
```

In `packages/shared/messages-codes/index.js` add (next to the command-center line):

```js
export * from "./my-day/index.js";
```

In `packages/shared/messages-names.js` add after `commandCenterMessages`:

```js
  myDayMessages: "myDayMessages",
```

- [ ] **Step 4: Run the new test + the whole shared suite**

Run: `npm test -- packages/shared`
Expected: the new file PASSES. If any existing navigation/profile parity test fails by asserting an exact per-role tab list or exact code set, update its expectation to include the new `my-day` entry / codes — the same treatment `command-center` got when it was added (`git log --oneline -S command-center -- packages/shared/__tests__` shows the precedent). Do NOT weaken any assertion that admins/master-roles must NOT hold a code.

- [ ] **Step 5: Commit**

```bash
git add packages/shared
git commit -m "feat(shared): my_day.view + my_day.team.view codes, profiles, nav, message codes"
```

---

### Task 2: `LEAD_STALE` pure rule in the lead cockpit engine

**Files:**
- Modify: `server/src/modules/leads/lead/lead.cockpit.js` (new exported constant + rule 7b inside `computeSalesActions`)
- Modify: `server/src/modules/leads/lead/lead.repo.js` (add `updatedAt: true` to `COCKPIT_BUNDLE_SELECT`, ~line 991)
- Test: `server/src/modules/leads/lead/__tests__/lead.cockpit.test.js` (append a describe block)

**Interfaces:**
- Consumes: existing `computeCockpit(bundle, now, { profileKey })`, `ACTIVE_STATUSES`, `daysBetween`, `toDate`, `action` helpers (all already in the file).
- Produces: `export const STALE_LEAD_DAYS = 5;` (imported by Task 5's repo) and a new signal `{ type: "LEAD_STALE", severity: "warning", params: { daysSinceActivity }, cta: { kind: "OPEN_CALL", capability: "canAddCall", tabKey: "calls" } }`. Bundles now MAY carry `updatedAt` — the rule is skipped when absent (back-compat: every existing test bundle lacks it).

- [ ] **Step 1: Write the failing tests**

Append to `lead.cockpit.test.js` (uses the file's existing `NOW`, `baseBundle`, `types` helpers):

```js
describe("computeCockpit — LEAD_STALE (My Day)", () => {
  const daysAgo = (d) => new Date(NOW.getTime() - d * 24 * 3600_000);

  it("fires at exactly STALE_LEAD_DAYS with the age in params", () => {
    const r = computeCockpit(baseBundle({ updatedAt: daysAgo(5) }), NOW);
    const stale = r.actions.find((a) => a.type === "LEAD_STALE");
    expect(stale).toBeTruthy();
    expect(stale.severity).toBe("warning");
    expect(stale.params).toEqual({ daysSinceActivity: 5 });
    expect(stale.cta).toMatchObject({ kind: "OPEN_CALL", capability: "canAddCall", tabKey: "calls" });
  });

  it("does NOT fire below the threshold", () => {
    const r = computeCockpit(baseBundle({ updatedAt: daysAgo(4) }), NOW);
    expect(types(r)).not.toContain("LEAD_STALE");
  });

  it("suppressed when a future touch is scheduled", () => {
    const r = computeCockpit(
      baseBundle({
        updatedAt: daysAgo(10),
        callReminders: [{ time: new Date(NOW.getTime() + 3600_000), status: "IN_PROGRESS" }],
      }),
      NOW,
    );
    expect(types(r)).not.toContain("LEAD_STALE");
  });

  it("skipped when the bundle carries no updatedAt (legacy callers)", () => {
    const r = computeCockpit(baseBundle({ updatedAt: undefined }), NOW);
    expect(types(r)).not.toContain("LEAD_STALE");
  });

  it("suppressed on closed-won (funnel rules off)", () => {
    const r = computeCockpit(baseBundle({ status: "FINALIZED", updatedAt: daysAgo(30) }), NOW);
    expect(types(r)).not.toContain("LEAD_STALE");
  });

  it("still emits NO_UPCOMING_TOUCH alongside (both dimensions kept)", () => {
    const r = computeCockpit(baseBundle({ updatedAt: daysAgo(6) }), NOW);
    expect(types(r)).toEqual(expect.arrayContaining(["NO_UPCOMING_TOUCH", "LEAD_STALE"]));
  });
});
```

Also add `STALE_LEAD_DAYS` to the import from `../lead.cockpit.js` at the top of the test file and assert once: `expect(STALE_LEAD_DAYS).toBe(5);` (put it inside the first `it`).

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- lead.cockpit.test`
Expected: FAIL — `LEAD_STALE` not found / `STALE_LEAD_DAYS` not exported.

- [ ] **Step 3: Implement**

In `lead.cockpit.js`, near the other tunables (after `SEVERITY_RANK`):

```js
// My Day staleness threshold (spec §5.3/§6): an ACTIVE deal with no future touch and no
// activity for this many days is "dying silently". Single source — the my-day team-lens
// SQL imports this so both lenses breach at the same moment.
export const STALE_LEAD_DAYS = 5;
```

Inside `computeSalesActions`, immediately AFTER rule 7 (`NO_UPCOMING_TOUCH`) and BEFORE the `hasBlocking` line:

```js
    // 7b. LEAD_STALE (warning) — active deal, nothing scheduled, and no activity for
    // STALE_LEAD_DAYS+. Complements NO_UPCOMING_TOUCH with the AGE dimension (My Day
    // ranks on it). Skipped when the bundle has no `updatedAt` (older callers) so
    // legacy bundles stay signal-identical.
    if (
      bundle.updatedAt != null &&
      !hasFutureCall &&
      !hasFutureMeeting &&
      ACTIVE_STATUSES.includes(status)
    ) {
      const daysSinceActivity = daysBetween(toDate(bundle.updatedAt), now);
      if (daysSinceActivity >= STALE_LEAD_DAYS) {
        actions.push(
          action(
            "LEAD_STALE",
            "warning",
            { daysSinceActivity },
            { kind: "OPEN_CALL", capability: "canAddCall", tabKey: "calls" },
          ),
        );
      }
    }
```

(`hasFutureCall`/`hasFutureMeeting` are already in scope from rule 7.)

In `lead.repo.js`, add to `COCKPIT_BUNDLE_SELECT` (after `paymentStatus: true,`):

```js
  updatedAt: true, // LEAD_STALE age input (7b) — safe scalar, no free text
```

- [ ] **Step 4: Run the full lead cockpit test set**

Run: `npm test -- lead.cockpit`
Expected: ALL PASS (new + existing; existing bundles have no `updatedAt` → rule silent; the per-lead cockpit strip now legitimately emits LEAD_STALE for live stale leads — intentional per spec §5.3).

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/leads/lead/lead.cockpit.js server/src/modules/leads/lead/lead.repo.js server/src/modules/leads/lead/__tests__/lead.cockpit.test.js
git commit -m "feat(leads/cockpit): LEAD_STALE rule + updatedAt in the cockpit bundle"
```

---

### Task 3: Deadline rules in the work-stage engine

**Files:**
- Modify: `server/src/modules/leads/lead/lead.workstage-cockpit.js`
- Test: `server/src/modules/leads/lead/__tests__/lead.workstage-cockpit.test.js` (append)

**Interfaces:**
- Produces: `export const DELIVERY_SOON_HOURS = 48;`, `export const PROJECT_TYPE_TO_LEVEL` (currently module-local — add `export`), and `computeWorkStageActions({ assignments }, now)` where each assignment MAY carry `deliveryAt: Date|string|null`. Emits exactly ONE signal per active assignment, by precedence: `DELIVERY_OVERDUE` (critical, `params: { projectType, level, deliveryAt, overdueDays }`) → `STAGE_DUE_SOON` (warning, `params: { projectType, level, deliveryAt, hoursLeft }`) → `WORK_STAGE_ASSIGNED_TO_YOU` (warning, unchanged). All CTAs stay `{ kind: "GOTO_WORKSTAGE", capability: null, tabKey: null }`.
- Back-compat: the existing `workStageActionsForLead` adapter passes no `deliveryAt` → new rules never fire on the lead-detail surface.

- [ ] **Step 1: Write the failing tests**

Append to `lead.workstage-cockpit.test.js` (reuses its `NOW`):

```js
describe("computeWorkStageActions — deadline rules (My Day)", () => {
  const hoursFromNow = (h) => new Date(NOW.getTime() + h * 3600_000);
  const base = {
    projectType: "3D_Designer",
    contractLevel: "LEVEL_3",
    projectStatus: "IN_PROGRESS",
    stageStatus: "IN_PROGRESS",
  };

  it("DELIVERY_OVERDUE (critical) when the deadline passed", () => {
    const r = computeWorkStageActions(
      { assignments: [{ ...base, deliveryAt: hoursFromNow(-72) }] },
      NOW,
    );
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({
      type: "DELIVERY_OVERDUE",
      severity: "critical",
      params: { projectType: "3D_Designer", level: "LEVEL_3", overdueDays: 3 },
    });
    expect(r[0].params.deliveryAt).toBe(hoursFromNow(-72).toISOString());
  });

  it("STAGE_DUE_SOON (warning) inside the 48h window", () => {
    const r = computeWorkStageActions(
      { assignments: [{ ...base, deliveryAt: hoursFromNow(24) }] },
      NOW,
    );
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({
      type: "STAGE_DUE_SOON",
      severity: "warning",
      params: { projectType: "3D_Designer", level: "LEVEL_3", hoursLeft: 24 },
    });
  });

  it("falls back to WORK_STAGE_ASSIGNED_TO_YOU beyond the window", () => {
    const r = computeWorkStageActions(
      { assignments: [{ ...base, deliveryAt: hoursFromNow(49) }] },
      NOW,
    );
    expect(r).toHaveLength(1);
    expect(r[0].type).toBe("WORK_STAGE_ASSIGNED_TO_YOU");
  });

  it("no deliveryAt → unchanged legacy behavior (one ASSIGNED signal)", () => {
    const r = computeWorkStageActions({ assignments: [{ ...base }] }, NOW);
    expect(r).toHaveLength(1);
    expect(r[0].type).toBe("WORK_STAGE_ASSIGNED_TO_YOU");
  });

  it("completed assignments stay silent even when overdue", () => {
    const r = computeWorkStageActions(
      { assignments: [{ ...base, projectStatus: "COMPLETED", stageStatus: "COMPLETED", deliveryAt: hoursFromNow(-72) }] },
      NOW,
    );
    expect(r).toEqual([]);
  });
});
```

Add `DELIVERY_SOON_HOURS, PROJECT_TYPE_TO_LEVEL` to the test file's import and assert in the first `it`: `expect(DELIVERY_SOON_HOURS).toBe(48); expect(PROJECT_TYPE_TO_LEVEL["3D_Designer"]).toBe("LEVEL_3");`

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- lead.workstage-cockpit`
Expected: FAIL — new types/exports missing.

- [ ] **Step 3: Implement**

In `lead.workstage-cockpit.js`: change `const PROJECT_TYPE_TO_LEVEL = {` to `export const PROJECT_TYPE_TO_LEVEL = {`, add near the top:

```js
// My Day deadline window (spec §5.3/§6): a stage due within this many hours is "due soon".
// Single source — the my-day team-lens SQL imports this so both lenses agree.
export const DELIVERY_SOON_HOURS = 48;

const MS_PER_HOUR = 3600_000;
const MS_PER_DAY = 24 * MS_PER_HOUR;
```

Replace the body of `computeWorkStageActions` (keep the `TypeError` guard verbatim):

```js
export function computeWorkStageActions({ assignments } = {}, now) {
  if (!(now instanceof Date)) {
    throw new TypeError("computeWorkStageActions: `now` (a Date) is required — inject the clock for determinism.");
  }
  const cta = { kind: "GOTO_WORKSTAGE", capability: null, tabKey: null };
  return arr(assignments)
    .filter((a) => a && (a.projectStatus === "IN_PROGRESS" || a.stageStatus === "IN_PROGRESS"))
    .map((a) => {
      const deliveryAt = a.deliveryAt ? new Date(a.deliveryAt) : null;
      const baseParams = { projectType: a.projectType, level: a.contractLevel };
      // ONE signal per assignment, most-severe-first precedence.
      if (deliveryAt && deliveryAt.getTime() < now.getTime()) {
        return {
          type: "DELIVERY_OVERDUE",
          severity: "critical",
          params: { ...baseParams, deliveryAt: deliveryAt.toISOString(), overdueDays: Math.floor((now.getTime() - deliveryAt.getTime()) / MS_PER_DAY) },
          cta,
        };
      }
      if (deliveryAt && deliveryAt.getTime() - now.getTime() <= DELIVERY_SOON_HOURS * MS_PER_HOUR) {
        return {
          type: "STAGE_DUE_SOON",
          severity: "warning",
          params: { ...baseParams, deliveryAt: deliveryAt.toISOString(), hoursLeft: Math.ceil((deliveryAt.getTime() - now.getTime()) / MS_PER_HOUR) },
          cta,
        };
      }
      return { type: "WORK_STAGE_ASSIGNED_TO_YOU", severity: "warning", params: baseParams, cta };
    });
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- lead.workstage-cockpit`
Expected: ALL PASS (new + existing adapter tests).

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/leads/lead/lead.workstage-cockpit.js server/src/modules/leads/lead/__tests__/lead.workstage-cockpit.test.js
git commit -m "feat(leads/workstage): DELIVERY_OVERDUE + STAGE_DUE_SOON deadline rules"
```

---

### Task 4: Batch cockpit-bundle fetch in the lead repo

**Files:**
- Modify: `server/src/modules/leads/lead/lead.repo.js` (new methods next to `findCockpitBundle`, ~line 191; new exported const next to `COCKPIT_BUNDLE_SELECT`)
- Modify: `server/src/modules/leads/lead/lead.cockpit.usecase.js` (export `normalizeBundle`)
- Test: `server/src/modules/leads/lead/__tests__/lead.repo.cockpit-batch.test.js` (create)

**Interfaces:**
- Produces on `LeadRepository`:
  - `async findCockpitBundlesForUser({ userId, take = 50 })` → array of cockpit bundles, each additionally carrying `updatedAt`, `client: { name }`, VERSA already reduced (same as `findCockpitBundle`).
  - `countMyDayLeads({ userId })` → number (for `truncated`).
- Produces: `export const MY_DAY_LEAD_STATUSES = [...]` from `lead.repo.js`; `export function normalizeBundle(bundle)` from `lead.cockpit.usecase.js` (currently module-local — add `export`).
- Consumed by Task 6's usecase.

- [ ] **Step 1: Write the failing test**

Create `server/src/modules/leads/lead/__tests__/lead.repo.cockpit-batch.test.js` (mirrors the repo-test mocking pattern from `command-center.repo.test.js`):

```js
// Query-shape tests for the My Day batch cockpit fetch: caller-scoped (userId), status
// allow-list, oldest-touched-first cap, and the same free-text reduction as the single
// findCockpitBundle. Prisma mocked — no DB.
import { describe, it, expect, beforeEach, vi } from "vitest";

const findMany = vi.fn().mockResolvedValue([]);
const count = vi.fn().mockResolvedValue(0);

vi.mock("@dms/db", () => ({
  default: {
    clientLead: { findMany, count },
  },
}));

let leadRepository;
let MY_DAY_LEAD_STATUSES;

beforeEach(async () => {
  vi.clearAllMocks();
  ({ leadRepository, MY_DAY_LEAD_STATUSES } = await import("../lead.repo.js"));
});

describe("findCockpitBundlesForUser", () => {
  it("scopes to the target user, allow-listed statuses, oldest-updated first, capped", async () => {
    await leadRepository.findCockpitBundlesForUser({ userId: 7, take: 50 });
    expect(findMany).toHaveBeenCalledTimes(1);
    const args = findMany.mock.calls[0][0];
    expect(args.where).toEqual({ userId: 7, status: { in: MY_DAY_LEAD_STATUSES } });
    expect(args.orderBy).toEqual({ updatedAt: "asc" });
    expect(args.take).toBe(50);
    // Batch select = the cockpit select + display name (client.name) + updatedAt.
    expect(args.select.updatedAt).toBe(true);
    expect(args.select.client).toEqual({ select: { name: true } });
    expect(args.select.versaModel).toBeTruthy(); // same signal inputs as the single fetch
  });

  it("reduces VERSA free-text to presence booleans (never leaks question text)", async () => {
    findMany.mockResolvedValueOnce([
      {
        id: 5,
        versaModel: [{ v: { question: "secret?", answer: null, clientResponse: "yes" }, e: null, r: null, s: null, a: null }],
      },
    ]);
    const rows = await leadRepository.findCockpitBundlesForUser({ userId: 7 });
    expect(rows[0].versaModel[0].v).toEqual({ hasQuestion: true, hasResponse: true });
    expect(JSON.stringify(rows)).not.toContain("secret?");
  });

  it("MY_DAY_LEAD_STATUSES excludes dead + parked statuses", () => {
    expect(MY_DAY_LEAD_STATUSES).toEqual(
      expect.arrayContaining(["NEW", "IN_PROGRESS", "INTERESTED", "NEEDS_IDENTIFIED", "NEGOTIATING", "FINALIZED", "CONVERTED"]),
    );
    expect(MY_DAY_LEAD_STATUSES).not.toContain("REJECTED");
    expect(MY_DAY_LEAD_STATUSES).not.toContain("ARCHIVED");
    expect(MY_DAY_LEAD_STATUSES).not.toContain("ON_HOLD");
  });

  it("countMyDayLeads counts the same scope", async () => {
    await leadRepository.countMyDayLeads({ userId: 7 });
    expect(count).toHaveBeenCalledWith({
      where: { userId: 7, status: { in: MY_DAY_LEAD_STATUSES } },
    });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- lead.repo.cockpit-batch`
Expected: FAIL — methods/const not defined.

- [ ] **Step 3: Implement**

In `lead.repo.js`, next to `COCKPIT_BUNDLE_SELECT` (~line 991) add:

```js
// My Day personal-queue statuses (spec §5.2): the active pipeline + closed-won (contract
// signals survive into FINALIZED/CONVERTED). Dead (REJECTED/ARCHIVED — action-silent in
// the engine anyway) and parked (ON_HOLD/LEADEXCHANGE) are excluded.
export const MY_DAY_LEAD_STATUSES = Object.freeze([
  "NEW",
  "IN_PROGRESS",
  "INTERESTED",
  "NEEDS_IDENTIFIED",
  "NEGOTIATING",
  "FINALIZED",
  "CONVERTED",
]);
```

In the `LeadRepository` class, right after `findCockpitBundle` (~line 198):

```js
  // My Day batch variant of findCockpitBundle: the caller's OWN leads (personal-queue
  // scope — ClientLead.userId), oldest-touched first so the most-at-risk survive the cap.
  // Same select + the two display/rank fields (client.name, updatedAt); same VERSA
  // free-text reduction — nothing leaves this repo that the single fetch wouldn't emit.
  async findCockpitBundlesForUser({ userId, take = 50 }) {
    const rows = await prisma.clientLead.findMany({
      where: { userId: Number(userId), status: { in: [...MY_DAY_LEAD_STATUSES] } },
      orderBy: { updatedAt: "asc" },
      take,
      select: { ...COCKPIT_BUNDLE_SELECT, client: { select: { name: true } } },
    });
    return rows.map((b) => ({ ...b, versaModel: (b.versaModel ?? []).map(reduceVersaModel) }));
  }

  countMyDayLeads({ userId }) {
    return prisma.clientLead.count({
      where: { userId: Number(userId), status: { in: [...MY_DAY_LEAD_STATUSES] } },
    });
  }
```

NOTE: `COCKPIT_BUNDLE_SELECT` is declared AFTER the class in the file — that's fine (const hoisting via TDZ only matters at call time, and these methods run long after module init; `findCockpitBundle` already relies on this).

In `lead.cockpit.usecase.js` change `function normalizeBundle(bundle) {` to `export function normalizeBundle(bundle) {`.

Then run the mock-shape check: the test's `where` assertion uses `MY_DAY_LEAD_STATUSES` (the frozen array). `status: { in: [...MY_DAY_LEAD_STATUSES] }` spreads a copy — `toEqual` compares by value, so it matches.

- [ ] **Step 4: Run to verify pass + no regressions**

Run: `npm test -- lead.repo.cockpit-batch && npm test -- lead.cockpit`
Expected: ALL PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/leads/lead/lead.repo.js server/src/modules/leads/lead/lead.cockpit.usecase.js server/src/modules/leads/lead/__tests__/lead.repo.cockpit-batch.test.js
git commit -m "feat(leads/repo): batch cockpit bundles + MY_DAY_LEAD_STATUSES for the My Day queue"
```

---

### Task 5: `my-day` repository (designer queue inputs + team aggregates + scope lookup)

**Files:**
- Create: `server/src/modules/my-day/my-day.repo.js`
- Test: `server/src/modules/my-day/__tests__/my-day.repo.test.js`

**Interfaces:**
- Consumes: `ACTIVE_DEAL_STATUSES`, `ACTIVE_LEAD_STATUSES`, `DESIGNER_ROLES`, `INACTIVE_PROJECT_STATUSES` from `../command-center/command-center.repo.js`; `STALE_LEAD_DAYS` from `../leads/lead/lead.cockpit.js`; `DELIVERY_SOON_HOURS` from `../leads/lead/lead.workstage-cockpit.js`.
- Produces `myDayRepository` (singleton) with:
  - `findDesignerAssignments({ userId })` → rows `{ project: { id, type, status, deliveryTime, clientLeadId, clientLead: { id, client: { name } }, contractStages: [{ stageStatus, deliverySchedule: { deliveryAt } | null }] } }`
  - `findUserForScope({ userId })` → `{ id, name, isActive, role, profile, currentProfile: { key } | null }`
  - Team aggregates (all take `now: Date`): `staleLeadsByRep(now)`, `unclaimedAgingCount(now)`, `overdueCallsByRep(now)`, `signingStalled(now)`, `deliveriesAtRisk(now)`, `salesLoad()`, `designerLoad()`, `findUserNames(ids)`
- Produces: `export const UNCLAIMED_NEW_DAYS = 2;` `export const UNSIGNED_CONTRACT_DAYS = 3;`

- [ ] **Step 1: Write the failing test**

Create `server/src/modules/my-day/__tests__/my-day.repo.test.js`:

```js
// Query-shape tests for the my-day repo: threshold cutoffs derive from the SAME constants
// the pure rules use (single-source), relation filters exclude on-track work, and every
// projection is a safe field set (ids/names/counts — no PII beyond existing screens).
// Prisma mocked — no DB.
import { describe, it, expect, beforeEach, vi } from "vitest";

const leadGroupBy = vi.fn().mockResolvedValue([]);
const leadCount = vi.fn().mockResolvedValue(0);
const callGroupBy = vi.fn().mockResolvedValue([]);
const contractFindMany = vi.fn().mockResolvedValue([]);
const deliveryFindMany = vi.fn().mockResolvedValue([]);
const assignmentFindMany = vi.fn().mockResolvedValue([]);
const userFindUnique = vi.fn().mockResolvedValue(null);
const userFindMany = vi.fn().mockResolvedValue([]);
const projectCount = vi.fn().mockResolvedValue(0);

vi.mock("@dms/db", () => ({
  default: {
    clientLead: { groupBy: leadGroupBy, count: leadCount },
    callReminder: { groupBy: callGroupBy },
    contract: { findMany: contractFindMany },
    deliverySchedule: { findMany: deliveryFindMany },
    assignment: { findMany: assignmentFindMany },
    user: { findUnique: userFindUnique, findMany: userFindMany },
    project: { count: projectCount },
  },
}));

const NOW = new Date("2026-07-12T12:00:00.000Z");
const DAY = 24 * 3600_000;

let myDayRepository;
let UNCLAIMED_NEW_DAYS;
let UNSIGNED_CONTRACT_DAYS;
let STALE_LEAD_DAYS;
let DELIVERY_SOON_HOURS;

beforeEach(async () => {
  vi.clearAllMocks();
  ({ myDayRepository, UNCLAIMED_NEW_DAYS, UNSIGNED_CONTRACT_DAYS } = await import("../my-day.repo.js"));
  ({ STALE_LEAD_DAYS } = await import("../../leads/lead/lead.cockpit.js"));
  ({ DELIVERY_SOON_HOURS } = await import("../../leads/lead/lead.workstage-cockpit.js"));
});

describe("team aggregates — cutoffs from the shared thresholds", () => {
  it("staleLeadsByRep: active statuses, updatedAt older than STALE_LEAD_DAYS, no future touch", async () => {
    await myDayRepository.staleLeadsByRep(NOW);
    const args = leadGroupBy.mock.calls[0][0];
    expect(args.by).toEqual(["userId"]);
    expect(args.where.userId).toEqual({ not: null });
    expect(args.where.updatedAt).toEqual({ lt: new Date(NOW.getTime() - STALE_LEAD_DAYS * DAY) });
    expect(args.where.callReminders).toEqual({ none: { status: "IN_PROGRESS", time: { gte: NOW } } });
    expect(args.where.meetingReminders).toEqual({ none: { status: "IN_PROGRESS", time: { gte: NOW } } });
  });

  it("unclaimedAgingCount: unassigned NEW leads older than UNCLAIMED_NEW_DAYS", async () => {
    await myDayRepository.unclaimedAgingCount(NOW);
    expect(leadCount).toHaveBeenCalledWith({
      where: { userId: null, status: "NEW", createdAt: { lt: new Date(NOW.getTime() - UNCLAIMED_NEW_DAYS * DAY) } },
    });
  });

  it("overdueCallsByRep: active reminders in the past, grouped by user", async () => {
    await myDayRepository.overdueCallsByRep(NOW);
    const args = callGroupBy.mock.calls[0][0];
    expect(args.by).toEqual(["userId"]);
    expect(args.where).toEqual({ status: "IN_PROGRESS", time: { lt: NOW } });
  });

  it("signingStalled: SIGNING contracts older than UNSIGNED_CONTRACT_DAYS (createdAt approximation)", async () => {
    await myDayRepository.signingStalled(NOW);
    const args = contractFindMany.mock.calls[0][0];
    expect(args.where).toEqual({
      sessionStatus: "SIGNING",
      createdAt: { lt: new Date(NOW.getTime() - UNSIGNED_CONTRACT_DAYS * DAY) },
    });
    expect(args.select.clientLead.select.client).toEqual({ select: { name: true } });
  });

  it("deliveriesAtRisk: everything due before now + DELIVERY_SOON_HOURS with a non-complete stage", async () => {
    await myDayRepository.deliveriesAtRisk(NOW);
    const args = deliveryFindMany.mock.calls[0][0];
    expect(args.where).toEqual({
      deliveryAt: { lt: new Date(NOW.getTime() + DELIVERY_SOON_HOURS * 3600_000) },
      stage: { stageStatus: { not: "COMPLETED" } },
    });
    expect(args.orderBy).toEqual({ deliveryAt: "asc" });
  });
});

describe("designer queue inputs + scope lookup", () => {
  it("findDesignerAssignments: caller-scoped, active projects only, deadline fields selected", async () => {
    await myDayRepository.findDesignerAssignments({ userId: 42 });
    const args = assignmentFindMany.mock.calls[0][0];
    expect(args.where.userId).toBe(42);
    expect(args.where.project.status).toEqual({ notIn: expect.arrayContaining(["Completed"]) });
    const proj = args.select.project.select;
    expect(proj.deliveryTime).toBe(true);
    expect(proj.contractStages.select.deliverySchedule).toEqual({ select: { deliveryAt: true } });
    expect(proj.clientLead.select.client).toEqual({ select: { name: true } });
  });

  it("findUserForScope: safe projection incl. the active profile key", async () => {
    await myDayRepository.findUserForScope({ userId: 9 });
    expect(userFindUnique).toHaveBeenCalledWith({
      where: { id: 9 },
      select: {
        id: true,
        name: true,
        isActive: true,
        role: true,
        profile: true,
        currentProfile: { select: { key: true } },
      },
    });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- my-day.repo`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `my-day.repo.js`**

```js
// my-day repository — Prisma I/O ONLY (no business rules, no AppError). Two surfaces:
//   1. Personal-queue inputs: the caller's OWN designer assignments (the sales queue
//      reuses leadRepository.findCockpitBundlesForUser — not duplicated here).
//   2. Team-lens aggregates: indexed exception counts/groupBys (command-center style).
//
// THRESHOLD SINGLE-SOURCE (spec §6): the stale/delivery cutoffs IMPORT the constants the
// pure rules use, so the team lens and the personal queue breach at the same moment.
// UNCLAIMED_NEW_DAYS / UNSIGNED_CONTRACT_DAYS are team-lens-only and live here.
//
// 🔒 MONEY BOUNDARY (spec §5.4): like command-center, this repo NEVER touches Payment /
// ContractPayment / Outcome. Contract rows are read for sessionStatus only.
import prisma from "../../infra/prisma/prisma.js";
import { INACTIVE_PROJECT_STATUSES, ACTIVE_DEAL_STATUSES, ACTIVE_LEAD_STATUSES, DESIGNER_ROLES } from "../command-center/command-center.repo.js";
import { STALE_LEAD_DAYS } from "../leads/lead/lead.cockpit.js";
import { DELIVERY_SOON_HOURS } from "../leads/lead/lead.workstage-cockpit.js";

// Team-lens-only thresholds (spec §6).
export const UNCLAIMED_NEW_DAYS = 2;
export const UNSIGNED_CONTRACT_DAYS = 3;

const MS_PER_HOUR = 3600_000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

class MyDayRepository {
  // ── personal queue (designer tier) ─────────────────────────────────────────────────
  // The caller's own assignments on active projects, with everything the deadline rules
  // read: per-stage DeliverySchedule.deliveryAt (primary) and Project.deliveryTime
  // (fallback). Safe projection: no free text beyond the client display name.
  findDesignerAssignments({ userId }) {
    return prisma.assignment.findMany({
      where: {
        userId: Number(userId),
        project: { status: { notIn: [...INACTIVE_PROJECT_STATUSES] } },
      },
      select: {
        project: {
          select: {
            id: true,
            type: true,
            status: true,
            deliveryTime: true,
            clientLeadId: true,
            clientLead: { select: { id: true, client: { select: { name: true } } } },
            contractStages: {
              select: {
                stageStatus: true,
                deliverySchedule: { select: { deliveryAt: true } },
              },
            },
          },
        },
      },
    });
  }

  // ── drill-down scope lookup ────────────────────────────────────────────────────────
  // Target user's active profile for the supervisor scope check. Reads currentProfile.key
  // (DB-relational truth) + the transitional `profile` column — NEVER the legacy flags.
  findUserForScope({ userId }) {
    return prisma.user.findUnique({
      where: { id: Number(userId) },
      select: {
        id: true,
        name: true,
        isActive: true,
        role: true,
        profile: true,
        currentProfile: { select: { key: true } },
      },
    });
  }

  findUserNames(ids) {
    if (!ids.length) return Promise.resolve([]);
    return prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });
  }

  // ── team lens: sales domain ────────────────────────────────────────────────────────
  // Stale leads per rep — the SQL approximation of the LEAD_STALE rule (documented,
  // spec §5.4): active status, no activity since the cutoff, nothing scheduled.
  staleLeadsByRep(now) {
    const cutoff = new Date(now.getTime() - STALE_LEAD_DAYS * MS_PER_DAY);
    return prisma.clientLead.groupBy({
      by: ["userId"],
      _count: { _all: true },
      where: {
        userId: { not: null },
        status: { in: [...ACTIVE_DEAL_STATUSES] },
        updatedAt: { lt: cutoff },
        callReminders: { none: { status: "IN_PROGRESS", time: { gte: now } } },
        meetingReminders: { none: { status: "IN_PROGRESS", time: { gte: now } } },
      },
    });
  }

  unclaimedAgingCount(now) {
    const cutoff = new Date(now.getTime() - UNCLAIMED_NEW_DAYS * MS_PER_DAY);
    return prisma.clientLead.count({
      where: { userId: null, status: "NEW", createdAt: { lt: cutoff } },
    });
  }

  overdueCallsByRep(now) {
    return prisma.callReminder.groupBy({
      by: ["userId"],
      _count: { _all: true },
      where: { status: "IN_PROGRESS", time: { lt: now } },
    });
  }

  // Contract has NO updatedAt column — createdAt is the documented approximation for
  // "sitting in SIGNING too long" (a contract created N+ days ago and still unsigned).
  signingStalled(now, take = 20) {
    const cutoff = new Date(now.getTime() - UNSIGNED_CONTRACT_DAYS * MS_PER_DAY);
    return prisma.contract.findMany({
      where: { sessionStatus: "SIGNING", createdAt: { lt: cutoff } },
      select: {
        id: true,
        clientLeadId: true,
        createdAt: true,
        clientLead: { select: { userId: true, client: { select: { name: true } } } },
      },
      orderBy: { createdAt: "asc" },
      take,
    });
  }

  // Sales load: active leads per owner + the cap (mirrors command-center.salesLoad — the
  // people cards need the same shape plus per-rep exception counts merged in the usecase).
  async salesLoad() {
    const grouped = await prisma.clientLead.groupBy({
      by: ["userId"],
      _count: { _all: true },
      where: { userId: { not: null }, status: { in: [...ACTIVE_LEAD_STATUSES] } },
    });
    const userIds = grouped.map((g) => g.userId).filter((id) => id != null);
    const users = userIds.length
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, maxLeadsCounts: true },
        })
      : [];
    const usersById = new Map(users.map((u) => [u.id, u]));
    return grouped
      .filter((g) => usersById.has(g.userId))
      .map((g) => {
        const u = usersById.get(g.userId);
        return { userId: u.id, name: u.name, activeLeads: g._count._all, maxLeads: u.maxLeadsCounts ?? null };
      })
      .sort((a, b) => b.activeLeads - a.activeLeads);
  }

  // ── team lens: designers domain ────────────────────────────────────────────────────
  // Every delivery breaching within the window (or already overdue) with a live stage;
  // the usecase splits overdue vs due-soon and attributes designers via assignments.
  deliveriesAtRisk(now, take = 30) {
    const soonCutoff = new Date(now.getTime() + DELIVERY_SOON_HOURS * MS_PER_HOUR);
    return prisma.deliverySchedule.findMany({
      where: {
        deliveryAt: { lt: soonCutoff },
        stage: { stageStatus: { not: "COMPLETED" } },
      },
      select: {
        id: true,
        deliveryAt: true,
        project: {
          select: {
            id: true,
            type: true,
            clientLeadId: true,
            assignments: { select: { user: { select: { id: true, name: true } } } },
          },
        },
      },
      orderBy: { deliveryAt: "asc" },
      take,
    });
  }

  // Active-stage count per active designer (mirrors command-center.designerLoad).
  async designerLoad() {
    const designers = await prisma.user.findMany({
      where: { role: { in: [...DESIGNER_ROLES] }, isActive: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    });
    const counts = await Promise.all(
      designers.map((d) =>
        prisma.project.count({
          where: {
            assignments: { some: { userId: d.id } },
            status: { notIn: [...INACTIVE_PROJECT_STATUSES] },
          },
        }),
      ),
    );
    return designers.map((d, i) => ({ userId: d.id, name: d.name, role: d.role, activeStages: counts[i] }));
  }
}

export const myDayRepository = new MyDayRepository();
export { MyDayRepository };
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- my-day.repo`
Expected: ALL PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/my-day/my-day.repo.js server/src/modules/my-day/__tests__/my-day.repo.test.js
git commit -m "feat(my-day): repository — designer queue inputs + team-lens aggregates"
```

---

### Task 6: `my-day` usecase + DTO + validation (family dispatch, queues, team overview, scope checker)

**Files:**
- Create: `server/src/modules/my-day/my-day.usecase.js`
- Create: `server/src/modules/my-day/my-day.dto.js`
- Create: `server/src/modules/my-day/my-day.validation.js`
- Test: `server/src/modules/my-day/__tests__/my-day.usecase.test.js`

**Interfaces:**
- Consumes: `myDayRepository` (Task 5), `leadRepository.findCockpitBundlesForUser/countMyDayLeads` + `MY_DAY_LEAD_STATUSES` (Task 4), `computeCockpit` + `STALE_LEAD_DAYS` (Task 2), `normalizeBundle` (Task 4), `computeWorkStageActions` + `PROJECT_TYPE_TO_LEVEL` (Task 3), `AppError`, `myDayMessagesCodes` + `messagesNames` from `@dms/shared` (Task 1).
- Produces `myDayUsecase` (singleton, DI constructor `new MyDayUsecase(myDayRepository, leadRepository)`) with:
  - `async getMyQueue({ authUser, now = new Date() })` → queue DTO
  - `async checkIfUserCanViewMyDayOf({ id, authUser })` → target-user row (THROWS AppError on denial; used by `requireSpecialChecker`)
  - `async getQueueForTarget({ targetUser, now = new Date() })` → queue DTO for the (already scope-checked) target
  - `async getTeamOverview({ authUser, now = new Date() })` → team DTO
- Queue DTO (spec §5.5): `{ profileKey, family, generatedAt, truncated, items: [{ kind, leadId, clientName, status?, projectId?, projectType?, level?, deliveryAt?, sortAt, signals: [...] }] }` sorted most-severe-first then oldest `sortAt`.
- Team DTO: `{ generatedAt, domains: { sales?: { exceptions, people }, designers?: { exceptions, people } } }`.

- [ ] **Step 1: Write the failing tests**

Create `server/src/modules/my-day/__tests__/my-day.usecase.test.js`:

```js
// Usecase tests: profile-family dispatch, engine-over-batch queue assembly, sorting,
// truncation, the supervisor scope checker (super-sales = sales-domain only), and the
// team overview domain gating (designers block is admin-tier only). Repos are DI-stubbed.
import { describe, it, expect, vi } from "vitest";
import { MyDayUsecase } from "../my-day.usecase.js";

const NOW = new Date("2026-07-12T12:00:00.000Z");
const daysAgo = (d) => new Date(NOW.getTime() - d * 24 * 3600_000);

// A lead bundle that yields ONE critical signal (overdue call) + LEAD_STALE (warning).
const staleBundle = (id, name) => ({
  id,
  userId: 7,
  status: "IN_PROGRESS",
  paymentStatus: "PENDING",
  updatedAt: daysAgo(6),
  client: { name },
  contracts: [],
  salesStages: [],
  callReminders: [{ time: daysAgo(1), status: "IN_PROGRESS" }],
  meetingReminders: [],
  priceOffers: [],
  sessionQuestions: [],
  versaModel: [],
});

// A quiet bundle: fresh, has a future touch → zero actions → dropped from the queue.
const quietBundle = (id) => ({
  ...staleBundle(id, "Quiet"),
  updatedAt: daysAgo(0),
  callReminders: [{ time: new Date(NOW.getTime() + 3600_000), status: "IN_PROGRESS" }],
});

function makeLeadRepo(overrides = {}) {
  return {
    findCockpitBundlesForUser: vi.fn().mockResolvedValue([staleBundle(5, "Aisha"), quietBundle(6)]),
    countMyDayLeads: vi.fn().mockResolvedValue(2),
    ...overrides,
  };
}

function makeMyDayRepo(overrides = {}) {
  return {
    findDesignerAssignments: vi.fn().mockResolvedValue([
      {
        project: {
          id: 31,
          type: "3D_Designer",
          status: "In Progress",
          deliveryTime: null,
          clientLeadId: 5,
          clientLead: { id: 5, client: { name: "Aisha" } },
          contractStages: [
            { stageStatus: "IN_PROGRESS", deliverySchedule: { deliveryAt: daysAgo(1) } },
          ],
        },
      },
    ]),
    findUserForScope: vi.fn().mockResolvedValue({
      id: 9, name: "Rep", isActive: true, role: "STAFF", profile: null, currentProfile: { key: "NORMAL_SALES" },
    }),
    findUserNames: vi.fn().mockResolvedValue([{ id: 7, name: "Ahmed" }]),
    staleLeadsByRep: vi.fn().mockResolvedValue([{ userId: 7, _count: { _all: 3 } }]),
    unclaimedAgingCount: vi.fn().mockResolvedValue(2),
    overdueCallsByRep: vi.fn().mockResolvedValue([{ userId: 7, _count: { _all: 4 } }]),
    signingStalled: vi.fn().mockResolvedValue([
      { id: 1, clientLeadId: 5, createdAt: daysAgo(4), clientLead: { userId: 7, client: { name: "Aisha" } } },
    ]),
    deliveriesAtRisk: vi.fn().mockResolvedValue([
      {
        id: 2, deliveryAt: daysAgo(1),
        project: { id: 31, type: "3D_Designer", clientLeadId: 5, assignments: [{ user: { id: 42, name: "Sara" } }] },
      },
    ]),
    salesLoad: vi.fn().mockResolvedValue([{ userId: 7, name: "Ahmed", activeLeads: 12, maxLeads: 10 }]),
    designerLoad: vi.fn().mockResolvedValue([{ userId: 42, name: "Sara", role: "THREE_D_DESIGNER", activeStages: 4 }]),
    ...overrides,
  };
}

const salesUser = { id: 7, currentProfileKey: "NORMAL_SALES", isAdminTier: false, role: "STAFF" };
const designerUser = { id: 42, currentProfileKey: "DESIGNER_3D", isAdminTier: false, role: "THREE_D_DESIGNER" };
const superSales = { id: 8, currentProfileKey: "SUPER_SALES", isAdminTier: true, role: "STAFF" };
const admin = { id: 1, currentProfileKey: "ADMIN", isAdminTier: true, role: "ADMIN" };

const make = (o = {}) => new MyDayUsecase(makeMyDayRepo(o.myDay), makeLeadRepo(o.lead));

describe("getMyQueue — sales family", () => {
  it("runs the engine per bundle, drops zero-action leads, sorts critical-first", async () => {
    const q = await make().getMyQueue({ authUser: salesUser, now: NOW });
    expect(q.family).toBe("SALES");
    expect(q.items).toHaveLength(1); // quiet lead dropped
    expect(q.items[0]).toMatchObject({ kind: "LEAD", leadId: 5, clientName: "Aisha", status: "IN_PROGRESS" });
    expect(q.items[0].signals.map((s) => s.type)).toEqual(
      expect.arrayContaining(["CALL_OVERDUE", "LEAD_STALE"]),
    );
    expect(q.items[0].signals[0].severity).toBe("critical"); // engine sort preserved
    expect(q.truncated).toBe(false);
  });

  it("marks truncated when the cap was hit", async () => {
    const u = make({ lead: makeLeadRepo({ countMyDayLeads: vi.fn().mockResolvedValue(80) }) });
    const q = await u.getMyQueue({ authUser: salesUser, now: NOW });
    expect(q.truncated).toBe(true);
  });

  it("role fallback: un-migrated session (no currentProfileKey) with STAFF role → SALES", async () => {
    const q = await make().getMyQueue({ authUser: { id: 7, role: "STAFF" }, now: NOW });
    expect(q.family).toBe("SALES");
  });
});

describe("getMyQueue — designer family", () => {
  it("maps assignments → deadline engine (earliest live stage delivery wins)", async () => {
    const q = await make().getMyQueue({ authUser: designerUser, now: NOW });
    expect(q.family).toBe("DESIGNER");
    expect(q.items).toHaveLength(1);
    expect(q.items[0]).toMatchObject({
      kind: "WORK_STAGE",
      projectId: 31,
      leadId: 5,
      clientName: "Aisha",
      projectType: "3D_Designer",
      level: "LEVEL_3",
    });
    expect(q.items[0].signals[0].type).toBe("DELIVERY_OVERDUE"); // deliveryAt in the past
  });
});

describe("getMyQueue — unsupported profile", () => {
  it("throws 403 MY_DAY_PROFILE_UNSUPPORTED (defensive; route gate should prevent)", async () => {
    await expect(
      make().getMyQueue({ authUser: { id: 3, currentProfileKey: "ACCOUNTANT", role: "ACCOUNTANT" }, now: NOW }),
    ).rejects.toMatchObject({ statusCode: 403, message: "MY_DAY_PROFILE_UNSUPPORTED" });
  });
});

describe("checkIfUserCanViewMyDayOf — supervisor scope", () => {
  it("admin tier may target anyone (incl. designers)", async () => {
    const u = make({ myDay: makeMyDayRepo({ findUserForScope: vi.fn().mockResolvedValue({ id: 42, name: "Sara", isActive: true, role: "THREE_D_DESIGNER", profile: null, currentProfile: { key: "DESIGNER_3D" } }) }) });
    const target = await u.checkIfUserCanViewMyDayOf({ id: 42, authUser: admin });
    expect(target.id).toBe(42);
  });

  it("super-sales may target sales-tier users", async () => {
    const target = await make().checkIfUserCanViewMyDayOf({ id: 9, authUser: superSales });
    expect(target.id).toBe(9);
  });

  it("super-sales targeting a designer → 403 MY_DAY_TEAM_SCOPE_DENIED", async () => {
    const u = make({ myDay: makeMyDayRepo({ findUserForScope: vi.fn().mockResolvedValue({ id: 42, name: "Sara", isActive: true, role: "THREE_D_DESIGNER", profile: null, currentProfile: { key: "DESIGNER_3D" } }) }) });
    // SUPER_SALES holds the team code but is NOT allowed outside the sales domain even
    // when isAdminTier is true for them in the seed — the check keys on the PROFILE.
    await expect(
      u.checkIfUserCanViewMyDayOf({ id: 42, authUser: { ...superSales, isAdminTier: false } }),
    ).rejects.toMatchObject({ statusCode: 403, message: "MY_DAY_TEAM_SCOPE_DENIED" });
  });

  it("unknown target → 404 MY_DAY_TARGET_NOT_FOUND", async () => {
    const u = make({ myDay: makeMyDayRepo({ findUserForScope: vi.fn().mockResolvedValue(null) }) });
    await expect(u.checkIfUserCanViewMyDayOf({ id: 999, authUser: admin })).rejects.toMatchObject({
      statusCode: 404,
      message: "MY_DAY_TARGET_NOT_FOUND",
    });
  });
});

describe("getQueueForTarget", () => {
  it("computes the SALES queue for a sales target", async () => {
    const target = { id: 9, name: "Rep", role: "STAFF", profile: null, currentProfile: { key: "NORMAL_SALES" } };
    const u = make();
    const q = await u.getQueueForTarget({ targetUser: target, now: NOW });
    expect(q.family).toBe("SALES");
    expect(u.leadRepo.findCockpitBundlesForUser).toHaveBeenCalledWith({ userId: 9, take: 50 });
  });
});

describe("getTeamOverview — domain gating + assembly", () => {
  it("SUPER_SALES (non-admin-tier caller) gets the sales domain ONLY", async () => {
    const t = await make().getTeamOverview({ authUser: { ...superSales, isAdminTier: false }, now: NOW });
    expect(t.domains.sales).toBeTruthy();
    expect(t.domains.designers).toBeUndefined();
  });

  it("admin gets sales + designers; exceptions carry types/severities; people merge counts", async () => {
    const t = await make().getTeamOverview({ authUser: admin, now: NOW });
    expect(t.domains.designers).toBeTruthy();
    const salesTypes = t.domains.sales.exceptions.map((e) => e.type);
    expect(salesTypes).toEqual(
      expect.arrayContaining(["LEAD_STALE_TEAM", "LEAD_UNCLAIMED_AGING", "CALL_OVERDUE_TEAM", "CONTRACT_SIGNING_STALLED", "REP_OVER_CAPACITY"]),
    );
    const ahmed = t.domains.sales.people.find((p) => p.userId === 7);
    expect(ahmed).toMatchObject({ name: "Ahmed", activeCount: 12, staleCount: 3, overdueCount: 4 });
    const designerTypes = t.domains.designers.exceptions.map((e) => e.type);
    expect(designerTypes).toContain("DELIVERY_OVERDUE_TEAM");
    const sara = t.domains.designers.people.find((p) => p.userId === 42);
    expect(sara).toMatchObject({ name: "Sara", activeCount: 4 });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- my-day.usecase`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

**`my-day.validation.js`:**

```js
// my-day Zod schemas. Params only — every endpoint is a read.
import { z } from "zod";

export class MyDayValidation {
  // GET /v2/my-day/users/:userId — drill-down target.
  static userIdParams = z.object({
    userId: z.coerce.number().int().positive(),
  });
}
```

**`my-day.dto.js`:**

```js
// my-day DTOs — pure whitelisted projections (no Prisma, no business rules).
const SEVERITY_RANK = { critical: 0, warning: 1, info: 2 };

function itemRank(item) {
  if (!item.signals.length) return 3;
  return Math.min(...item.signals.map((s) => SEVERITY_RANK[s.severity] ?? 2));
}

export class MyDayDto {
  // Queue items sorted most-severe-first, ties broken oldest sortAt first (spec §5.5).
  static toQueue({ profileKey, family, items, truncated, now }) {
    const sorted = [...items].sort((a, b) => {
      const bySeverity = itemRank(a) - itemRank(b);
      if (bySeverity !== 0) return bySeverity;
      const at = a.sortAt ? new Date(a.sortAt).getTime() : 0;
      const bt = b.sortAt ? new Date(b.sortAt).getTime() : 0;
      return at - bt;
    });
    return {
      profileKey: profileKey ?? null,
      family,
      generatedAt: now.toISOString(),
      truncated: Boolean(truncated),
      items: sorted,
    };
  }

  static toTeam({ domains, now }) {
    return { generatedAt: now.toISOString(), domains };
  }
}
```

**`my-day.usecase.js`:**

```js
// my-day usecase — orchestration only, NO Prisma. Personal queues re-run the SAME pure
// engines the lead detail uses (spec §4: engine-reuse lens); the team lens assembles the
// repo's aggregate exceptions. Profile family comes from authUser.currentProfileKey with
// a role-only fallback for un-migrated sessions — NEVER the legacy isSuperSales/isPrimary
// flags (CLAUDE.md §2.8).
import { AppError } from "../../shared/errors/AppError.js";
import { myDayMessagesCodes as C, messagesNames } from "@dms/shared";
import { myDayRepository } from "./my-day.repo.js";
import { leadRepository } from "../leads/lead/lead.repo.js";
import { computeCockpit } from "../leads/lead/lead.cockpit.js";
import { normalizeBundle } from "../leads/lead/lead.cockpit.usecase.js";
import { computeWorkStageActions, PROJECT_TYPE_TO_LEVEL } from "../leads/lead/lead.workstage-cockpit.js";
import { MyDayDto } from "./my-day.dto.js";

const TK = messagesNames.myDayMessages;

// Queue cap (spec §7): oldest-touched-first, so the most-at-risk leads survive.
export const MY_DAY_QUEUE_CAP = 50;

// Profile → queue family. SUPER_SALES supervises but ALSO works own deals (spec §3).
const SALES_PROFILE_KEYS = ["NORMAL_SALES", "PRIMARY_SALES", "SUPER_SALES", "SUPER_SALES_BASE"];
const DESIGNER_PROFILE_KEYS = ["DESIGNER_3D", "DESIGNER_2D", "EXECUTOR_2D"];
// Role fallback for sessions minted before the profile backfill (transitional).
const ROLE_TO_FAMILY = {
  STAFF: "SALES",
  SUPER_SALES: "SALES",
  THREE_D_DESIGNER: "DESIGNER",
  TWO_D_DESIGNER: "DESIGNER",
  TWO_D_EXECUTOR: "DESIGNER",
};

function familyOf({ profileKey, role }) {
  if (SALES_PROFILE_KEYS.includes(profileKey)) return "SALES";
  if (DESIGNER_PROFILE_KEYS.includes(profileKey)) return "DESIGNER";
  return ROLE_TO_FAMILY[role] ?? null;
}

// Target user's active profile key WITHOUT reading the legacy flags: the relational
// currentProfile first, the transitional `profile` column second, role-only last
// (role STAFF can't distinguish sales tiers — but the FAMILY is all the scope needs).
function targetProfileKey(user) {
  return user?.currentProfile?.key ?? user?.profile ?? null;
}

function targetFamily(user) {
  const key = targetProfileKey(user);
  return familyOf({ profileKey: key, role: user?.role });
}

export class MyDayUsecase {
  /**
   * @param {typeof import("./my-day.repo.js").myDayRepository} repository
   * @param {import("../leads/lead/lead.repo.js").LeadRepository} leadRepo
   */
  constructor(repository, leadRepo) {
    this.repo = repository;
    this.leadRepo = leadRepo;
  }

  // ── personal queue ─────────────────────────────────────────────────────────────────

  async getMyQueue({ authUser, now = new Date() }) {
    return this.#queueFor({
      userId: authUser.id,
      profileKey: authUser?.currentProfileKey ?? null,
      family: familyOf({ profileKey: authUser?.currentProfileKey, role: authUser?.role ?? authUser?.activeRole }),
      now,
    });
  }

  // Drill-down: target already scope-checked by checkIfUserCanViewMyDayOf (req.scoped).
  async getQueueForTarget({ targetUser, now = new Date() }) {
    return this.#queueFor({
      userId: targetUser.id,
      profileKey: targetProfileKey(targetUser),
      family: targetFamily(targetUser),
      now,
    });
  }

  async #queueFor({ userId, profileKey, family, now }) {
    if (family === "SALES") {
      const [bundles, total] = await Promise.all([
        this.leadRepo.findCockpitBundlesForUser({ userId, take: MY_DAY_QUEUE_CAP }),
        this.leadRepo.countMyDayLeads({ userId }),
      ]);
      const items = bundles
        .map((b) => {
          const { actions } = computeCockpit(normalizeBundle(b), now, { profileKey });
          return {
            kind: "LEAD",
            leadId: b.id,
            clientName: b.client?.name ?? null,
            status: b.status,
            sortAt: b.updatedAt ?? null,
            signals: actions,
          };
        })
        .filter((i) => i.signals.length > 0);
      return MyDayDto.toQueue({ profileKey, family, items, truncated: total > bundles.length, now });
    }

    if (family === "DESIGNER") {
      const rows = await this.repo.findDesignerAssignments({ userId });
      const seen = new Set();
      const items = [];
      for (const row of rows) {
        const p = row.project;
        if (!p || seen.has(p.id)) continue;
        seen.add(p.id);
        const deliveryAt = resolveDeliveryAt(p);
        const signals = computeWorkStageActions(
          {
            assignments: [
              {
                projectType: p.type,
                contractLevel: PROJECT_TYPE_TO_LEVEL[p.type] ?? null,
                projectStatus: "IN_PROGRESS", // repo already filtered to active projects
                stageStatus: "IN_PROGRESS",
                deliveryAt,
              },
            ],
          },
          now,
        );
        if (!signals.length) continue;
        items.push({
          kind: "WORK_STAGE",
          projectId: p.id,
          leadId: p.clientLeadId,
          clientName: p.clientLead?.client?.name ?? null,
          projectType: p.type,
          level: PROJECT_TYPE_TO_LEVEL[p.type] ?? null,
          deliveryAt: deliveryAt ? new Date(deliveryAt).toISOString() : null,
          sortAt: deliveryAt ?? null,
          signals,
        });
      }
      return MyDayDto.toQueue({ profileKey, family, items, truncated: false, now });
    }

    // Admins/accountants/contact-initiators have no personal queue (spec §3).
    throw new AppError(C.MY_DAY_PROFILE_UNSUPPORTED, 403, null, {
      translationKey: TK,
      reason: `no My Day queue family for profile "${profileKey}" / role fallback`,
    });
  }

  // ── supervisor scope checker (requireSpecialChecker contract: THROW on denial) ──────
  // ADMIN/SUPER_ADMIN target anyone; SUPER_SALES targets sales-tier users only (spec §5.1).
  async checkIfUserCanViewMyDayOf({ id, authUser }) {
    const target = await this.repo.findUserForScope({ userId: Number(id) });
    if (!target) throw new AppError(C.MY_DAY_TARGET_NOT_FOUND, 404, null, { translationKey: TK });

    const callerProfile = authUser?.currentProfileKey;
    const callerIsAdmin =
      callerProfile === "ADMIN" || callerProfile === "SUPER_ADMIN" ||
      (!callerProfile && ["ADMIN", "SUPER_ADMIN"].includes(authUser?.role ?? authUser?.activeRole));
    if (callerIsAdmin) return target;

    // Everyone else holding my_day.team.view is a SUPER_SALES-tier supervisor:
    // sales-domain targets only.
    if (targetFamily(target) === "SALES") return target;
    throw new AppError(C.MY_DAY_TEAM_SCOPE_DENIED, 403, null, {
      translationKey: TK,
      reason: "super-sales supervisors may only view sales-tier queues",
    });
  }

  // ── team lens ──────────────────────────────────────────────────────────────────────

  async getTeamOverview({ authUser, now = new Date() }) {
    const callerProfile = authUser?.currentProfileKey;
    const isAdmin =
      callerProfile === "ADMIN" || callerProfile === "SUPER_ADMIN" ||
      (!callerProfile && ["ADMIN", "SUPER_ADMIN"].includes(authUser?.role ?? authUser?.activeRole));

    const domains = { sales: await this.#salesDomain(now) };
    if (isAdmin) domains.designers = await this.#designersDomain(now);
    return MyDayDto.toTeam({ domains, now });
  }

  async #salesDomain(now) {
    const [stale, unclaimed, overdueCalls, signing, load] = await Promise.all([
      this.repo.staleLeadsByRep(now),
      this.repo.unclaimedAgingCount(now),
      this.repo.overdueCallsByRep(now),
      this.repo.signingStalled(now),
      this.repo.salesLoad(),
    ]);

    // Resolve names for reps that appear only in the groupBys.
    const knownIds = new Set(load.map((p) => p.userId));
    const extraIds = [...new Set([...stale, ...overdueCalls].map((g) => g.userId))].filter(
      (id) => id != null && !knownIds.has(id),
    );
    const extraNames = await this.repo.findUserNames(extraIds);
    const nameById = new Map([
      ...load.map((p) => [p.userId, p.name]),
      ...extraNames.map((u) => [u.id, u.name]),
    ]);

    const staleById = new Map(stale.map((g) => [g.userId, g._count._all]));
    const overdueById = new Map(overdueCalls.map((g) => [g.userId, g._count._all]));

    const exceptions = [];
    for (const g of stale) {
      exceptions.push({
        type: "LEAD_STALE_TEAM",
        severity: "warning",
        params: { userId: g.userId, userName: nameById.get(g.userId) ?? null, count: g._count._all },
      });
    }
    if (unclaimed > 0) {
      exceptions.push({ type: "LEAD_UNCLAIMED_AGING", severity: "warning", params: { count: unclaimed } });
    }
    for (const g of overdueCalls) {
      exceptions.push({
        type: "CALL_OVERDUE_TEAM",
        severity: "critical",
        params: { userId: g.userId, userName: nameById.get(g.userId) ?? null, count: g._count._all },
      });
    }
    for (const c of signing) {
      exceptions.push({
        type: "CONTRACT_SIGNING_STALLED",
        severity: "warning",
        params: {
          leadId: c.clientLeadId,
          clientName: c.clientLead?.client?.name ?? null,
          userId: c.clientLead?.userId ?? null,
          userName: c.clientLead?.userId != null ? (nameById.get(c.clientLead.userId) ?? null) : null,
          sinceDays: Math.floor((now.getTime() - new Date(c.createdAt).getTime()) / 86400_000),
        },
      });
    }
    for (const p of load) {
      if (p.maxLeads != null && p.activeLeads > p.maxLeads) {
        exceptions.push({
          type: "REP_OVER_CAPACITY",
          severity: "warning",
          params: { userId: p.userId, userName: p.name, activeCount: p.activeLeads, maxCount: p.maxLeads },
        });
      }
    }

    const people = load.map((p) => ({
      userId: p.userId,
      name: p.name,
      family: "SALES",
      activeCount: p.activeLeads,
      maxCount: p.maxLeads,
      staleCount: staleById.get(p.userId) ?? 0,
      overdueCount: overdueById.get(p.userId) ?? 0,
    }));

    return { exceptions: sortExceptions(exceptions), people };
  }

  async #designersDomain(now) {
    const [deliveries, load] = await Promise.all([
      this.repo.deliveriesAtRisk(now),
      this.repo.designerLoad(),
    ]);

    const exceptions = [];
    const overdueByUser = new Map();
    const soonByUser = new Map();
    for (const d of deliveries) {
      const isOverdue = new Date(d.deliveryAt).getTime() < now.getTime();
      const designers = (d.project?.assignments ?? [])
        .map((a) => a.user)
        .filter(Boolean);
      exceptions.push({
        type: isOverdue ? "DELIVERY_OVERDUE_TEAM" : "DELIVERY_DUE_SOON_TEAM",
        severity: isOverdue ? "critical" : "warning",
        params: {
          projectId: d.project?.id ?? null,
          leadId: d.project?.clientLeadId ?? null,
          projectType: d.project?.type ?? null,
          deliveryAt: new Date(d.deliveryAt).toISOString(),
          designers: designers.map((u) => ({ userId: u.id, name: u.name })),
        },
      });
      for (const u of designers) {
        const bucket = isOverdue ? overdueByUser : soonByUser;
        bucket.set(u.id, (bucket.get(u.id) ?? 0) + 1);
      }
    }

    const people = load.map((p) => ({
      userId: p.userId,
      name: p.name,
      family: "DESIGNER",
      activeCount: p.activeStages,
      overdueCount: overdueByUser.get(p.userId) ?? 0,
      atRiskCount: soonByUser.get(p.userId) ?? 0,
    }));

    return { exceptions: sortExceptions(exceptions), people };
  }
}

// Earliest live-stage delivery date, else the project fallback (spec §5.2).
function resolveDeliveryAt(project) {
  const liveDeliveries = (project.contractStages ?? [])
    .filter((s) => s.stageStatus !== "COMPLETED" && s.deliverySchedule?.deliveryAt)
    .map((s) => new Date(s.deliverySchedule.deliveryAt))
    .sort((a, b) => a - b);
  return liveDeliveries[0] ?? project.deliveryTime ?? null;
}

const EXCEPTION_RANK = { critical: 0, warning: 1, info: 2 };
function sortExceptions(list) {
  return [...list].sort((a, b) => (EXCEPTION_RANK[a.severity] ?? 2) - (EXCEPTION_RANK[b.severity] ?? 2));
}

export const myDayUsecase = new MyDayUsecase(myDayRepository, leadRepository);
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- my-day.usecase`
Expected: ALL PASS. (If the CALL_OVERDUE assertion fails because the engine sorts critical-first with LEAD_STALE second — that IS the expected order; fix the test only if you asserted the wrong order, never re-sort in the usecase: the DTO sorts ITEMS, the engine sorts SIGNALS.)

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/my-day/my-day.usecase.js server/src/modules/my-day/my-day.dto.js server/src/modules/my-day/my-day.validation.js server/src/modules/my-day/__tests__/my-day.usecase.test.js
git commit -m "feat(my-day): usecase — family dispatch, engine-over-batch queues, team lens, scope checker"
```

---

### Task 7: Controller + route + mount + HTTP integration tests

**Files:**
- Create: `server/src/modules/my-day/my-day.controller.js`
- Create: `server/src/modules/my-day/my-day.route.js`
- Modify: `server/src/shared/routes.js` (import ~line 40; mount ~line 281)
- Test: `server/src/modules/my-day/__tests__/my-day.route.integration.test.js`

**Interfaces:**
- Consumes: `myDayUsecase` (Task 6), `MyDayValidation`, `ok` helper, `AuthMiddleware`, `asyncHandler`, `validate`, `PERMISSIONS.MY_DAY` + `myDayMessagesCodes` + `messagesNames` from `@dms/shared`.
- Produces: `myDayRouter` mounted at `/v2/my-day` with `GET /`, `GET /team`, `GET /users/:userId`.

- [ ] **Step 1: Write the failing integration test**

Create `server/src/modules/my-day/__tests__/my-day.route.integration.test.js` (mirrors the command-center harness — module depth is `my-day/__tests__/` → three `../` levels):

```js
// Real HTTP integration test for /v2/my-day — the permission matrix IS the feature's
// security story (spec §10): sales get the personal queue but not /team; ADMINS have NO
// personal queue (403 on /); SUPER_SALES gets /team without the designers block and is
// scope-blocked from drilling into a designer; admin drills into anyone. JWT secrets set
// BEFORE importing env-reading modules; Prisma mocked (no DB).
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import express from "express";
import cookieParser from "cookie-parser";

process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.ISLOCAL = "true";

const STALE_UPDATED = new Date("2026-01-01T00:00:00.000Z");

// One stale owned lead → the STAFF caller's queue has ≥1 item.
const BUNDLE = {
  id: 5,
  userId: 7,
  status: "IN_PROGRESS",
  paymentStatus: "PENDING",
  updatedAt: STALE_UPDATED,
  client: { name: "Aisha" },
  contracts: [],
  salesStages: [],
  callReminders: [{ time: new Date("2020-01-01T00:00:00.000Z"), status: "IN_PROGRESS" }],
  meetingReminders: [],
  priceOffers: [],
  sessionQuestions: [],
  versaModel: [],
};

const userFindUnique = vi.fn(async ({ where }) => {
  if (where.id === 9) return { id: 9, name: "Rep", isActive: true, role: "STAFF", profile: null, currentProfile: { key: "NORMAL_SALES" } };
  if (where.id === 42) return { id: 42, name: "Sara", isActive: true, role: "THREE_D_DESIGNER", profile: null, currentProfile: { key: "DESIGNER_3D" } };
  return null;
});

vi.mock("@dms/db", () => ({
  default: {
    clientLead: {
      findMany: vi.fn(async ({ where }) => (where.userId === 7 || where.userId === 9 ? [BUNDLE] : [])),
      count: vi.fn().mockResolvedValue(1),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    callReminder: { groupBy: vi.fn().mockResolvedValue([]) },
    contract: { findMany: vi.fn().mockResolvedValue([]) },
    deliverySchedule: { findMany: vi.fn().mockResolvedValue([]) },
    assignment: { findMany: vi.fn().mockResolvedValue([]) },
    user: { findUnique: userFindUnique, findMany: vi.fn().mockResolvedValue([]) },
    project: { count: vi.fn().mockResolvedValue(0) },
  },
}));

let server;
let baseUrl;
let JwtService;
let myDayRouter;
let errorHandler;
let AUTH_COOKIE_NAME;
let authMessagesCodes;
let myDayMessagesCodes;

beforeAll(async () => {
  ({ JwtService } = await import("../../../infra/security/jwt.js"));
  ({ myDayRouter } = await import("../my-day.route.js"));
  ({ errorHandler } = await import("../../../shared/errors/error-handler.js"));
  ({ AUTH_COOKIE_NAME, authMessagesCodes, myDayMessagesCodes } = await import("@dms/shared"));

  const app = express();
  app.use(cookieParser());
  app.use("/my-day", myDayRouter);
  app.use(errorHandler);

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

function signFor({ id, role }) {
  return JwtService.signAccess({
    id,
    role,
    activeRole: role,
    isActive: true,
    isPrimary: false,
    isSuperSales: false,
    subRoles: [],
  });
}

async function getJson(path, token) {
  const headers = token ? { cookie: `${AUTH_COOKIE_NAME}=${token}` } : {};
  const res = await fetch(`${baseUrl}${path}`, { headers });
  return { status: res.status, body: await res.json() };
}

describe("GET /v2/my-day — personal queue", () => {
  it("no cookie -> 401", async () => {
    const { status } = await getJson("/my-day");
    expect(status).toBe(401);
  });

  it("sales (STAFF) -> 200 with own queue items", async () => {
    const { status, body } = await getJson("/my-day", signFor({ id: 7, role: "STAFF" }));
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe(myDayMessagesCodes.MY_DAY_FETCHED);
    expect(body.data.family).toBe("SALES");
    expect(body.data.items.length).toBeGreaterThan(0);
    expect(body.data.items[0]).toMatchObject({ kind: "LEAD", leadId: 5, clientName: "Aisha" });
  });

  it("ADMIN -> 403 (admins hold no my_day.view — team lens only)", async () => {
    const { status, body } = await getJson("/my-day", signFor({ id: 1, role: "ADMIN" }));
    expect(status).toBe(403);
    expect(body.message).toBe(authMessagesCodes.PERMISSION_DENIED);
    expect(body.details.requiredPermissions).toContain("my_day.view");
  });
});

describe("GET /v2/my-day/team — supervisor rollup", () => {
  it("STAFF -> 403 PERMISSION_DENIED", async () => {
    const { status, body } = await getJson("/my-day/team", signFor({ id: 7, role: "STAFF" }));
    expect(status).toBe(403);
    expect(body.details.requiredPermissions).toContain("my_day.team.view");
  });

  it("SUPER_SALES -> 200, sales domain ONLY (no designers block)", async () => {
    const { status, body } = await getJson("/my-day/team", signFor({ id: 8, role: "SUPER_SALES" }));
    expect(status).toBe(200);
    expect(body.data.domains.sales).toBeTruthy();
    expect(body.data.domains.designers).toBeUndefined();
  });

  it("ADMIN -> 200 with sales + designers domains", async () => {
    const { status, body } = await getJson("/my-day/team", signFor({ id: 1, role: "ADMIN" }));
    expect(status).toBe(200);
    expect(body.data.domains.sales).toBeTruthy();
    expect(body.data.domains.designers).toBeTruthy();
  });
});

describe("GET /v2/my-day/users/:userId — supervisor drill-down", () => {
  it("SUPER_SALES -> sales target 200", async () => {
    const { status, body } = await getJson("/my-day/users/9", signFor({ id: 8, role: "SUPER_SALES" }));
    expect(status).toBe(200);
    expect(body.data.family).toBe("SALES");
  });

  it("SUPER_SALES -> designer target 403 MY_DAY_TEAM_SCOPE_DENIED", async () => {
    const { status, body } = await getJson("/my-day/users/42", signFor({ id: 8, role: "SUPER_SALES" }));
    expect(status).toBe(403);
    expect(body.message).toBe(myDayMessagesCodes.MY_DAY_TEAM_SCOPE_DENIED);
  });

  it("ADMIN -> designer target 200 (designer family queue)", async () => {
    const { status, body } = await getJson("/my-day/users/42", signFor({ id: 1, role: "ADMIN" }));
    expect(status).toBe(200);
    expect(body.data.family).toBe("DESIGNER");
  });

  it("unknown target -> 404; invalid param -> 422", async () => {
    const notFound = await getJson("/my-day/users/999", signFor({ id: 1, role: "ADMIN" }));
    expect(notFound.status).toBe(404);
    const invalid = await getJson("/my-day/users/abc", signFor({ id: 1, role: "ADMIN" }));
    expect(invalid.status).toBe(422);
  });

  it("STAFF -> 403 (no team code)", async () => {
    const { status } = await getJson("/my-day/users/9", signFor({ id: 7, role: "STAFF" }));
    expect(status).toBe(403);
  });
});
```

NOTE: the ADMIN caller in the drill-down/team tests has no `currentProfileKey` (role-only token) — the usecase's role fallback (`["ADMIN","SUPER_ADMIN"].includes(authUser.role)`) covers it; that's exactly the un-migrated-session path.

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- my-day.route.integration`
Expected: FAIL — `my-day.route.js` not found.

- [ ] **Step 3: Implement controller + route + mount**

**`my-day.controller.js`:**

```js
// my-day controller — thin. Delegates to the usecase, responds via the envelope helper.
// The drill-down scope check runs as route middleware (requireSpecialChecker) and stashes
// the verified target on req.scoped — the handler never re-fetches it.
import { ok } from "../../shared/http/response.js";
import { myDayMessagesCodes, messagesNames } from "@dms/shared";
import { myDayUsecase } from "./my-day.usecase.js";

const C = myDayMessagesCodes;
const TK = messagesNames.myDayMessages;

export class MyDayController {
  constructor(usecase) {
    this.usecase = usecase;
  }

  // GET /v2/my-day — the caller's own queue.
  myQueue = async (req, res) => {
    const data = await this.usecase.getMyQueue({ authUser: req.auth });
    return ok(res, data, C.MY_DAY_FETCHED, TK);
  };

  // GET /v2/my-day/team — supervisor rollup (domain gating inside the usecase).
  team = async (req, res) => {
    const data = await this.usecase.getTeamOverview({ authUser: req.auth });
    return ok(res, data, C.MY_DAY_TEAM_FETCHED, TK);
  };

  // requireSpecialChecker adapter — MUST throw on denial (AuthMiddleware contract).
  checkTargetScope = (req) =>
    this.usecase.checkIfUserCanViewMyDayOf({ id: req.params.userId, authUser: req.auth });

  // GET /v2/my-day/users/:userId — drill-down for the scope-checked target (req.scoped).
  userQueue = async (req, res) => {
    const data = await this.usecase.getQueueForTarget({ targetUser: req.scoped });
    return ok(res, data, C.MY_DAY_FETCHED, TK);
  };
}

export const myDayController = new MyDayController(myDayUsecase);
```

**`my-day.route.js`:**

```js
// my-day routes — mounted under `/v2/my-day`. Read-only surface.
//   GET /            my_day.view       — the caller's own queue (sales tiers + designers;
//                                        admins do NOT hold this code — no personal queue)
//   GET /team        my_day.team.view  — supervisor rollup (SUPER_SALES sales-only,
//                                        ADMIN/SUPER_ADMIN all domains — gated in usecase)
//   GET /users/:id   my_day.team.view + object scope (SUPER_SALES → sales targets only)
import { Router } from "express";
import { AuthMiddleware } from "../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { PERMISSIONS } from "@dms/shared";
import { myDayController } from "./my-day.controller.js";
import { MyDayValidation } from "./my-day.validation.js";

const P = PERMISSIONS.MY_DAY;
const router = Router();

router.use(AuthMiddleware.requireAuth);

router.get("/", AuthMiddleware.requirePermissions([P.VIEW]), asyncHandler(myDayController.myQueue));

router.get("/team", AuthMiddleware.requirePermissions([P.TEAM_VIEW]), asyncHandler(myDayController.team));

router.get(
  "/users/:userId",
  AuthMiddleware.requirePermissions([P.TEAM_VIEW]),
  validate(MyDayValidation.userIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(myDayController.checkTargetScope),
  asyncHandler(myDayController.userQueue),
);

export { router as myDayRouter };
```

**Mount** in `server/src/shared/routes.js` — add the import next to the command-center import (~line 39):

```js
import { myDayRouter } from "../modules/my-day/my-day.route.js";
```

and the mount next to `router.use("/command-center", commandCenterRouter);` (~line 280):

```js
// My Day — profile-scoped work queue + supervisor team lens (additive, 2026-07-12).
router.use("/my-day", myDayRouter);
```

- [ ] **Step 4: Run integration + full backend suite**

Run: `npm test -- my-day` then `npm test`
Expected: all my-day tests PASS; full suite green (the 2 pre-existing `projects.security-fixes.test.js` failures are documented pre-existing — unrelated).

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/my-day server/src/shared/routes.js
git commit -m "feat(my-day): routes + controller — /v2/my-day, /team, /users/:userId (scope-checked)"
```

---

### Task 8: Frontend — `/dashboard/my-day` page, queue + team components, copy, icon

**Files:**
- Create: `web/src/app/(auth)/dashboard/(dashboard)/my-day/page.jsx`
- Create: `web/src/features/my-day/MyDay.jsx`
- Create: `web/src/features/my-day/MyWorkQueue.jsx`
- Create: `web/src/features/my-day/TeamLens.jsx`
- Create: `web/src/features/my-day/PersonQueueDrawer.jsx`
- Create: `web/src/features/my-day/config/myDayCopy.jsx`
- Modify: `web/src/features/leads/cockpit/config/cockpitActions.jsx` (add `LEAD_STALE` entry — the per-lead strip now emits it)
- Create: `web/src/app/helpers/messages/maps/myDayMessages.js`
- Modify: `web/src/app/helpers/messages/resolveMessage.js` (import + spread, next to `commandCenterMessages`)
- Modify: `web/src/app/(auth)/dashboard/(dashboard)/layout.jsx` (add `"my-day"` to `ICON_BY_KEY`; add `FiSunrise` to the existing `react-icons/fi` import)

**Interfaces:**
- Consumes: `GET my-day`, `GET my-day/team`, `GET my-day/users/:id` (Tasks 6–7 payload shapes); `getData` (`@/app/helpers/functions/getData.js`); `usePermission` (`@/app/hooks/usePermission.js`); `getActionConfig`, `GOTO_SECTION`, `SEVERITY_PALETTE` from `@/features/leads/cockpit/config/cockpitActions.jsx`.
- Deep links: LEAD items → `/dashboard/deals/${leadId}?tab=${GOTO_SECTION[tabKey] || "details"}`; WORK_STAGE items → `/dashboard/work-stages/${leadId}` (that route takes the LEAD id — verified in `PreviewWorkStage`).

- [ ] **Step 1: Add the LEAD_STALE copy to the cockpit config**

In `cockpitActions.jsx`, add to `COCKPIT_ACTION_CONFIG` (after `NO_UPCOMING_TOUCH`, reusing an icon already imported in that file — check the imports and pick the same icon `NO_UPCOMING_TOUCH` uses):

```jsx
  LEAD_STALE: {
    icon: <IoMdCall />,
    severity: "warning",
    title: () => "Lead going stale",
    description: (p = {}) =>
      `No activity for ${p.daysSinceActivity ?? 0} days and nothing scheduled — reach out today.`,
    ctaLabel: "Schedule a call",
  },
```

(If `IoMdCall` is not among the file's imports, use the icon component the `CALL_OVERDUE` entry uses — same import, zero new dependencies.)

- [ ] **Step 2: Create `config/myDayCopy.jsx`**

```jsx
"use client";
// My Day copy — extends the cockpit signal map with the queue-only signal types and the
// team-lens exception copy. Language-neutral types/params in, English strings out.
import { MdTimeline } from "react-icons/md";
import { getActionConfig } from "@/features/leads/cockpit/config/cockpitActions.jsx";

// Work-stage queue signals (designer tier) — not in the cockpit map.
const MY_DAY_ONLY_CONFIG = {
  DELIVERY_OVERDUE: {
    icon: <MdTimeline />,
    severity: "critical",
    title: () => "Delivery overdue",
    description: (p = {}) =>
      `${p.projectType ?? "Stage"} delivery was due ${p.overdueDays ?? 0}d ago — finish or flag it now.`,
    ctaLabel: "Open work stage",
  },
  STAGE_DUE_SOON: {
    icon: <MdTimeline />,
    severity: "warning",
    title: () => "Delivery due soon",
    description: (p = {}) =>
      `${p.projectType ?? "Stage"} delivery in ${p.hoursLeft ?? 0}h.`,
    ctaLabel: "Open work stage",
  },
  WORK_STAGE_ASSIGNED_TO_YOU: {
    icon: <MdTimeline />,
    severity: "warning",
    title: () => "Stage in progress",
    description: (p = {}) => `Your ${p.projectType ?? ""} stage is in progress.`,
    ctaLabel: "Open work stage",
  },
};

export function getMyDaySignalConfig(type) {
  return getActionConfig(type) || MY_DAY_ONLY_CONFIG[type] || null;
}

// Team-lens exception copy (params in, one English line out).
export const TEAM_EXCEPTION_COPY = {
  LEAD_STALE_TEAM: (p = {}) => `${p.userName ?? "A rep"} has ${p.count ?? 0} stale lead(s) — no activity in 5+ days`,
  LEAD_UNCLAIMED_AGING: (p = {}) => `${p.count ?? 0} new lead(s) unclaimed for 2+ days`,
  CALL_OVERDUE_TEAM: (p = {}) => `${p.userName ?? "A rep"} has ${p.count ?? 0} overdue call(s)`,
  CONTRACT_SIGNING_STALLED: (p = {}) => `Contract for ${p.clientName ?? "a client"} awaiting signature for ${p.sinceDays ?? 0}+ days`,
  DELIVERY_OVERDUE_TEAM: (p = {}) => `${p.projectType ?? "A stage"} delivery overdue (${(p.designers ?? []).map((d) => d.name).join(", ") || "unassigned"})`,
  DELIVERY_DUE_SOON_TEAM: (p = {}) => `${p.projectType ?? "A stage"} delivery due within 48h (${(p.designers ?? []).map((d) => d.name).join(", ") || "unassigned"})`,
  REP_OVER_CAPACITY: (p = {}) => `${p.userName ?? "A rep"} is over capacity: ${p.activeCount ?? 0}/${p.maxCount ?? 0} active leads`,
};

export function resolveExceptionCopy(type, params) {
  const fn = TEAM_EXCEPTION_COPY[type];
  return fn ? fn(params) : type;
}
```

- [ ] **Step 3: Create `MyWorkQueue.jsx`**

```jsx
"use client";
// The personal queue list. Fetches /my-day (or /my-day/users/:id when userId is passed —
// the supervisor drill-down reuses this component read-only inside the drawer).
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { alpha, useTheme } from "@mui/material/styles";
import { Alert, Box, Button, Chip, Skeleton, Stack, Typography } from "@mui/material";
import { getData } from "@/app/helpers/functions/getData.js";
import { GOTO_SECTION, SEVERITY_PALETTE } from "@/features/leads/cockpit/config/cockpitActions.jsx";
import { getMyDaySignalConfig } from "@/features/my-day/config/myDayCopy.jsx";

function itemHref(item) {
  if (item.kind === "WORK_STAGE") return `/dashboard/work-stages/${item.leadId}`;
  const tabKey = item.signals?.[0]?.cta?.tabKey;
  const section = tabKey ? GOTO_SECTION[tabKey] || tabKey : null;
  return section ? `/dashboard/deals/${item.leadId}?tab=${section}` : `/dashboard/deals/${item.leadId}`;
}

export default function MyWorkQueue({ userId }) {
  const theme = useTheme();
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const url = userId ? `my-day/users/${userId}` : "my-day";

  const fetchQueue = useCallback(async () => {
    setError(false);
    const res = await getData({ url, setLoading });
    if (res && res.status === 200) setQueue(res.data);
    else setError(true);
  }, [url]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  if (loading) {
    return (
      <Stack spacing={1.5}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} variant="rounded" height={72} />
        ))}
      </Stack>
    );
  }
  if (error) {
    return (
      <Alert severity="error" action={<Button color="inherit" size="small" onClick={fetchQueue}>Retry</Button>}>
        Couldn&apos;t load the queue.
      </Alert>
    );
  }
  if (!queue?.items?.length) {
    return (
      <Box sx={{ py: 6, textAlign: "center" }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ color: theme.palette.success.main }}>
          All clear — nothing needs you right now.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={1.5}>
      {queue.truncated && (
        <Alert severity="info">Showing the {queue.items.length} most at-risk items.</Alert>
      )}
      {queue.items.map((item) => {
        const top = item.signals[0];
        const cfg = getMyDaySignalConfig(top.type);
        const paletteKey = SEVERITY_PALETTE[top.severity] || "info";
        const color = theme.palette[paletteKey].main;
        return (
          <Box
            key={`${item.kind}-${item.kind === "WORK_STAGE" ? item.projectId : item.leadId}`}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              p: 1.5,
              borderRadius: 2,
              borderLeft: `3px solid ${color}`,
              bgcolor: alpha(color, 0.04),
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5, flexWrap: "wrap" }}>
                <Typography variant="body2" fontWeight={700} noWrap>
                  {item.clientName || `Lead #${item.leadId}`}
                </Typography>
                {item.status && <Chip size="small" label={item.status} variant="outlined" />}
                {item.level && <Chip size="small" label={item.level} variant="outlined" />}
              </Stack>
              <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", rowGap: 0.5 }}>
                {item.signals.map((s, i) => {
                  const sCfg = getMyDaySignalConfig(s.type);
                  if (!sCfg) return null;
                  return (
                    <Chip
                      key={i}
                      size="small"
                      color={SEVERITY_PALETTE[s.severity] || "default"}
                      variant={i === 0 ? "filled" : "outlined"}
                      label={`${sCfg.title(s.params)} — ${sCfg.description(s.params)}`}
                      sx={{ maxWidth: "100%" }}
                    />
                  );
                })}
              </Stack>
            </Box>
            <Button component={Link} href={itemHref(item)} size="small" variant="outlined" sx={{ flexShrink: 0 }}>
              {cfg?.ctaLabel || "Open"}
            </Button>
          </Box>
        );
      })}
    </Stack>
  );
}
```

- [ ] **Step 4: Create `PersonQueueDrawer.jsx` and `TeamLens.jsx`**

`PersonQueueDrawer.jsx`:

```jsx
"use client";
// Supervisor drill-down: a right drawer showing the selected person's queue via
// /my-day/users/:id (read-only reuse of MyWorkQueue).
import { Box, Drawer, IconButton, Stack, Typography } from "@mui/material";
import { FiX } from "react-icons/fi";
import MyWorkQueue from "@/features/my-day/MyWorkQueue.jsx";

export default function PersonQueueDrawer({ open, onClose, person }) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: "100%", sm: 520 }, maxWidth: "100%" } }}
    >
      <Box sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>
            {person?.name ? `${person.name}'s queue` : "Queue"}
          </Typography>
          <IconButton onClick={onClose} aria-label="Close">
            <FiX />
          </IconButton>
        </Stack>
        {person?.userId && <MyWorkQueue userId={person.userId} />}
      </Box>
    </Drawer>
  );
}
```

`TeamLens.jsx`:

```jsx
"use client";
// Supervisor rollup: exceptions first (only breached thresholds), person cards below,
// click a person → drill-down drawer. Domains come server-gated (sales for super-sales;
// sales + designers for admins) — no client-side widening.
import { useCallback, useEffect, useState } from "react";
import { alpha, useTheme } from "@mui/material/styles";
import { Alert, Box, Button, Card, CardActionArea, Chip, Grid, Skeleton, Stack, Typography } from "@mui/material";
import { getData } from "@/app/helpers/functions/getData.js";
import { SEVERITY_PALETTE } from "@/features/leads/cockpit/config/cockpitActions.jsx";
import { resolveExceptionCopy } from "@/features/my-day/config/myDayCopy.jsx";
import PersonQueueDrawer from "@/features/my-day/PersonQueueDrawer.jsx";

const DOMAIN_LABEL = { sales: "Sales team", designers: "Designers" };

export default function TeamLens() {
  const theme = useTheme();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchOverview = useCallback(async () => {
    setError(false);
    const res = await getData({ url: "my-day/team", setLoading });
    if (res && res.status === 200) setOverview(res.data);
    else setError(true);
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  if (loading) return <Skeleton variant="rounded" height={280} />;
  if (error) {
    return (
      <Alert severity="error" action={<Button color="inherit" size="small" onClick={fetchOverview}>Retry</Button>}>
        Couldn&apos;t load the team overview.
      </Alert>
    );
  }

  const domains = Object.entries(overview?.domains ?? {});
  return (
    <Stack spacing={3}>
      {domains.map(([key, domain]) => (
        <Box key={key}>
          <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>
            {DOMAIN_LABEL[key] || key}
          </Typography>

          {domain.exceptions.length === 0 ? (
            <Typography variant="body2" sx={{ color: theme.palette.success.main, mb: 2 }}>
              No exceptions — everything on track.
            </Typography>
          ) : (
            <Stack spacing={1} sx={{ mb: 2 }}>
              {domain.exceptions.map((e, i) => {
                const color = theme.palette[SEVERITY_PALETTE[e.severity] || "info"].main;
                return (
                  <Box
                    key={i}
                    sx={{ p: 1.25, borderRadius: 1.5, borderLeft: `3px solid ${color}`, bgcolor: alpha(color, 0.05) }}
                  >
                    <Typography variant="body2">{resolveExceptionCopy(e.type, e.params)}</Typography>
                  </Box>
                );
              })}
            </Stack>
          )}

          <Grid container spacing={1.5}>
            {domain.people.map((p) => (
              <Grid key={p.userId} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card variant="outlined">
                  <CardActionArea onClick={() => { setSelected(p); setDrawerOpen(true); }} sx={{ p: 1.5 }}>
                    <Typography variant="body2" fontWeight={700} noWrap>{p.name}</Typography>
                    <Stack direction="row" spacing={0.75} sx={{ mt: 0.75, flexWrap: "wrap", rowGap: 0.5 }}>
                      <Chip size="small" variant="outlined" label={`${p.activeCount ?? 0} active`} />
                      {p.staleCount > 0 && <Chip size="small" color="warning" label={`${p.staleCount} stale`} />}
                      {p.overdueCount > 0 && <Chip size="small" color="error" label={`${p.overdueCount} overdue`} />}
                      {p.atRiskCount > 0 && <Chip size="small" color="warning" label={`${p.atRiskCount} at risk`} />}
                      {p.maxCount != null && p.activeCount > p.maxCount && (
                        <Chip size="small" color="error" label="over capacity" />
                      )}
                    </Stack>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}
      <PersonQueueDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} person={selected} />
    </Stack>
  );
}
```

- [ ] **Step 5: Create `MyDay.jsx` + the page + icon + message map**

`MyDay.jsx`:

```jsx
"use client";
// My Day — two permission-gated tabs, URL-synced (?tab=my-work|team). Sales/designers see
// "My work" only; admins see "Team" only (no personal queue); super-sales sees both.
import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Box, Tab, Tabs } from "@mui/material";
import { usePermission } from "@/app/hooks/usePermission.js";
import MyWorkQueue from "@/features/my-day/MyWorkQueue.jsx";
import TeamLens from "@/features/my-day/TeamLens.jsx";

// Codes mirrored from packages/shared/constants/access/permissions.constants.js
// (PERMISSIONS.MY_DAY — web has no @dms/shared dependency).
const MY_DAY_VIEW = "my_day.view";
const MY_DAY_TEAM_VIEW = "my_day.team.view";

export default function MyDay() {
  const { hasPermission } = usePermission();
  const canView = hasPermission(MY_DAY_VIEW);
  const canTeam = hasPermission(MY_DAY_TEAM_VIEW);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const defaultTab = canView ? "my-work" : "team";
  const urlTab = searchParams.get("tab");
  const initial = (urlTab === "team" && canTeam) || (urlTab === "my-work" && canView) ? urlTab : defaultTab;
  const [activeTab, setActiveTabState] = useState(initial);

  const setActiveTab = (val) => {
    setActiveTabState(val);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      params.set("tab", String(val));
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  };

  const showTabs = canView && canTeam;

  return (
    <Box>
      {showTabs && (
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2.5 }}>
          <Tab label="My work" value="my-work" />
          <Tab label="Team" value="team" />
        </Tabs>
      )}
      {activeTab === "my-work" && canView && <MyWorkQueue />}
      {activeTab === "team" && canTeam && <TeamLens />}
    </Box>
  );
}
```

`page.jsx` (`web/src/app/(auth)/dashboard/(dashboard)/my-day/page.jsx` — mirrors the command-center page shell):

```jsx
"use client";
import { Box, Container, Typography } from "@mui/material";
import { FiSunrise } from "react-icons/fi";
import { usePermission } from "@/app/hooks/usePermission.js";
import MyDay from "@/features/my-day/MyDay.jsx";

const MY_DAY_VIEW = "my_day.view";
const MY_DAY_TEAM_VIEW = "my_day.team.view";

export default function MyDayPage() {
  const { hasAnyPermission } = usePermission();
  const canOpen = hasAnyPermission([MY_DAY_VIEW, MY_DAY_TEAM_VIEW]);

  return (
    <Container maxWidth="lg" sx={{ pt: { xs: 3, md: 4 }, pb: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
        <FiSunrise size={24} />
        <Typography variant="h5" component="h1" fontWeight={800}>
          My Day
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Everything that needs your action today, ranked — and for supervisors, who needs
        unblocking.
      </Typography>

      {canOpen ? (
        <MyDay />
      ) : (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
            You don&apos;t have permission to view My Day
          </Typography>
        </Box>
      )}
    </Container>
  );
}
```

Icon: in `web/src/app/(auth)/dashboard/(dashboard)/layout.jsx` add `FiSunrise` to the existing `react-icons/fi` import list and add to `ICON_BY_KEY`:

```jsx
  "my-day": <FiSunrise size={20} />,
```

Message map `web/src/app/helpers/messages/maps/myDayMessages.js` (mirrors `commandCenterMessages.js`):

```js
// Single-language (English) resolution for backend message CODES emitted by the my-day
// surface ({ success, message: CODE, translationKey: "myDayMessages" }).
export const myDayMessages = {
  MY_DAY_FETCHED: "My Day loaded",
  MY_DAY_TEAM_FETCHED: "Team overview loaded",
  MY_DAY_PROFILE_UNSUPPORTED: "Your profile doesn't have a My Day queue",
  MY_DAY_TEAM_SCOPE_DENIED: "You can only view queues of sales team members",
  MY_DAY_TARGET_NOT_FOUND: "User not found",
};
```

Register in `web/src/app/helpers/messages/resolveMessage.js` — add next to the commandCenterMessages lines:

```js
import { myDayMessages } from "./maps/myDayMessages";
```

and spread `...myDayMessages,` alongside `...commandCenterMessages,`.

- [ ] **Step 6: Verify with the production build**

Run: `cd web && npx next build`
Expected: exit 0, `/dashboard/my-day` appears in the route list. Fix any import/JSX error it reports (lint is broken — the build IS the gate).

- [ ] **Step 7: Commit**

```bash
git add web/src/app/"(auth)"/dashboard/"(dashboard)"/my-day web/src/features/my-day web/src/features/leads/cockpit/config/cockpitActions.jsx web/src/app/helpers/messages web/src/app/"(auth)"/dashboard/"(dashboard)"/layout.jsx
git commit -m "feat(web/my-day): My Day page — personal queue + team lens + drill-down drawer"
```

---

### Task 9: Whole-branch verification + docs

**Files:**
- Modify: `PROJECT_STATE.md` (new LATEST block at the top)
- Modify: `docs/superpowers/specs/permissions-parity-matrix.md` (additive-codes addendum)

- [ ] **Step 1: Full backend suite**

Run: `npm test`
Expected: green except the 2 documented pre-existing `projects.security-fixes.test.js` failures (Zod strict-update — present before this work; do NOT fix here). Any OTHER failure is a regression from this plan — fix it before proceeding.

- [ ] **Step 2: Frontend build**

Run: `cd web && npx next build`
Expected: exit 0.

- [ ] **Step 3: Update docs**

- `PROJECT_STATE.md`: add a `LATEST (date) — My Day work queue` block at the top of the header section summarizing: new `/v2/my-day` module (3 read endpoints), 2 additive permission codes (`my_day.view` sales+designers, `my_day.team.view` super-sales+admins — admins have NO personal queue), 3 new pure-rule signals (`LEAD_STALE`, `DELIVERY_OVERDUE`, `STAGE_DUE_SOON`), the `/dashboard/my-day` screen, and test counts. Note the Contract-`createdAt` signing-stalled approximation.
- `permissions-parity-matrix.md`: append an addendum row/paragraph: "2026-07-12 — additive `my_day.view` / `my_day.team.view` (new surface, no master equivalent; no existing access changed)."

- [ ] **Step 4: Commit**

```bash
git add PROJECT_STATE.md docs/superpowers/specs/permissions-parity-matrix.md
git commit -m "docs: PROJECT_STATE + parity addendum for the My Day work queue"
```

---

## Self-review notes (done at plan-writing time)

- **Spec coverage:** §5.1 endpoints → Task 7; §5.2 queues → Tasks 4–6; §5.3 rules → Tasks 2–3; §5.4 aggregates + money boundary → Task 5; §5.5 DTOs → Task 6; §6 thresholds → single-source constants in Tasks 2/3/5 (repo-convention adaptation, documented); §7 caps/truncated → Tasks 4/6/8; §8 permissions/nav/seed → Task 1 (seed is data-driven — no edit); §9 FE → Task 8; §10 tests → every task + Task 9; §11 order preserved.
- **Deliberate deviations from the spec (both verified against the code):** (1) Contract "signing stalled" uses `createdAt` (no `updatedAt` column exists); (2) thresholds live as exported module constants, not a `@dms/shared` file (repo convention: `DESIGNER_LOAD_THRESHOLD` precedent) — still single-source via imports.
- **Type consistency check:** `findCockpitBundlesForUser({ userId, take })` (Tasks 4/6/7), `MY_DAY_LEAD_STATUSES` (4/6), `normalizeBundle` (4/6), `PROJECT_TYPE_TO_LEVEL`/`DELIVERY_SOON_HOURS` (3/5/6), `STALE_LEAD_DAYS` (2/5), queue item shape `{ kind, leadId, clientName, sortAt, signals }` (6/7/8), team shapes `{ exceptions, people }` (6/7/8) — names match across tasks.
