// leads/lead — pure "next-best-action" cockpit rules engine.
//
// `computeCockpit(bundle, now) → { health, actions }`. This function is PURE:
//   - no Prisma, no I/O, no side effects;
//   - no `Date.now()` / `new Date()` for the clock — `now` is a parameter, so the
//     whole thing is deterministic and fully unit-testable.
//
// It emits LANGUAGE-NEUTRAL signals only (`type` / `severity` / `params` / `cta`).
// ALL human-facing copy is resolved on the frontend from `type` + `params` — nothing
// here is prose (mirrors the message-code contract).
//
// Consumes the bundle produced by `lead.repo.findCockpitBundle` (normalized by the
// usecase so `versaModels` is an array). Each rule emits AT MOST one action; actions
// are returned sorted by severity (critical > warning > info) then rule order.

// Ordered sales-stage progression. Mirrors the `SalesStageType` enum in
// packages/db/prisma/schema.prisma — declaration order IS the progression order. The
// synthetic "NOT_INITIATED" state (no SalesStage rows yet) is represented as
// `currentStage: null` / `stageIndex: -1`, NOT as a member of this array.
const STAGE_ORDER = [
  "INITIAL_CONTACT",
  "SOCIAL_MEDIA_CHECK",
  "WHATSAPP_QA",
  "MEETING_BOOKED",
  "CLIENT_INFO_UPLOADED",
  "CONSULTATION_BOOKED",
  "FOLLOWUP_AFTER_MEETING",
  "HANDLE_OBJECTIONS",
  "DEAL_CLOSED",
  "AFTER_SALES_FOLLOWUP",
];

// `isTerminal` (health flag): the deal is closed/won/lost — the FE shows the "closed" summary.
const TERMINAL_STATUSES = ["FINALIZED", "CONVERTED", "REJECTED", "ARCHIVED"];

// Action-silent statuses: a lost/dead deal gets NO actions at all.
const DEAD_STATUSES = ["REJECTED", "ARCHIVED"];

// Closed-won: the sales FUNNEL rules are suppressed (no "advance to social-media check" on a
// finalized deal — the §0 bug), but the CONTRACT signals still run.
const CLOSED_WON = ["FINALIZED", "CONVERTED"];

// Profile → which rule set to emit. SALES is the default (back-compat + a missing profileKey).
const PROFILE_TO_RULESET = {
  NORMAL_SALES: "SALES",
  PRIMARY_SALES: "SALES",
  SUPER_SALES: "SALES",
  CONTACT_INITIATOR: "SALES",
  ADMIN: "SALES", // admins see the sales view for now (WORK_STAGE_BLOCKED is a later add)
  SUPER_ADMIN: "SALES",
  ACCOUNTANT: "ACCOUNTANT", // rules added in Phase 2
};

// Deal is actively being worked (chasing a touch / advancing the stage makes sense).
const ACTIVE_STATUSES = [
  "IN_PROGRESS",
  "INTERESTED",
  "NEEDS_IDENTIFIED",
  "NEGOTIATING",
];

// Early funnel statuses at which SPIN discovery should already be complete.
const EARLY_STATUSES = ["NEW", "IN_PROGRESS", "INTERESTED", "NEEDS_IDENTIFIED"];

// Statuses at which a price offer is expected to have been sent.
const PRICE_OFFER_STATUSES = ["INTERESTED", "NEEDS_IDENTIFIED", "NEGOTIATING"];

const SEVERITY_RANK = { critical: 0, warning: 1, info: 2 };

// My Day staleness threshold (spec §5.3/§6): an ACTIVE deal with no future touch and no
// activity for this many days is "dying silently". Single source — the my-day team-lens
// SQL imports this so both lenses breach at the same moment.
export const STALE_LEAD_DAYS = 5;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function arr(v) {
  return Array.isArray(v) ? v : [];
}

function toDate(v) {
  return v instanceof Date ? v : new Date(v);
}

function daysBetween(from, to) {
  return Math.floor((to.getTime() - from.getTime()) / MS_PER_DAY);
}

function action(type, severity, params, cta) {
  return { type, severity, params, cta };
}

