import { describe, it, expect, vi } from "vitest";

import { AppError } from "../../../shared/errors/AppError.js";
import { SalesStagesUsecase } from "../sales-stages.usecase.js";
import { SalesStagesValidation } from "../sales-stages.validation.js";

// Fake leads checkers mirroring the keystone scope model:
//   - lead 100 → OWNED by the caller (userId 5): readable AND mutable.
//   - lead 200 → CLAIMABLE unassigned-NEW pool: READABLE (access) but NOT mutable.
//   - anything else → out of scope: both denied.
function makeLeads() {
  return {
    checkIfUserCanAccessLead: vi.fn(async ({ id }) => {
      if (Number(id) === 100) return { id: 100, userId: 5, status: "FOLLOW_UP" };
      if (Number(id) === 200) return { id: 200, userId: null, status: "NEW" };
      throw new AppError("LEAD_ACCESS_DENIED", 403);
    }),
    checkIfUserCanMutateLead: vi.fn(async ({ id }) => {
      if (Number(id) === 100) return { id: 100, userId: 5, status: "FOLLOW_UP" };
      // lead 200 is the claimable NEW pool — viewable but NOT writable.
      throw new AppError("LEAD_MUTATE_DENIED", 403);
    }),
  };
}

function makeRepo(overrides = {}) {
  return {
    getSalesStages: vi.fn().mockResolvedValue([{ id: 1, stage: "INITIAL_CONTACT" }]),
    findStage: vi.fn().mockResolvedValue(null),
    createStage: vi.fn().mockResolvedValue({ id: 2 }),
    deleteStage: vi.fn().mockResolvedValue({ id: 1 }),
    ...overrides,
  };
}

const AUTH = { id: 5, role: "STAFF" };

describe("sales-stages usecase — object scope (the IDOR fix)", () => {
  it("getStages: READ path uses access-scope and allows an in-scope lead", async () => {
    const repo = makeRepo();
    const leads = makeLeads();
    const uc = new SalesStagesUsecase(repo, leads);
    const out = await uc.getStages({ clientLeadId: 100, authUser: AUTH });
    expect(out).toEqual([{ id: 1, stage: "INITIAL_CONTACT" }]);
    expect(leads.checkIfUserCanAccessLead).toHaveBeenCalledWith({ id: 100, authUser: AUTH });
    expect(leads.checkIfUserCanMutateLead).not.toHaveBeenCalled();
  });

  it("getStages: READ path ALLOWS a claimable unassigned-NEW lead (access-scope pool)", async () => {
    const repo = makeRepo();
    const leads = makeLeads();
    const uc = new SalesStagesUsecase(repo, leads);
    const out = await uc.getStages({ clientLeadId: 200, authUser: AUTH });
    expect(out).toEqual([{ id: 1, stage: "INITIAL_CONTACT" }]);
    expect(leads.checkIfUserCanAccessLead).toHaveBeenCalledWith({ id: 200, authUser: AUTH });
  });

  it("getStages: DENIES an out-of-scope lead and never reads", async () => {
    const repo = makeRepo();
    const uc = new SalesStagesUsecase(repo, makeLeads());
    await expect(uc.getStages({ clientLeadId: 999, authUser: AUTH })).rejects.toMatchObject({
      statusCode: 403,
    });
    expect(repo.getSalesStages).not.toHaveBeenCalled();
  });

  it("setStage: WRITE action uses mutate-scope; advancing creates the stage row when absent (owner)", async () => {
    const repo = makeRepo({ findStage: vi.fn().mockResolvedValue(null) });
    const leads = makeLeads();
    const uc = new SalesStagesUsecase(repo, leads);
    const out = await uc.setStage({
      clientLeadId: 100,
      nextStage: { key: "MEETING_BOOKED" },
      authUser: AUTH,
    });
    expect(out).toBe(true);
    // WRITE action → mutate checker, NOT the access checker.
    expect(leads.checkIfUserCanMutateLead).toHaveBeenCalledWith({ id: 100, authUser: AUTH });
    expect(leads.checkIfUserCanAccessLead).not.toHaveBeenCalled();
    expect(repo.createStage).toHaveBeenCalledWith({ clientLeadId: 100, stage: "MEETING_BOOKED" });
  });

  it("setStage: DENIES a claimable unassigned-NEW lead (mutate-scope, not read-scope)", async () => {
    // Lead 200 is in the caller's READ scope but NOT mutate scope — set-stage is a write.
    const repo = makeRepo();
    const uc = new SalesStagesUsecase(repo, makeLeads());
    await expect(
      uc.setStage({ clientLeadId: 200, nextStage: { key: "MEETING_BOOKED" }, authUser: AUTH }),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(repo.createStage).not.toHaveBeenCalled();
    expect(repo.deleteStage).not.toHaveBeenCalled();
  });

  it("setStage: does NOT re-create an existing stage", async () => {
    const repo = makeRepo({ findStage: vi.fn().mockResolvedValue({ id: 9 }) });
    const uc = new SalesStagesUsecase(repo, makeLeads());
    await uc.setStage({ clientLeadId: 100, nextStage: { key: "MEETING_BOOKED" }, authUser: AUTH });
    expect(repo.createStage).not.toHaveBeenCalled();
  });

  it("setStage: action=back deletes the current stage row", async () => {
    const repo = makeRepo();
    const uc = new SalesStagesUsecase(repo, makeLeads());
    await uc.setStage({
      clientLeadId: 100,
      currentStageType: "MEETING_BOOKED",
      action: "back",
      authUser: AUTH,
    });
    expect(repo.deleteStage).toHaveBeenCalledWith({ clientLeadId: 100, stage: "MEETING_BOOKED" });
  });

  it("setStage: NOT_INITIATED is never persisted/deleted (ported sentinel behavior)", async () => {
    const repo = makeRepo();
    const uc = new SalesStagesUsecase(repo, makeLeads());
    await uc.setStage({
      clientLeadId: 100,
      nextStage: { key: "NOT_INITIATED" },
      currentStageType: "NOT_INITIATED",
      action: "back",
      authUser: AUTH,
    });
    expect(repo.createStage).not.toHaveBeenCalled();
    expect(repo.deleteStage).not.toHaveBeenCalled();
  });

  it("setStage: DENIES an out-of-scope lead before any mutation", async () => {
    const repo = makeRepo();
    const uc = new SalesStagesUsecase(repo, makeLeads());
    await expect(
      uc.setStage({ clientLeadId: 999, nextStage: { key: "DEAL_CLOSED" }, authUser: AUTH }),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(repo.createStage).not.toHaveBeenCalled();
    expect(repo.deleteStage).not.toHaveBeenCalled();
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
