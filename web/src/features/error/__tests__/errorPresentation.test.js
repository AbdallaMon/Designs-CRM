import { describe, expect, it } from "vitest";
import { getErrorPresentation } from "../config/errorPresentation";

describe("generic error presentation", () => {
  it("shows the specific friendly message for a lead-scope denial", () => {
    expect(
      getErrorPresentation({ code: "LEAD_ACCESS_DENIED", status: "403" }),
    ).toMatchObject({
      code: "LEAD_ACCESS_DENIED",
      status: 403,
      title: "Access denied",
      message: "You do not have access to this lead",
      actionHref: "/dashboard",
    });
  });

  it("sends unauthenticated users to sign in", () => {
    expect(
      getErrorPresentation({ code: "UNAUTHORIZED", status: "401" }),
    ).toMatchObject({
      status: 401,
      title: "Sign in required",
      actionHref: "/login",
    });
  });

  it("does not display a malformed or injected message code", () => {
    const presentation = getErrorPresentation({
      code: "<script>alert(1)</script>",
      status: "403",
    });

    expect(presentation).toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      status: 500,
      title: "Something went wrong",
    });
    expect(presentation.message).not.toContain("script");
  });

  it("uses a safe generic state for invalid status values", () => {
    expect(
      getErrorPresentation({ code: "UNKNOWN_SAFE_CODE", status: "200" }),
    ).toMatchObject({
      code: "UNKNOWN_SAFE_CODE",
      status: 500,
      title: "Something went wrong",
    });
  });
});

