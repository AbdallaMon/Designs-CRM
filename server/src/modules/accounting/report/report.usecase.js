// accounting/report usecase — outcome list + income/outcome summary (legacy
// `/accountant/outcome` and `/accountant/summary`). Orchestration only (no Prisma);
// behavior ported 1:1 from the accountant service (getOutcomes / getIncomeOutcomeSummary).
// The legacy outcome route parsed `filters` (a JSON string) for an optional date range;
// same behavior, but a malformed/absent `filters` now safely defaults to {} (no 500).
const legacyDefaults = {
  getOutcomes: (a) =>
    import("../../../../services/main/accountant/accountantServices.js").then((m) => m.getOutcomes(a)),
  getIncomeOutcomeSummary: () =>
    import("../../../../services/main/accountant/accountantServices.js").then((m) =>
      m.getIncomeOutcomeSummary(),
    ),
};

export class ReportUsecase {
  constructor(legacy = {}) {
    this.legacy = { ...legacyDefaults, ...legacy };
  }

  outcomes({ query, skip, limit }) {
    const { filters } = query;
    const parsedFilters = (() => {
      try {
        return filters ? JSON.parse(filters) : {};
      } catch {
        return {};
      }
    })();
    return this.legacy.getOutcomes({
      limit: Number(limit),
      skip: Number(skip),
      filters: parsedFilters,
    });
  }

  summary() {
    return this.legacy.getIncomeOutcomeSummary();
  }
}

export const reportUsecase = new ReportUsecase();
