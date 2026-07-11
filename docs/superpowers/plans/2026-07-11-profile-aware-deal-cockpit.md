# Profile-Aware Deal Cockpit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the deal cockpit keep telling every person what to do next — driven by their **active profile** — instead of going dark at `FINALIZED` and only ever speaking to the sales owner.

**Architecture:** Keep the pure `computeCockpit(bundle, now)` engine and extend it: add a `profileKey` input and a widened (still language-neutral) bundle carrying the active contract + its stages/payments; split rule emission into profile-scoped sets; remove the terminal blackout (only `REJECTED`/`ARCHIVED` stay silent); derive payment truth live from `ContractPayment` rows (no DB migration). Ships in three independently-testable phases: P1 sales post-finalize, P2 accountant, P3 designers.

**Tech Stack:** Node/Express (ESM), Prisma 6 (`@dms/db`), Vitest (backend unit + integration), Next.js 16 + MUI v7 (frontend), `@dms/shared` message codes.

## Global Constraints

- **JavaScript only** (ESM, `"type":"module"`) — no TypeScript in app source.
- **Engine stays PURE + deterministic:** no Prisma/I/O in `lead.cockpit.js`; the clock `now` is always injected (never `new Date()` inside).
- **Prisma only in repositories** (`*.repo.js`); no business logic in routes/controllers.
- **No schema change / no migration** — payment truth is derived from `ContractPayment.status` at compute-time. `ClientLead.paymentStatus` is left as-is.
- **Contract legacy service is frozen** — read its state only; never modify `contract-services.js`.
- **Authorization unchanged for P1/P2** (accountant already `FULL_SCOPE_ROLES`); **P3 must NOT widen `checkIfUserCanAccessLead`** — designers get their slice on their own `Assignment`-scoped surface.
- **Signals are language-neutral codes**; all English copy lives in the frontend `cockpitActions.jsx` (single English source).
- **Verify frontend with `cd web && npx next build`** (web eslint config is broken).
- **Backend tests:** `cd server && npx vitest run <path>`.

---

## File Structure

**Phase 1**
- Modify: `server/src/modules/leads/lead/lead.repo.js` — widen `COCKPIT_BUNDLE_SELECT` with the active contract + stages; normalize in `findCockpitBundle`.
- Modify: `server/src/modules/leads/lead/lead.cockpit.js` — profile-aware signature, rule registry, `health.contract`, blackout removal, funnel guard, 4 new sales signals.
- Modify: `server/src/modules/leads/lead/lead.cockpit.usecase.js` — pass `profileKey`.
- Modify: `server/src/modules/leads/lead/__tests__/lead.cockpit.test.js` — update terminal cases, add post-finalize cases.
- Modify: `web/src/features/leads/cockpit/config/cockpitActions.jsx` — copy for the 4 new types.
- Modify: `web/src/features/leads/cockpit/DealHealthBar.jsx` — render contract `LEVEL_N/7` progress when `health.contract` present.

**Phase 2**
- Modify: `server/src/modules/leads/lead/lead.repo.js` — add `payments` to the contract select.
- Modify: `server/src/modules/leads/lead/lead.cockpit.js` — accountant rule set (`DOWNPAYMENT_DUE`, `PAYMENT_DUE`), `health.payment`.
- Modify: `server/src/modules/leads/lead/__tests__/lead.cockpit.test.js` — accountant-profile cases.
- Modify: `web/src/features/leads/cockpit/config/cockpitActions.jsx` — copy for the 2 accountant types.

**Phase 3**
- Create: `server/src/modules/leads/lead/lead.workstage-cockpit.js` — pure `computeWorkStageActions({ assignments }, now)`.
- Modify: the work-stage read path the designer already uses (`PreviewWorkStage` data source) to attach `workStageActions` scoped to `Assignment.userId === caller`.
- Create: `web/src/features/leads/cockpit/WorkStageCockpit.jsx` — the designer next-action strip.

---

## PHASE 1 — Sales, post-finalize

### Task 1: Widen the cockpit bundle with the active contract

**Files:**
- Modify: `server/src/modules/leads/lead/lead.repo.js` (`COCKPIT_BUNDLE_SELECT` ~:991-1011; `findCockpitBundle` ~:191-198)

**Interfaces:**
- Produces: `findCockpitBundle` now returns, additionally, `contracts: [{ id, status, sessionStatus, stages: [{ title, stageStatus, order }] }]` (0 or 1 entry — the latest non-cancelled contract).

- [ ] **Step 1: Add the contract select to `COCKPIT_BUNDLE_SELECT`.** Insert after `paymentStatus: true,`:

```js
  paymentStatus: true,
  // Active contract (latest IN_PROGRESS or COMPLETED) — read-only, drives post-finalize
  // signals + health.contract. Language-neutral primitives only.
  contracts: {
    where: { status: { in: ["IN_PROGRESS", "COMPLETED"] } },
    orderBy: { id: "desc" },
    take: 1,
    select: {
      id: true,
      status: true,
      sessionStatus: true,
      stages: { select: { title: true, stageStatus: true, order: true } },
    },
  },
```

