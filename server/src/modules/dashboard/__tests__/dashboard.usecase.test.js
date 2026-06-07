import { describe, it, expect, vi } from "vitest";

import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { AppError } from "../../../shared/errors/AppError.js";
import {
  PERMISSIONS,
  getEffectivePermissions,
  USER_ROLES,
  authMessagesCodes,
  dashboardMessagesCodes,
} from "@dms/shared";

import { DashboardUsecase } from "../dashboard.usecase.js";
import { DashboardRepository } from "../dashboard.repository.js";
import { DashboardValidation } from "../dashboard.validation.js";

const DC = dashboardMessagesCodes;
const PD = PERMISSIONS.DASHBOARD;

function authFor(role, id = 1, isSuperSales = false) {
  const { permissions, permissionsByModule } = getEffectivePermissions({ role, isSuperSales });
  return { id, role, isSuperSales, permissions, permissionsByModule };
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
const ADMIN_TIER = [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN];
// Roles that must be self-scoped (cannot read another user's metrics).
const SCOPED_ROLES = [
  USER_ROLES.STAFF,
  USER_ROLES.THREE_D_DESIGNER,
  USER_ROLES.TWO_D_DESIGNER,
  USER_ROLES.TWO_D_EXECUTOR,
  USER_ROLES.ACCOUNTANT,
  USER_ROLES.SUPER_SALES,
  USER_ROLES.CONTACT_INITIATOR,
];

function makeLegacy() {
  return {
    getKeyMetrics: vi.fn().mockResolvedValue({ totalRevenue: 0 }),
    getDashboardLeadStatusData: vi.fn().mockResolvedValue([]),
    getMonthlyPerformanceData: vi.fn().mockResolvedValue([]),
    getEmiratesAnalytics: vi.fn().mockResolvedValue({ analytics: [] }),
    getLeadsMonthlyOverview: vi.fn().mockResolvedValue({ totals: {} }),
    getPerformanceMetrics: vi.fn().mockResolvedValue({ weekly: {} }),
    getLatestNewLeads: vi.fn().mockResolvedValue([{ id: 1 }]),
    getDesignerMetrics: vi.fn().mockResolvedValue({ totalProjects: 0 }),
  };
}

function makeRepo() {
  return { recentActivities: vi.fn().mockResolvedValue([{ id: 9 }]) };
}

function makeUsecase() {
  const legacy = makeLegacy();
  const repo = makeRepo();
  return { usecase: new DashboardUsecase(repo, legacy), legacy, repo };
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
    ["keyMetrics", "getKeyMetrics"],
    ["leadsStatus", "getDashboardLeadStatusData"],
    ["monthlyPerformance", "getMonthlyPerformanceData"],
    ["emiratesAnalytics", "getEmiratesAnalytics"],
    ["leadsMonthlyOverview", "getLeadsMonthlyOverview"],
    ["weekPerformance", "getPerformanceMetrics"],
    ["designerMetrics", "getDesignerMetrics"],
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

  for (const role of ADMIN_TIER) {
    it(`${role} → keyMetrics: a client ?staffId=999 IS honored (privileged, preserved 1:1)`, async () => {
      const { usecase, legacy } = makeUsecase();
      await usecase.keyMetrics({ query: { staffId: 999 }, authUser: authFor(role, 7) });
      const sp = legacy.getKeyMetrics.mock.calls[0][0];
      expect(sp.staffId).toBe("999");
    });

    it(`${role} → keyMetrics: NO staffId yields the GLOBAL aggregate (no staffId forwarded)`, async () => {
      const { usecase, legacy } = makeUsecase();
      await usecase.keyMetrics({ query: {}, authUser: authFor(role, 7) });
      const sp = legacy.getKeyMetrics.mock.calls[0][0];
      expect(sp.staffId).toBeUndefined();
    });
  }

  it("isSuperSales (non-admin base role) is treated as admin-tier (legacy isAdmin union)", async () => {
    const { usecase, legacy } = makeUsecase();
    await usecase.keyMetrics({
      query: { staffId: 999 },
      authUser: authFor(USER_ROLES.SUPER_SALES, 7, true),
    });
    expect(legacy.getKeyMetrics.mock.calls[0][0].staffId).toBe("999");
  });

  it("role branching uses the TOKEN role — a forged authUser without admin role is scoped", async () => {
    // Even if a scoped role's request carried role in the query, the usecase only reads
    // authUser.role; here we prove the auth role (STAFF) drives the scope, not the query.
    const { usecase, legacy } = makeUsecase();
    await usecase.keyMetrics({
      query: { staffId: 999, role: "ADMIN" }, // attacker tries to escalate via ?role=
      authUser: authFor(USER_ROLES.STAFF, 7),
    });
    expect(legacy.getKeyMetrics.mock.calls[0][0].staffId).toBe("7");
  });

  it("the TOKEN role is forwarded to getKeyMetrics (not a query role)", async () => {
    const { usecase, legacy } = makeUsecase();
    await usecase.keyMetrics({ query: { role: "ADMIN" }, authUser: authFor(USER_ROLES.STAFF, 7) });
    expect(legacy.getKeyMetrics.mock.calls[0][1]).toBe(USER_ROLES.STAFF);
  });

  it("date filters survive sanitization; profile flag is forwarded", async () => {
    const { usecase, legacy } = makeUsecase();
    await usecase.keyMetrics({
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
describe("DashboardUsecase.recentActivities scope", () => {
  for (const role of SCOPED_ROLES) {
    it(`${role}: feed is bound to req.auth.id; client ?userId/?staffId IGNORED`, async () => {
      const { usecase, repo } = makeUsecase();
      await usecase.recentActivities({
        query: { userId: 999, staffId: 888 },
        authUser: authFor(role, 7),
      });
      expect(repo.recentActivities).toHaveBeenCalledWith({ scope: { userId: 7 } });
    });
  }

  it("admin-tier: may filter by an actor staffId (legacy passthrough)", async () => {
    const { usecase, repo } = makeUsecase();
    await usecase.recentActivities({ query: { staffId: 5 }, authUser: authFor(USER_ROLES.ADMIN, 7) });
    expect(repo.recentActivities).toHaveBeenCalledWith({ scope: { staffId: 5 } });
  });

  it("admin-tier: no staffId yields the global feed ({} scope)", async () => {
    const { usecase, repo } = makeUsecase();
    await usecase.recentActivities({ query: {}, authUser: authFor(USER_ROLES.SUPER_ADMIN, 7) });
    expect(repo.recentActivities).toHaveBeenCalledWith({ scope: {} });
  });

  // ──────────────────────────────────────────────────────────────────────────
  //  Defense-in-depth: a non-numeric auth id must NOT collapse to the global feed
  // ──────────────────────────────────────────────────────────────────────────
  it("non-admin: a numeric-string auth id is coerced and still self-scopes", async () => {
    const { usecase, repo } = makeUsecase();
    // a future token path could hand a numeric STRING id; coercion keeps the self-scope
    await usecase.recentActivities({ query: {}, authUser: authFor(USER_ROLES.STAFF, "7") });
    expect(repo.recentActivities).toHaveBeenCalledWith({ scope: { userId: 7 } });
  });

  it("non-admin: a NON-numeric auth id is REJECTED (not given the global feed)", async () => {
    // The usecase coerces to NaN; the REAL repository must throw rather than collapse
    // the where to {} (which would silently re-open the cross-user IDOR).
    const repo = new DashboardRepository();
    const usecase = new DashboardUsecase(repo, makeLegacy());
    await expect(
      usecase.recentActivities({ query: {}, authUser: authFor(USER_ROLES.STAFF, "abc") }),
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
describe("DashboardUsecase.latestLeads (legacy-preserved global pool)", () => {
  it("calls the legacy service with NO args for every role", async () => {
    const { usecase, legacy } = makeUsecase();
    await usecase.latestLeads();
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
    expect(codes).toHaveLength(9);
    for (const c of codes) expect(c).toMatch(/^[A-Z_]+$/);
  });
});
