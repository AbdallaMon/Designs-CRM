// Query-shape tests for the my-day repo: threshold cutoffs derive from the SAME constants
// the pure rules use (single-source), relation filters exclude on-track work, and every
// projection is a safe field set (ids/names/counts — no PII beyond existing screens).
// Prisma mocked — no DB.
import { describe, it, expect, beforeEach, vi } from "vitest";

const leadGroupBy = vi.fn().mockResolvedValue([]);
const leadCount = vi.fn().mockResolvedValue(0);
const callGroupBy = vi.fn().mockResolvedValue([]);
const contractFindMany = vi.fn().mockResolvedValue([]);
const deliveryFindMany = vi.fn().mockResolvedValue([]);
const assignmentFindMany = vi.fn().mockResolvedValue([]);
const userFindUnique = vi.fn().mockResolvedValue(null);
const userFindMany = vi.fn().mockResolvedValue([]);
const projectCount = vi.fn().mockResolvedValue(0);

vi.mock("@dms/db", () => ({
  default: {
    clientLead: { groupBy: leadGroupBy, count: leadCount },
    callReminder: { groupBy: callGroupBy },
    contract: { findMany: contractFindMany },
    deliverySchedule: { findMany: deliveryFindMany },
    assignment: { findMany: assignmentFindMany },
    user: { findUnique: userFindUnique, findMany: userFindMany },
    project: { count: projectCount },
  },
}));

const NOW = new Date("2026-07-12T12:00:00.000Z");
const DAY = 24 * 3600_000;

let myDayRepository;
let UNCLAIMED_NEW_DAYS;
let UNSIGNED_CONTRACT_DAYS;
let STALE_LEAD_DAYS;
let DELIVERY_SOON_HOURS;

beforeEach(async () => {
  vi.clearAllMocks();
  ({ myDayRepository, UNCLAIMED_NEW_DAYS, UNSIGNED_CONTRACT_DAYS } = await import("../my-day.repo.js"));
  ({ STALE_LEAD_DAYS } = await import("../../leads/lead/lead.cockpit.js"));
  ({ DELIVERY_SOON_HOURS } = await import("../../leads/lead/lead.workstage-cockpit.js"));
});

describe("team aggregates — cutoffs from the shared thresholds", () => {
  it("staleLeadsByRep: active statuses, updatedAt older than STALE_LEAD_DAYS, no future touch", async () => {
    await myDayRepository.staleLeadsByRep(NOW);
    const args = leadGroupBy.mock.calls[0][0];
    expect(args.by).toEqual(["userId"]);
    expect(args.where.userId).toEqual({ not: null });
    expect(args.where.updatedAt).toEqual({ lt: new Date(NOW.getTime() - STALE_LEAD_DAYS * DAY) });
    expect(args.where.callReminders).toEqual({ none: { status: "IN_PROGRESS", time: { gte: NOW } } });
    expect(args.where.meetingReminders).toEqual({ none: { status: "IN_PROGRESS", time: { gte: NOW } } });
  });

  it("unclaimedAgingCount: unassigned NEW leads older than UNCLAIMED_NEW_DAYS", async () => {
    await myDayRepository.unclaimedAgingCount(NOW);
    expect(leadCount).toHaveBeenCalledWith({
      where: { userId: null, status: "NEW", createdAt: { lt: new Date(NOW.getTime() - UNCLAIMED_NEW_DAYS * DAY) } },
    });
  });

  it("overdueCallsByRep: active reminders in the past, grouped by user", async () => {
    await myDayRepository.overdueCallsByRep(NOW);
    const args = callGroupBy.mock.calls[0][0];
    expect(args.by).toEqual(["userId"]);
    expect(args.where).toEqual({ status: "IN_PROGRESS", time: { lt: NOW } });
  });

  it("signingStalled: SIGNING contracts older than UNSIGNED_CONTRACT_DAYS (createdAt approximation)", async () => {
    await myDayRepository.signingStalled(NOW);
    const args = contractFindMany.mock.calls[0][0];
    expect(args.where).toEqual({
      sessionStatus: "SIGNING",
      createdAt: { lt: new Date(NOW.getTime() - UNSIGNED_CONTRACT_DAYS * DAY) },
    });
    expect(args.select.clientLead.select.client).toEqual({ select: { name: true } });
  });

  it("deliveriesAtRisk: everything due before now + DELIVERY_SOON_HOURS with a non-complete stage", async () => {
    await myDayRepository.deliveriesAtRisk(NOW);
    const args = deliveryFindMany.mock.calls[0][0];
    expect(args.where).toEqual({
      deliveryAt: { lt: new Date(NOW.getTime() + DELIVERY_SOON_HOURS * 3600_000) },
      stage: { stageStatus: { not: "COMPLETED" } },
    });
    expect(args.orderBy).toEqual({ deliveryAt: "asc" });
  });
});

describe("designer queue inputs + scope lookup", () => {
  it("findDesignerAssignments: caller-scoped, active projects only, deadline fields selected", async () => {
    await myDayRepository.findDesignerAssignments({ userId: 42 });
    const args = assignmentFindMany.mock.calls[0][0];
    expect(args.where.userId).toBe(42);
    expect(args.where.project.status).toEqual({ notIn: expect.arrayContaining(["Completed"]) });
    const proj = args.select.project.select;
    expect(proj.deliveryTime).toBe(true);
    expect(proj.contractStages.select.deliverySchedule).toEqual({ select: { deliveryAt: true } });
    expect(proj.clientLead.select.client).toEqual({ select: { name: true } });
  });

  it("findUserForScope: safe projection incl. the active profile key", async () => {
    await myDayRepository.findUserForScope({ userId: 9 });
    expect(userFindUnique).toHaveBeenCalledWith({
      where: { id: 9 },
      select: {
        id: true,
        name: true,
        isActive: true,
        currentProfile: { select: { key: true } },
      },
    });
  });
});
