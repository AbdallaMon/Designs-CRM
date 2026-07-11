// Real HTTP integration test for GET /v2/leads/:clientLeadId/cockpit, exercising the
// LIVE middleware chain (requireAuth → requirePermissions([lead.view]) → validate(params)
// → requireSpecialChecker(checkIfUserCanAccessLead) → controller → cockpit usecase →
// repo) + the JSON envelope. Mirrors the audit.route integration harness: JWT secrets
// set BEFORE importing env-reading modules; Prisma mocked (no DB); the BullMQ queue that
// the lead usecase graph imports at load time is stubbed so no Redis connection opens.
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import express from "express";
import cookieParser from "cookie-parser";

process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.ISLOCAL = "true";

// Lead #5 is owned by user 7, active. The scope checker reads {id,userId,status}.
const LEAD_ROW = { id: 5, userId: 7, status: "IN_PROGRESS" };

// The narrow cockpit bundle (relation `versaModel`, singular). An overdue IN_PROGRESS
// call (year 2020) guarantees a CALL_OVERDUE action regardless of the real clock.
const COCKPIT_BUNDLE = {
  id: 5,
  userId: 7,
  status: "INTERESTED",
  paymentStatus: "PENDING",
  salesStages: [{ stage: "WHATSAPP_QA" }],
  callReminders: [{ time: new Date("2020-01-01T00:00:00.000Z"), status: "IN_PROGRESS" }],
  meetingReminders: [],
  priceOffers: [],
  sessionQuestions: [],
  versaModel: [],
};

// Emulate the scoped `where` the repo builds: full-scope callers (admin) get no AND
// narrowing; scoped callers get an ownership OR clause — match only when they own it.
const findFirst = vi.fn(async ({ where }) => {
  if (!where.AND) return LEAD_ROW; // full scope (admin/super-admin/accountant/super-sales)
  const ownership = where.AND[where.AND.length - 1];
  const or = ownership.OR || [];
  const ownerClause = or.find((c) => c.userId != null && !("status" in c));
  const callerId = ownerClause ? ownerClause.userId : null;
  return LEAD_ROW.userId === callerId ? LEAD_ROW : null;
});

// findCockpitBundle — exposed so a test can override it for one call (finalized bundle).
const findUnique = vi.fn(async () => COCKPIT_BUNDLE);

vi.mock("@dms/db", () => ({
  default: {
    clientLead: {
      findFirst, // findScopedLead (object-scope checker)
      findUnique, // findCockpitBundle
    },
  },
}));

// The lead usecase graph imports this BullMQ queue at load time — stub it (no Redis).
vi.mock("../../../../infra/queues/telegram-channel.queue.js", () => ({
  telegramChannelQueue: { add: vi.fn() },
}));

let server;
let baseUrl;
let JwtService;
let leadRouter;
let errorHandler;
let AUTH_COOKIE_NAME;
let leadsMessagesCodes;

beforeAll(async () => {
  ({ JwtService } = await import("../../../../infra/security/jwt.js"));
  ({ leadRouter } = await import("../lead.route.js"));
  ({ errorHandler } = await import("../../../../shared/errors/error-handler.js"));
  ({ AUTH_COOKIE_NAME, leadsMessagesCodes } = await import("@dms/shared"));

  const app = express();
  app.use(cookieParser());
  app.use("/leads", leadRouter);
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

describe("GET /v2/leads/:clientLeadId/cockpit — object-scoped read (real HTTP)", () => {
  it("no cookie -> 401", async () => {
    const { status } = await getJson("/leads/5/cockpit");
    expect(status).toBe(401);
  });

  it("non-owner sales user -> 403 LEAD_ACCESS_DENIED (IDOR guard)", async () => {
    const { status, body } = await getJson("/leads/5/cockpit", signFor({ id: 99, role: "STAFF" }));
    expect(status).toBe(403);
    expect(body.message).toBe(leadsMessagesCodes.LEAD_ACCESS_DENIED);
  });

  it("owner sales user -> 200 with health + actions + capabilities", async () => {
    const { status, body } = await getJson("/leads/5/cockpit", signFor({ id: 7, role: "STAFF" }));
    expect(status).toBe(200);
    expect(body).toMatchObject({
      success: true,
      message: "LEAD_COCKPIT_FETCHED",
      translationKey: "leadsMessages",
    });
    expect(body.data).toHaveProperty("health");
    expect(body.data).toHaveProperty("actions");
    expect(body.data).toHaveProperty("capabilities");
    expect(body.data.health).toMatchObject({ status: "INTERESTED", isTerminal: false, currentStage: "WHATSAPP_QA" });
    // The overdue call surfaces as the top critical action.
    expect(body.data.actions[0]).toMatchObject({ type: "CALL_OVERDUE", severity: "critical" });
    // Owner + lead.call_manage -> the CTA is enabled.
    expect(body.data.capabilities.canAddCall).toBe(true);
  });

  it("admin -> 200 (full scope)", async () => {
    const { status, body } = await getJson("/leads/5/cockpit", signFor({ id: 1, role: "ADMIN" }));
    expect(status).toBe(200);
    expect(body.data).toHaveProperty("actions");
  });

  it("invalid id param -> 422", async () => {
    const { status } = await getJson("/leads/abc/cockpit", signFor({ id: 1, role: "ADMIN" }));
    expect(status).toBe(422);
  });

  it("FINALIZED deal with an active contract still returns actions (no blackout)", async () => {
    // Override the cockpit bundle for THIS request only: finalized, but the contract is
    // mid-production at LEVEL_2 — the old engine returned []; the new one must not.
    findUnique.mockResolvedValueOnce({
      ...COCKPIT_BUNDLE,
      status: "FINALIZED",
      callReminders: [],
      contracts: [
        {
          id: 1,
          status: "IN_PROGRESS",
          sessionStatus: "SIGNING",
          stages: [
            { title: "LEVEL_1", stageStatus: "COMPLETED", order: 1 },
            { title: "LEVEL_2", stageStatus: "IN_PROGRESS", order: 2 },
          ],
        },
      ],
    });
    const { status, body } = await getJson("/leads/5/cockpit", signFor({ id: 7, role: "STAFF" }));
    expect(status).toBe(200);
    expect(body.data.health.isTerminal).toBe(true);
    expect(body.data.health.contract).toMatchObject({ currentLevel: "LEVEL_2", levelsDone: 1, levelsTotal: 2 });
    const t = body.data.actions.map((a) => a.type);
    expect(t).toContain("SIGNING_AWAITED");
    expect(t).toContain("CONTRACT_STAGE_IN_PROGRESS");
    expect(t).not.toContain("ADVANCE_STAGE");
  });
});
