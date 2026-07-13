import { describe, it, expect, vi } from "vitest";

// DI was removed: the usecase now calls the imported `commandCenterRepository` singleton
// directly. Mock the singleton (keeping the module's real ACTIVE_DEAL_STATUSES the usecase
// imports); each test seeds the singleton's methods via makeUsecase(makeRepo(...)).
vi.mock("../command-center.repo.js", async (importActual) => {
  const actual = await importActual();
  return { ...actual, commandCenterRepository: {} };
});

import { CommandCenterUsecase, DESIGNER_LOAD_THRESHOLD } from "../command-center.usecase.js";
import { commandCenterRepository } from "../command-center.repo.js";

// Seed the mocked repo singleton with a stubbed repo object, then build the usecase. The
// returned object's vi.fns ARE the singleton's methods, so `repo.xxx.mock` assertions hold.
function makeUsecase(repo) {
  Object.assign(commandCenterRepository, repo);
  return new CommandCenterUsecase();
}

// A fully-stubbed repo (Prisma-shaped return values incl. Decimal-as-string). Overridable.
function makeRepo(overrides = {}) {
  return {
    pipelineByStatus: vi.fn().mockResolvedValue([
      { status: "NEGOTIATING", _count: { _all: 9 }, _sum: { averagePrice: "420000" } },
      { status: "NEW", _count: { _all: 5 }, _sum: { averagePrice: "100000" } },
      { status: "FINALIZED", _count: { _all: 2 }, _sum: { averagePrice: "640000" } },
    ]),
    activeDealsCount: vi.fn().mockResolvedValue(42),
    finalizedValue: vi.fn().mockResolvedValue({ _sum: { averagePrice: "640000" } }),
    revenue: vi.fn().mockResolvedValue({ _sum: { amount: "512000" } }),
    commissions: vi.fn().mockResolvedValue({ _sum: { amount: "48000" } }),
    designerLoad: vi.fn().mockResolvedValue([
      { userId: 12, name: "Sara", role: "THREE_D_DESIGNER", activeProjects: 7 },
      { userId: 13, name: "Ali", role: "TWO_D_DESIGNER", activeProjects: 3 },
    ]),
    salesLoad: vi.fn().mockResolvedValue([
      { userId: 5, name: "Omar", activeLeads: 60, maxLeads: 50 },
      { userId: 6, name: "Lina", activeLeads: 10, maxLeads: 50 },
      { userId: 7, name: "Zed", activeLeads: 3, maxLeads: null },
    ]),
    autoAssignRotation: vi.fn().mockResolvedValue([
      { userId: 1, type: "SALES" },
      { userId: 2, type: "SALES" },
      { userId: 3, type: "DESIGN" },
    ]),
    lateDeliveries: vi.fn().mockResolvedValue([
      { id: 1, deliveryAt: new Date("2026-07-06T00:00:00Z"), project: { id: 88, groupTitle: "Villa 12 — 3D" } },
    ]),
    lateDeliveriesCount: vi.fn().mockResolvedValue(3),
    ...overrides,
  };
}

const NOW = new Date("2026-07-10T00:00:00Z");

