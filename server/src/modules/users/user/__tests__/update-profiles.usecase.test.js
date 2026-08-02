import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../../infra/audit/auth-audit.repo.js", () => ({
  authAuditRepository: { record: vi.fn() },
  AUTH_AUDIT_ACTIONS: { PROFILE_ASSIGN: "PROFILE_ASSIGN", PROFILE_REMOVE: "PROFILE_REMOVE", PROFILE_SWITCH: "PROFILE_SWITCH" },
}));

// DI removed: the usecase calls the imported `userRepository` singleton directly.
vi.mock("../user.repo.js", () => ({
  userRepository: {
    findProfilesByIds: vi.fn(),
    getUserProfileIds: vi.fn(),
    setUserProfiles: vi.fn(),
  },
}));

import { userUsecase } from "../user.usecase.js";
import { userRepository } from "../user.repo.js";
import { authAuditRepository } from "../../../../infra/audit/auth-audit.repo.js";

describe("updateUserProfiles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default fixture (individual tests override): profile 5 = ACCOUNTANT, others NORMAL_SALES.
    userRepository.findProfilesByIds.mockImplementation(async ({ ids }) =>
      ids.map((id) => ({ id, key: id === 5 ? "ACCOUNTANT" : "NORMAL_SALES", baseRole: id === 5 ? "ACCOUNTANT" : "STAFF" })),
    );
    userRepository.getUserProfileIds.mockResolvedValue([2]);
    userRepository.setUserProfiles.mockImplementation(async (args) => args);
  });

  it("adds new profiles, sets current, and audits the add", async () => {
    const res = await userUsecase.updateUserProfiles({ authUser: { id: 99 }, userId: 1, profileIds: [2, 5], currentProfileId: 5 });
    const args = userRepository.setUserProfiles.mock.calls[0][0];
    expect(args).toMatchObject({ userId: 1, addIds: [5], removeIds: [], currentProfileId: 5, assignedByUserId: 99 });
    expect(args).not.toHaveProperty("legacySync");
    expect(authAuditRepository.record).toHaveBeenCalledWith(
      expect.objectContaining({ actorUserId: 99, targetUserId: 1, action: "PROFILE_ASSIGN", detail: { profileId: 5 } }),
    );
    expect(res).toEqual({ userId: 1, profileIds: [2, 5], currentProfileId: 5 });
  });

  it("removes de-selected profiles and audits removals; current defaults to first desired", async () => {
    userRepository.getUserProfileIds.mockResolvedValue([2, 5]);
    await userUsecase.updateUserProfiles({ authUser: { id: 99 }, userId: 1, profileIds: [2] });
    const args = userRepository.setUserProfiles.mock.calls[0][0];
    expect(args.removeIds).toEqual([5]);
    expect(args.currentProfileId).toBe(2);
    expect(authAuditRepository.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: "PROFILE_REMOVE", detail: { profileId: 5 } }),
    );
  });

  it("rejects an empty profileIds list (a user must keep ≥1 profile)", async () => {
    await expect(userUsecase.updateUserProfiles({ authUser: { id: 99 }, userId: 1, profileIds: [] }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it("falls back current to the first desired when currentProfileId is not in the set", async () => {
    await userUsecase.updateUserProfiles({ authUser: { id: 99 }, userId: 1, profileIds: [2, 5], currentProfileId: 999 });
    expect(userRepository.setUserProfiles.mock.calls[0][0].currentProfileId).toBe(2);
  });

  it("rejects more than one sales-tier profile (Sales/Primary/Super are mutually exclusive)", async () => {
    userRepository.findProfilesByIds.mockResolvedValue([
      { id: 2, key: "NORMAL_SALES", baseRole: "STAFF" },
      { id: 3, key: "SUPER_SALES", baseRole: "STAFF" },
    ]);
    userRepository.getUserProfileIds.mockResolvedValue([]);
    await expect(
      userUsecase.updateUserProfiles({ authUser: { id: 99 }, userId: 1, profileIds: [2, 3] }),
    ).rejects.toMatchObject({ statusCode: 400, code: "USER_SALES_TIER_EXCLUSIVE" });
    expect(userRepository.setUserProfiles).not.toHaveBeenCalled();
  });

  it("allows one sales-tier profile combined with a different family", async () => {
    userRepository.findProfilesByIds.mockResolvedValue([
      { id: 2, key: "SUPER_SALES", baseRole: "STAFF" },
      { id: 5, key: "ACCOUNTANT", baseRole: "ACCOUNTANT" },
    ]);
    userRepository.getUserProfileIds.mockResolvedValue([]);
    await userUsecase.updateUserProfiles({ authUser: { id: 99 }, userId: 1, profileIds: [2, 5], currentProfileId: 2 });
    expect(userRepository.setUserProfiles).toHaveBeenCalledOnce();
  });
});
