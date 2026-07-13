// accounting/report usecase — outcome list + income/outcome summary (legacy
// `/accountant/outcome` and `/accountant/summary`). Orchestration only (no Prisma); the
// Prisma reads/aggregates are delegated to report.repo.js and the summary payload is shaped
// by report.dto.js. The legacy outcome route parsed `filters` (a JSON string) for an
// optional date range; same behavior, but a malformed/absent `filters` now safely defaults
// to {} (no 500).
//
// The `legacy` constructor param remains a dependency-injection seam; its defaults now point
// at the relocated repo/dto code instead of the deleted accountant service.
import { reportRepository } from "./report.repo.js";
import { shapeIncomeOutcomeSummary } from "./report.dto.js";

class ReportUsecase {
  listOutcomes({ query, skip, limit }) {
    const { filters } = query;
    const parsedFilters = (() => {
      try {
        return filters ? JSON.parse(filters) : {};
      } catch {
        return {};
      }
    })();
    return reportRepository.getOutcomes({
      limit: Number(limit),
      skip: Number(skip),
      filters: parsedFilters,
    });
  }

  async getSummary() {
    return shapeIncomeOutcomeSummary(await reportRepository.getIncomeOutcomeSummary());
  }
}

export const reportUsecase = new ReportUsecase();
export { ReportUsecase };
