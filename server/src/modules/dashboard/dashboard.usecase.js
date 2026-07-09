// dashboard usecase — business logic / orchestration for the 9 read-only analytics
// aggregations (legacy `/shared/dashboard/*`). Prisma NEVER appears here: the heavy
// aggregations are reused 1:1 from the legacy `dashboardServices.js` via lazy-import
// adapters (no duplication), and the one small scoped read (recent-activities) goes
// through the repository. Behavior is ported from the legacy handlers with ONE deliberate
// security change — the scope identity is derived from req.auth, never from a client param.
//
// ════════════════════════════════════════════════════════════════════════════════════
//  THE IDOR-CLASS FIX (over-exposure / cross-user metric reads)
// ════════════════════════════════════════════════════════════════════════════════════
//  Legacy keyed every scoped aggregation off `searchParams.staffId` (a CLIENT-SUPPLIED
//  query param), and `getRecentActivities` ALSO off `searchParams.userId`. So:
//    - a scoped role (sales/designer/executor) could pass `?staffId=<other>` /
//      `?userId=<other>` and read ANOTHER user's metrics / activity feed, and
//    - omitting `staffId` returned the GLOBAL aggregate to everyone.
//  The `role` argument the legacy passed to getKeyMetrics / getDashboardLeadStatusData was
//  the TOKEN role (getCurrentUser decodes the JWT) — that part is fine and preserved; we
//  keep deriving role from req.auth, NEVER from a `?role=` query param.
//
//  v2 computes an EFFECTIVE staffId from the authenticated caller:
//    - admin-tier union (ADMIN / SUPER_ADMIN / isSuperSales): the client `staffId` is
//      honored as-is (scope to anyone), or omitted for the global aggregate — preserved
//      1:1 with legacy privileged behavior.
//    - every other role: staffId is FORCED to req.auth.id — they can only ever see their
//      OWN metrics (this matches the FE, which already sends the caller's own id for a
//      self-view; the ONLY thing closed is the cross-user read).
//  The sanitized searchParams handed to the legacy service carry ONLY the auth-derived
//  staffId (+ date filters + the harmless `profile` flag) — a raw client `staffId`/`userId`
//  never reaches the aggregation (the same lesson as the notifications fix: no
//  trusted-userId passthrough that makes the scope an illusion).
import dayjs from "dayjs";
import {
  getCommissionByUserId,
  reverseCommissions,
} from "../admin-residual/legacy/admin-services.js";
import { dashboardRepository } from "./dashboard.repo.js";
import {
  updateKeyFilterForUserFilter,
  buildDateRange,
  buildStaffFilter,
} from "./dashboard.filters.js";

// Roles that historically saw GLOBAL data / could scope to ANY user on the dashboard
// (the legacy `isAdmin` union). Everyone else is forced to a self-scope.
const ADMIN_TIER_ROLES = ["ADMIN", "SUPER_ADMIN"];

