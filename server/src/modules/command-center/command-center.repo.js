// command-center repository — Prisma I/O ONLY (no business rules, no AppError). Feeds the
// ADMIN/SUPER_ADMIN operational cockpit (`GET /v2/command-center/overview`). Every read is
// GLOBAL (the admin code is the gate — no per-record owner to scope).
//
// 🔒 MONEY BOUNDARY (spec §5 — DELIBERATE): this repo NEVER touches Payment,
// ContractPayment, or Outcome. Accounting aggregates are an ACCOUNTANT-only surface
// (documented parity with master); ADMIN/SUPER_ADMIN do NOT hold ACCOUNTING_* codes. The
// only money sources here are the ones admins can ALREADY see today via the dashboard:
//   - Invoice._sum.amount (revenue)
//   - Commission._sum.{amount, amountPaid}
//   - ClientLead.averagePrice (pipeline / finalized value)
// Widening to receivables/cash-flow is a future, explicit decision — not done here.
import prisma from "../../infra/prisma/prisma.js";

// ── business status vocabularies (query shapes) ──────────────────────────────────────
// Deals actively being worked in the pipeline (a KPI/pipeline-value concern). Excludes raw
// NEW (an unworked lead) and every terminal/parked status (FINALIZED/CONVERTED/REJECTED/
// ON_HOLD/ARCHIVED/LEADEXCHANGE). Named so a reviewer can tune the definition in one place.
export const ACTIVE_DEAL_STATUSES = Object.freeze([
  "IN_PROGRESS",
  "INTERESTED",
  "NEEDS_IDENTIFIED",
  "NEGOTIATING",
]);

// A salesperson's current lead workload (compared to User.maxLeadsCounts). Includes NEW
// (an assigned-but-unworked lead still counts toward the cap) plus the active-deal set.
export const ACTIVE_LEAD_STATUSES = Object.freeze(["NEW", ...ACTIVE_DEAL_STATUSES]);

// Won deals whose averagePrice is realized value.
export const FINALIZED_DEAL_STATUSES = Object.freeze(["FINALIZED", "CONVERTED"]);

// Designer/executor roles whose active-project load the cockpit surfaces.
export const DESIGNER_ROLES = Object.freeze([
  "THREE_D_DESIGNER",
  "TWO_D_DESIGNER",
  "TWO_D_EXECUTOR",
]);

// Project.status is a FREE-FORM String (not an enum). A project is "active" when its status
// is NOT one of these terminal/parked boards (verified against the schema: Project.status
// String; the FE work-stage boards use these labels).
export const INACTIVE_PROJECT_STATUSES = Object.freeze([
  "Completed",
  "Hold",
  "Rejected",
  "To Do",
]);

class CommandCenterRepository {
  // Build a createdAt filter from a { from, to } Date range (both optional). Empty range → {}.
  #rangeWhere(range = {}) {
    const where = {};
    if (range?.from || range?.to) {
      where.createdAt = {};
      if (range.from) where.createdAt.gte = range.from;
      if (range.to) where.createdAt.lte = range.to;
    }
    return where;
  }

  // ── pipeline (ClientLead.averagePrice — already admin-visible) ────────────────────────
  pipelineByStatus(range) {
    return prisma.clientLead.groupBy({
      by: ["status"],
      _count: { _all: true },
      _sum: { averagePrice: true },
      where: this.#rangeWhere(range),
    });
  }

  activeDealsCount(range) {
    return prisma.clientLead.count({
      where: { ...this.#rangeWhere(range), status: { in: [...ACTIVE_DEAL_STATUSES] } },
    });
  }

  finalizedValue(range) {
    return prisma.clientLead.aggregate({
      _sum: { averagePrice: true },
      where: { ...this.#rangeWhere(range), status: { in: [...FINALIZED_DEAL_STATUSES] } },
    });
  }

  // ── money (Invoice / Commission — already admin-visible; NO Payment/ContractPayment) ──
  revenue(range) {
    return prisma.invoice.aggregate({
      _sum: { amount: true },
      where: this.#rangeWhere(range),
    });
  }

  commissions(range) {
    return prisma.commission.aggregate({
      _sum: { amount: true, amountPaid: true },
      where: this.#rangeWhere(range),
    });
  }

  // ── team capacity ─────────────────────────────────────────────────────────────────────
  // Designer/executor load: one active-project count per active designer. Returns raw counts
  // (the overloaded flag is a usecase concern). Safe projection: id + name + role only.
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
    return designers.map((d, i) => ({
      userId: d.id,
      name: d.name,
      role: d.role,
      activeProjects: counts[i],
    }));
  }

  // Sales load: active leads grouped by owner, joined to the owner's name + maxLeadsCounts.
  // Safe projection: id + name + counts only. Ordered most-loaded first.
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
        return {
          userId: u.id,
          name: u.name,
          activeLeads: g._count._all,
          maxLeads: u.maxLeadsCounts ?? null,
        };
      })
      .sort((a, b) => b.activeLeads - a.activeLeads);
  }

  // Auto-assign rotation: the active auto-assignment rows (grouping by type is a usecase
  // concern). Safe projection: type + userId only.
  autoAssignRotation() {
    return prisma.autoAssignment.findMany({
      where: { isActive: true },
      select: { userId: true, type: true },
    });
  }

  // ── delivery health ───────────────────────────────────────────────────────────────────
  // Late deliveries: deadline passed AND the linked contract stage is not COMPLETED. Rows
  // without a stage are excluded (a to-one relation filter requires the relation to exist).
  lateDeliveries(now, take = 10) {
    return prisma.deliverySchedule.findMany({
      where: { deliveryAt: { lt: now }, stage: { stageStatus: { not: "COMPLETED" } } },
      select: {
        id: true,
        deliveryAt: true,
        project: { select: { id: true, groupTitle: true } },
      },
      orderBy: { deliveryAt: "asc" },
      take,
    });
  }

  lateDeliveriesCount(now) {
    return prisma.deliverySchedule.count({
      where: { deliveryAt: { lt: now }, stage: { stageStatus: { not: "COMPLETED" } } },
    });
  }
}

export const commandCenterRepository = new CommandCenterRepository();
export { CommandCenterRepository };
