// Unit tests for the PURE `computeCockpit(bundle, now)` rules engine. No Prisma, no
// clock — `now` is injected so every case is deterministic. Covers the spec §3 rule
// table (each rule ≤1 action), the severity+order sort, terminal-status suppression,
// and the `health` derivation.
import { describe, it, expect } from "vitest";
import { computeCockpit, COCKPIT_STAGE_ORDER } from "../lead.cockpit.js";

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

  it("PAYMENT_OVERDUE when paymentStatus is OVERDUE", () => {
    const result = computeCockpit(baseBundle({ paymentStatus: "OVERDUE" }), NOW);
    const a = result.actions.find((x) => x.type === "PAYMENT_OVERDUE");
    expect(a).toBeTruthy();
    expect(a.severity).toBe("critical");
    expect(a.cta).toMatchObject({ kind: "OPEN_PAYMENT", capability: "canAddPayment" });
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

describe("computeCockpit — sorting & suppression", () => {
  it("sorts critical > warning > info, ties kept in rule order", () => {
    const bundle = baseBundle({
      status: "INTERESTED",
      paymentStatus: "OVERDUE", // PAYMENT_OVERDUE (critical)
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
