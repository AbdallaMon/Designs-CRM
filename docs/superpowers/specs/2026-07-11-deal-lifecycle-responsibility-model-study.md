# Deal Lifecycle Responsibility Model — who does what next, and how the system knows

**Date:** 2026-07-11
**Branch:** `feat/audit-log-sales-admin` (study only; no code change this round)
**Type:** Domain study (current + gaps + target). **No UI is designed here** — UI is a later round.
**Status:** Draft for review.

---

## §0. The triggering problem & scope

### The screen that started this

A deal/lead detail "cockpit" was observed showing, all at once:

- **`1/10`** — sales funnel at stage 1 of 10 (only `INITIAL_CONTACT` done; next = `SOCIAL_MEDIA_CHECK`).
- **`Next: <social-media check>`** — the funnel's next-stage hint.
- **`Finalized`** — lead status chip.
- **`Payment: Pending`** — payment chip.
- **`This deal is closed — nothing to action.`** — the cockpit's empty state.

This is self-contradictory on its face: a deal that is *Finalized* (closed/won) but still sitting at *sales stage 1/10*, with payment *Pending*, being told there is *nothing to do*. In reality, a finalized deal is exactly where the heavy work begins — contract signing, `LEVEL_1..7` production stages, payment collection, designer assignments, delivery, after-sales.

### Root cause (confirmed in code)

The "Next"/action list is produced by a **real backend rules engine** — `computeCockpit(bundle, now)` in [server/src/modules/leads/lead/lead.cockpit.js](../../../server/src/modules/leads/lead/lead.cockpit.js). That engine has one short-circuit:

```js
// lead.cockpit.js:132-134
if (TERMINAL_STATUSES.includes(status)) {   // FINALIZED, CONVERTED, REJECTED, ARCHIVED
  return { health, actions: [] };
}
```

So the instant a lead's `status` becomes `FINALIZED`, the cockpit returns **zero actions** and the frontend renders "This deal is closed — nothing to action" ([SalesDealCockpit.jsx:256-258](../../../web/src/features/leads/cockpit/SalesDealCockpit.jsx)). The engine models the **pre-sale sales funnel for the sales owner** and stops. It has no awareness of the contract, the `LEVEL_1..7` work-stages, real payment state, or any role other than the sales owner.

### Two independent "stage" systems (must not be conflated)

| Track | What it is | Where | Progression driver |
|---|---|---|---|
| **Sales funnel** (the "1/10") | 10 `SalesStageType` steps | `SalesStage` rows, one per reached stage | Manual `POST /:id/actions/set-stage` |
| **Contract work-stages** | 7 `ContractStage` rows `LEVEL_1..LEVEL_7` | `ContractStage` per contract | Automatic — payments + project completion |

The screen shows only the **first** track's counter, even after the deal has entered the **second** track's world. The two are never reconciled anywhere in code.

### Scope of this study

- **In scope:** map who is responsible for the *next action* at every phase of the deal's life, across **all profiles**, how the system *knows* that responsibility, the **current** behavior, the **gaps/contradictions**, and the **target** responsibility model.
- **Out of scope this round:** the cockpit UI redesign, copy, layout, and the actual engine implementation. Those follow in a later round, seeded by §5's signal catalog.
- **Non-negotiable constraints:** PDF logic is frozen; the contract legacy service (`contract-services.js`) is frozen business logic — the target may *read* its state to emit signals but must not change its progression logic; authorization stays profile + permission-code + object-scope (never role-alone).

---

## §1. The lifecycle spine

This is the piece that **does not exist anywhere today** — a single ordered lifecycle that both tracks hang off. It is synthesized from: the sales funnel (`SalesStageType`), lead `status`, `Contract.sessionStatus`, `ContractStage` `LEVEL_1..7`, the payment models, and the after-sales stage.

