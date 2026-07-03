import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../../infra/audit/auth-audit.repository.js", () => ({
  authAuditRepository: { record: vi.fn() },
  AUTH_AUDIT_ACTIONS: { PROFILE_ASSIGN: "PROFILE_ASSIGN", PROFILE_REMOVE: "PROFILE_REMOVE", PROFILE_SWITCH: "PROFILE_SWITCH" },
}));

import { UserUsecase } from "../user.usecase.js";
import { authAuditRepository } from "../../../../infra/audit/auth-audit.repository.js";

function makeUsecase() {
  const repo = {
    findProfilesByIds: vi.fn(async ({ ids }) =>
      ids.map((id) => ({ id, key: id === 5 ? "ACCOUNTANT" : "NORMAL_SALES", baseRole: id === 5 ? "ACCOUNTANT" : "STAFF" })),
    ),
    getUserProfileIds: vi.fn(async () => [2]),
    setUserProfiles: vi.fn(async (args) => args),
  };
  return { uc: new UserUsecase(repo), repo };
}

describe("updateUserProfiles", () => {
  beforeEach(() => vi.clearAllMocks());

  it("adds new profiles, sets current, syncs legacy columns, audits the add", async () => {
    const { uc, repo } = makeUsecase();
    const res = await uc.updateUserProfiles({ authUser: { id: 99 }, userId: 1, profileIds: [2, 5], currentProfileId: 5 });
    const args = repo.setUserProfiles.mock.calls[0][0];
    expect(args).toMatchObject({ userId: 1, addIds: [5], removeIds: [], currentProfileId: 5, assignedByUserId: 99 });
    expect(args.legacySync).toEqual({ role: "ACCOUNTANT", isPrimary: false, isSuperSales: false, profileKey: "ACCOUNTANT" });
    expect(authAuditRepository.record).toHaveBeenCalledWith(
      expect.objectContaining({ actorUserId: 99, targetUserId: 1, action: "PROFILE_ASSIGN", detail: { profileId: 5 } }),
    );
    expect(res).toEqual({ userId: 1, profileIds: [2, 5], currentProfileId: 5 });
  });

  it("removes de-selected profiles and audits removals; current defaults to first desired", async () => {
    const { uc, repo } = makeUsecase();
    repo.getUserProfileIds.mockResolvedValue([2, 5]);
    await uc.updateUserProfiles({ authUser: { id: 99 }, userId: 1, profileIds: [2] });
    const args = repo.setUserProfiles.mock.calls[0][0];
    expect(args.removeIds).toEqual([5]);
    expect(args.currentProfileId).toBe(2);
    expect(authAuditRepository.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: "PROFILE_REMOVE", detail: { profileId: 5 } }),
    );
  });

  it("rejects an empty profileIds list (a user must keep ≥1 profile)", async () => {
    const { uc } = makeUsecase();
    await expect(uc.updateUserProfiles({ authUser: { id: 99 }, userId: 1, profileIds: [] }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it("falls back current to the first desired when currentProfileId is not in the set", async () => {
    const { uc, repo } = makeUsecase();
    await uc.updateUserProfiles({ authUser: { id: 99 }, userId: 1, profileIds: [2, 5], currentProfileId: 999 });
    expect(repo.setUserProfiles.mock.calls[0][0].currentProfileId).toBe(2);
  });
});