// A VERSA objection step is "unhandled" when it poses a question but no response has
// been captured yet. The repo pre-reduces each step to `{ hasQuestion, hasResponse }`
// booleans (`hasResponse` = scripted answer OR client response), so the free-text
// objection scripts never reach this pure engine.
function isUnhandledStep(step) {
  return Boolean(step && step.hasQuestion && !step.hasResponse);
}

function countUnhandledObjections(versaModels) {
  let count = 0;
  for (const vm of versaModels) {
    for (const step of [vm?.v, vm?.e, vm?.r, vm?.s, vm?.a]) {
      if (isUnhandledStep(step)) count += 1;
    }
  }
  return count;
}

// Stable sort: severity (critical > warning > info), ties broken by rule-emission order.
function sortActions(actions) {
  return actions
    .map((a, i) => ({ a, i }))
    .sort((x, y) => {
      const bySeverity =
        SEVERITY_RANK[x.a.severity] - SEVERITY_RANK[y.a.severity];
      return bySeverity !== 0 ? bySeverity : x.i - y.i;
    })
    .map((x) => x.a);
}

// The active contract on the bundle (0 or 1 entry — the latest IN_PROGRESS/COMPLETED).
function firstContract(bundle) {
  return arr(bundle.contracts)[0] ?? null;
}

// Contract work-stage progress (LEVEL_1..7). `currentLevel` = the IN_PROGRESS stage's title.
function contractStageProgress(stages) {
  const list = arr(stages);
  const inProgress = list.find((s) => s.stageStatus === "IN_PROGRESS");
  return {
    currentLevel: inProgress?.title ?? null,
    levelsDone: list.filter((s) => s.stageStatus === "COMPLETED").length,
    levelsTotal: list.length,
  };
}

// Earliest FUTURE in-progress touchpoint (call or meeting) — the positive counterpart
// of NO_UPCOMING_TOUCH, so the FE can show "Next call: …" instead of only the absence.
function nextTouch(bundle, now) {
  const candidates = [];
  for (const c of arr(bundle.callReminders)) {
    if (c.status === "IN_PROGRESS" && c.time != null && toDate(c.time) >= now) {
      candidates.push({ kind: "CALL", at: toDate(c.time) });
    }
  }
  for (const m of arr(bundle.meetingReminders)) {
    if (m.status === "IN_PROGRESS" && m.time != null && toDate(m.time) >= now) {
      candidates.push({ kind: "MEETING", at: toDate(m.time) });
    }
  }
  if (!candidates.length) return null;
  const earliest = candidates.reduce((a, b) => (a.at <= b.at ? a : b));
  return { kind: earliest.kind, at: earliest.at.toISOString() };
}

/** Deal-health summary: sales-stage progress + status/payment/offer facts + contract progress. */
function computeHealth(bundle, now) {
  const presentIndices = arr(bundle.salesStages)
    .map((s) => STAGE_ORDER.indexOf(s.stage))
    .filter((i) => i >= 0);
  const maxIdx = presentIndices.length ? Math.max(...presentIndices) : -1;
  const currentStage = maxIdx >= 0 ? STAGE_ORDER[maxIdx] : null;
  const nextStage =
    maxIdx + 1 < STAGE_ORDER.length ? STAGE_ORDER[maxIdx + 1] : null;
  const status = bundle.status ?? null;
  const contract = firstContract(bundle);
  return {
    status,
    isTerminal: TERMINAL_STATUSES.includes(status), // deal closed → FE shows the "closed" summary
    paymentStatus: bundle.paymentStatus ?? null,
    currentStage, // SalesStageType or null (NOT_INITIATED)
    nextStage, // SalesStageType or null (at/after the last stage)
    stageIndex: maxIdx, // 0-based index of the current stage; -1 = NOT_INITIATED
    stageCount: STAGE_ORDER.length,
    hasAcceptedPriceOffer: arr(bundle.priceOffers).some(
      (p) => p.isAccepted === true,
    ),
    // Contract track (null pre-contract): reconciles the misleading sales "N/10" post-finalize.
    contract: contract
      ? {
          status: contract.status,
          sessionStatus: contract.sessionStatus ?? null,
          ...contractStageProgress(contract.stages),
        }
      : null,
    // Payment track — derived from ContractPayment (ClientLead.paymentStatus is inert).
    payment: paymentHealth(contract, now),
    // Age of the last touch on the record + the next scheduled touchpoint (or null).
    lastActivityDays:
      bundle.updatedAt != null ? daysBetween(toDate(bundle.updatedAt), now) : null,
    nextTouch: nextTouch(bundle, now),
  };
}

