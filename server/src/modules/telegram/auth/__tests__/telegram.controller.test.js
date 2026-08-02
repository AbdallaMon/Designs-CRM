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
      data: { status: "INIT" },
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
      data: { status: "INIT" },
      translationKey: "adminResidualMessages",
    });
  });
});
