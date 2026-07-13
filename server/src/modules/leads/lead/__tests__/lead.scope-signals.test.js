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
  it("isAdminUser: true for ADMIN/SUPER_ADMIN base role and admin-tier profiles, false otherwise", () => {
    expect(uc.isAdminUser({ role: "ADMIN" })).toBe(true);
    expect(uc.isAdminUser({ role: "SUPER_ADMIN" })).toBe(true);
    expect(uc.isAdminUser({ role: "STAFF", isAdminTier: true })).toBe(true); // SUPER_SALES profile
    expect(uc.isAdminUser({ role: "STAFF", currentProfileKey: "NORMAL_SALES" })).toBe(false);
    expect(uc.isAdminUser({ role: "STAFF", isSuperSales: true })).toBe(false); // flags are NOT read
  });

  it("repo.hasFullScope keys off the profile, not the flags", () => {
    expect(leadRepository.hasFullScope({ role: "STAFF", currentProfileKey: "SUPER_SALES" })).toBe(true);
    expect(leadRepository.hasFullScope({ role: "STAFF", isSuperSales: true })).toBe(false);
    expect(leadRepository.hasFullScope({ role: "ADMIN" })).toBe(true);
    expect(leadRepository.hasFullScope({ role: "CONTACT_INITIATOR", includeContactInitiator: true })).toBe(true);
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
      authUser: { id: 5, role: "STAFF", currentProfileKey: "SUPER_SALES", isAdminTier: true },
    });
    const { searchParams } = getClientLeadsByDateRange.mock.calls[0][0];
    expect(searchParams.userId).toBeUndefined();
    expect(searchParams.selfId).toBeUndefined();
  });

  it("DOES self-scope a NORMAL_SALES profile user", async () => {
    await uc.getDeals({
      query: {},
      authUser: { id: 7, role: "STAFF", currentProfileKey: "NORMAL_SALES" },
    });
    const { searchParams } = getClientLeadsByDateRange.mock.calls[0][0];
    expect(searchParams.userId).toBe(7);
    expect(searchParams.selfId).toBe(7);
  });
});
