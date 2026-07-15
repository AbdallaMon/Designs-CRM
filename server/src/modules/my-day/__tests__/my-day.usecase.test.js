// Usecase tests: profile-family dispatch, engine-over-batch queue assembly, sorting,
// truncation, the supervisor scope checker (super-sales = sales-domain only), and the
// team overview domain gating (designers block is admin-tier only). Repos are DI-stubbed.
import { describe, it, expect, vi } from "vitest";

// DI was removed: the usecase now calls the imported `myDayRepository` and `leadRepository`
// singletons directly. Mock both singletons (keeping each module's other real exports the
// usecase + engines import); make() seeds them per test via Object.assign.
vi.mock("../my-day.repo.js", async (importActual) => {
  const actual = await importActual();
  return { ...actual, myDayRepository: {} };
});
vi.mock("../../leads/lead/lead.repo.js", async (importActual) => {
  const actual = await importActual();
  return { ...actual, leadRepository: {} };
});

import { MyDayUsecase } from "../my-day.usecase.js";
import { myDayRepository } from "../my-day.repo.js";
import { leadRepository } from "../../leads/lead/lead.repo.js";

const NOW = new Date("2026-07-12T12:00:00.000Z");
const daysAgo = (d) => new Date(NOW.getTime() - d * 24 * 3600_000);

// A lead bundle that yields ONE critical signal (overdue call) + LEAD_STALE (warning).
const staleBundle = (id, name) => ({
  id,
  userId: 7,
  status: "IN_PROGRESS",
  paymentStatus: "PENDING",
  updatedAt: daysAgo(6),
  client: { name },
  contracts: [],
  salesStages: [],
  callReminders: [{ time: daysAgo(1), status: "IN_PROGRESS" }],
  meetingReminders: [],
  priceOffers: [],
  sessionQuestions: [],
  versaModel: [],
});

// A quiet bundle: fresh, has a future touch → zero actions → dropped from the queue.
const quietBundle = (id) => ({
  ...staleBundle(id, "Quiet"),
  updatedAt: daysAgo(0),
  callReminders: [{ time: new Date(NOW.getTime() + 3600_000), status: "IN_PROGRESS" }],
});

function makeLeadRepo(overrides = {}) {
  return {
    findCockpitBundlesForUser: vi.fn().mockResolvedValue([staleBundle(5, "Aisha"), quietBundle(6)]),
    countMyDayLeads: vi.fn().mockResolvedValue(2),
    ...overrides,
  };
}