// ════════════════════════════════════════════════════════════════════════════════════
//  Metric computation — the (frozen) heavy aggregations decomposed 1:1 from the legacy
//  `dashboard-services.js`. Prisma I/O is delegated to `dashboardRepository`; the math,
//  date-range building, and Promise.all orchestration stay here. The cross-cluster
//  commission recompute (getCommissionByUserId / reverseCommissions) is invoked from the
//  admin-residual legacy service exactly as before. Behavior is preserved verbatim,
//  including the historical `updateKeyFilterForUserFilter(fn, searchParams)` call shape.
//  These module functions replace the former shared/legacy lazy-import adapters and are
//  wired into the `legacyDefaults` DI seam below (constructor shape unchanged).
// ════════════════════════════════════════════════════════════════════════════════════
async function getKeyMetrics(searchParams, role) {
  try {
    let userFilter = {};

    if (searchParams.staffId) {
      userFilter = await updateKeyFilterForUserFilter(
        updateKeyFilterForUserFilter,
        searchParams
      );
    }
    const staffFilter = userFilter;
    const invoicesFilters = searchParams.staffId
      ? {
          payment: {
            clientLead: userFilter,
          },
        }
      : {};

    const userProfile = searchParams.profile;
    const totalRevenueResult = await dashboardRepository.aggregateInvoiceAmount({
      where: { ...invoicesFilters },
    });
    const totalRevenue = totalRevenueResult._sum.amount || 0;
    const avgLeadValueResult = await dashboardRepository.aggregateLeadAvgPrice({
      where: { status: { in: ["FINALIZED", "ARCHIVED"] }, ...staffFilter },
    });
    const averageProjectValue = avgLeadValueResult._avg.averagePrice
      ? parseFloat(avgLeadValueResult._avg.averagePrice.toFixed(2))
      : 0;

    const successLeadsCount = await dashboardRepository.countLeads({
      where: { status: { in: ["FINALIZED", "ARCHIVED"] }, ...staffFilter },
    });
    const newLeadCounts = await dashboardRepository.countLeads({
      where: { status: "NEW", ...staffFilter },
    });
    const inProgressLeadCounts = await dashboardRepository.countLeads({
      where: { status: "IN_PROGRESS", ...staffFilter },
    });
    const interestedLeadCounts = await dashboardRepository.countLeads({
      where: { status: "INTERESTED", ...staffFilter },
    });
    const needsIdentifiedLeadCounts = await dashboardRepository.countLeads({
      where: { status: "NEEDS_IDENTIFIED", ...staffFilter },
    });
    const negotiatingLeadCounts = await dashboardRepository.countLeads({
      where: { status: "NEGOTIATING", ...staffFilter },
    });
    const rejectedLeadCounts = await dashboardRepository.countLeads({
      where: { status: "REJECTED", ...staffFilter },
    });
    const finalizedLeadCounts = await dashboardRepository.countLeads({
      where: { status: "FINALIZED", ...staffFilter },
    });
    const convertedLeadCounts = await dashboardRepository.countLeads({
      where: { status: "CONVERTED", ...staffFilter },
    });
    const onHoldLeadCounts = await dashboardRepository.countLeads({
      where: { status: "ON_HOLD", ...staffFilter },
    });
    const archivedLeadCounts = await dashboardRepository.countLeads({
      where: { status: "ARCHIVED", ...staffFilter },
    });
    const nonSuccessLeadsCount = await dashboardRepository.countLeads({
      where: { ...staffFilter, status: { in: ["CONVERTED", "ON_HOLD", "REJECTED"] } },
    });

    let leadsCounts;
    let interactedLeads = 0;
    const startOfToday = dayjs().startOf("day").toDate();
    const endOfToday = dayjs().endOf("day").toDate();
    interactedLeads = await dashboardRepository.countLeads({
      where: { ...staffFilter, updatedAt: { gte: startOfToday, lte: endOfToday } },
    });
    leadsCounts = await dashboardRepository.countLeads({
      where: { ...staffFilter },
    });

    const totalProcessedLeadsCount = successLeadsCount + nonSuccessLeadsCount;

    const successRate =
      totalProcessedLeadsCount > 0
        ? ((successLeadsCount / totalProcessedLeadsCount) * 100).toFixed(2)
        : "0.00";

    const commissions = await dashboardRepository.aggregateCommission({
      where: staffFilter,
    });

    const totalCommission = commissions._sum.amount || 0;
    const totalClreadCommission = commissions._sum.amountPaid || 0;
    return {
      totalRevenue,
      averageProjectValue,
      successRate,
      leadsCounts,
      interactedLeads,
      totalCommission,
      totalClreadCommission,
      successLeadsCount,
      newLeadCounts,
      inProgressLeadCounts,
      interestedLeadCounts,
      needsIdentifiedLeadCounts,
      negotiatingLeadCounts,
      rejectedLeadCounts,
      finalizedLeadCounts,
      convertedLeadCounts,
      onHoldLeadCounts,
      archivedLeadCounts,
    };
  } catch (error) {
    console.error("Error fetching key metrics:", error);
    throw new Error("Unable to fetch key metrics");
  }
}