| # | Phase | Entered when | Primary track | Key state |
|---|---|---|---|---|
| **P0** | **Intake / assignment** | Lead created, `status = NEW`, no `SalesStage` rows (`NOT_INITIATED`, `stageIndex = -1`) | Sales funnel | `ClientLead.status = NEW`, `userId` unset/just-set |
| **P1** | **Discovery funnel** | Stages `INITIAL_CONTACT → … → HANDLE_OBJECTIONS`; `status` in `IN_PROGRESS / INTERESTED / NEEDS_IDENTIFIED / NEGOTIATING` | Sales funnel | `SalesStage` rows accumulate; SPIN + VERSA data |
| **P2** | **Price offer & negotiation** | A price offer is expected/sent; `status` in `INTERESTED / NEEDS_IDENTIFIED / NEGOTIATING` | Sales funnel | `PriceOffer` rows; `isAccepted` |
| **P3** | **Closing & signature** | Offer accepted; `DEAL_CLOSED` stage; contract created; `Contract.sessionStatus INITIAL → SIGNING → REGISTERED`; `status → FINALIZED` | Sales → Contract handoff | `hasAcceptedPriceOffer`, `Contract.sessionStatus`, `status = FINALIZED` |
| **P4** | **Contract activation (down-payment)** | Contract signed; the `SIGNATURE`-condition `ContractPayment` becomes `DUE` then `RECEIVED` → `LEVEL_1` COMPLETED, `LEVEL_2` IN_PROGRESS | Contract | `ContractPayment(condition=SIGNATURE).status`, `ContractStage LEVEL_1/LEVEL_2` |
| **P5** | **Production work-stages** | `LEVEL_2..LEVEL_5` cycle: each spawns a typed `Project`, assigned to a specific user, advanced when that project is `COMPLETED` | Contract | `ContractStage.stageStatus`, `Project.status`, `Assignment` |
| **P6** | **Payment collection (ongoing)** | `ContractPayment` rows go `NOT_DUE → DUE → RECEIVED/TRANSFERRED` throughout P4–P7 | Finance (cross-cutting) | `ContractPayment.status`, `ClientLead.paymentStatus` |
| **P7** | **Contract completion** | No open stages (`IN_PROGRESS/NOT_STARTED`) **and** no outstanding payments (`DUE/NOT_DUE`) → `Contract.status = COMPLETED` (automatic) | Contract | `Contract.status = COMPLETED` |
| **P8** | **After-sales follow-up** | Sales funnel's last stage `AFTER_SALES_FOLLOWUP` set manually | Sales funnel | `SalesStage(AFTER_SALES_FOLLOWUP)` |

**Critical observation:** the cockpit engine covers **only P0–P3** (and only for the sales owner). **P4–P8 are entirely invisible to it** because they all occur after `status = FINALIZED`, which triggers the terminal blackout. The observed screen is a P4+ deal being rendered with a P0–P3-only engine.

---

## §2. Identity = the active profile (not role flags)

> **Correction incorporated:** there is **no `isPrimary` / `isSuperSales` decision in the model.** A user *is* Primary Sales because their **profile** is `PRIMARY_SALES`; *is* Super Sales because their profile is `SUPER_SALES`. The flags survive only as legacy-derivation input for un-backfilled rows. Everything the study says about "who sees what" keys off the **currently active profile**.

### The profile model

- **Catalog:** 11 code-defined profiles in [packages/shared/constants/access/profiles.js:35-47](../../../packages/shared/constants/access/profiles.js). `PROFILE_META` (`:56-68`) gives label + `baseRole`.
- **What a user may hold:** `UserProfile` rows (many per user) — [schema.prisma:2431](../../../packages/db/prisma/schema.prisma) (comment: *"replaces subRoles. A user may hold many."*).
- **Which is active:** `User.currentProfileId → Profile` (`schema.prisma:618, 678`). The active profile's key is **`currentProfileKey`**.
- **Source of truth for the key:** `resolveProfileKey(user)` ([profiles.js:109-112](../../../packages/shared/constants/access/profiles.js)) — *"the stored column if valid, else the legacy derivation."* The legacy derivation (`deriveProfileFromLegacy`, `:71-89`) is the ONLY place `isSuperSales`/`isPrimary` are read, and only for rows not yet migrated.

### Switching the active profile

- **Endpoint:** `POST /auth/profile/switch` ([auth.route.js:36-42](../../../server/src/modules/auth/auth.route.js)) → `AuthUseCase.switchProfile` ([auth.usecase.js:84-121](../../../server/src/modules/auth/auth.usecase.js)). Enforces the target is in the user's held set (`PROFILE_NOT_ASSIGNED` 403 otherwise), persists `currentProfileId`, audits `PROFILE_SWITCH`, and **re-mints access + refresh tokens** so new permissions/nav take effect immediately.
- **What `/auth/me` exposes** ([auth.dto.js:135-151](../../../server/src/modules/auth/auth.dto.js)): `profile` (active key), `currentProfileId`, `profiles[]` (the switchable set: `{id,key,label,family,isAdminTier}`), and `navigationTabs` (which follow the active profile via `navRole`).

