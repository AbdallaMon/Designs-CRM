// Unit tests for the PURE `computeCockpit(bundle, now)` rules engine. No Prisma, no
// clock — `now` is injected so every case is deterministic. Covers the spec §3 rule
// table (each rule ≤1 action), the severity+order sort, terminal-status suppression,
// and the `health` derivation.
import { describe, it, expect } from "vitest";
import { computeCockpit, COCKPIT_STAGE_ORDER, STALE_LEAD_DAYS } from "../lead.cockpit.js";

const NOW = new Date("2026-07-10T12:00:00.000Z");
const past = (h) => new Date(NOW.getTime() - h * 3600_000);
const future = (h) => new Date(NOW.getTime() + h * 3600_000);

// A minimal healthy bundle: active status, no reminders, no signals.
function baseBundle(overrides = {}) {
  return {
    status: "IN_PROGRESS",
    paymentStatus: "PENDING",
    salesStages: [],
    callReminders: [],
    meetingReminders: [],
    priceOffers: [],
    sessionQuestions: [],
    versaModels: [],
    ...overrides,
  };
}

const types = (result) => result.actions.map((a) => a.type);

describe("computeCockpit — health", () => {
  it("derives current/next stage from the highest-progression stage present", () => {
    const bundle = baseBundle({
      status: "NEGOTIATING",
      paymentStatus: "PARTIALLY_PAID",
      // Out-of-order rows; current = highest progression index (HANDLE_OBJECTIONS).
      salesStages: [{ stage: "INITIAL_CONTACT" }, { stage: "HANDLE_OBJECTIONS" }, { stage: "MEETING_BOOKED" }],
    });
    const { health } = computeCockpit(bundle, NOW);
    expect(health).toMatchObject({
      status: "NEGOTIATING",
      isTerminal: false,
      paymentStatus: "PARTIALLY_PAID",
      currentStage: "HANDLE_OBJECTIONS",
      nextStage: "DEAL_CLOSED",
      stageIndex: 7,
      stageCount: COCKPIT_STAGE_ORDER.length,
      hasAcceptedPriceOffer: false,
    });
    expect(COCKPIT_STAGE_ORDER.length).toBe(10);
  });

  it("NOT_INITIATED when no stage rows: currentStage null, stageIndex -1, next = first stage", () => {
    const { health } = computeCockpit(baseBundle({ salesStages: [] }), NOW);
    expect(health.currentStage).toBeNull();
    expect(health.stageIndex).toBe(-1);
    expect(health.nextStage).toBe("INITIAL_CONTACT");
  });

  it("last stage present: nextStage is null", () => {
    const { health } = computeCockpit(
      baseBundle({ salesStages: [{ stage: "AFTER_SALES_FOLLOWUP" }] }),
      NOW,
    );
    expect(health.currentStage).toBe("AFTER_SALES_FOLLOWUP");
    expect(health.nextStage).toBeNull();
  });

  it("hasAcceptedPriceOffer reflects an accepted offer", () => {
    const { health } = computeCockpit(
      baseBundle({ priceOffers: [{ isAccepted: false }, { isAccepted: true }] }),
      NOW,
    );
    expect(health.hasAcceptedPriceOffer).toBe(true);
  });
});

describe("computeCockpit — critical rules", () => {
  it("CALL_OVERDUE first, with count/mostOverdueAt/overdueDays", () => {
    const bundle = baseBundle({
      callReminders: [
        { time: past(48), status: "IN_PROGRESS" }, // 2 days overdue (earliest)
        { time: past(5), status: "IN_PROGRESS" },
        { time: past(10), status: "DONE" }, // not counted (not IN_PROGRESS)
        { time: future(5), status: "IN_PROGRESS" }, // future, not overdue
      ],
    });
    const result = computeCockpit(bundle, NOW);
    expect(result.actions[0].type).toBe("CALL_OVERDUE");
    expect(result.actions[0].severity).toBe("critical");
    expect(result.actions[0].params).toMatchObject({
      count: 2,
      mostOverdueAt: past(48).toISOString(),
      overdueDays: 2,
    });
    expect(result.actions[0].cta).toMatchObject({ kind: "OPEN_CALL", capability: "canAddCall", tabKey: "calls" });
  });

  it("MEETING_OVERDUE for a past active meeting", () => {
    const bundle = baseBundle({
      meetingReminders: [{ time: past(24), status: "IN_PROGRESS", type: "ONLINE" }],
    });
    const result = computeCockpit(bundle, NOW);
    expect(types(result)).toContain("MEETING_OVERDUE");
    const a = result.actions.find((x) => x.type === "MEETING_OVERDUE");
    expect(a.severity).toBe("critical");
    expect(a.cta.kind).toBe("OPEN_MEETING");
  });

  it("PAYMENT_OVERDUE no longer fires from the inert ClientLead.paymentStatus column", () => {
    const result = computeCockpit(baseBundle({ paymentStatus: "OVERDUE" }), NOW);
    expect(types(result)).not.toContain("PAYMENT_OVERDUE");
  });
});