- [ ] **Step 2: Confirm `findCockpitBundle` passes it through.** It already spreads the whole bundle (`return { ...bundle, versaModel: ... }`), so `contracts` flows through unchanged. No edit needed beyond Step 1.

- [ ] **Step 3: Sanity-run the repo integration test (should still pass).**

Run: `cd server && npx vitest run src/modules/leads/lead/__tests__/lead.cockpit.route.integration.test.js`
Expected: PASS (select is additive).

- [ ] **Step 4: Commit**

```bash
git add server/src/modules/leads/lead/lead.repo.js
git commit -m "feat(leads/cockpit): widen bundle with active contract + stages"
```

---

### Task 2: Profile-aware engine — registry, health.contract, blackout removal, post-finalize signals

**Files:**
- Modify: `server/src/modules/leads/lead/lead.cockpit.js`
- Test: `server/src/modules/leads/lead/__tests__/lead.cockpit.test.js`

**Interfaces:**
- Produces: `computeCockpit(bundle, now, { profileKey } = {})` — third arg optional; missing `profileKey` defaults to the SALES rule set (back-compat). `health` gains `health.contract` (`null` or `{ status, sessionStatus, currentLevel, levelsDone, levelsTotal }`). New action types: `SIGNING_AWAITED`, `CONTRACT_STAGE_IN_PROGRESS`, `AFTER_SALES_DUE`, `CONTRACT_COMPLETED`. `AWAIT_SIGNATURE` is removed. Exports add `COCKPIT_DEAD_STATUSES`.

- [ ] **Step 1: Write the failing tests.** Append to `__tests__/lead.cockpit.test.js`:

```js
describe("computeCockpit — contract health + post-finalize (Phase 1)", () => {
  const withContract = (over = {}) =>
    baseBundle({
      status: "FINALIZED",
      salesStages: [{ stage: "INITIAL_CONTACT" }],
      contracts: [
        {
          id: 1,
          status: "IN_PROGRESS",
          sessionStatus: "SIGNING",
          stages: [
            { title: "LEVEL_1", stageStatus: "COMPLETED", order: 1 },
            { title: "LEVEL_2", stageStatus: "IN_PROGRESS", order: 2 },
            { title: "LEVEL_3", stageStatus: "NOT_STARTED", order: 3 },
          ],
        },
      ],
      ...over,
    });

  it("derives health.contract from the active contract stages", () => {
    const { health } = computeCockpit(withContract(), NOW);
    expect(health.contract).toMatchObject({
      status: "IN_PROGRESS",
      sessionStatus: "SIGNING",
      currentLevel: "LEVEL_2",
      levelsDone: 1,
      levelsTotal: 3,
    });
  });

  it("health.contract is null when there is no contract", () => {
    const { health } = computeCockpit(baseBundle({ status: "IN_PROGRESS" }), NOW);
    expect(health.contract).toBeNull();
  });

  it("FINALIZED is NO LONGER a blackout — emits contract signals (fixes the 1/10 bug)", () => {
    const result = computeCockpit(withContract(), NOW);
    const t = types(result);
    // The contradiction case: finalized, contract SIGNING + LEVEL_2 in progress.
    expect(t).toContain("SIGNING_AWAITED");
    expect(t).toContain("CONTRACT_STAGE_IN_PROGRESS");
    // And it must NOT nag "advance the sales funnel" on a closed-won deal.
    expect(t).not.toContain("ADVANCE_STAGE");
  });

  it("SIGNING_AWAITED fires on sessionStatus SIGNING (warning, contracts tab)", () => {
    const a = computeCockpit(withContract(), NOW).actions.find((x) => x.type === "SIGNING_AWAITED");
    expect(a.severity).toBe("warning");
    expect(a.cta).toMatchObject({ kind: "GOTO_TAB", capability: null, tabKey: "contracts" });
  });

  it("CONTRACT_STAGE_IN_PROGRESS carries level params", () => {
    const a = computeCockpit(withContract(), NOW).actions.find((x) => x.type === "CONTRACT_STAGE_IN_PROGRESS");
    expect(a.severity).toBe("info");
    expect(a.params).toMatchObject({ level: "LEVEL_2", levelsDone: 1, levelsTotal: 3 });
  });

  it("AFTER_SALES_DUE when contract COMPLETED and no after-sales stage yet", () => {
    const bundle = withContract({
      contracts: [{ id: 1, status: "COMPLETED", sessionStatus: "REGISTERED", stages: [{ title: "LEVEL_1", stageStatus: "COMPLETED", order: 1 }] }],
      salesStages: [{ stage: "DEAL_CLOSED" }],
    });
    const t = types(computeCockpit(bundle, NOW));
    expect(t).toContain("AFTER_SALES_DUE");
    expect(t).not.toContain("CONTRACT_COMPLETED");
  });

  it("CONTRACT_COMPLETED when contract COMPLETED and after-sales already done", () => {
    const bundle = withContract({
      contracts: [{ id: 1, status: "COMPLETED", sessionStatus: "REGISTERED", stages: [{ title: "LEVEL_1", stageStatus: "COMPLETED", order: 1 }] }],
      salesStages: [{ stage: "AFTER_SALES_FOLLOWUP" }],
    });
    const t = types(computeCockpit(bundle, NOW));
    expect(t).toContain("CONTRACT_COMPLETED");
    expect(t).not.toContain("AFTER_SALES_DUE");
  });

  it("a non-sales profile with no matching rule set gets no sales actions", () => {
    // ACCOUNTANT rules arrive in Phase 2; here it must simply not emit sales signals.
    const result = computeCockpit(withContract(), NOW, { profileKey: "ACCOUNTANT" });
    expect(types(result)).not.toContain("SIGNING_AWAITED");
  });
});
```