function makeMyDayRepo(overrides = {}) {
  return {
    findDesignerAssignments: vi.fn().mockResolvedValue([
      {
        project: {
          id: 31,
          type: "3D_Designer",
          status: "In Progress",
          deliveryTime: null,
          clientLeadId: 5,
          clientLead: { id: 5, client: { name: "Aisha" } },
          contractStages: [
            { stageStatus: "IN_PROGRESS", deliverySchedule: { deliveryAt: daysAgo(1) } },
          ],
        },
      },
    ]),
    findUserForScope: vi.fn().mockResolvedValue({
      id: 9, name: "Rep", isActive: true, role: "STAFF", profile: null, currentProfile: { key: "NORMAL_SALES" },
    }),
    findUserNames: vi.fn().mockResolvedValue([{ id: 7, name: "Ahmed" }]),
    staleLeadsByRep: vi.fn().mockResolvedValue([{ userId: 7, _count: { _all: 3 } }]),
    unclaimedAgingCount: vi.fn().mockResolvedValue(2),
    overdueCallsByRep: vi.fn().mockResolvedValue([{ userId: 7, _count: { _all: 4 } }]),
    signingStalled: vi.fn().mockResolvedValue([
      { id: 1, clientLeadId: 5, createdAt: daysAgo(4), clientLead: { userId: 7, client: { name: "Aisha" } } },
    ]),
    deliveriesAtRisk: vi.fn().mockResolvedValue([
      {
        id: 2, deliveryAt: daysAgo(1),
        project: { id: 31, type: "3D_Designer", clientLeadId: 5, assignments: [{ user: { id: 42, name: "Sara" } }] },
      },
    ]),
    salesLoad: vi.fn().mockResolvedValue([{ userId: 7, name: "Ahmed", activeLeads: 12, maxLeads: 10 }]),
    designerLoad: vi.fn().mockResolvedValue([{ userId: 42, name: "Sara", role: "THREE_D_DESIGNER", activeStages: 4 }]),
    // Drill-down itemization reads (the supervisor drawer).
    activeLeadsForRep: vi.fn().mockResolvedValue([
      { id: 5, status: "IN_PROGRESS", updatedAt: daysAgo(6), client: { name: "Aisha" } },
      { id: 6, status: "NEW", updatedAt: daysAgo(0), client: { name: "Quiet" } },
    ]),
    staleLeadsForRep: vi.fn().mockResolvedValue([
      { id: 5, status: "IN_PROGRESS", updatedAt: daysAgo(6), client: { name: "Aisha" } },
    ]),
    overdueCallsForRep: vi.fn().mockResolvedValue([
      { id: 1, time: daysAgo(1), clientLeadId: 5, clientLead: { id: 5, status: "IN_PROGRESS", client: { name: "Aisha" } } },
    ]),
    signingStalledForRep: vi.fn().mockResolvedValue([
      { id: 1, clientLeadId: 5, createdAt: daysAgo(4), clientLead: { status: "IN_PROGRESS", client: { name: "Aisha" } } },
    ]),
    unclaimedAgingLeads: vi.fn().mockResolvedValue([
      { id: 20, createdAt: daysAgo(3), client: { name: "Walk-in" } },
    ]),
    ...overrides,
  };
}

const salesUser = { id: 7, currentProfileKey: "NORMAL_SALES", isAdminTier: false, role: "STAFF" };
const designerUser = { id: 42, currentProfileKey: "DESIGNER_3D", isAdminTier: false, role: "THREE_D_DESIGNER" };
const superSales = { id: 8, currentProfileKey: "SUPER_SALES", isAdminTier: true, role: "STAFF" };
const admin = { id: 1, currentProfileKey: "ADMIN", isAdminTier: true, role: "ADMIN" };

// Seed both mocked repo singletons, then build the usecase (constructor takes no args now).
// The seeded vi.fns ARE the singletons' methods, so `leadRepository.xxx.mock` assertions hold.
const make = (o = {}) => {
  Object.assign(myDayRepository, makeMyDayRepo(o.myDay));
  Object.assign(leadRepository, makeLeadRepo(o.lead));
  return new MyDayUsecase();
};

describe("getMyQueue — sales family", () => {
  it("runs the engine per bundle, drops zero-action leads, sorts critical-first", async () => {
    const q = await make().getMyQueue({ authUser: salesUser, now: NOW });
    expect(q.family).toBe("SALES");
    expect(q.items).toHaveLength(1); // quiet lead dropped
    expect(q.items[0]).toMatchObject({ kind: "LEAD", leadId: 5, clientName: "Aisha", status: "IN_PROGRESS" });
    expect(q.items[0].signals.map((s) => s.type)).toEqual(
      expect.arrayContaining(["CALL_OVERDUE", "LEAD_STALE"]),
    );
    expect(q.items[0].signals[0].severity).toBe("critical"); // engine sort preserved
    expect(q.truncated).toBe(false);
  });

  it("marks truncated when the cap was hit", async () => {
    const u = make({ lead: makeLeadRepo({ countMyDayLeads: vi.fn().mockResolvedValue(80) }) });
    const q = await u.getMyQueue({ authUser: salesUser, now: NOW });
    expect(q.truncated).toBe(true);
  });

  it("role fallback: un-migrated session (no currentProfileKey) with STAFF role → SALES", async () => {
    const q = await make().getMyQueue({ authUser: { id: 7, role: "STAFF" }, now: NOW });
    expect(q.family).toBe("SALES");
  });
});

