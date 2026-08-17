import { beforeEach, describe, expect, it } from "vitest";
import {
  AUTH_COOKIE_NAME,
  AUTH_REFRESH_TOKEN_COOKIE_NAME,
} from "@dms/shared";
import { env } from "../../../config/env.js";
import { authCsrfProtection } from "../auth-csrf.middleware.js";

const csrfToken = "a".repeat(43);

function request({
  method = "POST",
  path = "/v2/projects",
  origin,
  referer,
  csrfHeader = csrfToken,
  cookies = {
    [AUTH_COOKIE_NAME]: "access",
    [AUTH_REFRESH_TOKEN_COOKIE_NAME]: "refresh",
    csrf_token: csrfToken,
  },
} = {}) {
  const headers = {
    origin,
    referer,
    "x-csrf-token": csrfHeader,
  };
  return {
    method,
    path,
    cookies,
    get(name) {
      return headers[String(name).toLowerCase()];
    },
  };
}

function run(req) {
  return new Promise((resolve) => {
    authCsrfProtection(req, {}, (error) => resolve(error || null));
  });
}

describe("authCsrfProtection", () => {
  beforeEach(() => {
    env.ALLOW_ORIGIN = undefined;
    env.ALLOWED_DOMAINS = undefined;
    env.COOKIE_DOMAIN = ".dream.test";
    env.DASHBOARD_ORIGIN = "https://dashboard.dream.test";
    env.COURSES_ORIGIN = "https://courses.dream.test";
    env.PORTFOLIO_ORIGIN = undefined;
    env.CONTACT_ORIGIN = undefined;
    env.BOOKING_ORIGIN = undefined;
    env.SERVER_URL = "https://api.dream.test";
  });

  it("blocks a cross-origin unsafe cookie-authenticated request", async () => {
    const error = await run(request({ origin: "https://attacker.example" }));
    expect(error).toMatchObject({ code: "FORBIDDEN", statusCode: 403 });
  });

  it.each([
    "https://dashboard.dream.test",
    "https://courses.dream.test",
    "https://ops.dream.test",
  ])("allows trusted dashboard/courses/same-site origin %s", async (origin) => {
    await expect(run(request({ origin }))).resolves.toBeNull();
  });

  it("accepts a trusted Referer when Origin is unavailable", async () => {
    await expect(
      run(
        request({
          origin: undefined,
          referer: "https://dashboard.dream.test/projects/1",
        }),
      ),
    ).resolves.toBeNull();
  });

  it("derives the trusted origin from a booking page base URL", async () => {
    env.COOKIE_DOMAIN = undefined;
    env.BOOKING_ORIGIN = "https://booking.dream.test/register";
    await expect(
      run(request({ origin: "https://booking.dream.test" })),
    ).resolves.toBeNull();
  });

  it("rejects a trusted origin when the double-submit token mismatches", async () => {
    const error = await run(
      request({
        origin: "https://dashboard.dream.test",
        csrfHeader: "b".repeat(43),
      }),
    );
    expect(error).toMatchObject({ code: "FORBIDDEN", statusCode: 403 });
  });

  it("keeps public purpose-token endpoints independent from auth cookies", async () => {
    await expect(
      run(
        request({
          path: "/v2/files/client/capabilities",
          origin: "https://external-client.example",
          csrfHeader: undefined,
        }),
      ),
    ).resolves.toBeNull();
  });

  it.each([
    "/v2/client/new-lead",
    "/v2/client/new-lead/register",
    "/v2/client/new-lead/complete-register/42",
    "/v2/client/cooperation-requests",
    "/v2/client/booking-leads",
    "/v2/client/booking-leads/42",
    "/v2/client/booking-leads/42/actions/submit",
    "/v2/client/pay",
  ])("keeps the public funnel mutation %s independent from auth cookies", async (path) => {
    await expect(
      run(
        request({
          path,
          origin: "https://external-client.example",
          csrfHeader: undefined,
        }),
      ),
    ).resolves.toBeNull();
  });

  it("keeps password-reset completion public even if stale cookies exist", async () => {
    await expect(
      run(
        request({
          path: "/v2/auth/reset-password",
          origin: "https://external-client.example",
          csrfHeader: undefined,
        }),
      ),
    ).resolves.toBeNull();
  });
});
