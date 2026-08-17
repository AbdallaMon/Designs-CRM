import { beforeEach, describe, expect, it, vi } from "vitest";

const manager = vi.hoisted(() => ({
  sendCode: vi.fn(),
  verifyCode: vi.fn(),
  verifyPassword: vi.fn(),
  getSessionString: vi.fn(),
  setConfig: vi.fn(),
  connect: vi.fn(),
  checkHealth: vi.fn(),
}));

const cache = vi.hoisted(() => ({
  getCurrentTeleStatus: vi.fn(),
  createNewTeleStatus: vi.fn(),
  updateCurrentTeleStatus: vi.fn(),
  deleteCurrentTeleStatus: vi.fn(),
}));

const repo = vi.hoisted(() => ({
  getMainConnection: vi.fn(),
  updateMainConnectionFields: vi.fn(),
  replaceEncryptedCredentials: vi.fn(),
  markNotifiedOfDisconnection: vi.fn(),
  upsertMainConnection: vi.fn(),
}));

vi.mock("../../manager/telegram.manager.js", () => ({
  getTelegramManager: () => manager,
}));

vi.mock("../telegram.cache.js", () => ({
  TelegramAuthCache: cache,
}));

vi.mock("../telegram.repo.js", () => ({
  telegramAuthRepo: repo,
}));

vi.mock("../../../../shared/notifications/notification.service.js", () => ({
  sendToAdmins: vi.fn(),
}));

import { adminResidualMessagesCodes } from "@dms/shared";
import { TelegramAuthusecase } from "../telegram.usecase.js";