describe("computeCockpit — payment truth (date-based PAYMENT_OVERDUE + health.payment)", () => {
  const days = (n) => new Date(NOW.getTime() - n * 24 * 3600_000);
  const contractWith = (paymentsNew, extra = {}) => ({
    contracts: [
      {
        status: "IN_PROGRESS",
        sessionStatus: "REGISTERED",
        stages: [{ title: "LEVEL_2", stageStatus: "IN_PROGRESS", order: 2 }],
        paymentsNew,
        ...extra,
      },
    ],
  });

  it("DUE payment with a past dueDate → PAYMENT_OVERDUE (critical) with count/overdueDays — sales set", () => {
    const bundle = baseBundle({
      status: "FINALIZED", // survives close (the whole point)
      ...contractWith([
        { status: "DUE", paymentCondition: "AFTER_STAGE", dueDate: days(12) },
        { status: "DUE", paymentCondition: "AFTER_STAGE", dueDate: days(3) },
        { status: "RECEIVED", paymentCondition: "SIGNATURE", dueDate: days(30) },
      ]),
    });
    const result = computeCockpit(bundle, NOW);
    const a = result.actions.find((x) => x.type === "PAYMENT_OVERDUE");
    expect(a).toBeTruthy();
    expect(a.severity).toBe("critical");
    expect(a.params).toMatchObject({ count: 2, overdueDays: 12 });
    expect(a.cta).toMatchObject({ kind: "OPEN_PAYMENT", capability: "canAddPayment" });
  });

  it("accountant profile also gets the date-based PAYMENT_OVERDUE; non-overdue DUE stays PAYMENT_DUE", () => {
    const bundle = baseBundle({
      status: "FINALIZED",
      ...contractWith([
        { status: "DUE", paymentCondition: "AFTER_STAGE", dueDate: days(5) }, // overdue
        { status: "DUE", paymentCondition: "AFTER_STAGE", dueDate: null }, // due, no date
      ]),
    });
    const result = computeCockpit(bundle, NOW, { profileKey: "ACCOUNTANT" });
    const overdue = result.actions.find((x) => x.type === "PAYMENT_OVERDUE");
    const due = result.actions.find((x) => x.type === "PAYMENT_DUE");
    expect(overdue?.params).toMatchObject({ count: 1, overdueDays: 5 });
    expect(due?.params).toMatchObject({ count: 1 });
  });

  it("DUE with only future/null dueDate → no PAYMENT_OVERDUE", () => {
    const bundle = baseBundle({
      ...contractWith([
        { status: "DUE", paymentCondition: "AFTER_STAGE", dueDate: future(48) },
        { status: "DUE", paymentCondition: "AFTER_STAGE", dueDate: null },
      ]),
    });
    expect(types(computeCockpit(bundle, NOW))).not.toContain("PAYMENT_OVERDUE");
  });

  it("health.payment carries overdueCount + oldestOverdueDays", () => {
    const bundle = baseBundle({
      ...contractWith([
        { status: "DUE", paymentCondition: "AFTER_STAGE", dueDate: days(9) },
        { status: "DUE", paymentCondition: "AFTER_STAGE", dueDate: days(2) },
      ]),
    });
    const { health } = computeCockpit(bundle, NOW);
    expect(health.payment).toMatchObject({
      outstandingCount: 2,
      hasDue: true,
      overdueCount: 2,
      oldestOverdueDays: 9,
    });
  });

  it("health.payment.oldestOverdueDays is null when nothing is overdue", () => {
    const { health } = computeCockpit(baseBundle(), NOW);
    expect(health.payment.overdueCount).toBe(0);
    expect(health.payment.oldestOverdueDays).toBeNull();
  });
});