- [ ] **Step 2: Update the existing terminal tests** (they encode the OLD blackout). In `__tests__/lead.cockpit.test.js`:
  - Replace the `"terminal status FINALIZED → health only, no actions"` test body so it no longer asserts `actions === []`. New body:

```js
  it("FINALIZED with no contract → health only (no sales nag), isTerminal true", () => {
    const bundle = baseBundle({ status: "FINALIZED", salesStages: [{ stage: "DEAL_CLOSED" }] });
    const result = computeCockpit(bundle, NOW);
    expect(types(result)).not.toContain("ADVANCE_STAGE");
    expect(result.health.status).toBe("FINALIZED");
    expect(result.health.isTerminal).toBe(true);
  });
```

  - Change the parametrised terminal test from `it.each(["CONVERTED", "REJECTED", "ARCHIVED"])` to only the DEAD statuses:

```js
  it.each(["REJECTED", "ARCHIVED"])("dead status %s → no actions", (status) => {
    const result = computeCockpit(
      baseBundle({ status, paymentStatus: "OVERDUE", callReminders: [{ time: past(2), status: "IN_PROGRESS" }] }),
      NOW,
    );
    expect(result.actions).toEqual([]);
  });
```

  - Remove the old `AWAIT_SIGNATURE` test (the signal is replaced by `SIGNING_AWAITED`).

- [ ] **Step 3: Run the tests to verify they fail.**

Run: `cd server && npx vitest run src/modules/leads/lead/__tests__/lead.cockpit.test.js`
Expected: FAIL — `health.contract` undefined; new signal types missing; `computeCockpit` ignores `profileKey`.

- [ ] **Step 4: Implement the engine.** Replace the body of `lead.cockpit.js` with the version below (this preserves the existing 9 rules verbatim inside `computeSalesActions`, guarded so the funnel never nags a closed-won deal):

