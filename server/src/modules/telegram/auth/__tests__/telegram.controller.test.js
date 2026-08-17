import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminResidualMessagesCodes } from "@dms/shared";
import { TelegramController } from "../telegram.controller.js";
import { TelegramAuthusecase } from "../telegram.usecase.js";

function response() {
  const res = {
    status: vi.fn(() => res),
    json: vi.fn(() => res),
  };
  return res;
}

describe("Telegram controller contract", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a coded success envelope for auth init", async () => {
    vi.spyOn(TelegramAuthusecase, "initTelegramAuth").mockResolvedValue({
      data: {
        phoneNumber: "+971500000000",
        teleStatus: "AWAIT_CODE",
        phoneCodeHash: "secret-code-hash",
        code: "12345",
        password: "secret-password",
        sessionString: "secret-session",
      },
      message: adminResidualMessagesCodes.TELEGRAM_AUTH_INITIATED,
    });
    const res = response();

    await TelegramController.initTelegramAuth(
      { body: { phoneNumber: "+971500000000" } },
      res,
    );

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message:
        adminResidualMessagesCodes.TELEGRAM_AUTH_INITIATED,
      data: {
        phoneNumber: "+971500000000",
        teleStatus: "AWAIT_CODE",
      },
      translationKey: "adminResidualMessages",
    });
    expect(JSON.stringify(res.json.mock.calls)).not.toMatch(
      /secret-code-hash|12345|secret-password|secret-session/,
    );
  });

  it("returns only the current status fields used by the profile UI", async () => {
    vi.spyOn(TelegramAuthusecase, "getActiveAuth").mockResolvedValue({
      phoneNumber: "+971500000000",
      status: "CONNECTED",
      apiHash: "secret-api-hash",
      sessionString: "secret-session",
      lastError: "provider error with secret-token",
    });
    const res = response();

    await TelegramController.getCurrentTelegramAuth({}, res);

    expect(res.json.mock.calls[0][0].data).toEqual({
      phoneNumber: "+971500000000",
      status: "CONNECTED",
    });
    expect(JSON.stringify(res.json.mock.calls)).not.toMatch(
      /secret-api-hash|secret-session|secret-token/,
    );
  });
});
