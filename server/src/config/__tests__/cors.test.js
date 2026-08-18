import { describe, expect, it, vi } from "vitest";

vi.mock("../env.js", () => ({
  env: {
    ALLOW_ORIGIN: "https://test-web.dreamstudiio.com",
    ALLOWED_DOMAINS: "",
  },
  allowedOrigins: [
    "https://test-web.dreamstudiio.com",
    "https://test-courses.dreamstudiio.com",
  ],
}));

import { corsOptions } from "../cors.js";

function evaluateOrigin(origin) {
  let result;
  corsOptions.origin(origin, (error, allowed) => {
    result = { error, allowed };
  });
  return result;
}

describe("CORS configured frontend origins", () => {
  it("keeps COURSES_ORIGIN allowed when ALLOW_ORIGIN is also configured", () => {
    expect(evaluateOrigin("https://test-courses.dreamstudiio.com")).toEqual({
      error: null,
      allowed: true,
    });
  });
});
