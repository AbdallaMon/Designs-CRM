# Profile-Aware Deal Cockpit — implementation design

**Date:** 2026-07-11
**Branch:** `feat/audit-log-sales-admin`
**Type:** Implementation design (target build). Seeds a `writing-plans` implementation plan.
**Depends on:** [Deal Lifecycle Responsibility Model study](./2026-07-11-deal-lifecycle-responsibility-model-study.md) (the "why" + phase spine + signal catalog + gaps register).
**Status:** Draft for review.

---

## 1. Goal & locked decisions

**Goal:** every person sees *their own* "what do I do next" on the deal page — driven by their **active profile** — instead of the cockpit going dark at `FINALIZED` and only ever speaking to the sales owner.

**Decisions locked with the user (do not relitigate):**

| # | Decision | Choice |
|---|---|---|
| D1 | Delivery surface | **Per-deal cockpit on the deal page**, rendered for the viewer's active profile. (A cross-deal "my next actions" dashboard is explicitly deferred.) |
| D2 | Engine shape | **Extend the existing pure `computeCockpit`**, don't replace it. Add `profileKey` + a widened language-neutral bundle. |
| D3 | Rule organization | **Profile-scoped rule sets** (sales / accountant / designer / admin); the engine emits only the sets for the active profile. |
| D4 | Payment truth | **Derive at compute-time from `ContractPayment.status`** rows. Do **not** migrate/recompute `ClientLead.paymentStatus`, do **not** touch the frozen contract service. |
| D5 | Phasing | **P1 sales post-finalize → P2 accountant → P3 designers.** Each independently shippable + tested. |
| D6 | Authorization | P1/P2 need **no authz change** (sales owner, PRIMARY, SUPER_SALES, ADMIN, ACCOUNTANT already pass `checkIfUserCanAccessLead`). Designers (P3) get their slice on their **own** `PreviewWorkStage` surface — **no widening of lead IDOR scope**. |

**Constraints:** contract legacy service frozen (read-only for signals); authorization stays profile + permission-code + object-scope; cockpit engine stays pure and deterministic (clock injected); no schema change (D4).

---

## 2. Access reality (why P1/P2 are pure engine work)

`hasFullScope` ([lead.repo.js:27,37-42](../../../server/src/modules/leads/lead/lead.repo.js)):

```js
const FULL_SCOPE_ROLES = ["ADMIN", "SUPER_ADMIN", "ACCOUNTANT"];
hasFullScope: currentProfileKey === "SUPER_SALES" || isAdminTier || FULL_SCOPE_ROLES.includes(role)
```

| Profile | Passes `checkIfUserCanAccessLead`? | Cockpit today | This design |
|---|---|---|---|
| NORMAL_SALES / PRIMARY_SALES (owner) | yes (own lead) | full sales cockpit | + post-finalize sales signals (P1) |
| SUPER_SALES | yes (all leads) | full sales cockpit | same as sales, all leads (P1) |
| ADMIN / SUPER_ADMIN | yes (all) | full cockpit | + admin unblock signals (P1) |
| ACCOUNTANT | **yes (all — role full-scope)** | sees sales cockpit (irrelevant to them) | **accountant rule set** (P2) |
| DESIGNER_3D / 2D, EXECUTOR_2D | **no** (never the lead `userId`) | routed to `PreviewWorkStage`, no cockpit | work-stage mini-action on `PreviewWorkStage` (P3) |
| CONTACT_INITIATOR | yes (view, incl. NEW pool) | sales cockpit | P0 `NEEDS_FIRST_CONTACT` (optional, P1) |

So the accountant already has read access to every lead — P2 is purely "emit accountant signals when this profile is active." Only P3 touches access, and it does so on the designer's existing surface.

---

## 3. Architecture

### 3.1 Engine signature

```js
// lead.cockpit.js — pure, deterministic (clock injected). Add profileKey.
computeCockpit(bundle, now, { profileKey }) → { health, actions }
```

- `profileKey` is the caller's **active** `currentProfileKey` (from `req.auth`, already derived in the auth middleware). Missing key (transitional token, study G7) → treat as the base-role profile / sales default.
- The function stays pure: `profileKey` is just another input; no I/O added.

### 3.2 Rule-set registry (D3)

Replace the flat rule list with profile-scoped sets. Each rule declares the profiles it targets; the engine runs only rules whose target set includes the active profile.