// A ContractPayment row is date-overdue when it is DUE and its dueDate has passed.
function overduePayments(pays, now) {
  return pays.filter(
    (p) => p.status === "DUE" && p.dueDate != null && toDate(p.dueDate) < now,
  );
}

// Payment summary derived from the contract's ContractPayment rows (not ClientLead.paymentStatus).
function paymentHealth(contract, now) {
  const pays = arr(contract?.paymentsNew);
  const overdue = overduePayments(pays, now);
  const oldestDue = overdue.length
    ? overdue.map((p) => toDate(p.dueDate)).reduce((a, b) => (a < b ? a : b))
    : null;
  return {
    outstandingCount: pays.filter((p) => p.status === "DUE").length,
    hasDue: pays.some((p) => p.status === "DUE"),
    downpaymentReceived: pays.some(
      (p) =>
        p.paymentCondition === "SIGNATURE" &&
        (p.status === "RECEIVED" || p.status === "TRANSFERRED"),
    ),
    overdueCount: overdue.length,
    oldestOverdueDays: oldestDue ? daysBetween(oldestDue, now) : null,
  };
}

// ── ACCOUNTANT rule set ──────────────────────────────────────────────────────
// Payment collection, derived live from ContractPayment.status. The down-payment
// (SIGNATURE condition) is the critical gate that unblocks production.
function computeAccountantActions(bundle, now) {
  const actions = [];
  const payments = arr(firstContract(bundle)?.paymentsNew);

  const sigDue = payments.find(
    (p) =>
      p.paymentCondition === "SIGNATURE" &&
      (p.status === "DUE" || p.status === "NOT_DUE"),
  );
  if (sigDue) {
    actions.push(
      action(
        "DOWNPAYMENT_DUE",
        "critical",
        {},
        {
          kind: "OPEN_PAYMENT",
          capability: "canAddPayment",
          tabKey: "payments",
        },
      ),
    );
  }

  // Date-based overdue (real truth): DUE rows whose dueDate has passed.
  const overdue = overduePayments(payments, now);
  if (overdue.length) {
    const oldest = overdue
      .map((p) => toDate(p.dueDate))
      .reduce((a, b) => (a < b ? a : b));
    actions.push(
      action(
        "PAYMENT_OVERDUE",
        "critical",
        { count: overdue.length, overdueDays: daysBetween(oldest, now) },
        {
          kind: "OPEN_PAYMENT",
          capability: "canAddPayment",
          tabKey: "payments",
        },
      ),
    );
  }

  const overdueSet = new Set(overdue);
  const otherDue = payments.filter(
    (p) =>
      p.status === "DUE" &&
      p.paymentCondition !== "SIGNATURE" &&
      !overdueSet.has(p),
  );
  if (otherDue.length) {
    actions.push(
      action(
        "PAYMENT_DUE",
        "warning",
        { count: otherDue.length },
        {
          kind: "OPEN_PAYMENT",
          capability: "canAddPayment",
          tabKey: "payments",
        },
      ),
    );
  }
  return actions;
}

