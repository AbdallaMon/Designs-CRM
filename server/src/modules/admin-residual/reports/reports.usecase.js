// admin-residual/reports usecase — legacy `/admin/reports/*`.
//
// TWO kinds of endpoints:
//  - 🔒 FROZEN excel/pdf generators (report-excel.legacy.js / report-pdf.legacy.js): they
//    read `req.body` and WRITE the HTTP response themselves (streamed xlsx/pdf). We do NOT
//    re-implement them — each is invoked via a lazy import adapter and handed a minimal
//    `{ body }` shim plus the real `res`, so the observable output is preserved exactly.
//  - NON-frozen DATA endpoints (lead-report / staff-report data): the Prisma read lives in
//    reports.repo.js and the row/summary shaping in reports.dto.js. The usecase builds the
//    `where` from the request filters (verbatim), reads, shapes, and RETURNS the payload;
//    the controller owns `res.json` + the 500 error envelope (preserving legacy behavior).
import { reportsRepository } from "./reports.repo.js";
import {
  processLeads,
  calculateSummary,
  calculateStaffStats,
} from "./reports.dto.js";

const legacyDefaults = {
  generateExcelReport: (req, res) =>
    import("./report-excel.legacy.js").then((m) => m.generateExcelReport(req, res)),
  generatePDFReport: (req, res) =>
    import("./report-pdf.legacy.js").then((m) => m.generatePDFReport(req, res)),
  generateStaffExcelReport: (req, res) =>
    import("./report-excel.legacy.js").then((m) => m.generateStaffExcelReport(req, res)),
  generateStaffPDFReport: (req, res) =>
    import("./report-pdf.legacy.js").then((m) => m.generateStaffPDFReport(req, res)),
};

export class ReportsUsecase {
  constructor(repository = reportsRepository, legacy = {}) {
    this.repo = repository;
    this.legacy = { ...legacyDefaults, ...legacy };
  }

  // ── NON-frozen DATA endpoints (read + shape; controller owns res) ────────────────
  // Ported VERBATIM from the legacy generateLeadReport (minus the res.json / try-catch,
  // which the controller now owns).
  async leadReportData({ body }) {
    const filters = body;

    const where = {
      AND: [
        filters.startDate && filters.endDate
          ? {
              createdAt: {
                gte: new Date(filters.startDate),
                lte: new Date(filters.endDate),
              },
            }
          : {},
        filters.emirates?.length > 0
          ? {
              emirate: { in: filters.emirates },
            }
          : {},
        filters.statuses?.length > 0
          ? {
              status: { in: filters.statuses },
            }
          : {},
        filters.userIds?.length > 0
          ? {
              userId: { in: filters.userIds },
            }
          : {},
        filters.clientIds?.length > 0
          ? {
              clientId: { in: filters.clientIds },
            }
          : {},
        filters.reportType === "finalized"
          ? {
              status: "FINALIZED",
            }
          : {},
      ].filter((condition) => Object.keys(condition).length > 0),
    };

    const leads = await this.repo.findLeadsForReport({ where });

    const processedLeads = processLeads(leads);
    const summary = calculateSummary(leads);

    return { leads: processedLeads, summary };
  }

  // Ported VERBATIM from the legacy generateStaffReport (minus the res.json / try-catch).
  async staffReportData({ body }) {
    const filters = body;
    const where = {
      AND: [
        filters.startDate && filters.endDate
          ? {
              createdAt: {
                gte: new Date(filters.startDate),
                lte: new Date(filters.endDate),
              },
            }
          : {},
        filters.emirates?.length > 0
          ? {
              emirate: { in: filters.emirates },
            }
          : {},
      ],
    };

    // First, get all staff users
    const staffUsers = await this.repo.findStaffWithLeadsForReport({ where });

    const staffStats = calculateStaffStats(staffUsers, filters);

    const summary = {
      totalStaff: staffStats.length,
      activeStaff: staffStats.filter((staff) => staff.totalLeads > 0).length,
      totalLeads: staffStats.reduce((sum, staff) => sum + staff.totalLeads, 0),
      averageLeadsPerStaff:
        staffStats.reduce((sum, staff) => sum + staff.totalLeads, 0) /
        (staffStats.length || 1),
      totalRevenue: staffStats.reduce(
        (sum, staff) => sum + staff.totalRevenue,
        0,
      ),
      averageSuccessRate:
        staffStats.reduce((sum, staff) => sum + staff.successRate, 0) /
        (staffStats.length || 1),
      conversionRate:
        (staffStats.reduce(
          (sumConverted, staff) => sumConverted + (staff.converted || 0),
          0,
        ) /
          (staffStats.reduce(
            (sumLeads, staff) => sumLeads + (staff.totalLeads || 0),
            0,
          ) || 1)) *
        100,
      bestPerformer: staffStats.reduce(
        (best, current) =>
          current.successRate > (best?.successRate || 0) ? current : best,
        null,
      ),
      topRevenue: staffStats.reduce(
        (best, current) =>
          current.totalRevenue > (best?.totalRevenue || 0) ? current : best,
        null,
      ),
      totalCommission: staffStats.reduce(
        (sum, staff) => sum + staff.totalCommission,
        0,
      ),
    };

    return {
      staffStats,
      summary,
      dateRange:
        filters.startDate && filters.endDate
          ? {
              start: filters.startDate,
              end: filters.endDate,
            }
          : null,
    };
  }

  // ── 🔒 FROZEN excel/pdf (the frozen fn writes its own response) ──────────────────
  leadReportExcel({ body, res }) {
    return this.legacy.generateExcelReport({ body }, res);
  }
  leadReportPdf({ body, res }) {
    return this.legacy.generatePDFReport({ body }, res);
  }
  staffReportExcel({ body, res }) {
    return this.legacy.generateStaffExcelReport({ body }, res);
  }
  staffReportPdf({ body, res }) {
    return this.legacy.generateStaffPDFReport({ body }, res);
  }
}

export const reportsUsecase = new ReportsUsecase();