### Where the active profile already gates the deal

`currentProfileKey` is derived once in the auth middleware ([auth.middleware.js:91-99](../../../server/src/shared/middlewares/auth.middleware.js)) and already drives lead scope/capabilities:

- `computeLeadCapabilities` full-scope check: `currentProfileKey === "SUPER_SALES"` ([lead.dto.js:24-30](../../../server/src/modules/leads/lead/lead.dto.js)).
- Read-scope: `#isSuperSalesScope` / `#isPrimaryScope` ([lead.usecase.js:123-130](../../../server/src/modules/leads/lead/lead.usecase.js)); query-level `hasFullScope` ([lead.repo.js:37-38](../../../server/src/modules/leads/lead/lead.repo.js)).
- Status transitions restricted unless `PRIMARY_SALES`/`SUPER_SALES` ([lead.assign-status.usecase.js:293](../../../server/src/modules/leads/lead/lead.assign-status.usecase.js)).

**Implication for the target:** the cockpit already receives `capabilities` computed from the active profile. The *right* extension is to make the **whole action list** a function of the active profile — the same person, switched to a different profile, should see a different "what do I do next." Today it is sales-owner-only regardless.

> **Transitional caveat:** an unmigrated token can lack `currentProfileKey` (middleware legacy path, `auth.middleware.js:109-119`); scope then falls back to role checks and `profiles` defaults to `[]`. The target must degrade gracefully here (treat as the base-role profile).

### The 11 profiles (matrix columns for §4)

| Profile key | Label | baseRole | Assignable |
|---|---|---|---|
| `ADMIN` | Admin | ADMIN | yes |
| `SUPER_ADMIN` | Super admin | SUPER_ADMIN | yes |
| `SUPER_SALES` | Super sales | STAFF | yes |
| `PRIMARY_SALES` | Primary sales | STAFF | yes |
| `NORMAL_SALES` | Sales | STAFF | yes |
| `ACCOUNTANT` | Accountant | ACCOUNTANT | yes |
| `DESIGNER_3D` | 3D Designer | THREE_D_DESIGNER | yes |
| `DESIGNER_2D` | 2D Designer | TWO_D_DESIGNER | yes |
| `EXECUTOR_2D` | 2D Executor | TWO_D_EXECUTOR | no (legacy) |
| `CONTACT_INITIATOR` | Contact initiator | CONTACT_INITIATOR | yes |
| `SUPER_SALES_BASE` | Super sales (legacy role) | SUPER_SALES | no (superseded) |

---

## §3. Phase-by-phase spine (framing A)

For each phase: **entry trigger → baton holder (profile) → next action → how the system knows → current behavior → gap → target.** "Baton holder" is the profile whose next action the deal is *waiting on*.

### P0 — Intake / assignment
- **Trigger:** lead created, `status = NEW`, no `SalesStage` rows.
- **Baton:** `CONTACT_INITIATOR` (first touch) or an admin/primary assigning an owner; then the assigned `NORMAL_SALES` owner.
- **Next action:** make first contact; ensure the lead has an owner.
- **How the system knows:** `ClientLead.userId` set/unset; `status = NEW`; `stageIndex = -1`.
- **Current:** cockpit emits `ADVANCE_STAGE` once `currentStage != null`; before any stage exists it is silent (no "start me" nudge). Assignment ownership isn't a cockpit signal.
- **Gap:** no "unassigned lead" or "not yet contacted" signal.
- **Target signal:** `NEEDS_FIRST_CONTACT` / `UNASSIGNED` (owner = initiator/admin).