// ── SALES rule set ───────────────────────────────────────────────────────────
// The pre-sale FUNNEL rules (1-8) run only while the deal is NOT closed-won, so a
// finalized deal is never nagged to "advance the sales funnel" (the §0 bug). The
// CONTRACT signals run whenever a contract exists (before or after close).
function computeSalesActions(bundle, now, health, status) {
  const actions = [];
  const contract = firstContract(bundle);

  if (!CLOSED_WON.includes(status)) {
    const callReminders = arr(bundle.callReminders);
    const meetingReminders = arr(bundle.meetingReminders);
    const priceOffers = arr(bundle.priceOffers);
    const sessionQuestions = arr(bundle.sessionQuestions);
    const versaModels = arr(bundle.versaModels);

    // 1. CALL_OVERDUE (critical) — an active call reminder is in the past.
    const overdueCalls = callReminders.filter(
      (c) =>
        c.status === "IN_PROGRESS" && c.time != null && toDate(c.time) < now,
    );
    if (overdueCalls.length) {
      const mostOverdueAt = overdueCalls
        .map((c) => toDate(c.time))
        .reduce((a, b) => (a < b ? a : b));
      actions.push(
        action(
          "CALL_OVERDUE",
          "critical",
          {
            count: overdueCalls.length,
            mostOverdueAt: mostOverdueAt.toISOString(),
            overdueDays: daysBetween(mostOverdueAt, now),
          },
          { kind: "OPEN_CALL", capability: "canAddCall", tabKey: "calls" },
        ),
      );
    }

    // 2. MEETING_OVERDUE (critical) — an active meeting reminder is in the past.
    const overdueMeetings = meetingReminders.filter(
      (m) =>
        m.status === "IN_PROGRESS" && m.time != null && toDate(m.time) < now,
    );
    if (overdueMeetings.length) {
      const mostOverdueAt = overdueMeetings
        .map((m) => toDate(m.time))
        .reduce((a, b) => (a < b ? a : b));
      actions.push(
        action(
          "MEETING_OVERDUE",
          "critical",
          {
            count: overdueMeetings.length,
            mostOverdueAt: mostOverdueAt.toISOString(),
            overdueDays: daysBetween(mostOverdueAt, now),
          },
          {
            kind: "OPEN_MEETING",
            capability: "canAddMeeting",
            tabKey: "meetings",
          },
        ),
      );
    }

    // (Rule 3 — the old paymentStatus-based PAYMENT_OVERDUE — was retired: the column is
    // inert (never set by app code). The real, date-based rule lives in the contract
    // signals block below, derived from ContractPayment.dueDate.)

    // 4. DISCOVERY_INCOMPLETE (warning) — unanswered SPIN questions while still early.
    const unansweredDiscovery = sessionQuestions.filter(
      (q) => q.answer == null,
    );
    if (unansweredDiscovery.length && EARLY_STATUSES.includes(status)) {
      actions.push(
        action(
          "DISCOVERY_INCOMPLETE",
          "warning",
          { unansweredCount: unansweredDiscovery.length },
          { kind: "GOTO_TAB", capability: null, tabKey: "analysis" },
        ),
      );
    }

    // 5. OBJECTION_UNHANDLED (warning) — a VERSA step poses a question with no response.
    const unhandledObjections = countUnhandledObjections(versaModels);
    if (unhandledObjections > 0) {
      actions.push(
        action(
          "OBJECTION_UNHANDLED",
          "warning",
          { count: unhandledObjections },
          { kind: "GOTO_TAB", capability: null, tabKey: "analysis" },
        ),
      );
    }

    // 6. NO_PRICE_OFFER (warning) — no offer sent while the deal expects one.
    if (priceOffers.length === 0 && PRICE_OFFER_STATUSES.includes(status)) {
      actions.push(
        action(
          "NO_PRICE_OFFER",
          "warning",
          {},
          {
            kind: "OPEN_PRICE_OFFER",
            capability: "canAddPriceOffer",
            tabKey: "priceOffers",
          },
        ),
      );
    }

    // 7. NO_UPCOMING_TOUCH (warning) — no future call/meeting on an active deal.
    const hasFutureCall = callReminders.some(
      (c) =>
        c.status === "IN_PROGRESS" && c.time != null && toDate(c.time) >= now,
    );
    const hasFutureMeeting = meetingReminders.some(
      (m) =>
        m.status === "IN_PROGRESS" && m.time != null && toDate(m.time) >= now,
    );
    if (
      !hasFutureCall &&
      !hasFutureMeeting &&
      ACTIVE_STATUSES.includes(status)
    ) {
      actions.push(
        action(
          "NO_UPCOMING_TOUCH",
          "warning",
          {},
          { kind: "OPEN_CALL", capability: "canAddCall", tabKey: "calls" },
        ),
      );
    }

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

    // A critical/warning funnel action above "blocks" the (info) advance suggestion.
    const hasBlocking = actions.length > 0;

    // 8. ADVANCE_STAGE (info) — a stage is complete, a next stage exists, nothing blocks.
    if (
      !hasBlocking &&
      health.currentStage != null &&
      health.nextStage != null
    ) {
      actions.push(
        action(
          "ADVANCE_STAGE",
          "info",
          { currentStage: health.currentStage, nextStage: health.nextStage },
          { kind: "OPEN_STATUS", capability: "canChangeStatus", tabKey: null },
        ),
      );
    }
  }

  // ── Contract signals (run whenever a contract exists; survive into FINALIZED) ──
  if (contract) {
    // PAYMENT_OVERDUE (critical) — real, date-based: DUE ContractPayment past its dueDate.
    const overdue = overduePayments(arr(contract.paymentsNew), now);
    if (overdue.length) {
      const oldest = overdue
        .map((p) => toDate(p.dueDate))
        .reduce((a, b) => (a < b ? a : b));
      actions.push(
        action(
          "PAYMENT_OVERDUE",
          "critical",
          { count: overdue.length, overdueDays: daysBetween(oldest, now) },
          {
            kind: "OPEN_PAYMENT",
            capability: "canAddPayment",
            tabKey: "payments",
          },
        ),
      );
    }

    // SIGNING_AWAITED (warning) — the contract is out for signing (real sessionStatus,
    // not the old accepted-offer proxy).
    if (contract.sessionStatus === "SIGNING") {
      actions.push(
        action(
          "SIGNING_AWAITED",
          "warning",
          {},
          { kind: "GOTO_TAB", capability: null, tabKey: "contracts" },
        ),
      );
    }
    if (contract.status === "COMPLETED") {
      const afterSalesDone = arr(bundle.salesStages).some(
        (s) => s.stage === "AFTER_SALES_FOLLOWUP",
      );
      if (!afterSalesDone) {
        // AFTER_SALES_DUE (info) — delivery done, after-sales follow-up not yet logged.
        actions.push(
          action(
            "AFTER_SALES_DUE",
            "info",
            {},
            {
              kind: "OPEN_STATUS",
              capability: "canChangeStatus",
              tabKey: null,
            },
          ),
        );
      } else {
        // CONTRACT_COMPLETED (info) — fully delivered + followed up.
        actions.push(
          action(
            "CONTRACT_COMPLETED",
            "info",
            {},
            { kind: "GOTO_TAB", capability: null, tabKey: "contracts" },
          ),
        );
      }
    } else {
      // CONTRACT_STAGE_IN_PROGRESS (info) — production is at LEVEL_N/7.
      const p = contractStageProgress(contract.stages);
      if (p.currentLevel) {
        actions.push(
          action(
            "CONTRACT_STAGE_IN_PROGRESS",
            "info",
            {
              level: p.currentLevel,
              levelsDone: p.levelsDone,
              levelsTotal: p.levelsTotal,
            },
            { kind: "GOTO_TAB", capability: null, tabKey: "contracts" },
          ),
        );
      }
    }
  }

  return actions;
}

