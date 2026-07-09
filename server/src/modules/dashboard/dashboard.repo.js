// dashboard repository — Prisma I/O ONLY (no business rules, no AppError).
//
// Most dashboard aggregations are HEAVY and are reused 1:1 from the legacy
// `dashboardServices.js` via lazy-import adapters in the usecase (we do NOT duplicate
// hundreds of lines of aggregation). This repository holds ONLY the one small read that
// the legacy service could not be safely scoped for: `recent-activities`.
//
// Legacy `getRecentActivities(searchParams)` built its where-clause from BOTH a
// client-supplied `staffId` AND a client-supplied `userId` query param — i.e. any caller
// could read another user's activity feed by passing `?userId=<other>` or
// `?staffId=<other>`. Here the usecase passes an AUTH-DERIVED scope:
//   - admin-tier (ADMIN/SUPER_ADMIN/isSuperSales): may pass a `staffId` (actor filter) or
//     nothing (global) — preserved 1:1.
//   - every other role: the feed is bound to the caller's OWN `userId` (req.auth.id) — a
//     non-privileged caller can only ever see activity addressed to them (the IDOR fix).
import { AppError } from "../../shared/errors/AppError.js";
import { authMessagesCodes } from "@dms/shared";
import prisma from "../../infra/prisma/prisma.js";

class DashboardRepository {
  model = prisma.notification;

  // Recent activities (latest 5 notifications), scoped by the usecase-supplied filter.
  // `scope` is one of:
  //   { userId }        — non-privileged self-scope (caller's own feed)
  //   { staffId }       — admin-tier actor filter (legacy passthrough)
  //   {}                — admin-tier global feed (no staffId supplied)
  async recentActivities({ scope = {}, take = 5 } = {}) {
    const where = {};
    // Defense-in-depth: a non-admin self-scope ALWAYS carries a `userId` key. If that id
    // did not resolve to a finite number (e.g. a non-numeric req.auth.id), DO NOT let the
    // where collapse to {} — that would silently hand the non-admin the GLOBAL feed and
    // re-open the cross-user IDOR. Reject instead. (Admin-tier global is `{}` — no userId
    // key — and is unaffected.)
    if ("userId" in scope) {
      if (!Number.isFinite(scope.userId)) {
        throw new AppError(authMessagesCodes.ACCESS_DENIED, 403);
      }
      where.userId = scope.userId;
    }
    if (Number.isFinite(scope.staffId)) where.staffId = scope.staffId;

    return prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  Metric-aggregation reads (Prisma I/O for the decomposed legacy dashboard
  //  services). Each method takes a usecase-built `where` and runs the exact query
  //  the legacy service ran — behavior-preserving; the math/orchestration stays in
  //  the usecase.
  // ════════════════════════════════════════════════════════════════════════════
  aggregateInvoiceAmount({ where }) {
    return prisma.invoice.aggregate({ _sum: { amount: true }, where });
  }

  aggregateLeadAvgPrice({ where }) {
    return prisma.clientLead.aggregate({ _avg: { averagePrice: true }, where });
  }

  aggregateLeadSumAvgPrice({ where }) {
    return prisma.clientLead.aggregate({ _sum: { averagePrice: true }, where });
  }

  countLeads({ where }) {
    return prisma.clientLead.count({ where });
  }

  aggregateCommission({ where }) {
    return prisma.commission.aggregate({
      where,
      _sum: { amount: true, amountPaid: true },
    });
  }

  findStaffUsers() {
    return prisma.user.findMany({
      where: {
        OR: [{ role: "STAFF" }, { subRoles: { some: { subRole: "STAFF" } } }],
      },
      select: { id: true },
    });
  }

  groupLeadsByStatus({ where }) {
    return prisma.clientLead.groupBy({
      by: ["status"],
      _count: { status: true },
      where,
    });
  }

  groupLeadsCountAll({ by, where }) {
    return prisma.clientLead.groupBy({ by, where, _count: { _all: true } });
  }

  groupTopSelectedCategory({ where }) {
    return prisma.clientLead.groupBy({
      by: ["selectedCategory"],
      _count: { selectedCategory: true },
      where,
      orderBy: { _count: { selectedCategory: "desc" } },
      take: 1,
    });
  }

  findLatestNewLeads() {
    return prisma.clientLead.findMany({
      where: { status: "NEW" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        client: { select: { id: true, name: true } },
        status: true,
        createdAt: true,
      },
    });
  }

  groupNotifications({ where }) {
    return prisma.notification.groupBy({
      by: ["userId", "createdAt"],
      _count: { staffId: true },
      where,
    });
  }

  countCallReminders({ where }) {
    return prisma.callReminder.count({ where });
  }

  countProjects({ where }) {
    return prisma.project.count({ where });
  }

  aggregateProjectArea({ where }) {
    return prisma.project.aggregate({ _sum: { area: true }, where });
  }

  findProjectsWithTime({ where }) {
    return prisma.project.findMany({
      where,
      select: { startedAt: true, endedAt: true, createdAt: true },
    });
  }
}

export const dashboardRepository = new DashboardRepository();
export { DashboardRepository };