describe("CommandCenterUsecase.getOverview — composition + dto shape", () => {
  it("composes { kpis, pipeline, capacity, delivery } with numeric (Decimal→number) KPIs", async () => {
    const usecase = makeUsecase(makeRepo());
    const data = await usecase.getOverview({ query: {}, authUser: { id: 1, role: "ADMIN" }, now: NOW });

    expect(Object.keys(data)).toEqual(["kpis", "pipeline", "capacity", "delivery"]);
    expect(data.kpis).toEqual({
      activeDeals: 42,
      pipelineValue: 420000, // only ACTIVE_DEAL_STATUSES (NEGOTIATING); NEW + FINALIZED excluded
      finalizedValue: 640000,
      revenue: 512000,
      commissions: 48000,
      lateDeliveries: 3,
    });
    // every money KPI is a real number, never a Prisma Decimal / string
    for (const v of Object.values(data.kpis)) expect(typeof v).toBe("number");
  });

  it("shapes the pipeline as per-status { status, count, value } (value coerced to number)", async () => {
    const usecase = makeUsecase(makeRepo());
    const { pipeline } = await usecase.getOverview({ query: {}, now: NOW });
    expect(pipeline).toEqual([
      { status: "NEGOTIATING", count: 9, value: 420000 },
      { status: "NEW", count: 5, value: 100000 },
      { status: "FINALIZED", count: 2, value: 640000 },
    ]);
  });

  it("flags an overloaded designer (activeProjects > threshold) and only exposes safe fields", async () => {
    const usecase = makeUsecase(makeRepo());
    const { capacity } = await usecase.getOverview({ query: {}, now: NOW });
    expect(DESIGNER_LOAD_THRESHOLD).toBe(6);
    expect(capacity.designers).toEqual([
      { userId: 12, name: "Sara", role: "THREE_D_DESIGNER", activeProjects: 7, overloaded: true },
      { userId: 13, name: "Ali", role: "TWO_D_DESIGNER", activeProjects: 3, overloaded: false },
    ]);
  });

  it("flags an overloaded salesperson (activeLeads > maxLeads); null maxLeads is never overloaded", async () => {
    const usecase = makeUsecase(makeRepo());
    const { capacity } = await usecase.getOverview({ query: {}, now: NOW });
    expect(capacity.sales).toEqual([
      { userId: 5, name: "Omar", activeLeads: 60, maxLeads: 50, overloaded: true },
      { userId: 6, name: "Lina", activeLeads: 10, maxLeads: 50, overloaded: false },
      { userId: 7, name: "Zed", activeLeads: 3, maxLeads: null, overloaded: false },
    ]);
  });

  it("groups the auto-assign rotation by type (active users per type)", async () => {
    const usecase = makeUsecase(makeRepo());
    const { capacity } = await usecase.getOverview({ query: {}, now: NOW });
    expect(capacity.autoAssign).toEqual([
      { type: "SALES", activeUsers: 2 },
      { type: "DESIGN", activeUsers: 1 },
    ]);
  });

  it("computes delivery.items[].overdueDays from the INJECTED now", async () => {
    const usecase = makeUsecase(makeRepo());
    const { delivery } = await usecase.getOverview({ query: {}, now: NOW });
    expect(delivery.lateCount).toBe(3);
    expect(delivery.items).toEqual([
      {
        projectId: 88,
        title: "Villa 12 — 3D",
        deliveryAt: new Date("2026-07-06T00:00:00Z"),
        overdueDays: 4, // 2026-07-10 − 2026-07-06
      },
    ]);
  });

  it("does not leak PII/extra fields (capacity + delivery are whitelisted projections)", async () => {
    const repo = makeRepo({
      designerLoad: vi.fn().mockResolvedValue([
        { userId: 12, name: "Sara", role: "THREE_D_DESIGNER", activeProjects: 7, email: "sara@x.com", password: "hash" },
      ]),
    });
    const usecase = makeUsecase(repo);
    const { capacity } = await usecase.getOverview({ query: {}, now: NOW });
    expect(Object.keys(capacity.designers[0])).toEqual([
      "userId", "name", "role", "activeProjects", "overloaded",
    ]);
  });
});

describe("CommandCenterUsecase.getOverview — date range resolution", () => {
  it("defaults to month-to-now when no from/to supplied", async () => {
    const repo = makeRepo();
    const usecase = makeUsecase(repo);
    await usecase.getOverview({ query: {}, now: NOW });
    const range = repo.pipelineByStatus.mock.calls[0][0];
    expect(range.to).toBe(NOW);
    expect(range.from.getFullYear()).toBe(NOW.getFullYear());
    expect(range.from.getMonth()).toBe(NOW.getMonth()); // same month
    expect(range.from.getDate()).toBe(1); // first of the month
    // the same range threads to every range-aware repo read
    expect(repo.activeDealsCount).toHaveBeenCalledWith(range);
    expect(repo.finalizedValue).toHaveBeenCalledWith(range);
    expect(repo.revenue).toHaveBeenCalledWith(range);
    expect(repo.commissions).toHaveBeenCalledWith(range);
  });

  it("honors an explicit { from, to } range", async () => {
    const repo = makeRepo();
    const usecase = makeUsecase(repo);
    const from = new Date("2026-01-01T00:00:00Z");
    const to = new Date("2026-03-01T00:00:00Z");
    await usecase.getOverview({ query: { from, to }, now: NOW });
    expect(repo.pipelineByStatus).toHaveBeenCalledWith({ from, to });
  });

  it("passes `now` (not the range) to the delivery reads", async () => {
    const repo = makeRepo();
    const usecase = makeUsecase(repo);
    await usecase.getOverview({ query: {}, now: NOW });
    expect(repo.lateDeliveries).toHaveBeenCalledWith(NOW, 10);
    expect(repo.lateDeliveriesCount).toHaveBeenCalledWith(NOW);
  });
});
