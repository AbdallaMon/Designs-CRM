import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { env } from "../../../config/env.js";
import { attachmentErrorRedirect } from "../attachment-error-redirect.middleware.js";

describe("attachment error redirect", () => {
  const originalDashboardOrigin = env.DASHBOARD_ORIGIN;

  beforeEach(() => {
    env.DASHBOARD_ORIGIN = "http://localhost:4001";
  });

  afterEach(() => {
    env.DASHBOARD_ORIGIN = originalDashboardOrigin;
    vi.restoreAllMocks();
  });

  function response() {
    return {
      headersSent: false,
      setHeader: vi.fn(),
      redirect: vi.fn(),
    };
  }

  it("redirects a lead-scope denial to the public frontend error page", () => {
    const res = response();
    const next = vi.fn();
    const error = Object.assign(new Error("LEAD_ACCESS_DENIED"), {
      statusCode: 403,
    });

    attachmentErrorRedirect(error, {}, res, next);

    expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", "no-store");
    expect(res.redirect).toHaveBeenCalledWith(
      302,
      "http://localhost:4001/error?code=LEAD_ACCESS_DENIED&status=403",
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("redirects unauthenticated attachment requests to a sign-in error", () => {
    const res = response();

    attachmentErrorRedirect(
      { code: "UNAUTHORIZED", statusCode: 401 },
      {},
      res,
      vi.fn(),
    );

    expect(res.redirect).toHaveBeenCalledWith(
      302,
      "http://localhost:4001/error?code=UNAUTHORIZED&status=401",
    );
  });

  it("does not expose raw unexpected error messages", () => {
    const res = response();

    attachmentErrorRedirect(
      new Error("database password leaked"),
      {},
      res,
      vi.fn(),
    );

    const redirectUrl = res.redirect.mock.calls[0][1];
    expect(redirectUrl).toBe(
      "http://localhost:4001/error?code=INTERNAL_SERVER_ERROR&status=500",
    );
    expect(redirectUrl).not.toContain("database");
  });

  it("falls through to the normal API error handler when the frontend origin is invalid", () => {
    env.DASHBOARD_ORIGIN = "not-a-url";
    const res = response();
    const next = vi.fn();
    const error = Object.assign(new Error("LEAD_ACCESS_DENIED"), {
      statusCode: 403,
    });

    attachmentErrorRedirect(error, {}, res, next);

    expect(res.redirect).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(error);
  });

  it("keeps redirect behavior scoped as Express error middleware", () => {
    expect(attachmentErrorRedirect).toHaveLength(4);
  });
});