### P1 — Discovery funnel
- **Trigger:** stages `INITIAL_CONTACT … HANDLE_OBJECTIONS`; active statuses.
- **Baton:** the lead's **sales owner** (`NORMAL_SALES`/`PRIMARY_SALES`/`SUPER_SALES` as owner).
- **Next action:** advance the funnel; complete SPIN discovery; log calls/meetings; handle objections.
- **How the system knows:** max `SalesStage` row = current stage; `sessionQuestions.answer == null`; VERSA `{hasQuestion,hasResponse}`; `callReminders`/`meetingReminders`.
- **Current:** **well covered.** Rules `CALL_OVERDUE`, `MEETING_OVERDUE`, `DISCOVERY_INCOMPLETE`, `OBJECTION_UNHANDLED`, `NO_UPCOMING_TOUCH`, `ADVANCE_STAGE` all fire here.
- **Gap:** minor — "current stage = max row" is non-monotonic if rows are rolled back.
- **Target:** keep as-is.

### P2 — Price offer & negotiation
- **Trigger:** `status` in `INTERESTED/NEEDS_IDENTIFIED/NEGOTIATING`.
- **Baton:** sales owner (with `PRIMARY_SALES`/`SUPER_SALES` review for pricing authority).
- **Next action:** send a price offer; negotiate; get it accepted.
- **How the system knows:** `priceOffers` empty vs present; `isAccepted`.
- **Current:** `NO_PRICE_OFFER` (warning) fires when no offer while expected.
- **Gap:** no signal for "offer sent, awaiting client decision" (a distinct waiting state).
- **Target signal:** `PRICE_OFFER_PENDING_DECISION` (owner = sales; informational).

### P3 — Closing & signature
- **Trigger:** offer accepted; `DEAL_CLOSED` stage; contract created; `sessionStatus INITIAL→SIGNING→REGISTERED`; `status → FINALIZED`.
- **Baton:** sales owner + **admin** (finalize authority), then the client (to sign).
- **Next action:** generate/send contract, collect signature, finalize.
- **How the system knows:** `hasAcceptedPriceOffer`; `Contract.sessionStatus`; `status`.
- **Current:** `AWAIT_SIGNATURE` (info) fires — *but only while `status !== FINALIZED`*. The moment finalize happens, the blackout begins.
- **Gap:** `AWAIT_SIGNATURE` reads only `hasAcceptedPriceOffer`, not the actual `Contract.sessionStatus`. A contract stuck in `SIGNING` (not `REGISTERED`) after finalize is invisible.
- **Target signal:** `SIGNING_AWAITED` driven by `Contract.sessionStatus === "SIGNING"`, surviving into the finalized state.

### P4 — Contract activation (down-payment)
- **Trigger:** contract signed → the `SIGNATURE`-condition `ContractPayment` becomes `DUE`; when marked `RECEIVED`/`TRANSFERRED` → `updateSecondStageAfterFirstPayment` completes `LEVEL_1`, moves `LEVEL_2` to `IN_PROGRESS` ([contract-services.js:960-1013, 613-617](../../../server/src/modules/contracts/legacy/contract-services.js)).
- **Baton:** whoever records the down-payment — `ACCOUNTANT` (owns the money surface) or authed staff holding `CONTRACT.PAYMENT_MANAGE`.
- **Next action:** collect & record the signature/down-payment.
- **How the system knows:** `ContractPayment(condition=SIGNATURE).status`.
- **Current:** **invisible in cockpit** (post-FINALIZED blackout). `ClientLead.paymentStatus` stays `PENDING` (see §6 G2).
- **Gap (CRITICAL):** the deal is waiting on a payment nobody is nudged about.
- **Target signal:** `DOWNPAYMENT_DUE` (owner = accountant/sales).

### P5 — Production work-stages
- **Trigger:** each of `LEVEL_2..LEVEL_5` spawns a typed `Project` and is advanced when that project is `COMPLETED` ([contract-services.js:883-959](../../../server/src/modules/contracts/legacy/contract-services.js)).
- **Baton:** the **specific designer/executor** the project is assigned to.
- **Next action:** do the assigned production work; mark the project complete.
- **How the system knows:**
  - `LEVEL_N → project type` map: `LEVEL_2→2D_Study, LEVEL_3→3D_Designer, LEVEL_4→2D_Final_Plans, LEVEL_5→2D_Quantity_Calculation` ([contract-services.js:11-16](../../../server/src/modules/contracts/legacy/contract-services.js)).
  - **Assignment is data-driven, not role-hardcoded:** `assignDesignersForStageRelatedProject` reads the `AutoAssignment` table keyed by project type (`{userId, type, isActive}`, no role column) and creates `Assignment` rows via `assignProjectToUser` ([contract-services.js:1402-1441](../../../server/src/modules/contracts/legacy/contract-services.js); [project.legacy-flows.js:125-204](../../../server/src/modules/projects/project/project.legacy-flows.js)).
  - The assigned user learns of it via **notifications** (Telegram channel add, project chat, `newProjectAssignmentNotification`) — **not** a prioritized action list.
