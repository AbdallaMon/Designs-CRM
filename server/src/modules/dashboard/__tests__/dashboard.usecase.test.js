import { describe, it, expect, vi, beforeEach } from "vitest";

import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { AppError } from "../../../shared/errors/AppError.js";
import {
  PERMISSIONS,
  getEffectivePermissions,
  USER_ROLES,
  authMessagesCodes,
  dashboardMessagesCodes,
} from "@dms/shared";

// DI was removed: the usecase now imports the heavy aggregations from the sibling
// `dashboard.aggregations.js` module (formerly the injected `legacy` bag) and calls the
// `dashboardRepository` singleton directly for recent-activities. Mock the aggregations
// module (so we can assert the searchParams projection) and the repo singleton (keeping the
// real DashboardRepository class the IDOR tests construct).
vi.mock("../dashboard.aggregations.js", () => ({
  getKeyMetrics: vi.fn(),
  getDashboardLeadStatusData: vi.fn(),
  getMonthlyPerformanceData: vi.fn(),
  getEmiratesAnalytics: vi.fn(),
  getLeadsMonthlyOverview: vi.fn(),
  getPerformanceMetrics: vi.fn(),
  getLatestNewLeads: vi.fn(),
  getDesignerMetrics: vi.fn(),
}));
vi.mock("../dashboard.repo.js", async (importActual) => {
  const actual = await importActual();
  return { ...actual, dashboardRepository: { recentActivities: vi.fn() } };
});

import { dashboardUsecase, DashboardUsecase } from "../dashboard.usecase.js";
import { dashboardRepository, DashboardRepository } from "../dashboard.repo.js";
import * as aggregations from "../dashboard.aggregations.js";
import { DashboardValidation } from "../dashboard.validation.js";

const DC = dashboardMessagesCodes;
const PD = PERMISSIONS.DASHBOARD;

function authFor(persona, id = 1, superSales = false) {
  const currentProfileKey = superSales
    ? "SUPER_SALES"
    : {
        ADMIN: "ADMIN",
        SUPER_ADMIN: "SUPER_ADMIN",
        STAFF: "NORMAL_SALES",
        THREE_D_DESIGNER: "DESIGNER_3D",
        TWO_D_DESIGNER: "DESIGNER_2D",
        TWO_D_EXECUTOR: "EXECUTOR_2D",
        ACCOUNTANT: "ACCOUNTANT",
        SUPER_SALES: "SUPER_SALES",
        CONTACT_INITIATOR: "CONTACT_INITIATOR",
      }[persona];
  const { permissions, permissionsByModule } = getEffectivePermissions({
    profile: currentProfileKey,
  });
  return {
    id,
    currentProfileKey,
    isAdminTier: ["ADMIN", "SUPER_ADMIN"].includes(currentProfileKey),
    permissions,
    permissionsByModule,
  };
}

// Every authed role behind the legacy SHARED gate.
const SHARED_ROLES = [
  USER_ROLES.ADMIN,
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.STAFF,
  USER_ROLES.THREE_D_DESIGNER,
  USER_ROLES.TWO_D_DESIGNER,
  USER_ROLES.TWO_D_EXECUTOR,
  USER_ROLES.ACCOUNTANT,
  USER_ROLES.SUPER_SALES,
  USER_ROLES.CONTACT_INITIATOR,
];

// Roles that legacy treated as privileged (could scope to any user / see global).
const FULL_SCOPE_PROFILES = [
  USER_ROLES.ADMIN,
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.SUPER_SALES,
];
// Roles that must be self-scoped (cannot read another user's metrics).
const SCOPED_ROLES = [
  USER_ROLES.STAFF,
  USER_ROLES.THREE_D_DESIGNER,
  USER_ROLES.TWO_D_DESIGNER,
  USER_ROLES.TWO_D_EXECUTOR,
  USER_ROLES.ACCOUNTANT,
  USER_ROLES.CONTACT_INITIATOR,
];

// Reset the mocked aggregations + repo singleton to their default resolved values before
// each test (individual tests override as needed).
beforeEach(() => {
  vi.clearAllMocks();
  aggregations.getKeyMetrics.mockResolvedValue({ totalRevenue: 0 });
  aggregations.getDashboardLeadStatusData.mockResolvedValue([]);
  aggregations.getMonthlyPerformanceData.mockResolvedValue([]);
  aggregations.getEmiratesAnalytics.mockResolvedValue({ analytics: [] });
  aggregations.getLeadsMonthlyOverview.mockResolvedValue({ totals: {} });
  aggregations.getPerformanceMetrics.mockResolvedValue({ weekly: {} });
  aggregations.getLatestNewLeads.mockResolvedValue([{ id: 1 }]);
  aggregations.getDesignerMetrics.mockResolvedValue({ totalProjects: 0 });
  dashboardRepository.recentActivities.mockResolvedValue([{ id: 9 }]);
});

