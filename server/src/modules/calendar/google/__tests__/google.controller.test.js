import { beforeEach, describe, expect, it, vi } from "vitest";
import { calendarMessagesCodes } from "@dms/shared";
import { googleCalendarController } from "../google.controller.js";
import { googleCalendarUsecase } from "../google.usecase.js";

function response() {
  const res = {
    redirect: vi.fn(() => res),
  };
  return res;
}

describe("Google OAuth callback redirect contract", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.DASHBOARD_ORIGIN = "https://dashboard.example";
  });

  it("redirects missing callback parameters with a stable code", async () => {
    const res = response();
    await googleCalendarController.handleOAuthCallback(
      { query: {}, auth: { id: 7 } },
      res,
    );

    expect(res.redirect).toHaveBeenCalledWith(
      `https://dashboard.example/dashboard?googleAuthError=${calendarMessagesCodes.GOOGLE_CALLBACK_INVALID}&profileOpen=true`,
    );
  });

  it("never redirects a raw third-party error message", async () => {
    vi.spyOn(googleCalendarUsecase, "handleCallback").mockRejectedValue(
      new Error("access_token=secret-token"),
    );
    const res = response();

    await googleCalendarController.handleOAuthCallback(
      { query: { code: "code", state: "state" }, auth: { id: 7 } },
      res,
    );

    const redirect = res.redirect.mock.calls[0][0];
    expect(redirect).toContain(
      `googleAuthError=${calendarMessagesCodes.CALENDAR_FETCH_FAILED}`,
    );
    expect(redirect).not.toContain("secret-token");
    expect(redirect).not.toContain("access_token");
  });
});
