// admin-residual/reports controller — thin. 🔒 The frozen report generators WRITE the
// HTTP response themselves (res.json for the data variants; a streamed excel/pdf for the
// file variants). The controller therefore does NOT call a response helper afterwards —
// it awaits the usecase, which routes the validated body + the real `res` to the frozen
// fn. The envelope/code contract does not apply to these binary/stream responses (they
// are the FROZEN observable output); the language-neutral code lives on the route name.
import { reportsUsecase } from "./reports.usecase.js";

export class ReportsController {
  constructor(usecase) {
    this.usecase = usecase;
  }

  leadReportData = (req, res) => this.usecase.leadReportData({ body: req.body, res });
  leadReportExcel = (req, res) => this.usecase.leadReportExcel({ body: req.body, res });
  leadReportPdf = (req, res) => this.usecase.leadReportPdf({ body: req.body, res });
  staffReportData = (req, res) => this.usecase.staffReportData({ body: req.body, res });
  staffReportExcel = (req, res) => this.usecase.staffReportExcel({ body: req.body, res });
  staffReportPdf = (req, res) => this.usecase.staffReportPdf({ body: req.body, res });
}

export const reportsController = new ReportsController(reportsUsecase);