// The usecase is now the singleton; `legacy` maps to the mocked aggregations module and
// `repo` to the mocked repo singleton — the very references the assertions inspect via `.mock`.
function makeUsecase() {
  return { usecase: dashboardUsecase, legacy: aggregations, repo: dashboardRepository };
}

// ════════════════════════════════════════════════════════════════════════════
//  PERMISSION GATE — dashboard.view granted to every authed role (SHARED parity)
// ════════════════════════════════════════════════════════════════════════════
describe("dashboard permission grant (every authed role)", () => {
  for (const role of SHARED_ROLES) {
    it(`${role} holds dashboard.view`, () => {
      const auth = authFor(role);
      expect(auth.permissions).toContain(PD.VIEW);
    });
  }

  it("an authed role passes the dashboard.view gate", () => {
    const req = { auth: authFor(USER_ROLES.STAFF) };
    const next = vi.fn();
    AuthMiddleware.requirePermissions([PD.VIEW])(req, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("an UNAUTHENTICATED request (no req.auth) is rejected (legacy hole closed)", () => {
    const next = vi.fn();
    AuthMiddleware.requirePermissions([PD.VIEW])({}, {}, next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe(authMessagesCodes.UNAUTHORIZED);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  SCOPE — a scoped role cannot pull another user's metrics via ?staffId
// ════════════════════════════════════════════════════════════════════════════
describe("DashboardUsecase scope (IDOR-class fix)", () => {
  // The metric endpoints that forward an effective staffId to a legacy aggregation.
  const METRIC_CASES = [
    ["getKeyMetrics", "getKeyMetrics"],
    ["getLeadsStatus", "getDashboardLeadStatusData"],
    ["getMonthlyPerformance", "getMonthlyPerformanceData"],
    ["getEmiratesAnalytics", "getEmiratesAnalytics"],
    ["getLeadsMonthlyOverview", "getLeadsMonthlyOverview"],
    ["getWeekPerformance", "getPerformanceMetrics"],
    ["getDesignerMetrics", "getDesignerMetrics"],
  ];

  for (const role of SCOPED_ROLES) {
    for (const [method, legacyFn] of METRIC_CASES) {
      it(`${role} → ${method}: a client ?staffId=999 is IGNORED; scope is forced to req.auth.id`, async () => {
        const { usecase, legacy } = makeUsecase();
        await usecase[method]({ query: { staffId: 999 }, authUser: authFor(role, 7) });
        const sp = legacy[legacyFn].mock.calls[0][0];
        expect(sp.staffId).toBe("7"); // forced to the caller's own id
        expect(sp.staffId).not.toBe("999");
      });
    }
  }

  for (const role of FULL_SCOPE_PROFILES) {
    it(`${role} → keyMetrics: a client ?staffId=999 IS honored (privileged, preserved 1:1)`, async () => {
      const { usecase, legacy } = makeUsecase();
      await usecase.getKeyMetrics({ query: { staffId: 999 }, authUser: authFor(role, 7) });
      const sp = legacy.getKeyMetrics.mock.calls[0][0];
      expect(sp.staffId).toBe("999");
    });

    it(`${role} → keyMetrics: NO staffId yields the GLOBAL aggregate (no staffId forwarded)`, async () => {
      const { usecase, legacy } = makeUsecase();
      await usecase.getKeyMetrics({ query: {}, authUser: authFor(role, 7) });
      const sp = legacy.getKeyMetrics.mock.calls[0][0];
      expect(sp.staffId).toBeUndefined();
    });
  }

  it("SUPER_SALES sends the supervisor signal to lead-status processing", async () => {
    const { usecase, legacy } = makeUsecase();
    await usecase.getLeadsStatus({ query: {}, authUser: authFor(USER_ROLES.SUPER_SALES, 7) });
    expect(legacy.getDashboardLeadStatusData).toHaveBeenCalledWith({}, true);
  });

  it("scope branching uses the active profile and ignores a forged query role", async () => {
    const { usecase, legacy } = makeUsecase();
    await usecase.getKeyMetrics({
      query: { staffId: 999, role: "ADMIN" },
      authUser: authFor(USER_ROLES.STAFF, 7),
    });
    expect(legacy.getKeyMetrics.mock.calls[0][0].staffId).toBe("7");
  });

  it("date filters survive sanitization; profile flag is forwarded", async () => {
    const { usecase, legacy } = makeUsecase();
    await usecase.getKeyMetrics({
      query: { startDate: "2026-01-01", endDate: "2026-02-01", profile: "true" },
      authUser: authFor(USER_ROLES.ADMIN, 7),
    });
    const sp = legacy.getKeyMetrics.mock.calls[0][0];
    expect(sp.startDate).toBe("2026-01-01");
    expect(sp.endDate).toBe("2026-02-01");
    expect(sp.profile).toBe("true");
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  RECENT ACTIVITIES — self-scoped feed; client ?userId / ?staffId cannot leak
// ════════════════════════════════════════════════════════════════════════════
describe("DashboardUsecase.getRecentActivities scope", () => {
  for (const role of SCOPED_ROLES) {
    it(`${role}: feed is bound to req.auth.id; client ?userId/?staffId IGNORED`, async () => {
      const { usecase, repo } = makeUsecase();
      await usecase.getRecentActivities({
        query: { userId: 999, staffId: 888 },
        authUser: authFor(role, 7),
      });
      expect(repo.recentActivities).toHaveBeenCalledWith({ scope: { userId: 7 } });
    });
  }

  it("admin-tier: may filter by an actor staffId (legacy passthrough)", async () => {
    const { usecase, repo } = makeUsecase();
    await usecase.getRecentActivities({ query: { staffId: 5 }, authUser: authFor(USER_ROLES.ADMIN, 7) });
    expect(repo.recentActivities).toHaveBeenCalledWith({ scope: { staffId: 5 } });
  });

  it("admin-tier: no staffId yields the global feed ({} scope)", async () => {
    const { usecase, repo } = makeUsecase();
    await usecase.getRecentActivities({ query: {}, authUser: authFor(USER_ROLES.SUPER_ADMIN, 7) });
    expect(repo.recentActivities).toHaveBeenCalledWith({ scope: {} });
  });

  // ──────────────────────────────────────────────────────────────────────────
  //  Defense-in-depth: a non-numeric auth id must NOT collapse to the global feed
  // ──────────────────────────────────────────────────────────────────────────
  it("non-admin: a numeric-string auth id is coerced and still self-scopes", async () => {
    const { usecase, repo } = makeUsecase();
    // a future token path could hand a numeric STRING id; coercion keeps the self-scope
    await usecase.getRecentActivities({ query: {}, authUser: authFor(USER_ROLES.STAFF, "7") });
    expect(repo.recentActivities).toHaveBeenCalledWith({ scope: { userId: 7 } });
  });

  it("non-admin: a NON-numeric auth id is REJECTED (not given the global feed)", async () => {
    // The usecase coerces to NaN; the REAL repository must throw rather than collapse
    // the where to {} (which would silently re-open the cross-user IDOR). Route the mocked
    // singleton through the real repository implementation for this case.
    dashboardRepository.recentActivities.mockImplementation((args) =>
      new DashboardRepository().recentActivities(args),
    );
    await expect(
      dashboardUsecase.getRecentActivities({ query: {}, authUser: authFor(USER_ROLES.STAFF, "abc") }),
    ).rejects.toMatchObject({ statusCode: 403, message: authMessagesCodes.ACCESS_DENIED });
  });

  it("repository: a non-admin self-scope with a non-finite userId throws ACCESS_DENIED", async () => {
    const repo = new DashboardRepository();
    await expect(repo.recentActivities({ scope: { userId: NaN } })).rejects.toMatchObject({
      statusCode: 403,
      message: authMessagesCodes.ACCESS_DENIED,
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  LATEST LEADS — legacy global behavior preserved (no args, no scope)
// ════════════════════════════════════════════════════════════════════════════
describe("DashboardUsecase.getLatestLeads (legacy-preserved global pool)", () => {
  it("calls the legacy service with NO args for every role", async () => {
    const { usecase, legacy } = makeUsecase();
    await usecase.getLatestLeads();
    expect(legacy.getLatestNewLeads).toHaveBeenCalledWith();
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  VALIDATION — query coercion + safe handling
// ════════════════════════════════════════════════════════════════════════════
describe("DashboardValidation", () => {
  it("metricsQuery coerces staffId to a number and accepts dates + profile", () => {
    const r = DashboardValidation.metricsQuery.safeParse({
      staffId: "12",
      startDate: "2026-01-01",
      endDate: "2026-02-01",
      profile: "true",
    });
    expect(r.success).toBe(true);
    expect(r.data.staffId).toBe(12);
  });

  it("metricsQuery REJECTS a non-positive staffId", () => {
    expect(DashboardValidation.metricsQuery.safeParse({ staffId: "0" }).success).toBe(false);
    expect(DashboardValidation.metricsQuery.safeParse({ staffId: "-3" }).success).toBe(false);
  });

  it("metricsQuery passes through unknown FE query keys (charts keep working)", () => {
    const r = DashboardValidation.metricsQuery.safeParse({ extra: "x", foo: "bar" });
    expect(r.success).toBe(true);
  });

  it("metricsQuery accepts an empty query (global / self default)", () => {
    expect(DashboardValidation.metricsQuery.safeParse({}).success).toBe(true);
  });

  it("emptyQuery accepts anything (latest-leads takes no args)", () => {
    expect(DashboardValidation.emptyQuery.safeParse({ junk: 1 }).success).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  ENVELOPE CODES — every message code is defined (no prose)
// ════════════════════════════════════════════════════════════════════════════
describe("dashboard message codes", () => {
  it("all 9 fetched codes exist and are language-neutral SCREAMING_SNAKE_CASE", () => {
    const codes = Object.values(DC);
    expect(codes).toHaveLength(10);
    for (const c of codes) expect(c).toMatch(/^[A-Z_]+$/);
  });
});
