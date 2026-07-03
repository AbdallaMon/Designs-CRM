import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../auth.repository.js", () => ({
  AuthRepository: { findById: vi.fn(), setCurrentProfile: vi.fn() },
}));
vi.mock("../../../infra/auth/profile-cache.js", () => ({
  profileCache: { resolve: vi.fn() },
}));
vi.mock("../../../infra/audit/auth-audit.repository.js", () => ({
  authAuditRepository: { record: vi.fn() },
  AUTH_AUDIT_ACTIONS: { PROFILE_SWITCH: "PROFILE_SWITCH", PROFILE_ASSIGN: "PROFILE_ASSIGN", PROFILE_REMOVE: "PROFILE_REMOVE" },
}));
vi.mock("../../../infra/security/jwt.js", () => ({
  JwtService: { signAccess: vi.fn(() => "AT"), signRefresh: vi.fn(() => "RT") },
}));

import { AuthUseCase } from "../auth.usecase.js";
import { AuthRepository } from "../auth.repository.js";
import { profileCache } from "../../../infra/auth/profile-cache.js";
import { authAuditRepository } from "../../../infra/audit/auth-audit.repository.js";

const baseUser = {
  id: 1, email: "a@b.c", name: "A", role: "STAFF", isActive: true, currentProfileId: 2,
  isSuperSales: false, isPrimary: false, subRoles: [],
  currentProfile: { id: 2, key: "NORMAL_SALES", baseRole: "STAFF", isAdminTier: false },
  userProfiles: [
    { profile: { id: 2, key: "NORMAL_SALES", label: "عادي", family: "SALES", isAdminTier: false } },
    { profile: { id: 5, key: "ACCOUNTANT", label: "محاسب", family: "FINANCE", isAdminTier: false } },
  ],
};

describe("AuthUseCase.switchProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    AuthRepository.findById.mockResolvedValue(baseUser);
    profileCache.resolve.mockReturnValue({
      key: "ACCOUNTANT", baseRole: "ACCOUNTANT", isAdminTier: false,
      permissions: ["accounting.summary.view"],
      permissionsByModule: { accounting: { codes: ["accounting.summary.view"] } },
    });
  });

  it("switches to a held profile, persists, audits, re-mints, returns /me", async () => {
    const res = await AuthUseCase.switchProfile({ authUser: { id: 1 }, profileId: 5 });
    expect(AuthRepository.setCurrentProfile).toHaveBeenCalledWith(1, 5);
    expect(authAuditRepository.record).toHaveBeenCalledWith(
      expect.objectContaining({ actorUserId: 1, targetUserId: 1, action: "PROFILE_SWITCH", detail: { from: 2, to: 5 } }),
    );
    expect(res.accessToken).toBe("AT");
    expect(res.refreshToken).toBe("RT");
    expect(res.user.currentProfileId).toBe(5);
    expect(res.user.profile).toBe("ACCOUNTANT");
    expect(res.user.permissions).toContain("accounting.summary.view");
    expect(res.user.profiles.map((p) => p.key).sort()).toEqual(["ACCOUNTANT", "NORMAL_SALES"]);
  });

  it("rejects switching to a profile the user does not hold (403)", async () => {
    await expect(AuthUseCase.switchProfile({ authUser: { id: 1 }, profileId: 99 }))
      .rejects.toMatchObject({ statusCode: 403 });
    expect(AuthRepository.setCurrentProfile).not.toHaveBeenCalled();
  });

  it("404 when the held profile is missing from the cache", async () => {
    profileCache.resolve.mockReturnValue(null);
    await expect(AuthUseCase.switchProfile({ authUser: { id: 1 }, profileId: 5 }))
      .rejects.toMatchObject({ statusCode: 404 });
  });
});
