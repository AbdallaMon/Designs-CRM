import { describe, it, expect } from "vitest";
import { describeApiError } from "../richError.js";

describe("describeApiError", () => {
  it("resolves the code and passes redirect metadata through", () => {
    const d = describeApiError({
      message: "PERMISSION_DENIED",
      redirectTo: "/dashboard",
      redirectText: "BACK_TO_DASHBOARD",
      dontRedirect: false,
    });
    expect(typeof d.message).toBe("string");
    expect(d.message.length).toBeGreaterThan(0);
    expect(d.message).not.toBe("PERMISSION_DENIED"); // resolved, not the raw code
    expect(d.redirectTo).toBe("/dashboard");
    expect(d.dontRedirect).toBe(false);
  });

  it("defaults redirectTo/redirectText to null and dontRedirect to false when absent", () => {
    const d = describeApiError({ message: "NOT_FOUND" });
    expect(d.redirectTo).toBeNull();
    expect(d.redirectText).toBeNull();
    expect(d.dontRedirect).toBe(false);
  });

  it("coerces dontRedirect to a boolean and resolves redirectText when present", () => {
    const d = describeApiError({
      message: "FORBIDDEN",
      redirectTo: "/login",
      redirectText: "BACK_TO_DASHBOARD",
      dontRedirect: 1,
    });
    expect(d.dontRedirect).toBe(true);
    expect(typeof d.redirectText).toBe("string");
    expect(d.redirectText.length).toBeGreaterThan(0);
  });

  it("handles an empty body without throwing", () => {
    const d = describeApiError();
    expect(d.redirectTo).toBeNull();
    expect(d.redirectText).toBeNull();
    expect(d.dontRedirect).toBe(false);
    expect(typeof d.message).toBe("string");
  });
});
