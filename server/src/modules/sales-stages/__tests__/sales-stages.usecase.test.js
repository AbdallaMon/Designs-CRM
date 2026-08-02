import { describe, it, expect, vi, beforeEach } from "vitest";

import { AppError } from "../../../shared/errors/AppError.js";
import { SalesStagesValidation } from "../sales-stages.validation.js";

// DI removed: the usecase calls the imported `salesStagesRepository` and `leadUsecase`
// singletons directly. Mock both so the scope model can be asserted without a DB.
vi.mock("../sales-stages.repo.js", () => ({
  salesStagesRepository: {
    getSalesStages: vi.fn(),
    findStage: vi.fn(),
    createStage: vi.fn(),
    deleteStage: vi.fn(),
  },
}));

vi.mock("../../leads/lead/lead.usecase.js", () => ({
  leadUsecase: {
    checkIfUserCanAccessLead: vi.fn(),
    checkIfUserCanMutateLead: vi.fn(),
  },
}));

import { salesStagesUsecase } from "../sales-stages.usecase.js";
import { salesStagesRepository } from "../sales-stages.repo.js";
import { leadUsecase } from "../../leads/lead/lead.usecase.js";

// Leads checkers mirror the keystone scope model:
//   - lead 100 → OWNED by the caller (userId 5): readable AND mutable.
//   - lead 200 → CLAIMABLE unassigned-NEW pool: READABLE (access) but NOT mutable.
//   - anything else → out of scope: both denied.
beforeEach(() => {
  vi.clearAllMocks();

  leadUsecase.checkIfUserCanAccessLead.mockImplementation(async ({ id }) => {
    if (Number(id) === 100) return { id: 100, userId: 5, status: "FOLLOW_UP" };
    if (Number(id) === 200) return { id: 200, userId: null, status: "NEW" };
    throw new AppError({ code: "LEAD_ACCESS_DENIED", statusCode: 403 });
  });
  leadUsecase.checkIfUserCanMutateLead.mockImplementation(async ({ id }) => {
    if (Number(id) === 100) return { id: 100, userId: 5, status: "FOLLOW_UP" };
    // lead 200 is the claimable NEW pool — viewable but NOT writable.
    throw new AppError({ code: "LEAD_MUTATE_DENIED", statusCode: 403 });
  });

  salesStagesRepository.getSalesStages.mockResolvedValue([{ id: 1, stage: "INITIAL_CONTACT" }]);
  salesStagesRepository.findStage.mockResolvedValue(null);
  salesStagesRepository.createStage.mockResolvedValue({ id: 2 });
  salesStagesRepository.deleteStage.mockResolvedValue({ id: 1 });
});

const AUTH = { id: 5, role: "STAFF" };

