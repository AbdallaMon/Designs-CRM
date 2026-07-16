// my-day repository — Prisma I/O ONLY (no business rules, no AppError). Two surfaces:
//   1. Personal-queue inputs: the caller's OWN designer assignments (the sales queue
//      reuses leadRepository.findCockpitBundlesForUser — not duplicated here).
//   2. Team-lens aggregates: indexed exception counts/groupBys.
//
// THRESHOLD SINGLE-SOURCE (spec §6): the stale/delivery cutoffs IMPORT the constants the
// pure rules use, so the team lens and the personal queue breach at the same moment.
// UNCLAIMED_NEW_DAYS / UNSIGNED_CONTRACT_DAYS are team-lens-only and live here.
//
// 🔒 MONEY BOUNDARY (spec §5.4): this repo NEVER touches Payment / ContractPayment /
// Outcome. Contract rows are read for sessionStatus only.
import prisma from "../../infra/prisma/prisma.js";
import { STALE_LEAD_DAYS } from "../leads/lead/lead.cockpit.js";
import { DELIVERY_SOON_HOURS } from "../leads/lead/lead.workstage-cockpit.js";

// ── business status vocabularies (query shapes) ──────────────────────────────────────
// Deals actively being worked in the pipeline. Excludes raw NEW (an unworked lead) and
// every terminal/parked status.
export const ACTIVE_DEAL_STATUSES = Object.freeze([
  "IN_PROGRESS",
  "INTERESTED",
  "NEEDS_IDENTIFIED",
  "NEGOTIATING",
]);

// A salesperson's current lead workload (compared to User.maxLeadsCounts). Includes NEW
// (an assigned-but-unworked lead still counts toward the cap) plus the active-deal set.
export const ACTIVE_LEAD_STATUSES = Object.freeze(["NEW", ...ACTIVE_DEAL_STATUSES]);

// Designer/executor roles whose active-project load the team lens surfaces.
export const DESIGNER_ROLES = Object.freeze([
  "THREE_D_DESIGNER",
  "TWO_D_DESIGNER",
  "TWO_D_EXECUTOR",
]);

// Project.status is a FREE-FORM String (not an enum). A project is "active" when its status
// is NOT one of these terminal/parked boards.
export const INACTIVE_PROJECT_STATUSES = Object.freeze([
  "Completed",
  "Hold",
  "Rejected",
  "To Do",
]);

// Team-lens-only thresholds (spec §6).
export const UNCLAIMED_NEW_DAYS = 2;
export const UNSIGNED_CONTRACT_DAYS = 3;

const MS_PER_HOUR = 3600_000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

class MyDayRepository {
  // ── personal queue (designer tier) ─────────────────────────────────────────────────
  // The caller's own assignments on active projects, with everything the deadline rules
  // read: per-stage DeliverySchedule.deliveryAt (primary) and Project.deliveryTime
  // (fallback). Safe projection: no free text beyond the client display name.
  findDesignerAssignments({ userId }) {
    return prisma.assignment.findMany({
      where: {
        userId: Number(userId),
        project: { status: { notIn: [...INACTIVE_PROJECT_STATUSES] } },
      },
      select: {
        project: {
          select: {
            id: true,
            type: true,
            status: true,
            deliveryTime: true,
            clientLeadId: true,
            clientLead: { select: { id: true, client: { select: { name: true } } } },
            contractStages: {
              select: {
                stageStatus: true,
                deliverySchedule: { select: { deliveryAt: true } },
              },
            },
          },
        },
      },
    });
  }

  // ── personal agenda ────────────────────────────────────────────────────────────────
  // The caller's own IN_PROGRESS call + meeting reminders up to end-of-day (server day):
  // today's schedule PLUS anything already overdue from earlier days — both actionable now.
  async findTodaysAgendaForUser({ userId, now }) {
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const where = {
      userId: Number(userId),
      status: "IN_PROGRESS",
      time: { not: null, lte: endOfDay },
    };
    const select = {
      id: true,
      time: true,
      reminderReason: true,
      clientLead: { select: { id: true, client: { select: { name: true } } } },
    };
    const [calls, meetings] = await Promise.all([
      prisma.callReminder.findMany({
        where: { ...where, time: { lte: endOfDay } }, // CallReminder.time is non-nullable
        select,
        orderBy: { time: "asc" },
        take: 100,
      }),
      prisma.meetingReminder.findMany({ where, select, orderBy: { time: "asc" }, take: 100 }),
    ]);
    return { calls, meetings };
  }