describe("computeCockpit — FIRST_TOUCH_SLA", () => {
  const hoursAgo = (h) => new Date(NOW.getTime() - h * 3600_000);
  const claimed = (h, overrides = {}) =>
    baseBundle({ assignedAt: hoursAgo(h), salesStages: [], ...overrides });

  it("silent under 24h since claim", () => {
    expect(types(computeCockpit(claimed(23), NOW))).not.toContain("FIRST_TOUCH_SLA");
  });

  it("warning at 24h, critical at 48h, with hoursSinceAssigned", () => {
    const warn = computeCockpit(claimed(24), NOW).actions.find((a) => a.type === "FIRST_TOUCH_SLA");
    expect(warn?.severity).toBe("warning");
    expect(warn?.params).toMatchObject({ hoursSinceAssigned: 24 });
    const crit = computeCockpit(claimed(50), NOW).actions.find((a) => a.type === "FIRST_TOUCH_SLA");
    expect(crit?.severity).toBe("critical");
    expect(crit?.cta).toMatchObject({ kind: "OPEN_CALL", capability: "canAddCall", tabKey: "calls" });
  });

  it("silent once first contact happened (a stage exists or a call was completed)", () => {
    expect(
      types(computeCockpit(claimed(72, { salesStages: [{ stage: "INITIAL_CONTACT" }] }), NOW)),
    ).not.toContain("FIRST_TOUCH_SLA");
    expect(
      types(computeCockpit(claimed(72, { callReminders: [{ time: hoursAgo(10), status: "DONE" }] }), NOW)),
    ).not.toContain("FIRST_TOUCH_SLA");
  });

  it("silent when unassigned, on closed-won, or when LEAD_STALE already fires", () => {
    expect(types(computeCockpit(baseBundle(), NOW))).not.toContain("FIRST_TOUCH_SLA");
    expect(
      types(computeCockpit(claimed(72, { status: "FINALIZED" }), NOW)),
    ).not.toContain("FIRST_TOUCH_SLA");
    // 6 days stale → LEAD_STALE fires and subsumes the first-touch nag.
    const stale = computeCockpit(
      claimed(6 * 24, { updatedAt: hoursAgo(6 * 24) }),
      NOW,
    );
    expect(types(stale)).toContain("LEAD_STALE");
    expect(types(stale)).not.toContain("FIRST_TOUCH_SLA");
  });
});

describe("computeCockpit — OFFER_AWAITING_DECISION", () => {
  const daysAgo = (d) => new Date(NOW.getTime() - d * 24 * 3600_000);

  it("fires at 3+ days since the newest unaccepted offer", () => {
    const bundle = baseBundle({
      status: "NEGOTIATING",
      priceOffers: [
        { isAccepted: false, createdAt: daysAgo(10) },
        { isAccepted: false, createdAt: daysAgo(4) }, // newest
      ],
    });
    const a = computeCockpit(bundle, NOW).actions.find(
      (x) => x.type === "OFFER_AWAITING_DECISION",
    );
    expect(a?.severity).toBe("warning");
    expect(a?.params).toMatchObject({ daysSinceOffer: 4, offerCount: 2 });
    expect(a?.cta).toMatchObject({ kind: "GOTO_TAB", tabKey: "priceOffers" });
  });

  it("silent when newer than 3 days, when accepted, or when closed-won", () => {
    const fresh = baseBundle({
      status: "NEGOTIATING",
      priceOffers: [{ isAccepted: false, createdAt: daysAgo(2) }],
    });
    expect(types(computeCockpit(fresh, NOW))).not.toContain("OFFER_AWAITING_DECISION");
    const accepted = baseBundle({
      status: "NEGOTIATING",
      priceOffers: [{ isAccepted: true, createdAt: daysAgo(10) }],
    });
    expect(types(computeCockpit(accepted, NOW))).not.toContain("OFFER_AWAITING_DECISION");
    const won = baseBundle({
      status: "FINALIZED",
      priceOffers: [{ isAccepted: false, createdAt: daysAgo(10) }],
    });
    expect(types(computeCockpit(won, NOW))).not.toContain("OFFER_AWAITING_DECISION");
  });
});

