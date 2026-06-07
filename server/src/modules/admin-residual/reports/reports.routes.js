// admin-residual/reports routes — 🔒 FROZEN lead/staff report generation (legacy
// `/admin/reports/*`, ADMIN gate). Mounted under `/v2/admin/reports` (paths 1:1 with
// legacy). Auth is mounted once at the parent admin-residual aggregate router; every
// route declares ADMIN_RESIDUAL.REPORT_GENERATE (granted to ADMIN/SUPER_ADMIN base +
// isSuperSales — the legacy `isAdmin` union). The frozen generators own the response body.
//
// Endpoint map (legacy → v2, paths 1:1):
//   POST /reports/lead-report        → POST /v2/admin/reports/lead-report
//   POST /reports/lead-report/excel  → POST /v2/admin/reports/lead-report/excel
//   POST /reports/lead-report/pdf    → POST /v2/admin/reports/lead-report/pdf
//   POST /reports/staff-report       → POST /v2/admin/reports/staff-report
//   POST /reports/staff-report/excel → POST /v2/admin/reports/staff-report/excel
//   POST /reports/staff-report/pdf   → POST /v2/admin/reports/staff-report/pdf
import { Router } from "express";
import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { PERMISSIONS } from "@dms/shared";
import { reportsController } from "./reports.controller.js";
import { ReportsValidation as V } from "./reports.validation.js";

const P = PERMISSIONS.ADMIN_RESIDUAL;
const router = Router();

// ── lead reports (literal /excel + /pdf before the bare /lead-report is fine — all POST) ──
router.post(
  "/lead-report/excel",
  AuthMiddleware.requirePermissions([P.REPORT_GENERATE]),
  validate(V.leadReportBody),
  asyncHandler(reportsController.leadReportExcel),
);
router.post(
  "/lead-report/pdf",
  AuthMiddleware.requirePermissions([P.REPORT_GENERATE]),
  validate(V.leadReportBody),
  asyncHandler(reportsController.leadReportPdf),
);
router.post(
  "/lead-report",
  AuthMiddleware.requirePermissions([P.REPORT_GENERATE]),
  validate(V.leadReportBody),
  asyncHandler(reportsController.leadReportData),
);

// ── staff reports ────────────────────────────────────────────────────────────────────
router.post(
  "/staff-report/excel",
  AuthMiddleware.requirePermissions([P.REPORT_GENERATE]),
  validate(V.staffReportBody),
  asyncHandler(reportsController.staffReportExcel),
);
router.post(
  "/staff-report/pdf",
  AuthMiddleware.requirePermissions([P.REPORT_GENERATE]),
  validate(V.staffReportBody),
  asyncHandler(reportsController.staffReportPdf),
);
router.post(
  "/staff-report",
  AuthMiddleware.requirePermissions([P.REPORT_GENERATE]),
  validate(V.staffReportBody),
  asyncHandler(reportsController.staffReportData),
);

export { router as reportsRouter };
