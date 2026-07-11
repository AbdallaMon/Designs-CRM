import { describe, it, expect } from "vitest";
import { LeadUsecase } from "../lead.usecase.js";
import { leadRepository } from "../lead.repo.js";

const uc = new LeadUsecase({}, {});

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
