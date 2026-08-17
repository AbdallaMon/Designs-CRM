import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../../../shared/errors/AppError.js";

vi.mock("../auth.repo.js", () => ({
  AuthRepository: {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    changePassword: vi.fn(),
    setCurrentProfile: vi.fn(),
  },
}));
vi.mock("../../../infra/security/hash.js", () => ({
  HashService: { compare: vi.fn(), hash: vi.fn() },
}));
vi.mock("../../../infra/security/jwt.js", () => ({
  JwtService: { signAccess: vi.fn(() => "access") },
}));
vi.mock("../../../infra/security/auth-session.js", () => ({
  AuthSessionService: {
    issueRefreshToken: vi.fn(),
    consumeRefreshToken: vi.fn(),
    revokeRefreshToken: vi.fn(),
    issuePasswordResetToken: vi.fn(),
    verifyPasswordResetToken: vi.fn(),
    consumePasswordResetToken: vi.fn(),
    invalidateUserSessions: vi.fn(),
  },
}));
vi.mock("../../../infra/mail/mail.js", () => ({ sendEmail: vi.fn() }));
vi.mock("../auth.emails.js", () => ({
  AuthEmails: { resetEmail: vi.fn(() => ({ subject: "RESET", html: "BODY" })) },
}));
vi.mock("../../../infra/auth/profile-cache.js", () => ({
  profileCache: { resolve: vi.fn() },
}));
vi.mock("../../../infra/audit/auth-audit.repo.js", () => ({
  authAuditRepository: { record: vi.fn() },
  AUTH_AUDIT_ACTIONS: { PROFILE_SWITCH: "PROFILE_SWITCH" },
}));

import { AuthRepository } from "../auth.repo.js";
import { AuthController } from "../auth.controller.js";
import { AuthUseCase } from "../auth.usecase.js";
import { HashService } from "../../../infra/security/hash.js";
import { AuthSessionService } from "../../../infra/security/auth-session.js";

const activeUser = {
  id: 7,
  email: "user@example.com",
  password: "stored-hash",
  isActive: true,
};

describe("auth reset and logout security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    AuthRepository.findById.mockResolvedValue(activeUser);
    AuthRepository.changePassword.mockResolvedValue({
      ...activeUser,
      password: "new-hash",
      googleRefreshToken: "secret",
      telegramSession: "secret",
    });
    HashService.compare.mockResolvedValue(false);
    HashService.hash.mockResolvedValue("new-hash");
    AuthSessionService.verifyPasswordResetToken.mockResolvedValue({ id: 7 });
    AuthSessionService.consumePasswordResetToken.mockResolvedValue({ id: 7 });
    AuthSessionService.invalidateUserSessions.mockResolvedValue(1);
    AuthSessionService.revokeRefreshToken.mockResolvedValue(true);
  });

  it("returns a null reset DTO even if the repository returns a sensitive row", async () => {
    const result = await AuthUseCase.resetPassword("reset-token", "NewPassword1");
    expect(result).toBeNull();
    expect(AuthRepository.changePassword).toHaveBeenCalledWith("new-hash", 7);
  });

  it("serializes reset success with null data and no sensitive fields", async () => {
    const resetSpy = vi.spyOn(AuthUseCase, "resetPassword").mockResolvedValue({
      password: "hash",
      googleRefreshToken: "secret",
    });
    const json = vi.fn();
    const res = { status: vi.fn(() => ({ json })) };

    await AuthController.resetPassword(
      { body: { token: "reset-token", password: "NewPassword1" } },
      res,
    );

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: null }),
    );
    const payload = json.mock.calls[0][0];
    expect(JSON.stringify(payload)).not.toContain("password");
    expect(JSON.stringify(payload)).not.toContain("secret");
    resetSpy.mockRestore();
  });

  it("consumes a reset token once and rejects reuse", async () => {
    AuthSessionService.consumePasswordResetToken
      .mockResolvedValueOnce({ id: 7 })
      .mockRejectedValueOnce(
        new AppError({ code: "INVALID_TOKEN", statusCode: 401 }),
      );

    await expect(
      AuthUseCase.resetPassword("reset-token", "NewPassword1"),
    ).resolves.toBeNull();
    await expect(
      AuthUseCase.resetPassword("reset-token", "OtherPassword2"),
    ).rejects.toMatchObject({ code: "INVALID_TOKEN", statusCode: 401 });
    expect(AuthRepository.changePassword).toHaveBeenCalledTimes(1);
  });

  it("invalidates every prior refresh session before saving the password", async () => {
    await AuthUseCase.resetPassword("reset-token", "NewPassword1");
    expect(AuthSessionService.invalidateUserSessions).toHaveBeenCalledWith(7);
    expect(
      AuthSessionService.invalidateUserSessions.mock.invocationCallOrder[0],
    ).toBeLessThan(AuthRepository.changePassword.mock.invocationCallOrder[0]);
  });

  it("revokes the presented refresh-token family on logout", async () => {
    await expect(AuthUseCase.logout("refresh-token")).resolves.toBeNull();
    expect(AuthSessionService.revokeRefreshToken).toHaveBeenCalledWith(
      "refresh-token",
    );
  });
});