```js
// ── constants (unchanged) ──
const STAGE_ORDER = [ /* … existing 10 entries, unchanged … */ ];
const TERMINAL_STATUSES = ["FINALIZED", "CONVERTED", "REJECTED", "ARCHIVED"]; // health.isTerminal
const DEAD_STATUSES = ["REJECTED", "ARCHIVED"];   // action-silent
const CLOSED_WON = ["FINALIZED", "CONVERTED"];    // funnel rules suppressed; contract rules run
const ACTIVE_STATUSES = ["IN_PROGRESS", "INTERESTED", "NEEDS_IDENTIFIED", "NEGOTIATING"];
const EARLY_STATUSES = ["NEW", "IN_PROGRESS", "INTERESTED", "NEEDS_IDENTIFIED"];
const PRICE_OFFER_STATUSES = ["INTERESTED", "NEEDS_IDENTIFIED", "NEGOTIATING"];
const SEVERITY_RANK = { critical: 0, warning: 1, info: 2 };
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Profile → which rule set to emit. SALES is the default (back-compat + missing profileKey).
const PROFILE_TO_RULESET = {
  NORMAL_SALES: "SALES", PRIMARY_SALES: "SALES", SUPER_SALES: "SALES", CONTACT_INITIATOR: "SALES",
  ADMIN: "SALES", SUPER_ADMIN: "SALES",   // admins see the sales view for now (WORK_STAGE_BLOCKED is a later add)
  ACCOUNTANT: "ACCOUNTANT",               // rules added in Phase 2
};

// helpers arr/toDate/daysBetween/action/isUnhandledStep/countUnhandledObjections/sortActions — UNCHANGED

function firstContract(bundle) {
  return arr(bundle.contracts)[0] ?? null;
}

function contractStageProgress(stages) {
  const list = arr(stages);
  const inProgress = list.find((s) => s.stageStatus === "IN_PROGRESS");
  return {
    currentLevel: inProgress?.title ?? null,
    levelsDone: list.filter((s) => s.stageStatus === "COMPLETED").length,
    levelsTotal: list.length,
  };
}

function computeHealth(bundle) {
  const presentIndices = arr(bundle.salesStages).map((s) => STAGE_ORDER.indexOf(s.stage)).filter((i) => i >= 0);
  const maxIdx = presentIndices.length ? Math.max(...presentIndices) : -1;
  const status = bundle.status ?? null;
  const contract = firstContract(bundle);
  return {
    status,
    isTerminal: TERMINAL_STATUSES.includes(status),
    paymentStatus: bundle.paymentStatus ?? null,
    currentStage: maxIdx >= 0 ? STAGE_ORDER[maxIdx] : null,
    nextStage: maxIdx + 1 < STAGE_ORDER.length ? STAGE_ORDER[maxIdx + 1] : null,
    stageIndex: maxIdx,
    stageCount: STAGE_ORDER.length,
    hasAcceptedPriceOffer: arr(bundle.priceOffers).some((p) => p.isAccepted === true),
    contract: contract
      ? { status: contract.status, sessionStatus: contract.sessionStatus ?? null, ...contractStageProgress(contract.stages) }
      : null,
  };
}

// The SALES rule set: the existing 9 funnel rules (verbatim, minus AWAIT_SIGNATURE), guarded so
// they never nag a closed-won deal, PLUS the 4 post-finalize contract signals.
function computeSalesActions(bundle, now, health, status) {
  const actions = [];
  const contract = firstContract(bundle);

  if (!CLOSED_WON.includes(status)) {
    // ── rules 1-8 EXACTLY as today (CALL_OVERDUE, MEETING_OVERDUE, PAYMENT_OVERDUE,
    //    DISCOVERY_INCOMPLETE, OBJECTION_UNHANDLED, NO_PRICE_OFFER, NO_UPCOMING_TOUCH,
    //    ADVANCE_STAGE). Copy the existing rule bodies here unchanged. ──
  }

  // ── post-finalize / contract signals (run whenever a contract exists) ──
  if (contract) {
    if (contract.sessionStatus === "SIGNING") {
      actions.push(action("SIGNING_AWAITED", "warning", {}, { kind: "GOTO_TAB", capability: null, tabKey: "contracts" }));
    }
    if (contract.status === "COMPLETED") {
      const afterSalesDone = arr(bundle.salesStages).some((s) => s.stage === "AFTER_SALES_FOLLOWUP");
      if (!afterSalesDone) {
        actions.push(action("AFTER_SALES_DUE", "info", {}, { kind: "OPEN_STATUS", capability: "canChangeStatus", tabKey: null }));
      } else {
        actions.push(action("CONTRACT_COMPLETED", "info", {}, { kind: "GOTO_TAB", capability: null, tabKey: "contracts" }));
      }
    } else {
      const p = contractStageProgress(contract.stages);
      if (p.currentLevel) {
        actions.push(action("CONTRACT_STAGE_IN_PROGRESS", "info",
          { level: p.currentLevel, levelsDone: p.levelsDone, levelsTotal: p.levelsTotal },
          { kind: "GOTO_TAB", capability: null, tabKey: "contracts" }));
      }
    }
  }
  return actions;
}

export function computeCockpit(bundle = {}, now, { profileKey } = {}) {
  if (!(now instanceof Date)) {
    throw new TypeError("computeCockpit: `now` (a Date) is required — inject the clock for determinism.");
  }
  const health = computeHealth(bundle);
  const status = bundle.status ?? null;
  if (DEAD_STATUSES.includes(status)) return { health, actions: [] };

  const ruleSet = PROFILE_TO_RULESET[profileKey] ?? "SALES";
  let actions = [];
  if (ruleSet === "SALES") actions = computeSalesActions(bundle, now, health, status);
  // ACCOUNTANT branch added in Phase 2.
  return { health, actions: sortActions(actions) };
}

export const COCKPIT_STAGE_ORDER = STAGE_ORDER;
export const COCKPIT_TERMINAL_STATUSES = TERMINAL_STATUSES;
export const COCKPIT_DEAD_STATUSES = DEAD_STATUSES;
```

> **Implementer note:** the `── rules 1-8 EXACTLY as today ──` block is a literal copy of the current bodies of rules 1 through 8 from the existing `computeCockpit` (lines ~143-245), including the `hasBlocking` computation and the `ADVANCE_STAGE` guard. Do not alter their logic — only move them inside `computeSalesActions` under the `if (!CLOSED_WON.includes(status))` guard. Delete the old rule-9 `AWAIT_SIGNATURE` block.

- [ ] **Step 5: Run tests to verify they pass.**

Run: `cd server && npx vitest run src/modules/leads/lead/__tests__/lead.cockpit.test.js`
Expected: PASS (all existing funnel tests + the new Phase-1 tests).

- [ ] **Step 6: Commit**

```bash
git add server/src/modules/leads/lead/lead.cockpit.js server/src/modules/leads/lead/__tests__/lead.cockpit.test.js
git commit -m "feat(leads/cockpit): profile-aware engine + post-finalize contract signals; kill FINALIZED blackout"
```

---

### Task 3: Pass the active profile from the usecase

**Files:**
- Modify: `server/src/modules/leads/lead/lead.cockpit.usecase.js:35`
- Test: `server/src/modules/leads/lead/__tests__/lead.cockpit.usecase.test.js`