```
RULE_SETS = {
  SALES:      [CALL_OVERDUE, MEETING_OVERDUE, DISCOVERY_INCOMPLETE, OBJECTION_UNHANDLED,
               NO_PRICE_OFFER, NO_UPCOMING_TOUCH, ADVANCE_STAGE, SIGNING_AWAITED,
               CONTRACT_STAGE_IN_PROGRESS, AFTER_SALES_DUE, CONTRACT_COMPLETED],
  ACCOUNTANT: [DOWNPAYMENT_DUE, PAYMENT_DUE, CONTRACT_COMPLETED],
  ADMIN:      [ ...SALES rules (visibility) , WORK_STAGE_BLOCKED ],
  DESIGNER:   [WORK_STAGE_ASSIGNED_TO_YOU]   // consumed by the PreviewWorkStage surface (P3)
}
PROFILE_TO_RULESET = {
  NORMAL_SALES: SALES, PRIMARY_SALES: SALES, SUPER_SALES: SALES,
  ADMIN: ADMIN, SUPER_ADMIN: ADMIN, ACCOUNTANT: ACCOUNTANT,
  DESIGNER_3D: DESIGNER, DESIGNER_2D: DESIGNER, EXECUTOR_2D: DESIGNER,
  CONTACT_INITIATOR: SALES,
}
```

- Severity sort + "critical/warning blocks info advance" logic is unchanged; it just runs over the active profile's emitted actions.
- Every action still carries `{ type, severity, params, cta:{ kind, capability, tabKey } }`; CTA still gated FE-side by `capabilities[cta.capability]`.

### 3.3 Widened bundle (`COCKPIT_BUNDLE_SELECT`)

Add, to the existing narrow select ([lead.repo.js:991-1033](../../../server/src/modules/leads/lead/lead.repo.js)):

- Active `Contract` (the single `IN_PROGRESS`, matching the existing lead-detail select): `status`, `sessionStatus`.
- Its `ContractStage[]`: `title` (LEVEL_N), `order`, `stageStatus`.
- Its `ContractPayment[]`: `status`, `paymentCondition`, `amount`/`amountLeft` (for `DUE` detection) — **read-only, for signal derivation (D4)**.
- For P3 only: the caller's `Assignment` rows on this lead's projects (`project.type`, `project.status`, `Assignment.userId`).

All language-neutral primitives — no free text reaches the engine (same discipline as the VERSA reduction).

### 3.4 Health payload (reconcile the "N/10", study G4)

`computeHealth` gains a contract-progress block so the FE can stop showing the misleading sales `1/10` post-finalize:

```
health.sales    = { currentStage, nextStage, stageIndex, stageCount }   // existing
health.contract = { status, sessionStatus, currentLevel, levelsTotal, levelsDone } // new, null pre-contract
health.payment  = { outstandingCount, hasDue, downpaymentReceived }     // new, derived from ContractPayment
```

FE display rule (P1): pre-finalize → sales `N/10`; once a contract exists → contract `LEVEL_N/7`. Exact visual is a UI-round detail (study §7.6), but the data is supplied now.

### 3.5 Remove the terminal blackout (study G1)

```js
// was: if (TERMINAL_STATUSES.includes(status)) return { health, actions: [] };
// now: only truly-dead states are silent.
const DEAD_STATUSES = ["REJECTED", "ARCHIVED"];
if (DEAD_STATUSES.includes(status)) return { health, actions: [] };
// FINALIZED / CONVERTED now fall through into the contract/payment/after-sales rules.
```

---

## 4. Phase 1 — Sales, post-finalize (no authz change)

**New signals** (sales rule set):

| Signal | Sev | Fires when | CTA (capability / tab) |
|---|---|---|---|
| `SIGNING_AWAITED` | warning | `contract.sessionStatus === "SIGNING"` | GOTO contracts (`null`) |
| `CONTRACT_STAGE_IN_PROGRESS` | info | a contract exists; shows `LEVEL_N/7` | GOTO contracts (`null`) |
| `AFTER_SALES_DUE` | info | `contract.status === "COMPLETED"` ∧ no `AFTER_SALES_FOLLOWUP` sales stage | OPEN_STATUS (`canChangeStatus`) |
| `CONTRACT_COMPLETED` | info | `contract.status === "COMPLETED"` | GOTO contracts (`null`) |

**Changes:** engine signature (§3.1), rule registry (§3.2, sales set only), bundle +contract/stage (§3.3), health +contract/payment (§3.4), blackout removal (§3.5). Replace `AWAIT_SIGNATURE`'s proxy with `SIGNING_AWAITED` (study G6).

**Frontend:** add config entries for the 4 new `type`s in `COCKPIT_ACTION_CONFIG` ([cockpitActions.jsx](../../../web/src/features/leads/cockpit/config/cockpitActions.jsx)); update `DealHealthBar` ([DealHealthBar.jsx](../../../web/src/features/leads/cockpit/DealHealthBar.jsx)) to render contract `LEVEL_N/7` when `health.contract` is present.

**Tests:** extend `lead.cockpit.test.js` — finalized deal with a contract emits the new signals (proves the blackout is gone); the exact `1/10 + Finalized + Pending` bundle now yields actionable signals; dead statuses still return `[]`.

