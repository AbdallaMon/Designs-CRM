// Real HTTP integration test for the LIVE authorization middleware chain:
// requireAuth → requirePermissions → requireSpecialChecker → errorHandler, plus
// the `/auth/me` navigationTabs contract. This exercises actual runtime wiring
// (cookie parsing, JWT verify, Express error-handling dispatch, JSON envelope
// shape) that the pure unit tests (e.g. auth.me.test.js on AuthSchema.toMe) do
// NOT cover. No DB / Redis / Telegram — permissions are computed from the JWT
// payload alone via the code-defined role→permission map.
//
// CRITICAL: `config/env.js` reads `process.env` at import time (dotenv). We set
// the JWT secrets BEFORE importing any module that transitively pulls in env.js,
// then dynamic-`import()` everything inside `beforeAll`.
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import express from "express";
import cookieParser from "cookie-parser";

process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.ISLOCAL = "true";

vi.mock("../../../infra/auth/profile-cache.js", async () => {
  const { getEffectivePermissions } = await import("@dms/shared");
  const keys = { 1: "ACCOUNTANT", 2: "ADMIN" };
  const toProfile = (id) => {
    const key = keys[id];
    if (!key) return null;
    const effective = getEffectivePermissions({ profile: key });
    return {
      id,
      key,
      label: key,
      family: key === "ACCOUNTANT" ? "FINANCE" : "ADMIN",
      isAdminTier: key === "ADMIN",
      ...effective,
    };
  };
  return {
    profileCache: {
      resolve: toProfile,
      resolveMeta: toProfile,
    },
  };
});

let server;
let baseUrl;
let JwtService;
let AuthMiddleware;
let AuthController;
let AppError;
let errorHandler;
let PERMISSIONS;
let authMessagesCodes;
let AUTH_COOKIE_NAME;

beforeAll(async () => {
  ({ JwtService } = await import("../../../infra/security/jwt.js"));
  ({ AuthMiddleware } = await import("../auth.middleware.js"));
  ({ AuthController } = await import("../../../modules/auth/auth.controller.js"));
  ({ AppError } = await import("../../errors/AppError.js"));
  ({ errorHandler } = await import("../../errors/error-handler.js"));
  ({ PERMISSIONS, authMessagesCodes, AUTH_COOKIE_NAME } = await import("@dms/shared"));

  const app = express();
  app.use(cookieParser());

  const router = express.Router();
  router.use(AuthMiddleware.requireAuth);

  router.get("/me", AuthController.getCurrentUser);

  router.get(
    "/needs-user-create",
    AuthMiddleware.requirePermissions([PERMISSIONS.USER.CREATE]),
    (req, res) => res.json({ ok: true }),
  );

  router.get(
    "/scoped",
    AuthMiddleware.requireSpecialChecker(async () => {
      throw new AppError({
        code: authMessagesCodes.ACCESS_DENIED,
        statusCode: 403,
        translationKey: "leadsMessages",
        redirectTo: "/dashboard/leads",
        redirectText: "BACK_TO_LEADS",
        reason: "lead not owned",
      });
    }),
    (req, res) => res.json({ ok: true }),
  );

  app.use(router);
  app.use(errorHandler);

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

function signFor(role) {
  const currentProfileId = role === "ACCOUNTANT" ? 1 : 2;
  return JwtService.signAccess({
    id: 1,
    currentProfileId,
    profileIds: [currentProfileId],
    isActive: true,
  });
}

async function getJson(path, token) {
  const headers = token ? { cookie: `${AUTH_COOKIE_NAME}=${token}` } : {};
  const res = await fetch(`${baseUrl}${path}`, { headers });
  const body = await res.json();
  return { status: res.status, body };
}

describe("authorization middleware chain — real HTTP integration", () => {
  it("1) no cookie -> GET /me -> 401 UNAUTHORIZED", async () => {
    const { status, body } = await getJson("/me");
    expect(status).toBe(401);
    expect(body.message).toBe(authMessagesCodes.UNAUTHORIZED);
  });

  it("2) ACCOUNTANT token -> GET /me -> 200, has salaries tab, no leads tab, has accounting permission", async () => {
    const token = signFor("ACCOUNTANT");
    const { status, body } = await getJson("/me", token);
    expect(status).toBe(200);

    const tabs = body.data.user.navigationTabs;
    expect(Array.isArray(tabs)).toBe(true);
    expect(tabs.some((t) => t.href === "/dashboard/salaries")).toBe(true);
    expect(tabs.some((t) => t.href === "/dashboard/leads")).toBe(false);

    expect(body.data.user.permissions).toContain(PERMISSIONS.ACCOUNTING.SALARY_VIEW);
  });

  it("3) ACCOUNTANT token -> GET /needs-user-create -> 403 PERMISSION_DENIED envelope", async () => {
    const token = signFor("ACCOUNTANT");
    const { status, body } = await getJson("/needs-user-create", token);
    expect(status).toBe(403);
    expect(body).toMatchObject({
      success: false,
      message: "PERMISSION_DENIED",
      code: "PERMISSION_DENIED",
      details: { requiredPermissions: [PERMISSIONS.USER.CREATE] },
      route: "GET /needs-user-create",
    });
    expect(body.reason).not.toBeNull();
  });

  it("4) ADMIN token -> GET /needs-user-create -> 200, and /me navigationTabs include users + website-utilities", async () => {
    const adminToken = signFor("ADMIN");

    const created = await getJson("/needs-user-create", adminToken);
    expect(created.status).toBe(200);
    expect(created.body).toEqual({ ok: true });

    const me = await getJson("/me", adminToken);
    expect(me.status).toBe(200);
    const tabs = me.body.data.user.navigationTabs;
    expect(tabs.some((t) => t.href === "/dashboard/users")).toBe(true);
    expect(tabs.some((t) => t.href === "/dashboard/website-utilities")).toBe(true);
  });

  it("5) ADMIN token -> GET /scoped -> 403 ACCESS_DENIED with redirect metadata", async () => {
    const token = signFor("ADMIN");
    const { status, body } = await getJson("/scoped", token);
    expect(status).toBe(403);
    expect(body.code).toBe(authMessagesCodes.ACCESS_DENIED);
    expect(body.redirectTo).toBe("/dashboard/leads");
    expect(body.redirectText).toBe("BACK_TO_LEADS");
    expect(body.reason).toBe("lead not owned");
  });
});
