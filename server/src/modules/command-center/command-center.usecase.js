// command-center usecase — business logic / orchestration for the ADMIN/SUPER_ADMIN
// operational cockpit. Prisma NEVER appears here (only repo calls). Composes the KPI /
// pipeline / capacity / delivery blocks from the repo aggregations, coerces Prisma Decimals
// to plain numbers, computes the derived business signals (pipeline value, "overloaded"
// flags, overdue days) and hands the result through the dto (safe projection). Authorization
// (the `command_center.view` code) is enforced at the route; the surface is admin-tier only,
// so every aggregation is GLOBAL (no per-user scoping) — and, per spec §5, no accounting
// money (Payment/ContractPayment/Outcome) is ever aggregated.
import {
  commandCenterRepository,
  ACTIVE_DEAL_STATUSES,
} from "./command-center.repo.js";
import { CommandCenterDto } from "./command-center.dto.js";

// A designer/executor is "overloaded" above this active-project count. A named business
// constant (spec §4) — tune here, not inline.
export const DESIGNER_LOAD_THRESHOLD = 6;

const DAY_MS = 24 * 60 * 60 * 1000;

// Prisma Decimal | number | null → finite number (0 fallback). Never throws.
function toNumber(value) {
  if (value == null) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export class CommandCenterUsecase {
  /**
   * @param {typeof import("./command-center.repo.js").commandCenterRepository} repository
   */
  constructor(repository) {
    this.repo = repository;
  }

  // Resolve the effective date range: explicit from/to when supplied, else month-to-`now`.
  // `now` is injected for testability.
  #resolveRange(query = {}, now) {
    const to = query.to instanceof Date ? query.to : now;
    const from =
      query.from instanceof Date
        ? query.from
        : new Date(now.getFullYear(), now.getMonth(), 1);
    return { from, to };
  }

  /**
   * Compose the admin cockpit overview.
   * @param {{ query?: object, authUser?: object, now?: Date }} args
   */
  async getOverview({ query = {}, authUser, now = new Date() } = {}) {
    const range = this.#resolveRange(query, now);

    const [
      pipelineRaw,
      activeDeals,
      finalizedAgg,
      revenueAgg,
      commissionAgg,
      designerLoadRaw,
      salesLoadRaw,
      autoAssignRaw,
      lateItemsRaw,
      lateCount,
    ] = await Promise.all([
      this.repo.pipelineByStatus(range),
      this.repo.activeDealsCount(range),
      this.repo.finalizedValue(range),
      this.repo.revenue(range),
      this.repo.commissions(range),
      this.repo.designerLoad(),
      this.repo.salesLoad(),
      this.repo.autoAssignRotation(),
      this.repo.lateDeliveries(now, 10),
      this.repo.lateDeliveriesCount(now),
    ]);

    // ── pipeline (per-status count + value) ──────────────────────────────────────────────
    const pipeline = (pipelineRaw || []).map((row) => ({
      status: row.status,
      count: row._count?._all ?? 0,
      value: toNumber(row._sum?.averagePrice),
    }));
    // Open-pipeline value = sum of averagePrice across the actively-worked statuses.
    const activeStatuses = new Set(ACTIVE_DEAL_STATUSES);
    const pipelineValue = pipeline
      .filter((p) => activeStatuses.has(p.status))
      .reduce((sum, p) => sum + p.value, 0);

    // ── capacity: designers ──────────────────────────────────────────────────────────────
    const designers = (designerLoadRaw || []).map((d) => ({
      userId: d.userId,
      name: d.name,
      role: d.role,
      activeProjects: d.activeProjects,
      overloaded: d.activeProjects > DESIGNER_LOAD_THRESHOLD,
    }));

    // ── capacity: sales ──────────────────────────────────────────────────────────────────
    const sales = (salesLoadRaw || []).map((s) => ({
      userId: s.userId,
      name: s.name,
      activeLeads: s.activeLeads,
      maxLeads: s.maxLeads,
      overloaded: s.maxLeads != null && s.activeLeads > s.maxLeads,
    }));

    // ── capacity: auto-assign rotation (active users per type) ────────────────────────────
    const byType = new Map();
    for (const row of autoAssignRaw || []) {
      byType.set(row.type, (byType.get(row.type) || 0) + 1);
    }
    const autoAssign = [...byType.entries()].map(([type, activeUsers]) => ({
      type,
      activeUsers,
    }));

    // ── delivery health ──────────────────────────────────────────────────────────────────
    const nowMs = now.getTime();
    const items = (lateItemsRaw || []).map((d) => {
      const dueMs = new Date(d.deliveryAt).getTime();
      const overdueDays = Number.isFinite(dueMs)
        ? Math.max(0, Math.floor((nowMs - dueMs) / DAY_MS))
        : 0;
      return {
        projectId: d.project?.id ?? null,
        title: d.project?.groupTitle ?? null,
        deliveryAt: d.deliveryAt,
        overdueDays,
      };
    });

    return CommandCenterDto.toOverview({
      kpis: {
        activeDeals,
        pipelineValue,
        finalizedValue: toNumber(finalizedAgg?._sum?.averagePrice),
        revenue: toNumber(revenueAgg?._sum?.amount),
        commissions: toNumber(commissionAgg?._sum?.amount),
        lateDeliveries: lateCount,
      },
      pipeline,
      capacity: { designers, sales, autoAssign },
      delivery: { lateCount, items },
    });
  }
}

export const commandCenterUsecase = new CommandCenterUsecase(commandCenterRepository);