**Interfaces:**
- Consumes: `computeCockpit(bundle, now, { profileKey })` from Task 2.

- [ ] **Step 1: Write the failing test.** Add to `lead.cockpit.usecase.test.js` a case asserting the usecase forwards `authUser.currentProfileKey`:

```js
it("forwards the caller's active profile to the engine", async () => {
  const repo = { findCockpitBundle: async () => ({ status: "FINALIZED", salesStages: [], contracts: [
    { id: 1, status: "IN_PROGRESS", sessionStatus: "SIGNING", stages: [] }] }) };
  const uc = new LeadCockpitUsecase(repo);
  const now = new Date("2026-07-10T12:00:00Z");
  const res = await uc.getLeadCockpit({ clientLeadId: 1, authUser: { id: 9, currentProfileKey: "NORMAL_SALES", permissions: [] }, now });
  expect(res.actions.map((a) => a.type)).toContain("SIGNING_AWAITED");
});
```

- [ ] **Step 2: Run it to confirm it fails.**

Run: `cd server && npx vitest run src/modules/leads/lead/__tests__/lead.cockpit.usecase.test.js`
Expected: FAIL (profileKey not forwarded → default still works, but assert against a profile that would differ; if it passes trivially, keep it as a regression guard).

- [ ] **Step 3: Forward the profile.** Change line 35:

```js
    const computed = computeCockpit(normalizeBundle(bundle), now, { profileKey: authUser?.currentProfileKey });
```

- [ ] **Step 4: Run tests to verify they pass.**

Run: `cd server && npx vitest run src/modules/leads/lead/__tests__/lead.cockpit.usecase.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/leads/lead/lead.cockpit.usecase.js server/src/modules/leads/lead/__tests__/lead.cockpit.usecase.test.js
git commit -m "feat(leads/cockpit): forward active profileKey to the engine"
```

---

### Task 4: Frontend — copy for new signals + contract progress in the health bar

**Files:**
- Modify: `web/src/features/leads/cockpit/config/cockpitActions.jsx`
- Modify: `web/src/features/leads/cockpit/DealHealthBar.jsx`

**Interfaces:**
- Consumes: action types `SIGNING_AWAITED`, `CONTRACT_STAGE_IN_PROGRESS`, `AFTER_SALES_DUE`, `CONTRACT_COMPLETED`; `health.contract = { status, sessionStatus, currentLevel, levelsDone, levelsTotal }`.

- [ ] **Step 1: Add config entries.** In `cockpitActions.jsx`, remove the `AWAIT_SIGNATURE` entry and add:

```jsx
  SIGNING_AWAITED: {
    icon: <IoMdContract />,
    severity: "warning",
    title: () => "Awaiting signature",
    description: () => "The contract is out for signing — follow it up.",
    ctaLabel: "View contract",
  },
  CONTRACT_STAGE_IN_PROGRESS: {
    icon: <MdTimeline />,
    severity: "info",
    title: () => "Contract in production",
    description: (p = {}) => `Stage ${p.level || "—"} (${p.levelsDone ?? 0}/${p.levelsTotal ?? 0}) in progress`,
    ctaLabel: "View contract",
  },
  AFTER_SALES_DUE: {
    icon: <RiAlarmLine />,
    severity: "info",
    title: () => "After-sales follow-up due",
    description: () => "Delivery is complete — do the after-sales follow-up.",
    ctaLabel: "Change status",
  },
  CONTRACT_COMPLETED: {
    icon: <MdCheckCircle />,
    severity: "info",
    title: () => "Delivery complete",
    description: () => "This contract is fully delivered.",
    ctaLabel: "View contract",
  },
```

Add `import { MdCheckCircle } from "react-icons/md";` to the `react-icons/md` import group.

- [ ] **Step 2: Show contract progress in `DealHealthBar`.** After the sales `{completed}/{count}` block, when `health.contract` exists, render the contract level line. Insert inside the "Stage progression" `<Box>`, after the existing `<Typography>` that shows `Next:`:

```jsx
          {health.contract && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: "block" }}>
              {health.contract.status === "COMPLETED"
                ? "Contract: delivered"
                : `Contract: ${health.contract.currentLevel || "—"} (${health.contract.levelsDone}/${health.contract.levelsTotal})`}
            </Typography>
          )}
```

- [ ] **Step 3: Build the frontend to verify it compiles.**

Run: `cd web && npx next build`
Expected: build succeeds (no missing import / syntax error).

- [ ] **Step 4: Commit**

```bash
git add web/src/features/leads/cockpit/config/cockpitActions.jsx web/src/features/leads/cockpit/DealHealthBar.jsx
git commit -m "feat(web/cockpit): copy for post-finalize signals + contract progress in health bar"
```

---

### Task 5: Integration test — the cockpit endpoint no longer blacks out at FINALIZED

**Files:**
- Modify: `server/src/modules/leads/lead/__tests__/lead.cockpit.route.integration.test.js`

