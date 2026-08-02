import { describe, expect, it } from "vitest";
import { generalMessagesCodes } from "@dms/shared";
import { rateLimitResponse } from "../rate-limit-response.js";

describe("rateLimitResponse", () => {
  it("uses the standard coded error envelope", () => {
    expect(rateLimitResponse()).toEqual({
      success: false,
      message: generalMessagesCodes.TOO_MANY_REQUESTS,
      code: generalMessagesCodes.TOO_MANY_REQUESTS,
      data: null,
      translationKey: "generalMessages",
      details: null,
    });
  });
});