- **Current:** designers use a **separate** `PreviewWorkStage` view ([deals/[id]/page.jsx:14-23](../../../web/src/app/(auth)/dashboard/(dashboard)/deals/[id]/page.jsx)) with **no cockpit at all**. No "here is your next work-stage" action list.
- **Gap (HIGH):** designers/executor have no deal-scoped next-action guidance; they rely on ad-hoc notifications.
- **Target signal:** `WORK_STAGE_ASSIGNED_TO_YOU` (owner = the assigned designer/executor profile), `WORK_STAGE_BLOCKED` (owner = admin — a `NOT_STARTED` stage waiting on a prior stage/payment).

### P6 — Payment collection (cross-cutting P4–P7)
- **Trigger:** `ContractPayment` rows transition `NOT_DUE → DUE` (on sign / on project payment-condition) then to `RECEIVED/TRANSFERRED` when collected.
- **Baton:** `ACCOUNTANT` (dedicated money surface — accounting module gated to ACCOUNTANT only, [accounting.route.js:1-6](../../../server/src/modules/accounting/accounting.route.js)); staff with `CONTRACT.PAYMENT_MANAGE` can mark contract-payment status.
- **Next action:** chase and record due payments.
- **How the system knows:** `ContractPayment.status` (`DUE` = outstanding). Marking `RECEIVED/TRANSFERRED` audits `CONTRACT_PAYMENT_PAID` ([contract.usecase.js:234-255](../../../server/src/modules/contracts/contract/contract.usecase.js)).
- **Current:** cockpit's only payment rule is `PAYMENT_OVERDUE` on `ClientLead.paymentStatus === "OVERDUE"` — a value **nothing in the app ever sets** (§6 G2). So payment is effectively unmonitored by the cockpit.
- **Gap (HIGH):** the real payment truth (`ContractPayment.status = DUE`) is never surfaced.
- **Target signal:** `PAYMENT_DUE` (owner = accountant) driven by outstanding `ContractPayment` rows, plus a **recomputed** `ClientLead.paymentStatus` (§6 G2 fix).

### P7 — Contract completion
- **Trigger:** no open stages (`IN_PROGRESS/NOT_STARTED`) **and** no outstanding payments (`DUE/NOT_DUE`) → `Contract.status = COMPLETED` (automatic, [contract-services.js:625-658](../../../server/src/modules/contracts/legacy/contract-services.js)).
- **Baton:** none — automatic.
- **Next action:** none directly; triggers P8 eligibility.
- **How the system knows:** `Contract.status = COMPLETED`.
- **Current:** invisible in cockpit.
- **Gap:** no "delivery complete" confirmation signal; no feedback into the sales funnel.
- **Target signal:** `CONTRACT_COMPLETED` (info, owner = sales/admin) — closes the loop and enables P8.

### P8 — After-sales follow-up
- **Trigger:** `AFTER_SALES_FOLLOWUP` sales stage set **manually** via `set-stage`.
- **Baton:** the lead's **sales owner** (lead MUTATE scope, [sales-stages.usecase.js:46-61](../../../server/src/modules/sales-stages/sales-stages.usecase.js)).
- **Next action:** post-delivery follow-up with the client.
- **How the system knows:** presence of the `AFTER_SALES_FOLLOWUP` `SalesStage` row.
- **Current:** **no automated trigger** ties contract `COMPLETED` to an after-sales nudge; the sales owner must remember. Cockpit is dark (finalized).
- **Gap (MEDIUM):** after-sales is never prompted.
- **Target signal:** `AFTER_SALES_DUE` (owner = sales owner) when `Contract.status = COMPLETED` and no `AFTER_SALES_FOLLOWUP` stage yet.

---

## §4. Role × phase responsibility matrix (framing B)

The core cross-cutting view. Cells = the active profile's responsibility at that phase. **B** = holds the baton (deal waits on them); **A** = acts/authorizes; **○** = observer (sees, no action); **—** = not involved. The cockpit should render **only the acting/baton rows for the currently active profile.**

