// admin-residual/reports controller — thin.
//
// The FROZEN excel/pdf generators WRITE the HTTP response themselves (a streamed xlsx/pdf),
// so those handlers do NOT call a response helper afterwards — they await the usecase, which
// routes the validated body + the real `res` to the frozen fn.
//
// The non-streaming data endpoints use the canonical JSON envelope. The frozen
// Excel/PDF generators still own their binary responses.
import { reportsUsecase } from "./reports.usecase.js";
import { ok } from "../../../shared/http/response.js";
import {
  adminResidualMessagesCodes,
  messagesNames,
} from "@dms/shared";

const TK = messagesNames.adminResidualMessages;

class ReportsController {
  async getLeadReportData(req, res) {
    const data = await reportsUsecase.getLeadReportData({ body: req.body });
    return ok(
      res,
      data,
      adminResidualMessagesCodes.LEAD_REPORT_GENERATED,
      TK,
    );
  }

  async getStaffReportData(req, res) {
    const data = await reportsUsecase.getStaffReportData({ body: req.body });
    return ok(
      res,
      data,
      adminResidualMessagesCodes.STAFF_REPORT_GENERATED,
      TK,
    );
  }

  leadReportExcel(req, res) { return reportsUsecase.leadReportExcel({ body: req.body, res }); }
  leadReportPdf(req, res) { return reportsUsecase.leadReportPdf({ body: req.body, res }); }
  staffReportExcel(req, res) { return reportsUsecase.staffReportExcel({ body: req.body, res }); }
  staffReportPdf(req, res) { return reportsUsecase.staffReportPdf({ body: req.body, res }); }
}

export const reportsController = new ReportsController();
export { ReportsController };