async function getDashboardLeadStatusData(searchParams, role) {
  let userFilter = {};
  if (role === "ADMIN") {
    const users = await dashboardRepository.findStaffUsers();
    users.forEach(async (user) => {
      await getCommissionByUserId(user.id);
    });
    await reverseCommissions();
  }
  if (searchParams.staffId) {
    userFilter = await updateKeyFilterForUserFilter(
      updateKeyFilterForUserFilter,
      searchParams
    );
  }
  const staffFilter = userFilter;
  try {
    const rawStatuses = await dashboardRepository.groupLeadsByStatus({
      where: { ...staffFilter },
    });
    const formattedStatuses = rawStatuses.map((entry) => ({
      status: entry.status.replace(/_/g, " "),
      count: parseFloat(entry._count.status.toFixed(2)),
    }));

    return formattedStatuses;
  } catch (error) {
    console.error("Error fetching lead status data:", error);
    throw new Error("Unable to fetch lead status data");
  }
}

async function getMonthlyPerformanceData(searchParams) {
  let userFilter = {};
  if (searchParams.staffId) {
    userFilter = await updateKeyFilterForUserFilter(
      updateKeyFilterForUserFilter,
      searchParams
    );
  }
  const staffFilter = userFilter;

  try {
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = dayjs().subtract(i, "month");
      return {
        label: date.format("MMM"),
        start: date.startOf("month").toDate(),
        end: date.endOf("month").toDate(),
      };
    }).reverse();

    const results = await Promise.all(
      months.map(async ({ label, start, end }) => {
        const totalLeads = await dashboardRepository.countLeads({
          where: { createdAt: { gte: start, lte: end }, ...staffFilter },
        });

        const finalizedLeads = await dashboardRepository.countLeads({
          where: {
            createdAt: { gte: start, lte: end },
            status: "FINALIZED",
            ...staffFilter,
          },
        });

        const nonSuccessLeads = await dashboardRepository.countLeads({
          where: {
            createdAt: { gte: start, lte: end },
            ...staffFilter,
            status: { in: ["CONVERTED", "ON_HOLD", "REJECTED"] },
          },
        });

        const revenueResult = await dashboardRepository.aggregateLeadSumAvgPrice({
          where: {
            createdAt: { gte: start, lte: end },
            ...staffFilter,
            status: "FINALIZED",
          },
        });

        const revenue = revenueResult._sum.averagePrice || 0;

        return {
          month: label,
          leads: totalLeads,
          finalized: finalizedLeads,
          nonSuccess: nonSuccessLeads,
          revenue,
        };
      })
    );

    return results;
  } catch (error) {
    console.error("Error fetching monthly performance data:", error);
    throw new Error("Unable to fetch monthly performance data");
  }
}