| Phase | NORMAL_SALES | PRIMARY_SALES | SUPER_SALES | ADMIN / SUPER_ADMIN | ACCOUNTANT | DESIGNER_3D / 2D | EXECUTOR_2D | CONTACT_INITIATOR |
|---|---|---|---|---|---|---|---|---|
| P0 Intake | **B** (if owner) | A (assign) | A (assign) | A (assign) | — | — | — | **B** (first touch) |
| P1 Discovery | **B** (owner) | A/○ (oversee) | A/○ (all) | ○ | — | — | — | — |
| P2 Price offer | **B** (owner) | A (pricing) | A (pricing) | ○ | — | — | — | — |
| P3 Closing/sign | **B** (owner) | A | A | **A** (finalize) | ○ | — | — | — |
| P4 Down-payment | ○ | ○ | ○ | A | **B** (record) | — | — | — |
| P5 Production | ○ | ○ | ○ (all leads) | A (unblock) | — | **B** (assigned) | **B** (assigned) | — |
| P6 Payments | ○ | ○ | ○ | A | **B** (chase/record) | — | — | — |
| P7 Completion | ○ | ○ | ○ | ○ | ○ | ○ | ○ | — |
| P8 After-sales | **B** (owner) | A | A | ○ | — | — | — | — |

> Object-scope still applies within a column: a `NORMAL_SALES` acts only on **their own** lead (`record.userId === authUser.id`); `SUPER_SALES` has full lead scope; a designer acts only on a work-stage **assigned to them** via `AutoAssignment`/`Assignment`.

### Per-profile narrative ("your whole world")

- **NORMAL_SALES (owner):** You own P0–P3 and P8 for *your* leads. After finalize, you become an **observer** of production/payments — but you still owe the client the after-sales touch (P8), which nothing currently reminds you of.
- **PRIMARY_SALES / SUPER_SALES:** Same sales spine, plus oversight/pricing authority and wider read-scope (SUPER = all leads). Not the baton holder in P4–P7.
- **ADMIN / SUPER_ADMIN:** Authorize/finalize (P3), unblock stuck production (P5), and can act anywhere. Rarely the baton holder except finalize.
- **ACCOUNTANT:** Your world is **P4 + P6** — record the down-payment, chase and record due `ContractPayment`s. You are the baton holder whenever a payment is `DUE`. The cockpit shows you none of this today.
- **DESIGNER_3D / DESIGNER_2D:** Your world is **P5** — the work-stages whose `Project` type is assigned to you (`LEVEL_3→3D`, `LEVEL_2/4/5→2D`). You are the baton holder while your project is `IN_PROGRESS`. You currently get a notification and a separate work-stage view, no prioritized action list.
- **EXECUTOR_2D:** Like the designers, scoped to executor-assigned work; legacy/non-assignable profile.
- **CONTACT_INITIATOR:** Your world is **P0** — first contact, then hand off to a sales owner.

---

## §5. Signal catalog & engine bridge (framing C)

The bridge that makes the target implementable without designing UI. Each signal is language-neutral (`type` + `params` + `cta`) exactly like today's, but now tagged with the **phase**, the **owning profile**, and the **data source**.

### Existing signals (9, all P0–P3, sales-owner-scoped)

| # | Signal | Severity | Phase | Data source | Notes |
|---|---|---|---|---|---|
| 1 | `CALL_OVERDUE` | critical | P1 | `callReminders` | ok |
| 2 | `MEETING_OVERDUE` | critical | P1 | `meetingReminders` | ok |
| 3 | `PAYMENT_OVERDUE` | critical | P6 | `ClientLead.paymentStatus === "OVERDUE"` | **effectively dead — value never set (G2)** |
| 4 | `DISCOVERY_INCOMPLETE` | warning | P1 | `sessionQuestions` | ok |
| 5 | `OBJECTION_UNHANDLED` | warning | P1 | VERSA steps | ok |
| 6 | `NO_PRICE_OFFER` | warning | P2 | `priceOffers` | ok |
| 7 | `NO_UPCOMING_TOUCH` | warning | P1 | reminders | ok |
| 8 | `ADVANCE_STAGE` | info | P1 | stage index | the "Next: …" hint |
| 9 | `AWAIT_SIGNATURE` | info | P3 | `hasAcceptedPriceOffer` | dies at FINALIZED; ignores `sessionStatus` |

