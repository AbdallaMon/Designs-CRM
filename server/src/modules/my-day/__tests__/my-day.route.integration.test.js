// Real HTTP integration test for /v2/my-day — the permission matrix IS the feature's
// security story (spec §10): sales get the personal queue but not /team; ADMINS have NO
// personal queue (403 on /); SUPER_SALES gets /team without the designers block and is
// scope-blocked from drilling into a designer; admin drills into anyone. JWT secrets set
// BEFORE importing env-reading modules; Prisma mocked (no DB).
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import express from "express";
import cookieParser from "cookie-parser";

process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.ISLOCAL = "true";

const STALE_UPDATED = new Date("2026-01-01T00:00:00.000Z");

// One stale owned lead → the STAFF caller's queue has ≥1 item.
const BUNDLE = {
  id: 5,
  userId: 7,
  status: "IN_PROGRESS",
  paymentStatus: "PENDING",
  updatedAt: STALE_UPDATED,
  client: { name: "Aisha" },
  contracts: [],
  salesStages: [],
  callReminders: [{ time: new Date("2020-01-01T00:00:00.000Z"), status: "IN_PROGRESS" }],
  meetingReminders: [],
  priceOffers: [],
  sessionQuestions: [],
  versaModel: [],
};

const userFindUnique = vi.fn(async ({ where }) => {
  if (where.id === 9) return { id: 9, name: "Rep", isActive: true, role: "STAFF", profile: null, currentProfile: { key: "NORMAL_SALES" } };
  if (where.id === 42) return { id: 42, name: "Sara", isActive: true, role: "THREE_D_DESIGNER", profile: null, currentProfile: { key: "DESIGNER_3D" } };
  // The reported real-world case: an ADMIN-profiled user surfaced by the team lens via an
  // overdue call THEY own on a lead OWNED BY SOMEONE ELSE (they hold no leads themselves).
  if (where.id === 1) return { id: 1, name: "admin", isActive: true, role: "ADMIN", profile: null, currentProfile: { key: "ADMIN" } };
  return null;
});

// The admin's overdue call hangs off lead 55, owned by rep 7 — the drill-down must still
// itemize it (the team lens counted it by CallReminder.userId, role-agnostic).
const ADMIN_OVERDUE_CALL = {
  id: 91,
  time: new Date("2026-01-02T00:00:00.000Z"),
  clientLeadId: 55,
  clientLead: { id: 55, status: "IN_PROGRESS", client: { name: "Rep's Client" } },
};

