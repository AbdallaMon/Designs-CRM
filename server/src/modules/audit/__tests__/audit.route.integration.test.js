// Real HTTP integration test for the /v2/audit-logs admin viewer, exercising the LIVE
// middleware chain (requireAuth → requirePermissions([audit.log.view]) → validate(query)
// → controller → usecase → repo) + the JSON envelope. Mirrors the authz.integration
// harness style: JWT secrets set BEFORE importing env-reading modules, everything
// dynamic-imported in beforeAll. The Prisma client is mocked (no DB) so the ADMIN path
// returns a real paged envelope.
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import express from "express";
import cookieParser from "cookie-parser";

process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.ISLOCAL = "true";

// Mock the singleton Prisma client — the audit repo reads through it.
vi.mock("@dms/db", () => ({
  default: {
    actionAuditLog: { findMany: vi.fn(), count: vi.fn() },
    user: { findMany: vi.fn() },
    $transaction: vi.fn().mockResolvedValue([[], 0]),
  },
}));

let server;
let baseUrl;
let JwtService;
let AuthMiddleware;
let auditRouter;
let errorHandler;
let AUTH_COOKIE_NAME;
let authMessagesCodes;
let PERMISSIONS;

beforeAll(async () => {
  ({ JwtService } = await import("../../../infra/security/jwt.js"));
  ({ AuthMiddleware } = await import("../../../shared/middlewares/auth.middleware.js"));
  ({ auditRouter } = await import("../audit.route.js"));
  ({ errorHandler } = await import("../../../shared/errors/error-handler.js"));
  ({ AUTH_COOKIE_NAME, authMessagesCodes, PERMISSIONS } = await import("@dms/shared"));

  const app = express();
  app.use(cookieParser());
  app.use("/audit-logs", auditRouter);
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
  return JwtService.signAccess({
    id: 1,
    role,
    activeRole: role,
    isActive: true,
    isPrimary: false,
    isSuperSales: false,
    subRoles: [],
  });
}

async function getJson(path, token) {
  const headers = token ? { cookie: `${AUTH_COOKIE_NAME}=${token}` } : {};
  const res = await fetch(`${baseUrl}${path}`, { headers });
  const body = await res.json();
  return { status: res.status, body };
}

describe("GET /v2/audit-logs — admin-only viewer (real HTTP)", () => {
  it("no cookie -> 401 UNAUTHORIZED", async () => {
    const { status, body } = await getJson("/audit-logs");
    expect(status).toBe(401);
    expect(body.message).toBe(authMessagesCodes.UNAUTHORIZED);
  });

  it("STAFF token (lacks audit.log.view) -> 403 PERMISSION_DENIED", async () => {
    const { status, body } = await getJson("/audit-logs", signFor("STAFF"));
    expect(status).toBe(403);
    expect(body.message).toBe("PERMISSION_DENIED");
    expect(body.details.requiredPermissions).toEqual([PERMISSIONS.AUDIT.LOG_VIEW]);
  });

  it("ACCOUNTANT token -> 403 (not an admin surface)", async () => {
    const { status } = await getJson("/audit-logs", signFor("ACCOUNTANT"));
    expect(status).toBe(403);
  });

  it("ADMIN token -> 200 with the paginated {items,total,page,pageSize} envelope", async () => {
    const { status, body } = await getJson("/audit-logs", signFor("ADMIN"));
    expect(status).toBe(200);
    expect(body).toMatchObject({
      success: true,
      message: "AUDIT_LOGS_FETCHED",
      translationKey: "auditMessages",
    });
    expect(body.data).toEqual({ items: [], total: 0, page: 1, pageSize: 20 });
  });

  it("SUPER_ADMIN token -> 200", async () => {
    const { status } = await getJson("/audit-logs", signFor("SUPER_ADMIN"));
    expect(status).toBe(200);
  });
});
