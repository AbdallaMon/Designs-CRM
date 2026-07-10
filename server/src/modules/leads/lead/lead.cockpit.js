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

// Deal is closed/terminal: return the health summary ONLY, never a nagging action.
const TERMINAL_STATUSES = ["FINALIZED", "CONVERTED", "REJECTED", "ARCHIVED"];

// Deal is actively being worked (chasing a touch / advancing the stage makes sense).
const ACTIVE_STATUSES = ["IN_PROGRESS", "INTERESTED", "NEEDS_IDENTIFIED", "NEGOTIATING"];

// Early funnel statuses at which SPIN discovery should already be complete.
const EARLY_STATUSES = ["NEW", "IN_PROGRESS", "INTERESTED", "NEEDS_IDENTIFIED"];

// Statuses at which a price offer is expected to have been sent.
const PRICE_OFFER_STATUSES = ["INTERESTED", "NEEDS_IDENTIFIED", "NEGOTIATING"];

const SEVERITY_RANK = { critical: 0, warning: 1, info: 2 };

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

// A VERSA objection step is "unhandled" when it poses a question but neither the
// scripted answer nor the client's response has been captured yet.
function isUnhandledStep(step) {
  return Boolean(step && step.question && !step.clientResponse && !step.answer);
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
      const bySeverity = SEVERITY_RANK[x.a.severity] - SEVERITY_RANK[y.a.severity];
      return bySeverity !== 0 ? bySeverity : x.i - y.i;
    })
    .map((x) => x.a);
}

/** Deal-health summary: stage progress + status/payment/offer facts. */
function computeHealth(bundle) {
  const presentIndices = arr(bundle.salesStages)
    .map((s) => STAGE_ORDER.indexOf(s.stage))
    .filter((i) => i >= 0);
  const maxIdx = presentIndices.length ? Math.max(...presentIndices) : -1;
  const currentStage = maxIdx >= 0 ? STAGE_ORDER[maxIdx] : null;
  const nextStage = maxIdx + 1 < STAGE_ORDER.length ? STAGE_ORDER[maxIdx + 1] : null;
  return {
    status: bundle.status ?? null,
    paymentStatus: bundle.paymentStatus ?? null,
    currentStage, // SalesStageType or null (NOT_INITIATED)
    nextStage, // SalesStageType or null (at/after the last stage)
    stageIndex: maxIdx, // 0-based index of the current stage; -1 = NOT_INITIATED
    stageCount: STAGE_ORDER.length,
    hasAcceptedPriceOffer: arr(bundle.priceOffers).some((p) => p.isAccepted === true),
  };
}

/**
 * Compute the prioritized next-best-action list + deal-health summary for one lead.
 * @param {object} bundle  language-neutral lead state (see lead.repo.findCockpitBundle)
 * @param {Date}   now     the reference clock (injected — never read internally)
 * @returns {{ health: object, actions: Array<{type,severity,params,cta}> }}
 */
