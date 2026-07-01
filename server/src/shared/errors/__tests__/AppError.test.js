import { describe, it, expect } from "vitest";
import { AppError } from "../AppError.js";

describe("AppError", () => {
  it("preserves the legacy positional shape", () => {
    const e = new AppError("FORBIDDEN", 403, { requiredPermissions: ["lead.list"] });
    expect(e.message).toBe("FORBIDDEN");
    expect(e.statusCode).toBe(403);
    expect(e.details).toEqual({ requiredPermissions: ["lead.list"] });
    expect(e.code).toBe("FORBIDDEN"); // code defaults to message
    expect(e.dontRedirect).toBe(false);
  });
  it("carries the options bag for reasons + redirects", () => {
    const e = new AppError("LEAD_ACCESS_DENIED", 403, null, {
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
});
