import { describe, it, expect, vi } from "vitest";
import { AppError } from "../AppError.js";
import { errorHandler } from "../error-handler.js";

function mockRes() {
  return { statusCode: 0, body: null,
    status(c){ this.statusCode = c; return this; },
    json(b){ this.body = b; return this; } };
}

describe("errorHandler", () => {
  it("serializes the full envelope for an AppError", () => {
    const res = mockRes();
    const err = new AppError("LEAD_ACCESS_DENIED", 403, { requiredPermissions: ["lead.view"] }, {
      translationKey: "leadsMessages", redirectTo: "/dashboard/leads", redirectText: "BACK_TO_LEADS",
    });
    errorHandler(err, { method: "GET", originalUrl: "/leads/9" }, res, () => {});
    expect(res.statusCode).toBe(403);
    expect(res.body).toMatchObject({
      success: false, message: "LEAD_ACCESS_DENIED", code: "LEAD_ACCESS_DENIED",
      translationKey: "leadsMessages", redirectTo: "/dashboard/leads",
      redirectText: "BACK_TO_LEADS", dontRedirect: false,
      details: { requiredPermissions: ["lead.view"] }, route: "GET /leads/9",
    });
  });
});