describe("sales-stages usecase — object scope (the IDOR fix)", () => {
  it("getStages: READ path uses access-scope and allows an in-scope lead", async () => {
    const out = await salesStagesUsecase.getStages({ clientLeadId: 100, authUser: AUTH });
    expect(out).toEqual([{ id: 1, stage: "INITIAL_CONTACT" }]);
    expect(leadUsecase.checkIfUserCanAccessLead).toHaveBeenCalledWith({ id: 100, authUser: AUTH });
    expect(leadUsecase.checkIfUserCanMutateLead).not.toHaveBeenCalled();
  });

  it("getStages: READ path ALLOWS a claimable unassigned-NEW lead (access-scope pool)", async () => {
    const out = await salesStagesUsecase.getStages({ clientLeadId: 200, authUser: AUTH });
    expect(out).toEqual([{ id: 1, stage: "INITIAL_CONTACT" }]);
    expect(leadUsecase.checkIfUserCanAccessLead).toHaveBeenCalledWith({ id: 200, authUser: AUTH });
  });

  it("getStages: DENIES an out-of-scope lead and never reads", async () => {
    await expect(salesStagesUsecase.getStages({ clientLeadId: 999, authUser: AUTH })).rejects.toMatchObject({
      statusCode: 403,
    });
    expect(salesStagesRepository.getSalesStages).not.toHaveBeenCalled();
  });

  it("setStage: WRITE action uses mutate-scope; advancing creates the stage row when absent (owner)", async () => {
    salesStagesRepository.findStage.mockResolvedValue(null);
    const out = await salesStagesUsecase.setStage({
      clientLeadId: 100,
      nextStage: { key: "MEETING_BOOKED" },
      authUser: AUTH,
    });
    expect(out).toBe(true);
    // WRITE action → mutate checker, NOT the access checker.
    expect(leadUsecase.checkIfUserCanMutateLead).toHaveBeenCalledWith({ id: 100, authUser: AUTH });
    expect(leadUsecase.checkIfUserCanAccessLead).not.toHaveBeenCalled();
    expect(salesStagesRepository.createStage).toHaveBeenCalledWith({ clientLeadId: 100, stage: "MEETING_BOOKED" });
  });

  it("setStage: DENIES a claimable unassigned-NEW lead (mutate-scope, not read-scope)", async () => {
    // Lead 200 is in the caller's READ scope but NOT mutate scope — set-stage is a write.
    await expect(
      salesStagesUsecase.setStage({ clientLeadId: 200, nextStage: { key: "MEETING_BOOKED" }, authUser: AUTH }),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(salesStagesRepository.createStage).not.toHaveBeenCalled();
    expect(salesStagesRepository.deleteStage).not.toHaveBeenCalled();
  });

  it("setStage: does NOT re-create an existing stage", async () => {
    salesStagesRepository.findStage.mockResolvedValue({ id: 9 });
    await salesStagesUsecase.setStage({ clientLeadId: 100, nextStage: { key: "MEETING_BOOKED" }, authUser: AUTH });
    expect(salesStagesRepository.createStage).not.toHaveBeenCalled();
  });

  it("setStage: action=back deletes the current stage row", async () => {
    await salesStagesUsecase.setStage({
      clientLeadId: 100,
      currentStageType: "MEETING_BOOKED",
      action: "back",
      authUser: AUTH,
    });
    expect(salesStagesRepository.deleteStage).toHaveBeenCalledWith({ clientLeadId: 100, stage: "MEETING_BOOKED" });
  });

  it("setStage: NOT_INITIATED is never persisted/deleted (ported sentinel behavior)", async () => {
    await salesStagesUsecase.setStage({
      clientLeadId: 100,
      nextStage: { key: "NOT_INITIATED" },
      currentStageType: "NOT_INITIATED",
      action: "back",
      authUser: AUTH,
    });
    expect(salesStagesRepository.createStage).not.toHaveBeenCalled();
    expect(salesStagesRepository.deleteStage).not.toHaveBeenCalled();
  });

  it("setStage: DENIES an out-of-scope lead before any mutation", async () => {
    await expect(
      salesStagesUsecase.setStage({ clientLeadId: 999, nextStage: { key: "DEAL_CLOSED" }, authUser: AUTH }),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(salesStagesRepository.createStage).not.toHaveBeenCalled();
    expect(salesStagesRepository.deleteStage).not.toHaveBeenCalled();
  });
});

describe("sales-stages validation — mass-assignment + bad input", () => {
  it("rejects unknown body fields (.strict)", () => {
    const r = SalesStagesValidation.setStageBody.safeParse({
      nextStage: { key: "DEAL_CLOSED" },
      userId: 999, // injected — must be rejected
    });
    expect(r.success).toBe(false);
  });

  it("rejects an invalid stage key", () => {
    const r = SalesStagesValidation.setStageBody.safeParse({ nextStage: { key: "NONSENSE" } });
    expect(r.success).toBe(false);
  });

  it("accepts the legacy misspelled curentStageType", () => {
    const r = SalesStagesValidation.setStageBody.safeParse({
      curentStageType: "MEETING_BOOKED",
      action: "back",
    });
    expect(r.success).toBe(true);
  });

  it("rejects a non-numeric clientLeadId param", () => {
    const r = SalesStagesValidation.clientLeadIdParam.safeParse({ clientLeadId: "abc" });
    expect(r.success).toBe(false);
  });
});
