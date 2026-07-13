// dashboard controller — thin. Reads validated query + the authenticated user, delegates
// to the usecase, responds via the shared envelope helpers. No business rules and no
// scoping logic here — the scope identity is derived from req.auth INSIDE the usecase
// (the controller never forwards a client-supplied target user/role).
import { ok } from "../../shared/http/response.js";
import { dashboardMessagesCodes, messagesNames } from "@dms/shared";
import { dashboardUsecase } from "./dashboard.usecase.js";

const TK = messagesNames.dashboardMessages;

class DashboardController {
  async getKeyMetrics(req, res) {
    const data = await dashboardUsecase.getKeyMetrics({ query: req.query, authUser: req.auth });
    return ok(res, data, dashboardMessagesCodes.KEY_METRICS_FETCHED, TK);
  }

  async getLeadsStatus(req, res) {
    const data = await dashboardUsecase.getLeadsStatus({ query: req.query, authUser: req.auth });
    return ok(res, data, dashboardMessagesCodes.LEAD_STATUS_FETCHED, TK);
  }

  async getMonthlyPerformance(req, res) {
    const data = await dashboardUsecase.getMonthlyPerformance({ query: req.query, authUser: req.auth });
    return ok(res, data, dashboardMessagesCodes.MONTHLY_PERFORMANCE_FETCHED, TK);
  }

  async getEmiratesAnalytics(req, res) {
    const data = await dashboardUsecase.getEmiratesAnalytics({ query: req.query, authUser: req.auth });
    return ok(res, data, dashboardMessagesCodes.EMIRATES_ANALYTICS_FETCHED, TK);
  }

  async getLeadsMonthlyOverview(req, res) {
    const data = await dashboardUsecase.getLeadsMonthlyOverview({ query: req.query, authUser: req.auth });
    return ok(res, data, dashboardMessagesCodes.LEADS_MONTHLY_OVERVIEW_FETCHED, TK);
  }

  async getWeekPerformance(req, res) {
    const data = await dashboardUsecase.getWeekPerformance({ query: req.query, authUser: req.auth });
    return ok(res, data, dashboardMessagesCodes.WEEK_PERFORMANCE_FETCHED, TK);
  }

  async getLatestLeads(req, res) {
    const data = await dashboardUsecase.getLatestLeads();
    return ok(res, data, dashboardMessagesCodes.LATEST_LEADS_FETCHED, TK);
  }

  async getRecentActivities(req, res) {
    const data = await dashboardUsecase.getRecentActivities({ query: req.query, authUser: req.auth });
    return ok(res, data, dashboardMessagesCodes.RECENT_ACTIVITIES_FETCHED, TK);
  }

  async getDesignerMetrics(req, res) {
    const data = await dashboardUsecase.getDesignerMetrics({ query: req.query, authUser: req.auth });
    return ok(res, data, dashboardMessagesCodes.DESIGNER_METRICS_FETCHED, TK);
  }
}

export const dashboardController = new DashboardController();
export { DashboardController };