export function computeCockpit(bundle = {}, now = new Date()) {
  const health = computeHealth(bundle);
  const status = bundle.status ?? null;

  // Terminal statuses → health-only; the FE renders the "deal closed" summary from
  // `health` (status/payment chips). No nagging actions.
  if (TERMINAL_STATUSES.includes(status)) {
    return { health, actions: [] };
  }

  const actions = [];
  const callReminders = arr(bundle.callReminders);
  const meetingReminders = arr(bundle.meetingReminders);
  const priceOffers = arr(bundle.priceOffers);
  const sessionQuestions = arr(bundle.sessionQuestions);
  const versaModels = arr(bundle.versaModels);

  // 1. CALL_OVERDUE (critical) — an active call reminder is in the past.
  const overdueCalls = callReminders.filter(
    (c) => c.status === "IN_PROGRESS" && c.time != null && toDate(c.time) < now,
  );
  if (overdueCalls.length) {
    const mostOverdueAt = overdueCalls
      .map((c) => toDate(c.time))
      .reduce((a, b) => (a < b ? a : b));
    actions.push(
      action(
        "CALL_OVERDUE",
        "critical",
        { count: overdueCalls.length, mostOverdueAt: mostOverdueAt.toISOString(), overdueDays: daysBetween(mostOverdueAt, now) },
        { kind: "OPEN_CALL", capability: "canAddCall", tabKey: "calls" },
      ),
    );
  }

  // 2. MEETING_OVERDUE (critical) — an active meeting reminder is in the past.
  const overdueMeetings = meetingReminders.filter(
    (m) => m.status === "IN_PROGRESS" && m.time != null && toDate(m.time) < now,
  );
  if (overdueMeetings.length) {
    const mostOverdueAt = overdueMeetings
      .map((m) => toDate(m.time))
      .reduce((a, b) => (a < b ? a : b));
    actions.push(
      action(
        "MEETING_OVERDUE",
        "critical",
        { count: overdueMeetings.length, mostOverdueAt: mostOverdueAt.toISOString(), overdueDays: daysBetween(mostOverdueAt, now) },
        { kind: "OPEN_MEETING", capability: "canAddMeeting", tabKey: "meetings" },
      ),
    );
  }

  // 3. PAYMENT_OVERDUE (critical).
  if (bundle.paymentStatus === "OVERDUE") {
    actions.push(
      action("PAYMENT_OVERDUE", "critical", {}, { kind: "OPEN_PAYMENT", capability: "canAddPayment", tabKey: "payments" }),
    );
  }

  // 4. DISCOVERY_INCOMPLETE (warning) — unanswered SPIN questions while still early.
  const unansweredDiscovery = sessionQuestions.filter((q) => q.answer == null);
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
      action("NO_PRICE_OFFER", "warning", {}, { kind: "OPEN_PRICE_OFFER", capability: "canAddPriceOffer", tabKey: "priceOffers" }),
    );
  }

  // 7. NO_UPCOMING_TOUCH (warning) — no future call/meeting on an active deal.
  const hasFutureCall = callReminders.some(
    (c) => c.status === "IN_PROGRESS" && c.time != null && toDate(c.time) >= now,
  );
  const hasFutureMeeting = meetingReminders.some(
    (m) => m.status === "IN_PROGRESS" && m.time != null && toDate(m.time) >= now,
  );
  if (!hasFutureCall && !hasFutureMeeting && ACTIVE_STATUSES.includes(status)) {
    actions.push(
      action("NO_UPCOMING_TOUCH", "warning", {}, { kind: "OPEN_CALL", capability: "canAddCall", tabKey: "calls" }),
    );
  }

  // A critical/warning action above "blocks" the (info) advance suggestion.
  const hasBlocking = actions.length > 0;

  // 8. ADVANCE_STAGE (info) — a stage is complete, a next stage exists, nothing blocks.
  if (!hasBlocking && health.currentStage != null && health.nextStage != null) {
    actions.push(
      action(
        "ADVANCE_STAGE",
        "info",
        { currentStage: health.currentStage, nextStage: health.nextStage },
        { kind: "OPEN_STATUS", capability: "canChangeStatus", tabKey: null },
      ),
    );
  }

  // 9. AWAIT_SIGNATURE (info) — an offer was accepted but the deal isn't finalized.
  if (health.hasAcceptedPriceOffer && status !== "FINALIZED") {
    actions.push(
      action("AWAIT_SIGNATURE", "info", {}, { kind: "GOTO_TAB", capability: null, tabKey: "contracts" }),
    );
  }

  return { health, actions: sortActions(actions) };
}

// Exported for the repo/usecase select + tests to stay in lock-step with the enum.
export const COCKPIT_STAGE_ORDER = STAGE_ORDER;
export const COCKPIT_TERMINAL_STATUSES = TERMINAL_STATUSES;