describe("poolTouchSeverity — unclaimed-pool first-touch ramp", () => {
  it("null under 4h, warning at 4h, critical at 24h", async () => {
    const { poolTouchSeverity } = await import("../lead.cockpit.js");
    const hoursAgo = (h) => new Date(NOW.getTime() - h * 3600_000);
    expect(poolTouchSeverity(hoursAgo(3), NOW)).toBeNull();
    expect(poolTouchSeverity(hoursAgo(4), NOW)).toBe("warning");
    expect(poolTouchSeverity(hoursAgo(24), NOW)).toBe("critical");
    expect(poolTouchSeverity(null, NOW)).toBeNull();
  });
});

describe("computeCockpit — health lastActivityDays + nextTouch", () => {
  const days = (n) => new Date(NOW.getTime() - n * 24 * 3600_000);

  it("lastActivityDays derives from updatedAt; null when absent", () => {
    expect(computeCockpit(baseBundle({ updatedAt: days(6) }), NOW).health.lastActivityDays).toBe(6);
    expect(computeCockpit(baseBundle(), NOW).health.lastActivityDays).toBeNull();
  });

  it("nextTouch = earliest FUTURE in-progress touchpoint across calls and meetings", () => {
    const bundle = baseBundle({
      callReminders: [
        { time: future(30), status: "IN_PROGRESS" },
        { time: past(2), status: "IN_PROGRESS" }, // past — not a next touch
      ],
      meetingReminders: [
        { time: future(5), status: "IN_PROGRESS" }, // earliest future
        { time: future(2), status: "DONE" }, // not in progress
      ],
    });
    const { health } = computeCockpit(bundle, NOW);
    expect(health.nextTouch).toEqual({ kind: "MEETING", at: future(5).toISOString() });
  });

  it("nextTouch is null when nothing future is scheduled", () => {
    expect(computeCockpit(baseBundle(), NOW).health.nextTouch).toBeNull();
  });
});

describe("computeCockpit — warning rules", () => {
  it("NO_PRICE_OFFER when no offer + status INTERESTED", () => {
    const result = computeCockpit(baseBundle({ status: "INTERESTED", priceOffers: [] }), NOW);
    const a = result.actions.find((x) => x.type === "NO_PRICE_OFFER");
    expect(a).toBeTruthy();
    expect(a.severity).toBe("warning");
    expect(a.cta.capability).toBe("canAddPriceOffer");
  });

  it("does NOT emit NO_PRICE_OFFER once an offer exists", () => {
    const result = computeCockpit(
      baseBundle({ status: "INTERESTED", priceOffers: [{ isAccepted: false }] }),
      NOW,
    );
    expect(types(result)).not.toContain("NO_PRICE_OFFER");
  });

  it("DISCOVERY_INCOMPLETE when a SPIN question is unanswered at an early stage", () => {
    const bundle = baseBundle({
      status: "IN_PROGRESS",
      sessionQuestions: [{ answer: { id: 1 } }, { answer: null }, { answer: null }],
    });
    const result = computeCockpit(bundle, NOW);
    const a = result.actions.find((x) => x.type === "DISCOVERY_INCOMPLETE");
    expect(a).toBeTruthy();
    expect(a.severity).toBe("warning");
    expect(a.params).toEqual({ unansweredCount: 2 });
    expect(a.cta).toMatchObject({ kind: "GOTO_TAB", capability: null, tabKey: "analysis" });
  });

  it("does NOT emit DISCOVERY_INCOMPLETE at a late status even with gaps", () => {
    const result = computeCockpit(
      baseBundle({ status: "NEGOTIATING", sessionQuestions: [{ answer: null }] }),
      NOW,
    );
    expect(types(result)).not.toContain("DISCOVERY_INCOMPLETE");
  });

  it("OBJECTION_UNHANDLED when a VERSA step has a question but no response", () => {
    // The repo pre-reduces each VERSA step to { hasQuestion, hasResponse } booleans.
    const bundle = baseBundle({
      versaModels: [
        {
          v: { hasQuestion: true, hasResponse: false }, // unhandled
          e: { hasQuestion: true, hasResponse: true }, // handled (scripted answer)
          r: { hasQuestion: false, hasResponse: false }, // no question -> ignore
          s: null,
          a: { hasQuestion: true, hasResponse: true }, // handled (client response)
        },
      ],
    });
    const result = computeCockpit(bundle, NOW);
    const a = result.actions.find((x) => x.type === "OBJECTION_UNHANDLED");
    expect(a).toBeTruthy();
    expect(a.params).toEqual({ count: 1 });
  });

  it("NO_UPCOMING_TOUCH when no future call/meeting on an active deal", () => {
    const result = computeCockpit(baseBundle({ status: "NEGOTIATING", priceOffers: [{ isAccepted: false }] }), NOW);
    expect(types(result)).toContain("NO_UPCOMING_TOUCH");
  });

  it("does NOT emit NO_UPCOMING_TOUCH when a future call exists", () => {
    const result = computeCockpit(
      baseBundle({
        status: "NEGOTIATING",
        priceOffers: [{ isAccepted: false }],
        callReminders: [{ time: future(24), status: "IN_PROGRESS" }],
      }),
      NOW,
    );
    expect(types(result)).not.toContain("NO_UPCOMING_TOUCH");
  });
});