---

## 5. Phase 2 — Accountant (no authz change)

**New signals** (accountant rule set), all derived from `ContractPayment` (D4):

| Signal | Sev | Fires when | CTA |
|---|---|---|---|
| `DOWNPAYMENT_DUE` | critical | `ContractPayment(condition=SIGNATURE).status ∈ {DUE, NOT_DUE}` and contract signed | OPEN_PAYMENT (`canAddPayment`/`PAYMENT_MANAGE`) |
| `PAYMENT_DUE` | warning | any `ContractPayment.status === "DUE"` | OPEN_PAYMENT (`PAYMENT_MANAGE`) |

**Changes:** accountant entry in `PROFILE_TO_RULESET`; bundle already carries `ContractPayment` from P1 §3.3; no schema/migration. `ClientLead.paymentStatus` is ignored for these signals (the dead `PAYMENT_OVERDUE` rule can be retired or left inert).

**Frontend:** config entries for the 2 new `type`s. When an ACCOUNTANT opens a deal they now see payment actions instead of an irrelevant sales list.

**Tests:** accountant profile + a `DUE` ContractPayment → `PAYMENT_DUE`; SIGNATURE payment `DUE` → `DOWNPAYMENT_DUE`; sales profile on the same bundle does **not** see accountant signals (profile-scoping proof).

---

## 6. Phase 3 — Designers / executor (own surface, isolated authz)

**Surface:** the existing `PreviewWorkStage` (`web/src/app/(auth)/dashboard/(dashboard)/deals/[id]/page.jsx:14-23`) gains a small next-action strip — **not** the lead cockpit.

**Signal:** `WORK_STAGE_ASSIGNED_TO_YOU` (info→warning) — a `Project` of a type assigned to the caller (`AutoAssignment`/`Assignment`) whose contract stage is `IN_PROGRESS`.

**Access:** driven by the caller's **own** `Assignment` rows (`Assignment.userId === me`) via a **work-stage/project-scoped** endpoint the designer already reaches — **no change to `checkIfUserCanAccessLead`, no lead-IDOR widening.** The designer sees only work-stages assigned to them.

**Data source:** `LEVEL_N → project type` map + `AutoAssignment` (study §3 P5): `LEVEL_2→2D_Study, LEVEL_3→3D_Designer, LEVEL_4→2D_Final_Plans, LEVEL_5→2D_Quantity_Calculation`.

**Tests:** designer with an assigned `IN_PROGRESS` project → sees their work-stage action; a designer **not** assigned to this lead's projects still cannot load lead-scoped data (IDOR unchanged); the action is scoped to the caller's assignments only.

---

## 7. Cross-cutting

- **Message codes:** each new signal `type` is a language-neutral code; add FE English copy in `cockpitActions.jsx` (mirrors the message-code contract; single English source per project rule).
- **Capabilities:** new CTAs reuse existing capability keys where possible (`canChangeStatus`, `canAddPayment` → `PAYMENT_MANAGE`); no new permission codes needed for P1/P2.
- **Determinism:** clock stays injected; all new rules are pure functions of the bundle + `now` + `profileKey`.
- **Backward-compat:** the endpoint shape (`{ health, actions, capabilities }`) is unchanged; `health` gains fields (additive). Existing FE keeps working; new fields are opt-in.

---

## 8. Non-goals (this build)

- No cross-deal "my next actions" dashboard (D1 — deferred).
- No `ClientLead.paymentStatus` recompute/migration (D4).
- No change to contract-stage progression logic (frozen service).
- No new permission codes / role changes for P1/P2; no lead-IDOR widening for P3.
- No UI visual redesign beyond wiring the new signal copy + the `LEVEL_N/7` progress display.

---

## 9. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Widened bundle over-fetches / N+1 | Keep the narrow `select`; one extra `Contract` include with its stages/payments, matching the existing lead-detail pattern. |
| Profile-scoping regresses the sales cockpit | Sales rule set = today's 9 rules verbatim + additions; snapshot tests on existing cases must stay green. |
| Transitional token lacks `currentProfileKey` | Default to sales rule set (study G7); never crash on missing profile. |
| Multi-contract lead (study §7.4) | P1 uses the single `IN_PROGRESS` contract like lead-detail today; multi-contract deferred, documented. |
| Designer surface accidentally leaks lead data | P3 strictly Assignment-scoped on the designer's own endpoint; explicit IDOR test. |

---

## 10. Deliverable sequence

1. `writing-plans` → implementation plan for **Phase 1** (engine signature + rule registry + bundle + health + blackout removal + FE copy + tests).
2. Phase 2 plan (accountant rule set + payment derivation).
3. Phase 3 plan (designer work-stage mini-action, isolated authz).

Each phase is a separate plan + PR so it ships and is verified independently.