### Missing signals the target needs (P3–P8)

| Signal | Severity | Phase | Owner profile(s) | Data source | Replaces / fixes |
|---|---|---|---|---|---|
| `SIGNING_AWAITED` | warning | P3 | sales owner, admin | `Contract.sessionStatus === "SIGNING"` | survives finalize; supersedes #9's proxy |
| `DOWNPAYMENT_DUE` | critical | P4 | accountant, sales | `ContractPayment(condition=SIGNATURE).status ∈ {DUE, NOT_DUE}` | the "Finalized but Pending" gap |
| `PAYMENT_DUE` | warning | P6 | accountant | outstanding `ContractPayment.status === "DUE"` | real payment truth vs dead #3 |
| `WORK_STAGE_ASSIGNED_TO_YOU` | info→warning | P5 | assigned designer/executor | `Project(type, status=IN_PROGRESS)` + `Assignment.userId = me` | designer next-action |
| `WORK_STAGE_BLOCKED` | warning | P5 | admin | `ContractStage.stageStatus = NOT_STARTED` gated by prior level/payment | stuck-production visibility |
| `CONTRACT_STAGE_IN_PROGRESS` | info | P5 | sales, admin | current `ContractStage LEVEL_N` | replaces misleading "1/10" post-finalize |
| `AFTER_SALES_DUE` | info | P8 | sales owner | `Contract.status = COMPLETED` ∧ no `AFTER_SALES_FOLLOWUP` row | the never-prompted follow-up |
| `CONTRACT_COMPLETED` | info | P7 | sales, admin | `Contract.status = COMPLETED` | delivery-done confirmation |

### Engine changes implied (design intent, not implementation)

1. **Remove the blanket terminal blackout.** `FINALIZED` must not return `actions: []`; instead it enters the **contract/payment/production** rule set. Only truly dead states (`REJECTED`, `ARCHIVED`) should be action-silent.
2. **Widen the cockpit bundle** to include the active `Contract` (`status`, `sessionStatus`), its `ContractStage` rows, outstanding `ContractPayment` rows, and (for designers) the caller's `Assignment`s on this lead's projects. Keep it a narrow, language-neutral select like the existing `COCKPIT_BUNDLE_SELECT`.
3. **Make the action list profile-aware.** Filter/emit signals by the caller's `currentProfileKey` so an accountant sees `PAYMENT_DUE`, a designer sees `WORK_STAGE_ASSIGNED_TO_YOU`, a sales owner sees the funnel + `AFTER_SALES_DUE`. The engine stays pure; the profile is another input.
4. **Reconcile the "N/10" display** so a finalized deal shows contract-stage progress (`LEVEL_N/7`) instead of a frozen, misleading sales-funnel counter.

---

## §6. Gaps & contradictions register