describe("getMyQueue — designer family", () => {
  it("maps assignments → deadline engine (earliest live stage delivery wins)", async () => {
    const q = await make().getMyQueue({ authUser: designerUser, now: NOW });
    expect(q.family).toBe("DESIGNER");
    expect(q.items).toHaveLength(1);
    expect(q.items[0]).toMatchObject({
      kind: "WORK_STAGE",
      projectId: 31,
      leadId: 5,
      clientName: "Aisha",
      projectType: "3D_Designer",
      level: "LEVEL_3",
    });
    expect(q.items[0].signals[0].type).toBe("DELIVERY_OVERDUE"); // deliveryAt in the past
  });
});

describe("getMyQueue — unsupported profile", () => {
  it("throws 403 MY_DAY_PROFILE_UNSUPPORTED (defensive; route gate should prevent)", async () => {
    await expect(
      make().getMyQueue({ authUser: { id: 3, currentProfileKey: "ACCOUNTANT", role: "ACCOUNTANT" }, now: NOW }),
    ).rejects.toMatchObject({ statusCode: 403, message: "MY_DAY_PROFILE_UNSUPPORTED" });
  });
});

describe("checkIfUserCanViewMyDayOf — supervisor scope", () => {
  it("admin tier may target anyone (incl. designers)", async () => {
    const u = make({ myDay: makeMyDayRepo({ findUserForScope: vi.fn().mockResolvedValue({ id: 42, name: "Sara", isActive: true, role: "THREE_D_DESIGNER", profile: null, currentProfile: { key: "DESIGNER_3D" } }) }) });
    const target = await u.checkIfUserCanViewMyDayOf({ id: 42, authUser: admin });
    expect(target.id).toBe(42);
  });

  it("super-sales may target sales-tier users", async () => {
    const target = await make().checkIfUserCanViewMyDayOf({ id: 9, authUser: superSales });
    expect(target.id).toBe(9);
  });

  it("super-sales targeting a designer → 403 MY_DAY_TEAM_SCOPE_DENIED", async () => {
    const u = make({ myDay: makeMyDayRepo({ findUserForScope: vi.fn().mockResolvedValue({ id: 42, name: "Sara", isActive: true, role: "THREE_D_DESIGNER", profile: null, currentProfile: { key: "DESIGNER_3D" } }) }) });
    // SUPER_SALES holds the team code but is NOT allowed outside the sales domain even
    // when isAdminTier is true for them in the seed — the check keys on the PROFILE.
    await expect(
      u.checkIfUserCanViewMyDayOf({ id: 42, authUser: { ...superSales, isAdminTier: false } }),
    ).rejects.toMatchObject({ statusCode: 403, message: "MY_DAY_TEAM_SCOPE_DENIED" });
  });

  it("unknown target → 404 MY_DAY_TARGET_NOT_FOUND", async () => {
    const u = make({ myDay: makeMyDayRepo({ findUserForScope: vi.fn().mockResolvedValue(null) }) });
    await expect(u.checkIfUserCanViewMyDayOf({ id: 999, authUser: admin })).rejects.toMatchObject({
      statusCode: 404,
      message: "MY_DAY_TARGET_NOT_FOUND",
    });
  });
});