async function getEmiratesAnalytics(searchParams) {
  let userFilter = {};
  if (searchParams.staffId) {
    userFilter = await updateKeyFilterForUserFilter(
      updateKeyFilterForUserFilter,
      searchParams
    );
  }
  const staffFilter = userFilter;
  try {
    const emirates = [
      "DUBAI",
      "ABU_DHABI",
      "SHARJAH",
      "AJMAN",
      "UMM_AL_QUWAIN",
      "RAS_AL_KHAIMAH",
      "FUJAIRAH",
    ];

    const currentStart = dayjs().subtract(1, "month").startOf("month").toDate();
    const currentEnd = dayjs().endOf("day").toDate();

    const previousStart = dayjs(currentStart).subtract(1, "month").toDate();
    const previousEnd = dayjs(currentEnd).subtract(1, "month").toDate();

    const dateRangeDescription = `${dayjs(currentStart).format(
      "MMMM YYYY"
    )} - ${dayjs(currentEnd).format("MMMM YYYY")}`;

    const analytics = await Promise.all(
      emirates.map(async (emirate) => {
        const currentLeads = await dashboardRepository.countLeads({
          where: {
            emirate,
            ...staffFilter,
            createdAt: { gte: currentStart, lte: currentEnd },
          },
        });

        const previousLeads = await dashboardRepository.countLeads({
          where: {
            emirate,
            ...staffFilter,
            createdAt: { gte: previousStart, lte: previousEnd },
          },
        });

        const growthRate =
          previousLeads > 0
            ? Math.round(((currentLeads - previousLeads) / previousLeads) * 100)
            : currentLeads > 0
            ? 100
            : 0;

        const finalizedLeads = await dashboardRepository.countLeads({
          where: {
            emirate,
            ...staffFilter,
            createdAt: { gte: currentStart, lte: currentEnd },
            status: "FINALIZED",
          },
        });

        const totalPriceResult = await dashboardRepository.aggregateLeadSumAvgPrice({
          where: {
            emirate,
            ...staffFilter,
            createdAt: { gte: currentStart, lte: currentEnd },
            status: "FINALIZED",
          },
        });
        const totalPrice = totalPriceResult._sum.averagePrice || 0;

        const averageLeadPrice =
          currentLeads > 0 ? Math.round(totalPrice / currentLeads) : 0;

        const topCategoryResult = await dashboardRepository.groupTopSelectedCategory({
          where: {
            emirate,
            ...staffFilter,
            createdAt: { gte: currentStart, lte: currentEnd },
          },
        });
        const selectedCategory =
          topCategoryResult[0]?.selectedCategory || "Unknown";

        const successRate =
          currentLeads > 0
            ? Math.round((finalizedLeads / currentLeads) * 100)
            : 0;

        return {
          emirate,
          leads: currentLeads,
          totalPrice,
          averageLeadPrice,
          growthRate,
          selectedCategory,
          successRate,
        };
      })
    );

    return {
      analytics,
      dateRange: dateRangeDescription,
    };
  } catch (error) {
    console.error("Error fetching Emirates analytics:", error);
    throw new Error("Unable to fetch Emirates analytics");
  }
}

