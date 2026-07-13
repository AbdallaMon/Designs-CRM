// dashboard controller — thin. Reads validated query + the authenticated user, delegates
// to the usecase, responds via the shared envelope helpers. No business rules and no
// scoping logic here — the scope identity is derived from req.auth INSIDE the usecase
// (the controller never forwards a client-supplied target user/role).
import { ok } from "../../shared/http/response.js";
import { dashboardMessagesCodes, messagesNames } from "@dms/shared";
import { dashboardUsecase } from "./dashboard.usecase.js";

const TK = messagesNames.dashboardMessages;

class DashboardController {
  async keyMetrics(req, res) {
    const data = await dashboardUsecase.keyMetrics({ query: req.query, authUser: req.auth });
    return ok(res, data, dashboardMessagesCodes.KEY_METRICS_FETCHED, TK);
  }

  async leadsStatus(req, res) {
    const data = await dashboardUsecase.leadsStatus({ query: req.query, authUser: req.auth });
    return ok(res, data, dashboardMessagesCodes.LEAD_STATUS_FETCHED, TK);
  }

  async monthlyPerformance(req, res) {
    const data = await dashboardUsecase.monthlyPerformance({ query: req.query, authUser: req.auth });
    return ok(res, data, dashboardMessagesCodes.MONTHLY_PERFORMANCE_FETCHED, TK);
  }

  async emiratesAnalytics(req, res) {
    const data = await dashboardUsecase.emiratesAnalytics({ query: req.query, authUser: req.auth });
    return ok(res, data, dashboardMessagesCodes.EMIRATES_ANALYTICS_FETCHED, TK);
  }

  async leadsMonthlyOverview(req, res) {
    const data = await dashboardUsecase.leadsMonthlyOverview({ query: req.query, authUser: req.auth });
    return ok(res, data, dashboardMessagesCodes.LEADS_MONTHLY_OVERVIEW_FETCHED, TK);
  }

  async weekPerformance(req, res) {
    const data = await dashboardUsecase.weekPerformance({ query: req.query, authUser: req.auth });
    return ok(res, data, dashboardMessagesCodes.WEEK_PERFORMANCE_FETCHED, TK);
  }

  async latestLeads(req, res) {
    const data = await dashboardUsecase.latestLeads();
    return ok(res, data, dashboardMessagesCodes.LATEST_LEADS_FETCHED, TK);
  }

  async recentActivities(req, res) {
    const data = await dashboardUsecase.recentActivities({ query: req.query, authUser: req.auth });
    return ok(res, data, dashboardMessagesCodes.RECENT_ACTIVITIES_FETCHED, TK);
  }

  async designerMetrics(req, res) {
    const data = await dashboardUsecase.designerMetrics({ query: req.query, authUser: req.auth });
    return ok(res, data, dashboardMessagesCodes.DESIGNER_METRICS_FETCHED, TK);
  }
}

export const dashboardController = new DashboardController();
export { DashboardController };