describe("computeCockpit — info rules", () => {
  it("ADVANCE_STAGE when a stage is complete, next exists, and nothing blocks", () => {
    const bundle = baseBundle({
      status: "NEGOTIATING",
      salesStages: [{ stage: "HANDLE_OBJECTIONS" }],
      priceOffers: [{ isAccepted: false }], // suppress NO_PRICE_OFFER
      callReminders: [{ time: future(24), status: "IN_PROGRESS" }], // suppress NO_UPCOMING_TOUCH
    });
    const result = computeCockpit(bundle, NOW);
    expect(types(result)).toEqual(["ADVANCE_STAGE"]);
    const a = result.actions[0];
    expect(a.severity).toBe("info");
    expect(a.params).toEqual({ currentStage: "HANDLE_OBJECTIONS", nextStage: "DEAL_CLOSED" });
    expect(a.cta).toMatchObject({ kind: "OPEN_STATUS", capability: "canChangeStatus" });
  });

  it("does NOT emit ADVANCE_STAGE while a blocking warning exists", () => {
    const bundle = baseBundle({
      status: "NEGOTIATING",
      salesStages: [{ stage: "HANDLE_OBJECTIONS" }],
      priceOffers: [], // triggers NO_PRICE_OFFER (blocking)
    });
    const result = computeCockpit(bundle, NOW);
    expect(types(result)).toContain("NO_PRICE_OFFER");
    expect(types(result)).not.toContain("ADVANCE_STAGE");
  });

});

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
    const t = types(computeCockpit(withContract(), NOW));
    expect(t).toContain("SIGNING_AWAITED");
    expect(t).toContain("CONTRACT_STAGE_IN_PROGRESS");
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
    const result = computeCockpit(withContract(), NOW, { profileKey: "ACCOUNTANT" });
    expect(types(result)).not.toContain("SIGNING_AWAITED");
  });
});

describe("computeCockpit — accountant (Phase 2)", () => {
  const acc = (payments) =>
    baseBundle({
      status: "FINALIZED",
      contracts: [{ id: 1, status: "IN_PROGRESS", sessionStatus: "REGISTERED", stages: [], paymentsNew: payments }],
    });

  it("DOWNPAYMENT_DUE (critical) when the SIGNATURE payment is not yet received", () => {
    const r = computeCockpit(acc([{ status: "DUE", paymentCondition: "SIGNATURE" }]), NOW, { profileKey: "ACCOUNTANT" });
    const a = r.actions.find((x) => x.type === "DOWNPAYMENT_DUE");
    expect(a.severity).toBe("critical");
    expect(a.cta).toMatchObject({ kind: "OPEN_PAYMENT", capability: "canAddPayment", tabKey: "payments" });
  });

  it("PAYMENT_DUE (warning) for a non-signature DUE payment", () => {
    const r = computeCockpit(acc([{ status: "DUE", paymentCondition: "INSTALLMENT" }]), NOW, { profileKey: "ACCOUNTANT" });
    const a = r.actions.find((x) => x.type === "PAYMENT_DUE");
    expect(a).toBeTruthy();
    expect(a.params).toEqual({ count: 1 });
  });

  it("no payment actions when nothing is DUE", () => {
    const r = computeCockpit(acc([{ status: "RECEIVED", paymentCondition: "SIGNATURE" }]), NOW, { profileKey: "ACCOUNTANT" });
    expect(r.actions).toEqual([]);
  });

  it("health.payment reflects outstanding + downpayment state", () => {
    const { health } = computeCockpit(
      acc([{ status: "RECEIVED", paymentCondition: "SIGNATURE" }, { status: "DUE", paymentCondition: "INSTALLMENT" }]),
      NOW,
      { profileKey: "ACCOUNTANT" },
    );
    expect(health.payment).toMatchObject({ outstandingCount: 1, hasDue: true, downpaymentReceived: true });
  });

  it("a SALES profile does NOT see accountant signals on the same bundle", () => {
    const r = computeCockpit(acc([{ status: "DUE", paymentCondition: "SIGNATURE" }]), NOW, { profileKey: "NORMAL_SALES" });
    expect(types(r)).not.toContain("DOWNPAYMENT_DUE");
  });
});