describe("Telegram auth secret and error handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.INTEGRATION_CREDENTIALS_MASTER_KEY = Buffer.alloc(32, 13).toString("base64");
    cache.deleteCurrentTeleStatus.mockResolvedValue(undefined);
    cache.createNewTeleStatus.mockResolvedValue(undefined);
    cache.updateCurrentTeleStatus.mockResolvedValue(undefined);
    repo.updateMainConnectionFields.mockResolvedValue({ count: 1 });
    repo.replaceEncryptedCredentials.mockResolvedValue({ id: 1 });
    repo.getMainConnection.mockResolvedValue({
      id: 1,
      apiId: "123",
      apiHash: "api-hash",
      sessionString: null,
      encryptedCredential: null,
    });
    manager.getSessionString.mockReturnValue("secret-session-string");
  });

  it("keeps the code hash in cache but never returns it from init", async () => {
    manager.sendCode.mockResolvedValue({
      phoneNumber: "+971500000000",
      phoneCodeHash: "secret-code-hash",
      isCodeViaApp: true,
    });

    const result = await TelegramAuthusecase.initTelegramAuth(
      "+971500000000",
    );

    expect(cache.createNewTeleStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ phoneCodeHash: "secret-code-hash" }),
      }),
    );
    expect(result).toEqual({
      data: {
        phoneNumber: "+971500000000",
        teleStatus: "AWAIT_CODE",
      },
      message: adminResidualMessagesCodes.TELEGRAM_AUTH_INITIATED,
    });
    expect(JSON.stringify(result)).not.toContain("secret-code-hash");
  });

  it("does not return OTP, code hash, provider objects, or the saved session", async () => {
    cache.getCurrentTeleStatus.mockResolvedValue({
      phoneNumber: "+971500000000",
      teleStatus: "AWAIT_CODE",
      phoneCodeHash: "secret-code-hash",
    });
    manager.verifyCode.mockResolvedValue({
      phoneCode: "12345",
      phoneCodeHash: "secret-code-hash",
      accessHash: "provider-object-secret",
    });

    const result = await TelegramAuthusecase.verifyCode({
      phoneNumber: "+971500000000",
      code: "12345",
    });

    expect(manager.verifyCode).toHaveBeenCalledWith({
      phoneNumber: "+971500000000",
      phoneCodeHash: "secret-code-hash",
      phoneCode: "12345",
    });
    expect(result.data).toEqual({
      phoneNumber: "+971500000000",
      teleStatus: "SUCCESS",
    });
    expect(JSON.stringify(result)).not.toMatch(
      /12345|secret-code-hash|provider-object-secret|secret-session-string/,
    );
  });

  it("preserves the password-required UI step without returning the code hash", async () => {
    cache.getCurrentTeleStatus.mockResolvedValue({
      phoneNumber: "+971500000000",
      teleStatus: "AWAIT_CODE",
      phoneCodeHash: "secret-code-hash",
    });
    manager.verifyCode.mockRejectedValue({
      errorMessage: "SESSION_PASSWORD_NEEDED",
    });

    const result = await TelegramAuthusecase.verifyCode({
      phoneNumber: "+971500000000",
      code: "12345",
    });

    expect(result).toEqual({
      data: {
        phoneNumber: "+971500000000",
        teleStatus: "AWAIT_PASSWORD",
      },
      message: adminResidualMessagesCodes.TELEGRAM_PASSWORD_REQUIRED,
    });
    expect(JSON.stringify(result)).not.toMatch(/12345|secret-code-hash/);
  });

  it("completes the password happy path without returning the password or session", async () => {
    manager.verifyPassword.mockResolvedValue({ phone: "+971500000000" });

    const result = await TelegramAuthusecase.verifyPassword({
      phoneNumber: "+971500000000",
      password: "secret-password",
    });

    expect(result).toEqual({
      data: {
        phoneNumber: "+971500000000",
        teleStatus: "SUCCESS",
      },
      message: adminResidualMessagesCodes.TELEGRAM_PASSWORD_VERIFIED,
    });
    expect(repo.replaceEncryptedCredentials).toHaveBeenCalledWith({
      connectionId: 1,
      ciphertext: expect.any(String),
      metadata: expect.objectContaining({ algorithm: "AES-256-GCM", keyVersion: 1 }),
      fieldsToUpdate: {
        status: "CONNECTED",
      },
    });
    expect(JSON.stringify(repo.replaceEncryptedCredentials.mock.calls)).not.toContain(
      "secret-session-string",
    );
    expect(JSON.stringify(result)).not.toMatch(
      /secret-password|secret-session-string/,
    );
  });

  it("maps an expired cached code to the existing AppError code", async () => {
    cache.getCurrentTeleStatus.mockResolvedValue(null);

    await expect(
      TelegramAuthusecase.verifyCode({
        phoneNumber: "+971500000000",
        code: "12345",
      }),
    ).rejects.toMatchObject({
      code: adminResidualMessagesCodes.TELEGRAM_CODE_EXPIRED,
      statusCode: 401,
    });
  });

  it("maps provider code and password failures without exposing raw errors", async () => {
    cache.getCurrentTeleStatus.mockResolvedValue({
      phoneNumber: "+971500000000",
      phoneCodeHash: "secret-code-hash",
    });
    manager.verifyCode.mockRejectedValue({
      code: 400,
      errorMessage: "PHONE_CODE_INVALID",
      message: "raw provider code error secret-token",
    });

    await expect(
      TelegramAuthusecase.verifyCode({
        phoneNumber: "+971500000000",
        code: "12345",
      }),
    ).rejects.toMatchObject({
      code: adminResidualMessagesCodes.TELEGRAM_CODE_INCORRECT,
      statusCode: 401,
    });

    manager.verifyPassword.mockRejectedValue({
      errorMessage: "PASSWORD_HASH_INVALID",
      message: "raw provider password error secret-token",
    });
    await expect(
      TelegramAuthusecase.verifyPassword({
        phoneNumber: "+971500000000",
        password: "secret-password",
      }),
    ).rejects.toMatchObject({
      code: adminResidualMessagesCodes.TELEGRAM_PASSWORD_INCORRECT,
      statusCode: 401,
    });
  });
});
