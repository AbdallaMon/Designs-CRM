// dashboard routes — the read-only analytics surface (legacy `/shared/dashboard/*`,
// behind the SHARED gate = all 9 authed roles). Mounted under `/v2/dashboard`.
// Authentication is mounted ONCE here; every route declares the single DASHBOARD.VIEW
// permission code (granted to every authed role via SHARED_AUTHED). There is NO
// per-endpoint role split in legacy — the per-request data SCOPE is what differs and is
// enforced in the usecase (admin-tier may scope to any user / global; every other role is
// FORCED to req.auth.id — the IDOR-class fix). The role used for branching comes from
// req.auth (the token), never from a `?role=` query param.
//
// Endpoint map (legacy → v2), all GET:
//   /shared/dashboard/key-metrics            → /v2/dashboard/key-metrics
//   /shared/dashboard/leads-status           → /v2/dashboard/leads-status
//   /shared/dashboard/monthly-performance    → /v2/dashboard/monthly-performance
//   /shared/dashboard/emirates-analytics     → /v2/dashboard/emirates-analytics
//   /shared/dashboard/leads-monthly-overview → /v2/dashboard/leads-monthly-overview
//   /shared/dashboard/week-performance       → /v2/dashboard/week-performance
//   /shared/dashboard/latest-leads           → /v2/dashboard/latest-leads
//   /shared/dashboard/recent-activities      → /v2/dashboard/recent-activities
//   /shared/dashboard/designer-metrics       → /v2/dashboard/designer-metrics
//
// NOTE: legacy `routes/staff/staff.js` `GET /staff/dashboard/latest-calls` is NOT migrated
// here — it is STAFF-gated call-reminder data (getCallReminders), not a dashboard
// aggregation; it belongs to the leads/staff-residual module and stays on legacy.
import { Router } from "express";
import { AuthMiddleware } from "../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { PERMISSIONS } from "@dms/shared";
import { dashboardController } from "./dashboard.controller.js";
import { DashboardValidation } from "./dashboard.validation.js";

const P = PERMISSIONS.DASHBOARD;
const router = Router();

// Authentication mounted once for the whole dashboard surface.
router.use(AuthMiddleware.requireAuth);

router.get(
  "/key-metrics",
  AuthMiddleware.requirePermissions([P.VIEW]),
  validate(DashboardValidation.metricsQuery, "query"),
  asyncHandler(dashboardController.keyMetrics),
);
router.get(
  "/leads-status",
  AuthMiddleware.requirePermissions([P.VIEW]),
  validate(DashboardValidation.metricsQuery, "query"),
  asyncHandler(dashboardController.leadsStatus),
);
router.get(
  "/monthly-performance",
  AuthMiddleware.requirePermissions([P.VIEW]),
  validate(DashboardValidation.metricsQuery, "query"),
  asyncHandler(dashboardController.monthlyPerformance),
);
router.get(
  "/emirates-analytics",
  AuthMiddleware.requirePermissions([P.VIEW]),
  validate(DashboardValidation.metricsQuery, "query"),
  asyncHandler(dashboardController.emiratesAnalytics),
);
router.get(
  "/leads-monthly-overview",
  AuthMiddleware.requirePermissions([P.VIEW]),
  validate(DashboardValidation.metricsQuery, "query"),
  asyncHandler(dashboardController.leadsMonthlyOverview),
);
router.get(
  "/week-performance",
  AuthMiddleware.requirePermissions([P.VIEW]),
  validate(DashboardValidation.metricsQuery, "query"),
  asyncHandler(dashboardController.weekPerformance),
);
router.get(
  "/latest-leads",
  AuthMiddleware.requirePermissions([P.VIEW]),
  validate(DashboardValidation.emptyQuery, "query"),
  asyncHandler(dashboardController.latestLeads),
);
router.get(
  "/recent-activities",
  AuthMiddleware.requirePermissions([P.VIEW]),
  validate(DashboardValidation.metricsQuery, "query"),
  asyncHandler(dashboardController.recentActivities),
);
router.get(
  "/designer-metrics",
  AuthMiddleware.requirePermissions([P.VIEW]),
  validate(DashboardValidation.metricsQuery, "query"),
  asyncHandler(dashboardController.designerMetrics),
);

export { router as dashboardRouter };
