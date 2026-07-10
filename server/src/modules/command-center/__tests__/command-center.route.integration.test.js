// Real HTTP integration test for the /v2/command-center/overview admin cockpit, exercising
// the LIVE middleware chain (requireAuth → requirePermissions([command_center.view]) →
// validate(query) → controller → usecase → repo) + the JSON envelope. Mirrors the audit
// integration harness: JWT secrets set BEFORE importing env-reading modules, everything
// dynamic-imported in beforeAll. The Prisma client is mocked (no DB) so the ADMIN path
// returns a real composed overview envelope.
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import express from "express";
import cookieParser from "cookie-parser";

process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.ISLOCAL = "true";

// Mock the singleton Prisma client — the command-center repo reads through it. Every
// delegate returns an EMPTY/zero result so the ADMIN path composes a clean empty overview.
// NOTE (money boundary): no payment / contractPayment / outcome delegate is defined — the
// module must never touch them; if it did, the mock would throw (undefined delegate).
vi.mock("@dms/db", () => ({
  default: {
    clientLead: {
      groupBy: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      aggregate: vi.fn().mockResolvedValue({ _sum: { averagePrice: null } }),
    },
    invoice: { aggregate: vi.fn().mockResolvedValue({ _sum: { amount: null } }) },
    commission: { aggregate: vi.fn().mockResolvedValue({ _sum: { amount: null } }) },
    user: { findMany: vi.fn().mockResolvedValue([]) },
    project: { count: vi.fn().mockResolvedValue(0) },
    autoAssignment: { findMany: vi.fn().mockResolvedValue([]) },
    deliverySchedule: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
    $transaction: vi.fn(),
  },
}));

let server;
let baseUrl;
let JwtService;
let commandCenterRouter;
let errorHandler;
let AUTH_COOKIE_NAME;
let authMessagesCodes;
let PERMISSIONS;

beforeAll(async () => {
  ({ JwtService } = await import("../../../infra/security/jwt.js"));
  ({ commandCenterRouter } = await import("../command-center.route.js"));
  ({ errorHandler } = await import("../../../shared/errors/error-handler.js"));
  ({ AUTH_COOKIE_NAME, authMessagesCodes, PERMISSIONS } = await import("@dms/shared"));

  const app = express();
  app.use(cookieParser());
  app.use("/command-center", commandCenterRouter);
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

describe("GET /v2/command-center/overview — admin-only cockpit (real HTTP)", () => {
  it("no cookie -> 401 UNAUTHORIZED", async () => {
    const { status, body } = await getJson("/command-center/overview");
    expect(status).toBe(401);
    expect(body.message).toBe(authMessagesCodes.UNAUTHORIZED);
  });

  it("STAFF token (lacks command_center.view) -> 403 PERMISSION_DENIED", async () => {
    const { status, body } = await getJson("/command-center/overview", signFor("STAFF"));
    expect(status).toBe(403);
    expect(body.message).toBe("PERMISSION_DENIED");
    expect(body.details.requiredPermissions).toEqual([PERMISSIONS.COMMAND_CENTER.VIEW]);
  });

  it("ACCOUNTANT token -> 403 (not an admin surface)", async () => {
    const { status } = await getJson("/command-center/overview", signFor("ACCOUNTANT"));
    expect(status).toBe(403);
  });

  it("THREE_D_DESIGNER token -> 403 (not an admin surface)", async () => {
    const { status } = await getJson("/command-center/overview", signFor("THREE_D_DESIGNER"));
    expect(status).toBe(403);
  });

  it("ADMIN token -> 200 with the { kpis, pipeline, capacity, delivery } envelope", async () => {
    const { status, body } = await getJson("/command-center/overview", signFor("ADMIN"));
    expect(status).toBe(200);
    expect(body).toMatchObject({
      success: true,
      message: "COMMAND_CENTER_FETCHED",
      translationKey: "commandCenterMessages",
    });
    expect(body.data).toEqual({
      kpis: {
        activeDeals: 0,
        pipelineValue: 0,
        finalizedValue: 0,
        revenue: 0,
        commissions: 0,
        lateDeliveries: 0,
      },
      pipeline: [],
      capacity: { designers: [], sales: [], autoAssign: [] },
      delivery: { lateCount: 0, items: [] },
    });
  });

  it("SUPER_ADMIN token -> 200", async () => {
    const { status } = await getJson("/command-center/overview", signFor("SUPER_ADMIN"));
    expect(status).toBe(200);
  });
});
