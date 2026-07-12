// my-day repository — Prisma I/O ONLY (no business rules, no AppError). Two surfaces:
//   1. Personal-queue inputs: the caller's OWN designer assignments (the sales queue
//      reuses leadRepository.findCockpitBundlesForUser — not duplicated here).
//   2. Team-lens aggregates: indexed exception counts/groupBys (command-center style).
//
// THRESHOLD SINGLE-SOURCE (spec §6): the stale/delivery cutoffs IMPORT the constants the
// pure rules use, so the team lens and the personal queue breach at the same moment.
// UNCLAIMED_NEW_DAYS / UNSIGNED_CONTRACT_DAYS are team-lens-only and live here.
//
// 🔒 MONEY BOUNDARY (spec §5.4): like command-center, this repo NEVER touches Payment /
// ContractPayment / Outcome. Contract rows are read for sessionStatus only.
import prisma from "../../infra/prisma/prisma.js";
import { INACTIVE_PROJECT_STATUSES, ACTIVE_DEAL_STATUSES, ACTIVE_LEAD_STATUSES, DESIGNER_ROLES } from "../command-center/command-center.repo.js";
import { STALE_LEAD_DAYS } from "../leads/lead/lead.cockpit.js";
import { DELIVERY_SOON_HOURS } from "../leads/lead/lead.workstage-cockpit.js";

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

  // Sales load: active leads per owner + the cap (mirrors command-center.salesLoad — the
  // people cards need the same shape plus per-rep exception counts merged in the usecase).
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

  // Active-stage count per active designer (mirrors command-center.designerLoad).
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
}

export const myDayRepository = new MyDayRepository();
export { MyDayRepository };