vi.mock("@dms/db", () => ({
  default: {
    clientLead: {
      findMany: vi.fn(async ({ where }) => (where.userId === 7 || where.userId === 9 ? [BUNDLE] : [])),
      count: vi.fn().mockResolvedValue(1),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    callReminder: {
      groupBy: vi.fn().mockResolvedValue([]),
      // Overdue-call reads key on CallReminder.userId (reminder OWNER, not lead owner).
      findMany: vi.fn(async ({ where }) => (where?.userId === 1 ? [ADMIN_OVERDUE_CALL] : [])),
    },
    meetingReminder: { findMany: vi.fn().mockResolvedValue([]) },
    contract: { findMany: vi.fn().mockResolvedValue([]) },
    deliverySchedule: { findMany: vi.fn().mockResolvedValue([]) },
    assignment: { findMany: vi.fn().mockResolvedValue([]) },
    user: { findUnique: userFindUnique, findMany: vi.fn().mockResolvedValue([]) },
    project: { count: vi.fn().mockResolvedValue(0) },
  },
}));

let server;
let baseUrl;
let JwtService;
let myDayRouter;
let errorHandler;
let AUTH_COOKIE_NAME;
let authMessagesCodes;
let myDayMessagesCodes;

beforeAll(async () => {
  ({ JwtService } = await import("../../../infra/security/jwt.js"));
  ({ myDayRouter } = await import("../my-day.route.js"));
  ({ errorHandler } = await import("../../../shared/errors/error-handler.js"));
  ({ AUTH_COOKIE_NAME, authMessagesCodes, myDayMessagesCodes } = await import("@dms/shared"));

  const app = express();
  app.use(cookieParser());
  app.use("/my-day", myDayRouter);
  app.use(errorHandler);

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

function signFor({ id, role }) {
  return JwtService.signAccess({
    id,
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
  return { status: res.status, body: await res.json() };
}

describe("GET /v2/my-day — personal queue", () => {
  it("no cookie -> 401", async () => {
    const { status } = await getJson("/my-day");
    expect(status).toBe(401);
  });

  it("sales (STAFF) -> 200 with own queue items", async () => {
    const { status, body } = await getJson("/my-day", signFor({ id: 7, role: "STAFF" }));
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe(myDayMessagesCodes.MY_DAY_FETCHED);
    expect(body.data.family).toBe("SALES");
    expect(body.data.items.length).toBeGreaterThan(0);
    expect(body.data.items[0]).toMatchObject({ kind: "LEAD", leadId: 5, clientName: "Aisha" });
  });

  it("ADMIN -> 403 (admins hold no my_day.view — team lens only)", async () => {
    const { status, body } = await getJson("/my-day", signFor({ id: 1, role: "ADMIN" }));
    expect(status).toBe(403);
    expect(body.message).toBe(authMessagesCodes.PERMISSION_DENIED);
    expect(body.details.requiredPermissions).toContain("my_day.view");
  });

  it("ACCOUNTANT -> 200 FINANCE collections queue (2026-07-15 additive grant)", async () => {
    const { status, body } = await getJson("/my-day", signFor({ id: 3, role: "ACCOUNTANT" }));
    expect(status).toBe(200);
    expect(body.data.family).toBe("FINANCE");
  });

  it("CONTACT_INITIATOR -> 200 INITIATOR first-touch queue (2026-07-15 additive grant)", async () => {
    const { status, body } = await getJson("/my-day", signFor({ id: 4, role: "CONTACT_INITIATOR" }));
    expect(status).toBe(200);
    expect(body.data.family).toBe("INITIATOR");
  });

  it("ACCOUNTANT + CONTACT_INITIATOR still 403 on the team lens", async () => {
    for (const role of ["ACCOUNTANT", "CONTACT_INITIATOR"]) {
      const { status, body } = await getJson("/my-day/team", signFor({ id: 3, role }));
      expect(status).toBe(403);
      expect(body.details.requiredPermissions).toContain("my_day.team.view");
    }
  });
});

describe("GET /v2/my-day/team — supervisor rollup", () => {
  it("STAFF -> 403 PERMISSION_DENIED", async () => {
    const { status, body } = await getJson("/my-day/team", signFor({ id: 7, role: "STAFF" }));
    expect(status).toBe(403);
    expect(body.details.requiredPermissions).toContain("my_day.team.view");
  });

  it("SUPER_SALES -> 200, sales domain ONLY (no designers block)", async () => {
    const { status, body } = await getJson("/my-day/team", signFor({ id: 8, role: "SUPER_SALES" }));
    expect(status).toBe(200);
    expect(body.data.domains.sales).toBeTruthy();
    expect(body.data.domains.designers).toBeUndefined();
  });

  it("ADMIN -> 200 with sales + designers domains", async () => {
    const { status, body } = await getJson("/my-day/team", signFor({ id: 1, role: "ADMIN" }));
    expect(status).toBe(200);
    expect(body.data.domains.sales).toBeTruthy();
    expect(body.data.domains.designers).toBeTruthy();
  });
});

describe("GET /v2/my-day/users/:userId — supervisor drill-down", () => {
  it("SUPER_SALES -> sales target 200 (itemized: user + counts + items)", async () => {
    const { status, body } = await getJson("/my-day/users/9", signFor({ id: 8, role: "SUPER_SALES" }));
    expect(status).toBe(200);
    expect(body.data.family).toBe("SALES");
    expect(body.data.user).toMatchObject({ id: 9, name: "Rep" });
    expect(body.data.counts).toMatchObject({ active: expect.any(Number) });
    expect(body.data.items.some((i) => i.leadId === 5)).toBe(true);
  });

  it("SUPER_SALES -> designer target 403 MY_DAY_TEAM_SCOPE_DENIED", async () => {
    const { status, body } = await getJson("/my-day/users/42", signFor({ id: 8, role: "SUPER_SALES" }));
    expect(status).toBe(403);
    expect(body.message).toBe(myDayMessagesCodes.MY_DAY_TEAM_SCOPE_DENIED);
  });

  it("ADMIN -> designer target 200 (designer family queue)", async () => {
    const { status, body } = await getJson("/my-day/users/42", signFor({ id: 1, role: "ADMIN" }));
    expect(status).toBe(200);
    expect(body.data.family).toBe("DESIGNER");
  });

  it("ADMIN -> admin target 200 with the overdue call itemized (team-lens count ↔ drawer parity)", async () => {
    // Reported bug: the team lens says "admin has 1 overdue call(s)" but the drawer showed
    // "Nothing active". The drill-down must itemize work keyed the same way the lens counts
    // it — by CallReminder.userId — even when the target owns zero leads.
    const { status, body } = await getJson("/my-day/users/1", signFor({ id: 1, role: "ADMIN" }));
    expect(status).toBe(200);
    expect(body.data.family).toBe("SALES");
    expect(body.data.counts.overdueCalls).toBe(1);
    const row = body.data.items.find((i) => i.leadId === 55);
    expect(row).toBeTruthy();
    expect(row.flags.overdueCalls).toBe(1);
    expect(row.severity).toBe("critical");
  });

  it("unknown target -> 404; invalid param -> 422", async () => {
    const notFound = await getJson("/my-day/users/999", signFor({ id: 1, role: "ADMIN" }));
    expect(notFound.status).toBe(404);
    const invalid = await getJson("/my-day/users/abc", signFor({ id: 1, role: "ADMIN" }));
    expect(invalid.status).toBe(422);
  });

  it("STAFF -> 403 (no team code)", async () => {
    const { status } = await getJson("/my-day/users/9", signFor({ id: 7, role: "STAFF" }));
    expect(status).toBe(403);
  });
});

describe("GET /v2/my-day/unclaimed — aging unclaimed leads", () => {
  it("STAFF -> 403 (no team code)", async () => {
    const { status, body } = await getJson("/my-day/unclaimed", signFor({ id: 7, role: "STAFF" }));
    expect(status).toBe(403);
    expect(body.details.requiredPermissions).toContain("my_day.team.view");
  });

  it("ADMIN -> 200 with an items array", async () => {
    const { status, body } = await getJson("/my-day/unclaimed", signFor({ id: 1, role: "ADMIN" }));
    expect(status).toBe(200);
    expect(body.message).toBe(myDayMessagesCodes.MY_DAY_UNCLAIMED_FETCHED);
    expect(Array.isArray(body.data.items)).toBe(true);
  });
});