  // ── initiator first-touch pool ─────────────────────────────────────────────────────
  // ALL unclaimed NEW leads oldest-first (the initiator queue ramps severity by age in
  // hours via the pure poolTouchSeverity helper — no threshold here).
  unclaimedPoolLeads({ take = 50 } = {}) {
    return prisma.clientLead.findMany({
      where: { userId: null, status: "NEW" },
      orderBy: { createdAt: "asc" },
      take,
      select: { id: true, createdAt: true, client: { select: { name: true } } },
    });
  }

  // ── drill-down scope lookup ────────────────────────────────────────────────────────
  // Target user's active profile for the supervisor scope check. Reads currentProfile.key
  // (DB-relational truth) + the transitional `profile` column — NEVER the legacy flags.
  findUserForScope({ userId }) {
    return prisma.user.findUnique({
      where: { id: Number(userId) },
      select: {
        id: true,
        name: true,
        isActive: true,
        role: true,
        profile: true,
        currentProfile: { select: { key: true } },
      },
    });
  }

  findUserNames(ids) {
    if (!ids.length) return Promise.resolve([]);
    return prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });
  }

  // ── team lens: sales domain ────────────────────────────────────────────────────────
  // Stale leads per rep — the SQL approximation of the LEAD_STALE rule (documented,
  // spec §5.4): active status, no activity since the cutoff, nothing scheduled.
  staleLeadsByRep(now) {
    const cutoff = new Date(now.getTime() - STALE_LEAD_DAYS * MS_PER_DAY);
    return prisma.clientLead.groupBy({
      by: ["userId"],
      _count: { _all: true },
      where: {
        userId: { not: null },
        status: { in: [...ACTIVE_DEAL_STATUSES] },
        updatedAt: { lt: cutoff },
        callReminders: { none: { status: "IN_PROGRESS", time: { gte: now } } },
        meetingReminders: { none: { status: "IN_PROGRESS", time: { gte: now } } },
      },
    });
  }

  unclaimedAgingCount(now) {
    const cutoff = new Date(now.getTime() - UNCLAIMED_NEW_DAYS * MS_PER_DAY);
    return prisma.clientLead.count({
      where: { userId: null, status: "NEW", createdAt: { lt: cutoff } },
    });
  }

  overdueCallsByRep(now) {
    return prisma.callReminder.groupBy({
      by: ["userId"],
      _count: { _all: true },
      where: { status: "IN_PROGRESS", time: { lt: now } },
    });
  }

  // Contract has NO updatedAt column — createdAt is the documented approximation for
  // "sitting in SIGNING too long" (a contract created N+ days ago and still unsigned).
  signingStalled(now, take = 20) {
    const cutoff = new Date(now.getTime() - UNSIGNED_CONTRACT_DAYS * MS_PER_DAY);
    return prisma.contract.findMany({
      where: { sessionStatus: "SIGNING", createdAt: { lt: cutoff } },
      select: {
        id: true,
        clientLeadId: true,
        createdAt: true,
        clientLead: { select: { userId: true, client: { select: { name: true } } } },
      },
      orderBy: { createdAt: "asc" },
      take,
    });
  }

  // Sales load: active leads per owner + the cap. The people cards need this shape plus
  // per-rep exception counts merged in the usecase.
  async salesLoad() {
    const grouped = await prisma.clientLead.groupBy({
      by: ["userId"],
      _count: { _all: true },
      where: { userId: { not: null }, status: { in: [...ACTIVE_LEAD_STATUSES] } },
    });
    const userIds = grouped.map((g) => g.userId).filter((id) => id != null);
    const users = userIds.length
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, maxLeadsCounts: true },
        })
      : [];
    const usersById = new Map(users.map((u) => [u.id, u]));
    return grouped
      .filter((g) => usersById.has(g.userId))
      .map((g) => {
        const u = usersById.get(g.userId);
        return { userId: u.id, name: u.name, activeLeads: g._count._all, maxLeads: u.maxLeadsCounts ?? null };
      })
      .sort((a, b) => b.activeLeads - a.activeLeads);
  }

  // ── team lens: designers domain ────────────────────────────────────────────────────
  // Every delivery breaching within the window (or already overdue) with a live stage;
  // the usecase splits overdue vs due-soon and attributes designers via assignments.
  deliveriesAtRisk(now, take = 30) {
    const soonCutoff = new Date(now.getTime() + DELIVERY_SOON_HOURS * MS_PER_HOUR);
    return prisma.deliverySchedule.findMany({
      where: {
        deliveryAt: { lt: soonCutoff },
        stage: { stageStatus: { not: "COMPLETED" } },
      },
      select: {
        id: true,
        deliveryAt: true,
        project: {
          select: {
            id: true,
            type: true,
            clientLeadId: true,
            assignments: { select: { user: { select: { id: true, name: true } } } },
          },
        },
      },
      orderBy: { deliveryAt: "asc" },
      take,
    });
  }

  // Active-stage count per active designer.
  async designerLoad() {
    const designers = await prisma.user.findMany({
      where: { role: { in: [...DESIGNER_ROLES] }, isActive: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    });
    const counts = await Promise.all(
      designers.map((d) =>
        prisma.project.count({
          where: {
            assignments: { some: { userId: d.id } },
            status: { notIn: [...INACTIVE_PROJECT_STATUSES] },
          },
        }),
      ),
    );
    return designers.map((d, i) => ({ userId: d.id, name: d.name, role: d.role, activeStages: counts[i] }));
  }

  // ── drill-down itemization (a single rep) ────────────────────────────────────────────
  // The actual rows behind a person card's counts, so the supervisor drawer can list WHICH
  // leads/calls (not just how many) and each row deep-links to its record. Safe projections:
  // id + status + client display name + the timestamps the UI shows. Same money boundary.

  // The rep's active leads (matches the salesLoad `activeLeads` count for this rep).
  activeLeadsForRep(userId) {
    return prisma.clientLead.findMany({
      where: { userId: Number(userId), status: { in: [...ACTIVE_LEAD_STATUSES] } },
      select: {
        id: true,
        status: true,
        updatedAt: true,
        client: { select: { name: true } },
      },
      orderBy: { updatedAt: "asc" },
    });
  }

  // Stale leads for ONE rep — the itemized form of staleLeadsByRep (identical predicate,
  // scoped to a single userId), so the drawer's stale rows equal the card's staleCount.
  staleLeadsForRep(userId, now) {
    const cutoff = new Date(now.getTime() - STALE_LEAD_DAYS * MS_PER_DAY);
    return prisma.clientLead.findMany({
      where: {
        userId: Number(userId),
        status: { in: [...ACTIVE_DEAL_STATUSES] },
        updatedAt: { lt: cutoff },
        callReminders: { none: { status: "IN_PROGRESS", time: { gte: now } } },
        meetingReminders: { none: { status: "IN_PROGRESS", time: { gte: now } } },
      },
      select: { id: true, status: true, updatedAt: true, client: { select: { name: true } } },
      orderBy: { updatedAt: "asc" },
    });
  }

  // Overdue calls for ONE rep — the itemized form of overdueCallsByRep, with the lead each
  // call hangs off so the row can link to `/dashboard/deals/:leadId?tab=calls`.
  overdueCallsForRep(userId, now) {
    return prisma.callReminder.findMany({
      where: { userId: Number(userId), status: "IN_PROGRESS", time: { lt: now } },
      select: {
        id: true,
        time: true,
        clientLeadId: true,
        clientLead: { select: { id: true, status: true, client: { select: { name: true } } } },
      },
      orderBy: { time: "asc" },
    });
  }

  // Stalled unsigned contracts for ONE rep — the itemized form of signingStalled scoped to
  // the rep who owns the lead (same SIGNING + createdAt cutoff predicate).
  signingStalledForRep(userId, now) {
    const cutoff = new Date(now.getTime() - UNSIGNED_CONTRACT_DAYS * MS_PER_DAY);
    return prisma.contract.findMany({
      where: {
        sessionStatus: "SIGNING",
        createdAt: { lt: cutoff },
        clientLead: { userId: Number(userId) },
      },
      select: {
        id: true,
        clientLeadId: true,
        createdAt: true,
        clientLead: { select: { status: true, client: { select: { name: true } } } },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  // The actual aging unclaimed leads behind unclaimedAgingCount — no owner, so the drawer
  // lists them for anyone holding my_day.team.view to pick up. Same NEW + createdAt cutoff.
  unclaimedAgingLeads(now, take = 50) {
    const cutoff = new Date(now.getTime() - UNCLAIMED_NEW_DAYS * MS_PER_DAY);
    return prisma.clientLead.findMany({
      where: { userId: null, status: "NEW", createdAt: { lt: cutoff } },
      select: { id: true, createdAt: true, client: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
      take,
    });
  }
}

export const myDayRepository = new MyDayRepository();
export { MyDayRepository };