describe("getQueueForTarget — SALES drill-down (itemized)", () => {
  const salesTarget = { id: 9, name: "Rep", role: "STAFF", profile: null, currentProfile: { key: "NORMAL_SALES" } };

  it("returns a flat item list with per-lead flags + counts matching the reads", async () => {
    const q = await make().getQueueForTarget({ targetUser: salesTarget, now: NOW });
    expect(q.family).toBe("SALES");
    expect(q.user).toMatchObject({ id: 9, name: "Rep" });
    // counts equal the itemized-read lengths (so they match the person-card counts).
    expect(q.counts).toEqual({ active: 2, stale: 1, overdueCalls: 1, unsigned: 1 });
    // lead 5 carries all three issues → critical; lead 6 is on-track → info.
    const lead5 = q.items.find((i) => i.leadId === 5);
    expect(lead5).toMatchObject({
      leadId: 5,
      clientName: "Aisha",
      severity: "critical",
      flags: { overdueCalls: 1, stale: true, unsigned: true },
    });
    const lead6 = q.items.find((i) => i.leadId === 6);
    expect(lead6).toMatchObject({ leadId: 6, severity: "info", flags: { overdueCalls: 0, stale: false, unsigned: false } });
  });

  it("sorts the critical (issue-bearing) lead ahead of the on-track one", async () => {
    const q = await make().getQueueForTarget({ targetUser: salesTarget, now: NOW });
    expect(q.items[0].leadId).toBe(5);
  });

  it("surfaces a lead that has an overdue call even if it is not in the active set", async () => {
    const u = make({
      myDay: makeMyDayRepo({
        activeLeadsForRep: vi.fn().mockResolvedValue([]), // no active leads
        staleLeadsForRep: vi.fn().mockResolvedValue([]),
        signingStalledForRep: vi.fn().mockResolvedValue([]),
        overdueCallsForRep: vi.fn().mockResolvedValue([
          { id: 9, time: daysAgo(2), clientLeadId: 77, clientLead: { id: 77, status: "NEW", client: { name: "Late" } } },
        ]),
      }),
    });
    const q = await u.getQueueForTarget({ targetUser: salesTarget, now: NOW });
    expect(q.items.map((i) => i.leadId)).toContain(77);
    expect(q.items.find((i) => i.leadId === 77).flags.overdueCalls).toBe(1);
  });
});

describe("getQueueForTarget — DESIGNER drill-down (on-track included)", () => {
  it("returns the designer's stages with the family tag", async () => {
    const target = { id: 42, name: "Sara", role: "THREE_D_DESIGNER", profile: null, currentProfile: { key: "DESIGNER_3D" } };
    const q = await make().getQueueForTarget({ targetUser: target, now: NOW });
    expect(q.family).toBe("DESIGNER");
    expect(q.user).toMatchObject({ id: 42, name: "Sara" });
    expect(q.items[0]).toMatchObject({ kind: "WORK_STAGE", projectId: 31, leadId: 5 });
  });
});

describe("getUnclaimedLeads", () => {
  it("returns the aging unclaimed leads with a computed agingDays", async () => {
    const q = await make().getUnclaimedLeads({ now: NOW });
    expect(q.items).toHaveLength(1);
    expect(q.items[0]).toMatchObject({ leadId: 20, clientName: "Walk-in", agingDays: 3 });
  });
});

describe("getTeamOverview — domain gating + assembly", () => {
  it("SUPER_SALES (non-admin-tier caller) gets the sales domain ONLY", async () => {
    const t = await make().getTeamOverview({ authUser: { ...superSales, isAdminTier: false }, now: NOW });
    expect(t.domains.sales).toBeTruthy();
    expect(t.domains.designers).toBeUndefined();
  });

  it("admin gets sales + designers; exceptions carry types/severities; people merge counts", async () => {
    const t = await make().getTeamOverview({ authUser: admin, now: NOW });
    expect(t.domains.designers).toBeTruthy();
    const salesTypes = t.domains.sales.exceptions.map((e) => e.type);
    expect(salesTypes).toEqual(
      expect.arrayContaining(["LEAD_STALE_TEAM", "LEAD_UNCLAIMED_AGING", "CALL_OVERDUE_TEAM", "CONTRACT_SIGNING_STALLED", "REP_OVER_CAPACITY"]),
    );
    const ahmed = t.domains.sales.people.find((p) => p.userId === 7);
    expect(ahmed).toMatchObject({ name: "Ahmed", activeCount: 12, staleCount: 3, overdueCount: 4 });
    const designerTypes = t.domains.designers.exceptions.map((e) => e.type);
    expect(designerTypes).toContain("DELIVERY_OVERDUE_TEAM");
    const sara = t.domains.designers.people.find((p) => p.userId === 42);
    expect(sara).toMatchObject({ name: "Sara", activeCount: 4 });
  });
});
