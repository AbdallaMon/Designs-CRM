// Usecase test for getLeadCockpit — mocks the repo bundle (no DB), asserts the usecase
// runs the pure engine, attaches capabilities from computeLeadCapabilities, and returns
// the { health, actions, capabilities } DTO. `now` is injected for determinism.
import { describe, it, expect, vi, beforeEach } from "vitest";

// The cockpit usecase now uses the `leadRepository` singleton directly (no DI) — mock it.
vi.mock("../lead.repo.js", () => ({
  leadRepository: { findCockpitBundle: vi.fn() },
  LeadRepository: class {},
}));

import { leadCockpitUsecase } from "../lead.cockpit.usecase.js";
import { leadRepository } from "../lead.repo.js";
import { PERMISSIONS } from "@dms/shared";

const P = PERMISSIONS.LEAD;
const NOW = new Date("2026-07-10T12:00:00.000Z");
const past = (h) => new Date(NOW.getTime() - h * 3600_000);

// A sales user who OWNS lead #5 and holds the call/price-offer/status perms.
const OWNER = {
  id: 7,
  role: "STAFF",
  permissions: [P.VIEW, P.CALL_MANAGE, P.PRICE_OFFER_MANAGE, P.CHANGE_STATUS, P.PAYMENT_MANAGE, P.MEETING_MANAGE],
};

// The repo bundle shape (relation is `versaModel`, singular — usecase normalizes it).
function bundle(overrides = {}) {
  return {
    id: 5,
    userId: 7,
    status: "INTERESTED",
    paymentStatus: "PENDING",
    salesStages: [{ stage: "WHATSAPP_QA" }],
    callReminders: [{ time: past(48), status: "IN_PROGRESS" }], // overdue -> CALL_OVERDUE
    meetingReminders: [],
    priceOffers: [],
    sessionQuestions: [],
    versaModel: [],
    ...overrides,
  };
}

// Configure the mocked repo to return the given bundle; hand back the singleton usecase.
function makeUsecase(bundleRow) {
  leadRepository.findCockpitBundle.mockResolvedValue(bundleRow);
  return { uc: leadCockpitUsecase, repo: leadRepository };
}

describe("LeadCockpitUsecase.getLeadCockpit", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches the bundle by id and returns { health, actions, capabilities }", async () => {
    const { uc, repo } = makeUsecase(bundle());
    const data = await uc.getLeadCockpit({ clientLeadId: 5, authUser: OWNER, now: NOW });

    expect(repo.findCockpitBundle).toHaveBeenCalledWith({ clientLeadId: 5 });
    expect(data).toHaveProperty("health");
    expect(data).toHaveProperty("actions");
    expect(data).toHaveProperty("capabilities");
    expect(data.health).toMatchObject({ status: "INTERESTED", currentStage: "WHATSAPP_QA" });
  });

  it("runs the pure engine: an overdue call surfaces CALL_OVERDUE first (critical)", async () => {
    const { uc } = makeUsecase(bundle());
    const data = await uc.getLeadCockpit({ clientLeadId: 5, authUser: OWNER, now: NOW });
    expect(data.actions[0]).toMatchObject({ type: "CALL_OVERDUE", severity: "critical" });
  });

  it("normalizes the `versaModel` relation to `versaModels` for the engine", async () => {
    // The repo hands over VERSA steps already reduced to presence booleans.
    const { uc } = makeUsecase(
      bundle({
        callReminders: [],
        versaModel: [{ v: { hasQuestion: true, hasResponse: false } }],
      }),
    );
    const data = await uc.getLeadCockpit({ clientLeadId: 5, authUser: OWNER, now: NOW });
    expect(data.actions.map((a) => a.type)).toContain("OBJECTION_UNHANDLED");
  });

  it("attaches capabilities from the auth user (owner + perms => canAddCall true)", async () => {
    const { uc } = makeUsecase(bundle());
    const data = await uc.getLeadCockpit({ clientLeadId: 5, authUser: OWNER, now: NOW });
    expect(data.capabilities.canAddCall).toBe(true);
    expect(data.capabilities.canAddPriceOffer).toBe(true);
  });

  it("gates capabilities for a non-owner scoped user (canAddCall false)", async () => {
    // NOTE: object-scope denial happens at the route; here we only assert the
    // capability predicate mirrors ownership — a different user cannot mutate.
    const stranger = { id: 99, role: "STAFF", permissions: [P.VIEW, P.CALL_MANAGE] };
    const { uc } = makeUsecase(bundle());
    const data = await uc.getLeadCockpit({ clientLeadId: 5, authUser: stranger, now: NOW });
    expect(data.capabilities.canAddCall).toBe(false);
  });

  it("forwards the caller's active profileKey to the engine (post-finalize contract signal)", async () => {
    const finalizedWithContract = bundle({
      status: "FINALIZED",
      callReminders: [],
      contracts: [{ id: 1, status: "IN_PROGRESS", sessionStatus: "SIGNING", stages: [] }],
    });
    // A SALES owner sees the contract signal post-finalize…
    const sales = { ...OWNER, currentProfileKey: "NORMAL_SALES" };
    const salesData = await makeUsecase(finalizedWithContract).uc.getLeadCockpit({ clientLeadId: 5, authUser: sales, now: NOW });
    expect(salesData.actions.map((a) => a.type)).toContain("SIGNING_AWAITED");

    // …but an ACCOUNTANT active profile does NOT get the SALES rule set.
    const accountant = { ...OWNER, currentProfileKey: "ACCOUNTANT" };
    const accData = await makeUsecase(finalizedWithContract).uc.getLeadCockpit({ clientLeadId: 5, authUser: accountant, now: NOW });
    expect(accData.actions.map((a) => a.type)).not.toContain("SIGNING_AWAITED");
  });

  it("throws LEAD_NOT_FOUND (404) when the bundle is missing", async () => {
    const { uc } = makeUsecase(null);
    await expect(uc.getLeadCockpit({ clientLeadId: 999, authUser: OWNER, now: NOW })).rejects.toMatchObject({
      statusCode: 404,
      message: "LEAD_NOT_FOUND",
    });
  });
});