- [ ] **Step 1: Add a test** that a FINALIZED lead with an `IN_PROGRESS` contract returns non-empty `actions` including `CONTRACT_STAGE_IN_PROGRESS`, mirroring the existing integration harness in that file (reuse its app/bootstrap + seeding helpers).

- [ ] **Step 2: Run it.**

Run: `cd server && npx vitest run src/modules/leads/lead/__tests__/lead.cockpit.route.integration.test.js`
Expected: PASS

- [ ] **Step 3: Run the whole lead cockpit suite.**

Run: `cd server && npx vitest run src/modules/leads/lead/__tests__/`
Expected: PASS (all cockpit unit + usecase + integration tests green).

- [ ] **Step 4: Commit**

```bash
git add server/src/modules/leads/lead/__tests__/lead.cockpit.route.integration.test.js
git commit -m "test(leads/cockpit): finalized deal with a contract still returns actions"
```

---

## PHASE 2 — Accountant

### Task 6: Accountant rule set + payment health (derived from ContractPayment)

**Files:**
- Modify: `server/src/modules/leads/lead/lead.repo.js` (contract select — add `payments`)
- Modify: `server/src/modules/leads/lead/lead.cockpit.js`
- Test: `server/src/modules/leads/lead/__tests__/lead.cockpit.test.js`

**Interfaces:**
- Produces: action types `DOWNPAYMENT_DUE` (critical), `PAYMENT_DUE` (warning); `health.payment = { outstandingCount, hasDue, downpaymentReceived }`.