async function getLeadsMonthlyOverview(searchParams) {
  const { start, end, label } = buildDateRange(searchParams);
  const staffFilter = buildStaffFilter(searchParams);

  const INSIDE_LIST = [
    "DUBAI",
    "ABU_DHABI",
    "SHARJAH",
    "AJMAN",
    "UMM_AL_QUWAIN",
    "RAS_AL_KHAIMAH",
    "FUJAIRAH",
    "KHOR_FAKKAN",
  ];

  const [
    totalThisPeriod,
    insideCount,
    outsideCount,
    incompleteCount,
    finalizedTotal,
  ] = await Promise.all([
    dashboardRepository.countLeads({
      where: { ...staffFilter, createdAt: { gte: start, lte: end } },
    }),
    dashboardRepository.countLeads({
      where: {
        ...staffFilter,
        createdAt: { gte: start, lte: end },
        emirate: { in: INSIDE_LIST },
      },
    }),
    dashboardRepository.countLeads({
      where: {
        ...staffFilter,
        createdAt: { gte: start, lte: end },
        emirate: "OUTSIDE",
      },
    }),
    dashboardRepository.countLeads({
      where: {
        ...staffFilter,
        createdAt: { gte: start, lte: end },
        emirate: null,
      },
    }),
    dashboardRepository.countLeads({
      where: {
        ...staffFilter,
        status: "FINALIZED",
        finalizedDate: { gte: start, lte: end },
      },
    }),
  ]);

  const successRate = totalThisPeriod
    ? Math.round((finalizedTotal * 100) / totalThisPeriod)
    : 0;

  const insideTotals = await dashboardRepository.groupLeadsCountAll({
    by: ["emirate"],
    where: {
      ...staffFilter,
      createdAt: { gte: start, lte: end },
      emirate: { in: INSIDE_LIST },
    },
  });

  const insideFinalizedFromCreated = await dashboardRepository.groupLeadsCountAll({
    by: ["emirate"],
    where: {
      ...staffFilter,
      createdAt: { gte: start, lte: end },
      emirate: { in: INSIDE_LIST },
      status: "FINALIZED",
    },
  });

  const insideFinalizedMap = Object.fromEntries(
    insideFinalizedFromCreated.map((r) => [r.emirate, r._count._all])
  );

  const insideRows = insideTotals
    .map((r) => {
      const finalized = insideFinalizedMap[r.emirate] || 0;
      const total = r._count._all;
      return {
        emirate: r.emirate,
        leads: total,
        finalized,
        successRate: total ? Math.round((finalized * 100) / total) : 0,
      };
    })
    .sort((a, b) => b.leads - a.leads);

  const outsideTotals = await dashboardRepository.groupLeadsCountAll({
    by: ["country"],
    where: {
      ...staffFilter,
      createdAt: { gte: start, lte: end },
      emirate: "OUTSIDE",
    },
  });

  const outsideFinalizedFromCreated = await dashboardRepository.groupLeadsCountAll({
    by: ["country"],
    where: {
      ...staffFilter,
      createdAt: { gte: start, lte: end },
      emirate: "OUTSIDE",
      status: "FINALIZED",
    },
  });

  const outsideFinalizedMap = Object.fromEntries(
    outsideFinalizedFromCreated.map((r) => [
      r.country ?? "Unknown",
      r._count._all,
    ])
  );

  const outsideRows = outsideTotals
    .map((r) => {
      const key = r.country ?? "Unknown";
      const finalized = outsideFinalizedMap[key] || 0;
      const total = r._count._all;
      return {
        country: key,
        leads: total,
        finalized,
        successRate: total ? Math.round((finalized * 100) / total) : 0,
      };
    })
    .sort((a, b) => b.leads - a.leads);

  const finalizedInside = await dashboardRepository.groupLeadsCountAll({
    by: ["emirate"],
    where: {
      ...staffFilter,
      status: "FINALIZED",
      finalizedDate: { gte: start, lte: end },
      emirate: { in: INSIDE_LIST },
    },
  });

  const finalizedInsideRows = finalizedInside
    .map((r) => ({ emirate: r.emirate, finalized: r._count._all }))
    .sort((a, b) => b.finalized - a.finalized);

  const finalizedOutside = await dashboardRepository.groupLeadsCountAll({
    by: ["country"],
    where: {
      ...staffFilter,
      status: "FINALIZED",
      finalizedDate: { gte: start, lte: end },
      emirate: "OUTSIDE",
    },
  });

  const finalizedOutsideRows = finalizedOutside
    .map((r) => ({ country: r.country ?? "Unknown", finalized: r._count._all }))
    .sort((a, b) => b.finalized - a.finalized);

  const dsTotals = await dashboardRepository.groupLeadsCountAll({
    by: ["discoverySource"],
    where: { ...staffFilter, createdAt: { gte: start, lte: end } },
  });

  const discoverySources = dsTotals
    .map((r) => ({
      source: r.discoverySource ?? "OTHER",
      count: r._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    period: { start, end, label },
    totals: {
      totalThisPeriod,
      insideCount,
      outsideCount,
      incompleteCount,
      finalizedTotal,
      successRate,
    },
    inside: { rows: insideRows },
    outside: { rows: outsideRows },
    finalizedInsideRows,
    finalizedOutsideRows,
    discoverySources,
  };
}

async function getPerformanceMetrics(searchParams) {
  let userFilter = {};
  if (searchParams.staffId) {
    userFilter = await updateKeyFilterForUserFilter(
      updateKeyFilterForUserFilter,
      searchParams
    );
  }
  const staffFilter = userFilter;
  try {
    const weekStart = dayjs().subtract(7, "day").startOf("day").toDate();
    const weekEnd = dayjs().endOf("day").toDate();
    const newLeads = await dashboardRepository.countLeads({
      where: { createdAt: { gte: weekStart, lte: weekEnd } },
    });

    const success = await dashboardRepository.countLeads({
      where: {
        ...staffFilter,
        status: "FINALIZED",
        updatedAt: { gte: weekStart, lte: weekEnd },
      },
    });

    const followUps = await dashboardRepository.groupNotifications({
      where: {
        ...staffFilter,
        type: { notIn: ["NEW_LEAD"] },
        createdAt: { gte: weekStart, lte: weekEnd },
      },
    });

    const uniqueFollowUps = new Set(
      followUps.map(
        (log) => `${log.staffId}-${dayjs(log.createdAt).format("YYYY-MM-DD")}`
      )
    ).size;

    const meetings = await dashboardRepository.countCallReminders({
      where: {
        ...staffFilter,
        time: { gte: weekStart, lte: weekEnd },
      },
    });
    return {
      currentWeek: `${dayjs(weekStart).format("DD/MM")} : ${dayjs(
        weekEnd
      ).format("DD/MM")}`,
      weekly: {
        newLeads: newLeads,
        success,
        followUps: uniqueFollowUps,
        meetings,
      },
    };
  } catch (error) {
    console.error("Error fetching performance metrics:", error);
    throw new Error("Unable to fetch performance metrics");
  }
}

async function getLatestNewLeads() {
  try {
    const latestLeads = await dashboardRepository.findLatestNewLeads();
    return latestLeads;
  } catch (error) {
    console.error("Error fetching latest new leads:", error);
    throw new Error("Unable to fetch latest new leads");
  }
}

async function getDesignerMetrics(searchParams) {
  try {
    const userId = searchParams.staffId ? parseInt(searchParams.staffId) : null;

    const userFilter = userId
      ? { assignments: { some: { userId: Number(userId) } } }
      : {};

    const completedProjects = await dashboardRepository.countProjects({
      where: { ...userFilter, status: "Completed" },
    });

    const holdProjects = await dashboardRepository.countProjects({
      where: { ...userFilter, status: "Hold" },
    });
    const inProgressProject = await dashboardRepository.countProjects({
      where: {
        ...userFilter,
        status: { notIn: ["Completed", "Hold", "Rejected", "To Do"] },
      },
    });
    const notStartedProject = await dashboardRepository.countProjects({
      where: { ...userFilter, status: "To Do" },
    });
    const totalProjects = await dashboardRepository.countProjects({
      where: { ...userFilter },
    });

    const areaResult = await dashboardRepository.aggregateProjectArea({
      where: { ...userFilter },
    });
    const totalArea = areaResult._sum.area
      ? parseFloat(areaResult._sum.area.toFixed(2))
      : 0;

    const projectsWithTime = await dashboardRepository.findProjectsWithTime({
      where: {
        ...userFilter,
        startedAt: { not: null },
        endedAt: { not: null },
      },
    });

    let totalTimeSpent = 0;
    projectsWithTime.forEach((project) => {
      const startTime = new Date(project.startedAt);
      const endTime = new Date(project.endedAt);
      const diffInHours = (endTime - startTime) / (1000 * 60 * 60);
      totalTimeSpent += diffInHours;
    });
    totalTimeSpent = parseFloat(totalTimeSpent.toFixed(2));

    const currentMonthStart = dayjs().startOf("month").toDate();
    const currentMonthEnd = dayjs().endOf("month").toDate();

    const currentMonthAreaResult = await dashboardRepository.aggregateProjectArea({
      where: {
        ...userFilter,
        startedAt: { gte: currentMonthStart, lte: currentMonthEnd },
      },
    });
    const currentMonthArea = currentMonthAreaResult._sum.area
      ? parseFloat(currentMonthAreaResult._sum.area.toFixed(2))
      : 0;

    let currentMonthTimeSpent = 0;
    projectsWithTime.forEach((project) => {
      const projectDate = new Date(project.startedAt);
      if (projectDate >= currentMonthStart && projectDate <= currentMonthEnd) {
        const startTime = new Date(project.startedAt);
        const endTime = new Date(project.endedAt);
        const diffInHours = (endTime - startTime) / (1000 * 60 * 60);
        currentMonthTimeSpent += diffInHours;
      }
    });
    currentMonthTimeSpent = parseFloat(currentMonthTimeSpent.toFixed(2));

    const previousMonthStart = dayjs()
      .subtract(1, "month")
      .startOf("month")
      .toDate();
    const previousMonthEnd = dayjs()
      .subtract(1, "month")
      .endOf("month")
      .toDate();

    const previousMonthAreaResult = await dashboardRepository.aggregateProjectArea({
      where: {
        ...userFilter,
        startedAt: { gte: previousMonthStart, lte: previousMonthEnd },
      },
    });
    const previousMonthArea = previousMonthAreaResult._sum.area
      ? parseFloat(previousMonthAreaResult._sum.area.toFixed(2))
      : 0;

    let previousMonthTimeSpent = 0;
    projectsWithTime.forEach((project) => {
      const projectDate = new Date(project.startedAt);
      if (
        projectDate >= previousMonthStart &&
        projectDate <= previousMonthEnd
      ) {
        const startTime = new Date(project.startedAt);
        const endTime = new Date(project.endedAt);
        const diffInHours = (endTime - startTime) / (1000 * 60 * 60);
        previousMonthTimeSpent += diffInHours;
      }
    });
    previousMonthTimeSpent = parseFloat(previousMonthTimeSpent.toFixed(2));
    return {
      completedProjects,
      holdProjects,
      inProgressProject,
      notStartedProject,
      totalArea,
      totalProjects,
      totalTimeSpent,
      currentMonthArea,
      previousMonthArea,
      currentMonthTimeSpent,
      previousMonthTimeSpent,
    };
  } catch (error) {
    console.error("Error fetching designer metrics:", error);
    throw new Error("Unable to fetch designer metrics");
  }
}

// DI seam (unchanged shape) — `legacyDefaults` now points at the REPO-BACKED module
// functions above instead of the removed shared/legacy/dashboard-services barrel. Tests
// still override the whole bag via the constructor.
const legacyDefaults = {
  getKeyMetrics,
  getDashboardLeadStatusData,
  getMonthlyPerformanceData,
  getEmiratesAnalytics,
  getLeadsMonthlyOverview,
  getPerformanceMetrics,
  getLatestNewLeads,
  getDesignerMetrics,
};

export class DashboardUsecase {
  /**
   * @param {import("./dashboard.repo.js").DashboardRepository} repository
   * @param {Partial<typeof legacyDefaults>} [legacy]
   */
  constructor(repository, legacy = {}) {
    this.repo = repository;
    this.legacy = { ...legacyDefaults, ...legacy };
  }

  // Admin-tier predicate — the legacy `isAdmin` union, read from the TOKEN (req.auth).
  #isAdminTier(authUser) {
    return ADMIN_TIER_ROLES.includes(authUser?.role) || Boolean(authUser?.isSuperSales);
  }

  // Resolve the effective staffId scope from the authenticated caller. Admin-tier may
  // scope to any user (client staffId) or global (undefined); everyone else is forced to
  // their own id. NEVER reads a `?role=` param — role comes from req.auth only.
  #effectiveStaffId({ query, authUser }) {
    if (this.#isAdminTier(authUser)) {
      // honor the (already int-coerced) client staffId, else global (undefined)
      return query?.staffId ?? undefined;
    }
    // scoped role → self only. Coerce the auth-derived id to a number so a non-numeric
    // req.auth.id (a future token path / malformed legacy token) becomes NaN here rather
    // than silently surviving to a where that collapses to global (the IDOR re-opening).
    return Number(authUser.id);
  }

  // Build the sanitized searchParams forwarded to a legacy aggregation: ONLY the
  // auth-derived staffId + the date range + the harmless profile flag. A raw client
  // staffId/userId/role never survives this projection.
  #buildSearchParams({ query, authUser }) {
    const staffId = this.#effectiveStaffId({ query, authUser });
    const sp = {};
    if (staffId !== undefined && staffId !== null) sp.staffId = String(staffId);
    if (query?.startDate) sp.startDate = query.startDate;
    if (query?.endDate) sp.endDate = query.endDate;
    if (query?.profile) sp.profile = query.profile;
    return sp;
  }

  // GET /key-metrics — role-scoped revenue/lead/commission aggregate.
  keyMetrics({ query, authUser }) {
    const sp = this.#buildSearchParams({ query, authUser });
    return this.legacy.getKeyMetrics(sp, authUser.role);
  }

  // GET /leads-status — role-scoped lead-status breakdown (legacy also runs an ADMIN-only
  // commission recompute side-effect, gated on the TOKEN role — preserved).
  leadsStatus({ query, authUser }) {
    const sp = this.#buildSearchParams({ query, authUser });
    return this.legacy.getDashboardLeadStatusData(sp, authUser.role);
  }

  // GET /monthly-performance — 12-month lead/revenue trend, scoped to the caller (legacy
  // was NOT role-scoped → over-exposed; now auth-scoped via the effective staffId).
  monthlyPerformance({ query, authUser }) {
    const sp = this.#buildSearchParams({ query, authUser });
    return this.legacy.getMonthlyPerformanceData(sp);
  }

  // GET /emirates-analytics — per-emirate lead analytics, auth-scoped via effective staffId.
  emiratesAnalytics({ query, authUser }) {
    const sp = this.#buildSearchParams({ query, authUser });
    return this.legacy.getEmiratesAnalytics(sp);
  }

  // GET /leads-monthly-overview — inside/outside lead overview, auth-scoped via staffId.
  leadsMonthlyOverview({ query, authUser }) {
    const sp = this.#buildSearchParams({ query, authUser });
    return this.legacy.getLeadsMonthlyOverview(sp);
  }

  // GET /week-performance — weekly new/success/follow-up/meeting metrics, auth-scoped.
  weekPerformance({ query, authUser }) {
    const sp = this.#buildSearchParams({ query, authUser });
    return this.legacy.getPerformanceMetrics(sp);
  }

  // GET /latest-leads — the 5 newest NEW (unassigned) leads. Legacy takes NO args and
  // returns a GLOBAL list to every authed role; preserved 1:1 (this is the shared
  // new-lead pool, not a per-user metric). Flagged for documentation as legacy-preserved.
  latestLeads() {
    return this.legacy.getLatestNewLeads();
  }

  // GET /recent-activities — the caller's recent activity feed. Legacy keyed it off a
  // client `staffId` AND a client `userId` → cross-user read. Here: admin-tier may filter
  // by an actor `staffId` (or global); every other role is bound to their own userId.
  async recentActivities({ query, authUser }) {
    let scope;
    if (this.#isAdminTier(authUser)) {
      scope = query?.staffId ? { staffId: query.staffId } : {};
    } else {
      // self-scope. Coerce to a number so a non-numeric req.auth.id surfaces as an invalid
      // scope the repository will REJECT, instead of collapsing to the global feed.
      scope = { userId: Number(authUser.id) };
    }
    return this.repo.recentActivities({ scope });
  }

  // GET /designer-metrics — per-designer project metrics. Legacy was NOT role-scoped and
  // keyed off a client staffId → a scoped designer could read another designer's metrics.
  // Now auth-scoped: admin-tier may pass a staffId (or global), everyone else is forced to
  // their own id.
  designerMetrics({ query, authUser }) {
    const sp = this.#buildSearchParams({ query, authUser });
    return this.legacy.getDesignerMetrics(sp);
  }
}

export const dashboardUsecase = new DashboardUsecase(dashboardRepository);
