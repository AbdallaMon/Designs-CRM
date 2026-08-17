import { describe, expect, it, vi } from "vitest";
import { adminResidualMessagesCodes } from "@dms/shared";
import { TelegramManager } from "../telegram.manager.js";

function managerWithClient(client) {
  const manager = Object.create(TelegramManager.prototype);
  manager.client = client;
  manager.connectingPromise = null;
  return manager;
}

describe("Telegram manager secret handling", () => {
  it("returns no provider object, OTP, or code hash after code verification", async () => {
    const manager = managerWithClient({
      invoke: vi.fn().mockResolvedValue({
        phoneCode: "12345",
        phoneCodeHash: "secret-code-hash",
        accessHash: "provider-secret",
      }),
    });

    const result = await manager.verifyCode({
      phoneNumber: "+971500000000",
      phoneCodeHash: "secret-code-hash",
      phoneCode: "12345",
    });

    expect(result).toBe(true);
    expect(JSON.stringify(result)).not.toMatch(
      /12345|secret-code-hash|provider-secret/,
    );
  });

  it("returns a stable health code instead of a raw provider error", async () => {
    const manager = managerWithClient({
      connected: true,
      checkAuthorization: vi
        .fn()
        .mockRejectedValue(new Error("provider secret-token failure")),
    });

    const result = await manager.checkHealth();

    expect(result.error).toBe(
      adminResidualMessagesCodes.TELEGRAM_CONNECTION_FAILED,
    );
    expect(JSON.stringify(result)).not.toContain("secret-token");
  });
});