- [ ] **Step 1: Add `payments` to the contract select** (Task 1's block), read-only for signal derivation:

```js
      stages: { select: { title: true, stageStatus: true, order: true } },
      payments: { select: { status: true, paymentCondition: true } },
```

- [ ] **Step 2: Write the failing tests.** Append to `lead.cockpit.test.js`:

```js
describe("computeCockpit — accountant (Phase 2)", () => {
  const acc = (payments) =>
    baseBundle({
      status: "FINALIZED",
      contracts: [{ id: 1, status: "IN_PROGRESS", sessionStatus: "REGISTERED", stages: [], payments }],
    });

  it("DOWNPAYMENT_DUE (critical) when the SIGNATURE payment is not yet received", () => {
    const r = computeCockpit(acc([{ status: "DUE", paymentCondition: "SIGNATURE" }]), NOW, { profileKey: "ACCOUNTANT" });
    const a = r.actions.find((x) => x.type === "DOWNPAYMENT_DUE");
    expect(a.severity).toBe("critical");
    expect(a.cta).toMatchObject({ kind: "OPEN_PAYMENT", capability: "canAddPayment", tabKey: "payments" });
  });

  it("PAYMENT_DUE (warning) for a non-signature DUE payment", () => {
    const r = computeCockpit(acc([{ status: "DUE", paymentCondition: "INSTALLMENT" }]), NOW, { profileKey: "ACCOUNTANT" });
    expect(r.actions.map((x) => x.type)).toContain("PAYMENT_DUE");
  });

  it("no payment actions when nothing is DUE", () => {
    const r = computeCockpit(acc([{ status: "RECEIVED", paymentCondition: "SIGNATURE" }]), NOW, { profileKey: "ACCOUNTANT" });
    expect(r.actions).toEqual([]);
  });

  it("a SALES profile does NOT see accountant signals on the same bundle", () => {
    const r = computeCockpit(acc([{ status: "DUE", paymentCondition: "SIGNATURE" }]), NOW, { profileKey: "NORMAL_SALES" });
    expect(r.actions.map((x) => x.type)).not.toContain("DOWNPAYMENT_DUE");
  });
});
```

- [ ] **Step 3: Run to confirm failure.**

Run: `cd server && npx vitest run src/modules/leads/lead/__tests__/lead.cockpit.test.js -t accountant`
Expected: FAIL (no ACCOUNTANT branch).

- [ ] **Step 4: Implement the accountant rule set** in `lead.cockpit.js`:

```js
function computeAccountantActions(bundle) {
  const contract = firstContract(bundle);
  const payments = arr(contract?.payments);
  const actions = [];
  const sigDue = payments.find((p) => p.paymentCondition === "SIGNATURE" && (p.status === "DUE" || p.status === "NOT_DUE"));
  if (sigDue) {
    actions.push(action("DOWNPAYMENT_DUE", "critical", {}, { kind: "OPEN_PAYMENT", capability: "canAddPayment", tabKey: "payments" }));
  }
  const otherDue = payments.filter((p) => p.status === "DUE" && p.paymentCondition !== "SIGNATURE");
  if (otherDue.length) {
    actions.push(action("PAYMENT_DUE", "warning", { count: otherDue.length }, { kind: "OPEN_PAYMENT", capability: "canAddPayment", tabKey: "payments" }));
  }
  return actions;
}
```

Add the payment-health block to `computeHealth` (inside the return object):

```js
    payment: (() => {
      const pays = arr(firstContract(bundle)?.payments);
      return {
        outstandingCount: pays.filter((p) => p.status === "DUE").length,
        hasDue: pays.some((p) => p.status === "DUE"),
        downpaymentReceived: pays.some((p) => p.paymentCondition === "SIGNATURE" && (p.status === "RECEIVED" || p.status === "TRANSFERRED")),
      };
    })(),
```

Wire the branch in `computeCockpit`:

```js
  if (ruleSet === "SALES") actions = computeSalesActions(bundle, now, health, status);
  else if (ruleSet === "ACCOUNTANT") actions = computeAccountantActions(bundle);
```

- [ ] **Step 5: Run tests to verify they pass.**

Run: `cd server && npx vitest run src/modules/leads/lead/__tests__/lead.cockpit.test.js`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add server/src/modules/leads/lead/lead.repo.js server/src/modules/leads/lead/lead.cockpit.js server/src/modules/leads/lead/__tests__/lead.cockpit.test.js
git commit -m "feat(leads/cockpit): accountant rule set (DOWNPAYMENT_DUE/PAYMENT_DUE) from ContractPayment"
```

---

### Task 7: Frontend — accountant signal copy

**Files:**
- Modify: `web/src/features/leads/cockpit/config/cockpitActions.jsx`

- [ ] **Step 1: Add config entries.**

```jsx
  DOWNPAYMENT_DUE: {
    icon: <FaMoneyBillWave />,
    severity: "critical",
    title: () => "Down-payment due",
    description: () => "The signature/down-payment hasn't been recorded yet.",
    ctaLabel: "Record payment",
  },
  PAYMENT_DUE: {
    icon: <PiCurrencyDollarSimpleLight />,
    severity: "warning",
    title: () => "Payment due",
    description: (p = {}) => `${p.count || 0} payment(s) awaiting collection`,
    ctaLabel: "Record payment",
  },
```

- [ ] **Step 2: Build.**

Run: `cd web && npx next build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add web/src/features/leads/cockpit/config/cockpitActions.jsx
git commit -m "feat(web/cockpit): accountant payment signal copy"
```

---

## PHASE 3 — Designers / executor (own surface, no IDOR widening)

### Task 8: Work-stage next-action engine (Assignment-scoped)

**Files:**
- Create: `server/src/modules/leads/lead/lead.workstage-cockpit.js`
- Test: `server/src/modules/leads/lead/__tests__/lead.workstage-cockpit.test.js`
- Modify: the designer work-stage read usecase/repo that backs `PreviewWorkStage` (attach `workStageActions` for the caller).

**Interfaces:**
- Produces: `computeWorkStageActions({ assignments }, now) → Array<{ type:'WORK_STAGE_ASSIGNED_TO_YOU', severity, params:{ projectType, level }, cta }>`. `assignments` = the CALLER's own assignments on this lead's projects: `[{ projectType, contractLevel, projectStatus, stageStatus }]`.

- [ ] **Step 1: Write the failing test** (`lead.workstage-cockpit.test.js`):

```js
import { describe, it, expect } from "vitest";
import { computeWorkStageActions } from "../lead.workstage-cockpit.js";

const NOW = new Date("2026-07-10T12:00:00Z");

it("emits WORK_STAGE_ASSIGNED_TO_YOU for an in-progress assigned stage", () => {
  const r = computeWorkStageActions({ assignments: [
    { projectType: "3D_Designer", contractLevel: "LEVEL_3", projectStatus: "IN_PROGRESS", stageStatus: "IN_PROGRESS" },
  ] }, NOW);
  expect(r).toHaveLength(1);
  expect(r[0]).toMatchObject({ type: "WORK_STAGE_ASSIGNED_TO_YOU", params: { projectType: "3D_Designer", level: "LEVEL_3" } });
});

it("ignores completed / not-started stages", () => {
  const r = computeWorkStageActions({ assignments: [
    { projectType: "2D_Study", contractLevel: "LEVEL_2", projectStatus: "COMPLETED", stageStatus: "COMPLETED" },
  ] }, NOW);
  expect(r).toEqual([]);
});

it("returns [] when the caller has no assignments", () => {
  expect(computeWorkStageActions({ assignments: [] }, NOW)).toEqual([]);
});
```

- [ ] **Step 2: Run to confirm failure.**

Run: `cd server && npx vitest run src/modules/leads/lead/__tests__/lead.workstage-cockpit.test.js`
Expected: FAIL (module missing).

- [ ] **Step 3: Implement** `lead.workstage-cockpit.js`:

```js
// Pure work-stage next-action engine for designers/executor. Scoped to the CALLER's own
// assignments — the read layer must only pass assignments where Assignment.userId === caller.
function arr(v) { return Array.isArray(v) ? v : []; }

export function computeWorkStageActions({ assignments } = {}, now) {
  if (!(now instanceof Date)) throw new TypeError("computeWorkStageActions: `now` (a Date) is required.");
  return arr(assignments)
    .filter((a) => a.projectStatus === "IN_PROGRESS" || a.stageStatus === "IN_PROGRESS")
    .map((a) => ({
      type: "WORK_STAGE_ASSIGNED_TO_YOU",
      severity: "warning",
      params: { projectType: a.projectType, level: a.contractLevel },
      cta: { kind: "GOTO_WORKSTAGE", capability: null, tabKey: null },
    }));
}
```

- [ ] **Step 4: Run tests to verify they pass.**

Run: `cd server && npx vitest run src/modules/leads/lead/__tests__/lead.workstage-cockpit.test.js`
Expected: PASS

- [ ] **Step 5: Wire into the designer read path.** In the usecase that backs `PreviewWorkStage`, load the caller's own `Assignment` rows for this lead's projects (repo query: `where: { userId: authUser.id, project: { clientLeadId } }`, select `project.type`, `project.status`, and the related contract stage's `title`/`stageStatus`), map to the `{ projectType, contractLevel, projectStatus, stageStatus }` shape, and attach `workStageActions: computeWorkStageActions({ assignments }, new Date())` to the response. **Do not** touch `checkIfUserCanAccessLead`; this is a designer-owned, assignment-scoped read.

- [ ] **Step 6: Add an IDOR guard test** — a designer with no assignment on the lead's projects gets `workStageActions: []` and cannot read lead-scoped cockpit data. Run the module + read-path tests.

Run: `cd server && npx vitest run src/modules/leads/lead/__tests__/`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add server/src/modules/leads/lead/lead.workstage-cockpit.js server/src/modules/leads/lead/__tests__/lead.workstage-cockpit.test.js server/src/modules/leads/lead/*.js
git commit -m "feat(leads/cockpit): assignment-scoped work-stage next-action for designers"
```

---

### Task 9: Frontend — designer work-stage next-action strip

**Files:**
- Create: `web/src/features/leads/cockpit/WorkStageCockpit.jsx`
- Modify: `PreviewWorkStage` to render it from `workStageActions`.

**Interfaces:**
- Consumes: `workStageActions: [{ type:'WORK_STAGE_ASSIGNED_TO_YOU', severity, params:{ projectType, level } }]`.

- [ ] **Step 1: Create `WorkStageCockpit.jsx`** — a compact list mirroring `SalesDealCockpit`'s row styling, rendering each action's title/description from a small local copy map:

```jsx
"use client";
import { Box, Stack, Typography } from "@mui/material";
import { MdTimeline } from "react-icons/md";

const LABEL = { "3D_Designer": "3D design", "2D_Study": "2D study", "2D_Final_Plans": "2D final plans", "2D_Quantity_Calculation": "2D quantities" };

export function WorkStageCockpit({ actions = [] }) {
  if (!actions.length) return null;
  return (
    <Stack spacing={1}>
      {actions.map((a, i) => (
        <Box key={i} sx={{ p: 1.5, borderRadius: 2, border: "1px solid", borderColor: "divider", display: "flex", gap: 1, alignItems: "center" }}>
          <MdTimeline />
          <Typography variant="body2" fontWeight={700}>
            {`Your ${LABEL[a.params?.projectType] || a.params?.projectType} stage (${a.params?.level}) is in progress`}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
}
```

- [ ] **Step 2: Render it in `PreviewWorkStage`** near the top, passing `actions={data.workStageActions}`.

- [ ] **Step 3: Build.**

Run: `cd web && npx next build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add web/src/features/leads/cockpit/WorkStageCockpit.jsx web/src/app/**/PreviewWorkStage*.jsx
git commit -m "feat(web/cockpit): designer work-stage next-action strip"
```

---

## Final verification

- [ ] Backend: `cd server && npx vitest run src/modules/leads/lead/__tests__/` → all green.
- [ ] Frontend: `cd web && npx next build` → succeeds.
- [ ] Manual smoke (the triggering bug): open the `1/10 + Finalized + Pending` deal → cockpit now shows contract/signing/payment signals instead of "nothing to action"; the health bar shows the contract `LEVEL_N/7` line.
- [ ] Update `PROJECT_STATE.md` with the new capability.

---

## Self-review notes

- **Spec coverage:** D1 per-deal (all tasks) · D2 extend pure engine (Task 2) · D3 profile-scoped sets (Tasks 2,6) · D4 derive payment from ContractPayment, no migration (Task 6) · D5 phasing (P1/P2/P3) · D6 no authz change P1/P2, own-surface P3 (Task 8 note). Study gaps: G1 blackout (Task 2) · G2 inert paymentStatus bypassed (Task 6) · G3 sales-only (Tasks 6,8) · G4 two-track reconcile (Tasks 2,4 health.contract) · G5 after-sales (Task 2 AFTER_SALES_DUE) · G6 AWAIT_SIGNATURE proxy → SIGNING_AWAITED (Task 2).
- **Placeholders:** the one `── rules 1-8 EXACTLY as today ──` marker is a deliberate verbatim-copy instruction (moving unchanged code), with an explicit implementer note — not an unspecified behavior.
- **Type consistency:** `health.contract`/`health.payment` shapes match between engine (Tasks 2,6), DTO passthrough, and frontend (Tasks 4,7). `computeWorkStageActions` shape matches between backend (Task 8) and frontend (Task 9).