/**
 * Compute the prioritized next-best-action list + deal-health summary for one lead,
 * scoped to the caller's ACTIVE profile.
 * @param {object} bundle  language-neutral lead state (see lead.repo.findCockpitBundle)
 * @param {Date}   now     the reference clock (REQUIRED, injected — never read internally)
 * @param {{ profileKey?: string }} [opts]  the caller's active profile key; missing → SALES set.
 * @returns {{ health: object, actions: Array<{type,severity,params,cta}> }}
 */
export function computeCockpit(bundle = {}, now, { profileKey } = {}) {
  // Determinism contract: the clock must be injected. No `new Date()` default here —
  // an omitted `now` fails loudly instead of silently reading the wall clock.
  if (!(now instanceof Date)) {
    throw new TypeError(
      "computeCockpit: `now` (a Date) is required — inject the clock for determinism.",
    );
  }
  const health = computeHealth(bundle, now);
  const status = bundle.status ?? null;

  // Dead statuses (lost deals) → health-only, no actions.
  if (DEAD_STATUSES.includes(status)) {
    return { health, actions: [] };
  }

  const ruleSet = PROFILE_TO_RULESET[profileKey] ?? "SALES";
  let actions = [];
  if (ruleSet === "SALES") {
    actions = computeSalesActions(bundle, now, health, status);
  } else if (ruleSet === "ACCOUNTANT") {
    actions = computeAccountantActions(bundle, now);
  }

  return { health, actions: sortActions(actions) };
}

// Exported for the repo/usecase select + tests to stay in lock-step with the enum.
export const COCKPIT_STAGE_ORDER = STAGE_ORDER;
export const COCKPIT_TERMINAL_STATUSES = TERMINAL_STATUSES;
export const COCKPIT_DEAD_STATUSES = DEAD_STATUSES;
