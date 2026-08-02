import { describe, it, expect } from "vitest";
import { AppError } from "../AppError.js";

describe("AppError", () => {
  it("uses the canonical options shape", () => {
    const e = new AppError({
      code: "FORBIDDEN",
      statusCode: 403,
      details: { requiredPermissions: ["lead.list"] },
    });
    expect(e.message).toBe("FORBIDDEN");
    expect(e.statusCode).toBe(403);
    expect(e.details).toEqual({ requiredPermissions: ["lead.list"] });
    expect(e.code).toBe("FORBIDDEN");
    expect(e.dontRedirect).toBe(false);
  });
  it("carries reasons and redirect metadata", () => {
    const e = new AppError({
      code: "LEAD_ACCESS_DENIED",
      statusCode: 403,
      translationKey: "leadsMessages",
      redirectTo: "/dashboard/leads",
      redirectText: "BACK_TO_LEADS",
      reason: "lead not owned by user",
    });
    expect(e.code).toBe("LEAD_ACCESS_DENIED");
    expect(e.translationKey).toBe("leadsMessages");
    expect(e.redirectTo).toBe("/dashboard/leads");
    expect(e.redirectText).toBe("BACK_TO_LEADS");
    expect(e.reason).toBe("lead not owned by user");
  });

  it("rejects prose and non-canonical codes", () => {
    expect(
      () => new AppError({ code: "Human readable error" }),
    ).toThrow(TypeError);
    expect(
      () => new AppError({ code: "booking.invalid" }),
    ).toThrow(TypeError);
  });
});
