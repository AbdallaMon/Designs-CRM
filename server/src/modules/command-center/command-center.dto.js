// command-center DTO — output shaping / SAFE PROJECTION only (pure, no Prisma). The usecase
// does the business computation (KPI math, overloaded flags, overdueDays) and hands the
// fully-computed pieces here; the dto enforces the final language-neutral shape and, for the
// capacity lists, whitelists exactly the safe fields — id + name + role + counts + flags.
// NO PII / free-text (no emails, phones, descriptions, project/lead notes) ever leaves here.
export class CommandCenterDto {
  static toOverview({ kpis, pipeline, capacity, delivery }) {
    return {
      kpis: {
        activeDeals: kpis.activeDeals,
        pipelineValue: kpis.pipelineValue,
        finalizedValue: kpis.finalizedValue,
        revenue: kpis.revenue,
        commissions: kpis.commissions,
        lateDeliveries: kpis.lateDeliveries,
      },
      pipeline: pipeline.map((p) => ({
        status: p.status,
        count: p.count,
        value: p.value,
      })),
      capacity: {
        designers: capacity.designers.map((d) => ({
          userId: d.userId,
          name: d.name,
          role: d.role,
          activeProjects: d.activeProjects,
          overloaded: d.overloaded,
        })),
        sales: capacity.sales.map((s) => ({
          userId: s.userId,
          name: s.name,
          activeLeads: s.activeLeads,
          maxLeads: s.maxLeads,
          overloaded: s.overloaded,
        })),
        autoAssign: capacity.autoAssign.map((a) => ({
          type: a.type,
          activeUsers: a.activeUsers,
        })),
      },
      delivery: {
        lateCount: delivery.lateCount,
        items: delivery.items.map((i) => ({
          projectId: i.projectId,
          title: i.title,
          deliveryAt: i.deliveryAt,
          overdueDays: i.overdueDays,
        })),
      },
    };
  }
}