| ID | Gap | Severity | Evidence | Target resolution |
|---|---|---|---|---|
| **G1** | **Terminal blackout:** `FINALIZED` → `actions: []`; the entire post-sale lifecycle (P4–P8) is invisible. *This is the triggering bug.* | **Critical** | [lead.cockpit.js:132-134](../../../server/src/modules/leads/lead/lead.cockpit.js) | Engine change #1 + missing signals |
| **G2** | **`ClientLead.paymentStatus` is inert:** defaults `PENDING`, only flips to `FULLY_PAID` via the Stripe client-portal; `PARTIALLY_PAID`/`OVERDUE` are **never set** by app code. So "Payment: Pending" is stale-by-design and `PAYMENT_OVERDUE` (#3) can't fire. | **High** | writes only at [payments.repo.js:34](../../../server/src/modules/client-portal/payments/payments.repo.js); no recompute anywhere | Recompute `paymentStatus` from `ContractPayment` rows, or drive payment signals from `ContractPayment.status` directly |
| **G3** | **Cockpit is sales-owner-only:** no next-action surface for accountant, designers, or executor; designers get a separate view + ad-hoc notifications. | **High** | [deals/[id]/page.jsx:14-23](../../../web/src/app/(auth)/dashboard/(dashboard)/deals/[id]/page.jsx); all cockpit capabilities are sales-side | Engine change #3 (profile-aware) + P4/P5/P6 signals |
| **G4** | **Two stage tracks never reconciled:** a deal can be sales-stage `1/10` yet FINALIZED with an active contract at `LEVEL_3`. The `1/10` counter is misleading post-finalize. | **High** | §1; `computeHealth` uses only `SalesStage` rows | Engine change #4 + `CONTRACT_STAGE_IN_PROGRESS` |
| **G5** | **After-sales never prompted:** no automated trigger links `Contract.status = COMPLETED` to `AFTER_SALES_FOLLOWUP`. | **Medium** | [sales-stages.usecase.js:46-61](../../../server/src/modules/sales-stages/sales-stages.usecase.js) — manual only | `AFTER_SALES_DUE` signal (P8) |
| **G6** | **`AWAIT_SIGNATURE` uses a proxy:** reads `hasAcceptedPriceOffer`, not `Contract.sessionStatus`; a contract stuck in `SIGNING` after finalize is invisible. | **Medium** | [lead.cockpit.js:248-252](../../../server/src/modules/leads/lead/lead.cockpit.js) | `SIGNING_AWAITED` from `sessionStatus` |
| **G7** | **Active-profile fallback:** unmigrated tokens lack `currentProfileKey`; scope silently falls back to role checks, `profiles = []`. | **Low** | [auth.middleware.js:109-119](../../../server/src/shared/middlewares/auth.middleware.js) | Target treats missing key as base-role profile; finish backfill |
| **G8** | **Non-monotonic stage counter:** "current stage = max `SalesStage` row" can mislead after rollback; `NOT_INITIATED` shows no "start" nudge. | **Low** | `computeHealth` [lead.cockpit.js:95-113](../../../server/src/modules/leads/lead/lead.cockpit.js) | Optional P0 `NEEDS_FIRST_CONTACT` signal |

---

## §7. Open questions for the later UI round

1. **Where do non-sales profiles see their cockpit?** The deal detail currently routes designers to `PreviewWorkStage`. Do accountant/designer signals surface on the deal page, on a dedicated per-profile "my next actions" dashboard, or both?
2. **`ClientLead.paymentStatus` fix — recompute vs derive-on-read?** Backfilling/recomputing the column is a data change (migration + backfill); deriving payment signals purely from `ContractPayment` at cockpit-compute time avoids touching the column. Decide in the UI/impl round.
3. **Contract legacy service is frozen.** The target only *reads* its state to emit signals. Confirm no progression-logic change is ever required (it should not be).
4. **Multi-contract leads.** A lead can have several contracts; the cockpit bundle currently takes only the single `IN_PROGRESS` one. Does the responsibility model need to handle >1 active contract?
5. **Signal → CTA capability mapping** for the new post-sale signals (which permission code gates each new CTA) — deferred to the permissions pass in the UI round.
6. **"N/10" replacement semantics** — exact display for a deal spanning both tracks (dual progress? single unified spine progress?).

---

## Appendix — key source references

- Cockpit engine: [server/src/modules/leads/lead/lead.cockpit.js](../../../server/src/modules/leads/lead/lead.cockpit.js)
- Cockpit UI: [web/src/features/leads/cockpit/SalesDealCockpit.jsx](../../../web/src/features/leads/cockpit/SalesDealCockpit.jsx), [DealHealthBar.jsx](../../../web/src/features/leads/cockpit/DealHealthBar.jsx)
- Profiles: [packages/shared/constants/access/profiles.js](../../../packages/shared/constants/access/profiles.js)
- Profile switch: [server/src/modules/auth/auth.usecase.js](../../../server/src/modules/auth/auth.usecase.js), [auth.route.js](../../../server/src/modules/auth/auth.route.js)
- Lead scope/capabilities: [server/src/modules/leads/lead/lead.dto.js](../../../server/src/modules/leads/lead/lead.dto.js), [lead.usecase.js](../../../server/src/modules/leads/lead/lead.usecase.js), [lead.repo.js](../../../server/src/modules/leads/lead/lead.repo.js)
- Contract stages/payments (frozen): [server/src/modules/contracts/legacy/contract-services.js](../../../server/src/modules/contracts/legacy/contract-services.js)
- Designer assignment: [server/src/modules/projects/project/project.legacy-flows.js](../../../server/src/modules/projects/project/project.legacy-flows.js)
- Schema: [packages/db/prisma/schema.prisma](../../../packages/db/prisma/schema.prisma)
