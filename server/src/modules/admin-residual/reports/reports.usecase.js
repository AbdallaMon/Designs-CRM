// admin-residual/reports usecase — 🔒 FROZEN report generation (legacy
// `/admin/reports/*`). The lead-report / staff-report data, excel and pdf (pdfkit)
// generators in `services/main/admin/adminServices.js` are LOGIC-FROZEN: they read
// `req.body` and WRITE the HTTP response themselves (res.json / streamed excel /
// streamed pdf). We do NOT re-implement them — each is invoked via a lazy import
// adapter and handed a minimal `{ body }` shim plus the real `res`, so the observable
// output (including the pdfkit byte stream + fragile font loading) is preserved exactly.
//
// Because the frozen fns own the response, the controller does NOT call a response
// helper after them — it just awaits. The usecase only routes body → frozen fn.
const legacyDefaults = {
  generateLeadReport: (req, res) =>
    import("../../../../services/main/admin/adminServices.js").then((m) => m.generateLeadReport(req, res)),
  generateExcelReport: (req, res) =>
    import("../../../../services/main/admin/adminServices.js").then((m) => m.generateExcelReport(req, res)),
  generatePDFReport: (req, res) =>
    import("../../../../services/main/admin/adminServices.js").then((m) => m.generatePDFReport(req, res)),
  generateStaffReport: (req, res) =>
    import("../../../../services/main/admin/adminServices.js").then((m) => m.generateStaffReport(req, res)),
  generateStaffExcelReport: (req, res) =>
    import("../../../../services/main/admin/adminServices.js").then((m) => m.generateStaffExcelReport(req, res)),
  generateStaffPDFReport: (req, res) =>
    import("../../../../services/main/admin/adminServices.js").then((m) => m.generateStaffPDFReport(req, res)),
};

export class ReportsUsecase {
  constructor(legacy = {}) {
    this.legacy = { ...legacyDefaults, ...legacy };
  }

  // Each method hands the frozen fn a minimal request shim ({ body }) and the real res
  // so it can write its own response (json / excel stream / pdf stream). The frozen fns
  // are responsible for status codes and the body.
  leadReportData({ body, res }) {
    return this.legacy.generateLeadReport({ body }, res);
  }
  leadReportExcel({ body, res }) {
    return this.legacy.generateExcelReport({ body }, res);
  }
  leadReportPdf({ body, res }) {
    return this.legacy.generatePDFReport({ body }, res);
  }
  staffReportData({ body, res }) {
    return this.legacy.generateStaffReport({ body }, res);
  }
  staffReportExcel({ body, res }) {
    return this.legacy.generateStaffExcelReport({ body }, res);
  }
  staffReportPdf({ body, res }) {
    return this.legacy.generateStaffPDFReport({ body }, res);
  }
}

export const reportsUsecase = new ReportsUsecase();
