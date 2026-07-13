// admin-residual/reports controller — thin.
//
// The FROZEN excel/pdf generators WRITE the HTTP response themselves (a streamed xlsx/pdf),
// so those handlers do NOT call a response helper afterwards — they await the usecase, which
// routes the validated body + the real `res` to the frozen fn.
//
// The NON-frozen DATA endpoints (lead-report / staff-report data) now RETURN their payload
// from the usecase; the controller owns `res.json` and the legacy 500 error envelope
// (preserved byte-for-byte from the former generateLeadReport / generateStaffReport
// try/catch — the FE consumes this raw `{ leads, summary }` / `{ staffStats, ... }` shape).
import { reportsUsecase } from "./reports.usecase.js";

class ReportsController {
  async getLeadReportData(req, res) {
    try {
      const data = await reportsUsecase.getLeadReportData({ body: req.body });
      return res.json(data);
    } catch (error) {
      console.error("Error generating report:", error);
      return res.status(500).json({ error: "Failed to generate report" });
    }
  }

  async getStaffReportData(req, res) {
    try {
      const data = await reportsUsecase.getStaffReportData({ body: req.body });
      return res.json(data);
    } catch (error) {
      console.error("Error generating staff report:", error);
      return res.status(500).json({ error: "Failed to generate staff report" });
    }
  }

  leadReportExcel(req, res) { return reportsUsecase.leadReportExcel({ body: req.body, res }); }
  leadReportPdf(req, res) { return reportsUsecase.leadReportPdf({ body: req.body, res }); }
  staffReportExcel(req, res) { return reportsUsecase.staffReportExcel({ body: req.body, res }); }
  staffReportPdf(req, res) { return reportsUsecase.staffReportPdf({ body: req.body, res }); }
}

export const reportsController = new ReportsController();
export { ReportsController };
