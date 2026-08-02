import { describe, it, expect, vi, beforeEach } from "vitest";

// `deals()` now calls the module-level `getClientLeadsByDateRange` directly (no DI bag),
// so spy on it via a module mock. The lead repo is left REAL — `hasFullScope` is a pure
// predicate we assert against below.
vi.mock("../lead.assign-status.usecase.js", () => ({
  getClientLeadsByDateRange: vi.fn(),
  getClientLeadsColumnStatus: vi.fn(),
  assignLeadToAUser: vi.fn(),
  bulkAssignLeadTsoAUser: vi.fn(),
  markClientLeadAsConverted: vi.fn(),
  updateClientLeadStatus: vi.fn(),
  checkIfUserAllowedToTakeALead: vi.fn(),
  claimStatus: vi.fn(),
}));

import { LeadUsecase } from "../lead.usecase.js";
import { leadRepository } from "../lead.repo.js";
import { getClientLeadsByDateRange } from "../lead.assign-status.usecase.js";

const uc = new LeadUsecase();

describe("LeadUsecase profile scope signals", () => {
  it("isAdminUser reads only the derived admin-tier signal", () => {
    expect(uc.isAdminUser({ currentProfileKey: "ADMIN", isAdminTier: true })).toBe(true);
    expect(uc.isAdminUser({ currentProfileKey: "SUPER_ADMIN", isAdminTier: true })).toBe(true);
    expect(uc.isAdminUser({ currentProfileKey: "SUPER_SALES", isAdminTier: false })).toBe(false);
    expect(uc.isAdminUser({ currentProfileKey: "NORMAL_SALES", isAdminTier: false })).toBe(false);
    expect(uc.isAdminUser({ role: "ADMIN", isAdminTier: false })).toBe(false);
  });

  it("repo.hasFullScope keys off the profile, not the flags", () => {
    expect(leadRepository.hasFullScope({ currentProfileKey: "SUPER_SALES" })).toBe(true);
    expect(leadRepository.hasFullScope({ isSuperSales: true })).toBe(false);
    expect(leadRepository.hasFullScope({ currentProfileKey: "ADMIN", isAdminTier: true })).toBe(true);
    expect(leadRepository.hasFullScope({
      currentProfileKey: "CONTACT_INITIATOR",
      includeContactInitiator: true,
    })).toBe(true);
  });
});

describe("deals() super-sales scope (#6 regression)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getClientLeadsByDateRange.mockResolvedValue([]);
  });

  it("does NOT self-scope a SUPER_SALES profile user", async () => {
    await uc.getDeals({
      query: {},
      authUser: { id: 5, currentProfileKey: "SUPER_SALES", isAdminTier: false },
    });
    const { searchParams } = getClientLeadsByDateRange.mock.calls[0][0];
    expect(searchParams.userId).toBeUndefined();
    expect(searchParams.selfId).toBeUndefined();
  });

  it("DOES self-scope a NORMAL_SALES profile user", async () => {
    await uc.getDeals({
      query: {},
      authUser: { id: 7, currentProfileKey: "NORMAL_SALES", isAdminTier: false },
    });
    const { searchParams } = getClientLeadsByDateRange.mock.calls[0][0];
    expect(searchParams.userId).toBe(7);
    expect(searchParams.selfId).toBe(7);
  });
});