describe("computeCockpit — sorting & suppression", () => {
  it("sorts critical > warning > info, ties kept in rule order", () => {
    const bundle = baseBundle({
      status: "INTERESTED",
      // PAYMENT_OVERDUE (critical) — real date-based rule: DUE payment past its dueDate.
      contracts: [
        {
          status: "IN_PROGRESS",
          sessionStatus: "REGISTERED",
          stages: [],
          paymentsNew: [{ status: "DUE", paymentCondition: "AFTER_STAGE", dueDate: past(72) }],
        },
      ],
      callReminders: [{ time: past(3), status: "IN_PROGRESS" }], // CALL_OVERDUE (critical)
      priceOffers: [], // NO_PRICE_OFFER (warning)
      salesStages: [{ stage: "WHATSAPP_QA" }],
    });
    const result = computeCockpit(bundle, NOW);
    const severities = result.actions.map((a) => a.severity);
    // criticals first (in rule order: CALL_OVERDUE before PAYMENT_OVERDUE), then warning.
    expect(result.actions[0].type).toBe("CALL_OVERDUE");
    expect(result.actions[1].type).toBe("PAYMENT_OVERDUE");
    expect(severities).toEqual([...severities].sort((a, b) => ({ critical: 0, warning: 1, info: 2 }[a] - { critical: 0, warning: 1, info: 2 }[b])));
  });

  it("FINALIZED with no contract → no sales nag, isTerminal true", () => {
    const bundle = baseBundle({
      status: "FINALIZED",
      paymentStatus: "OVERDUE",
      callReminders: [{ time: past(48), status: "IN_PROGRESS" }],
      priceOffers: [],
      salesStages: [{ stage: "DEAL_CLOSED" }],
    });
    const result = computeCockpit(bundle, NOW);
    expect(types(result)).not.toContain("ADVANCE_STAGE");
    expect(result.health.status).toBe("FINALIZED");
    expect(result.health.isTerminal).toBe(true);
    expect(result.health.currentStage).toBe("DEAL_CLOSED");
  });

  it.each(["REJECTED", "ARCHIVED"])(
    "dead status %s → no actions",
    (status) => {
      const result = computeCockpit(
        baseBundle({ status, paymentStatus: "OVERDUE", callReminders: [{ time: past(2), status: "IN_PROGRESS" }] }),
        NOW,
      );
      expect(result.actions).toEqual([]);
    },
  );

  it("healthy active deal with nothing outstanding → empty actions", () => {
    const bundle = baseBundle({
      status: "NEGOTIATING",
      salesStages: [{ stage: "AFTER_SALES_FOLLOWUP" }], // last stage -> no ADVANCE_STAGE
      callReminders: [{ time: future(24), status: "IN_PROGRESS" }],
      priceOffers: [{ isAccepted: false }],
    });
    const result = computeCockpit(bundle, NOW);
    expect(result.actions).toEqual([]);
  });

  it("is pure: does not mutate the input bundle", () => {
    const bundle = baseBundle({ status: "INTERESTED", callReminders: [{ time: past(2), status: "IN_PROGRESS" }] });
    const snapshot = JSON.parse(JSON.stringify(bundle));
    computeCockpit(bundle, NOW);
    expect(JSON.parse(JSON.stringify(bundle))).toEqual(snapshot);
  });
});

describe("computeCockpit — LEAD_STALE (My Day)", () => {
  const daysAgo = (d) => new Date(NOW.getTime() - d * 24 * 3600_000);

  it("fires at exactly STALE_LEAD_DAYS with the age in params", () => {
    expect(STALE_LEAD_DAYS).toBe(5);
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
