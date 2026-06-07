// dashboard controller — thin. Reads validated query + the authenticated user, delegates
// to the usecase, responds via the shared envelope helpers. No business rules and no
// scoping logic here — the scope identity is derived from req.auth INSIDE the usecase
// (the controller never forwards a client-supplied target user/role).
import { ok } from "../../shared/http/response.js";
import { dashboardMessagesCodes, messagesNames } from "@dms/shared";
import { dashboardUsecase } from "./dashboard.usecase.js";

const C = dashboardMessagesCodes;
const TK = messagesNames.dashboardMessages;

export class DashboardController {
  constructor(usecase) {
    this.usecase = usecase;
  }

  keyMetrics = async (req, res) => {
    const data = await this.usecase.keyMetrics({ query: req.query, authUser: req.auth });
    return ok(res, data, C.KEY_METRICS_FETCHED, TK);
  };

  leadsStatus = async (req, res) => {
    const data = await this.usecase.leadsStatus({ query: req.query, authUser: req.auth });
    return ok(res, data, C.LEAD_STATUS_FETCHED, TK);
  };

  monthlyPerformance = async (req, res) => {
    const data = await this.usecase.monthlyPerformance({ query: req.query, authUser: req.auth });
    return ok(res, data, C.MONTHLY_PERFORMANCE_FETCHED, TK);
  };

  emiratesAnalytics = async (req, res) => {
    const data = await this.usecase.emiratesAnalytics({ query: req.query, authUser: req.auth });
    return ok(res, data, C.EMIRATES_ANALYTICS_FETCHED, TK);
  };

  leadsMonthlyOverview = async (req, res) => {
    const data = await this.usecase.leadsMonthlyOverview({ query: req.query, authUser: req.auth });
    return ok(res, data, C.LEADS_MONTHLY_OVERVIEW_FETCHED, TK);
  };

  weekPerformance = async (req, res) => {
    const data = await this.usecase.weekPerformance({ query: req.query, authUser: req.auth });
    return ok(res, data, C.WEEK_PERFORMANCE_FETCHED, TK);
  };

  latestLeads = async (req, res) => {
    const data = await this.usecase.latestLeads();
    return ok(res, data, C.LATEST_LEADS_FETCHED, TK);
  };

  recentActivities = async (req, res) => {
    const data = await this.usecase.recentActivities({ query: req.query, authUser: req.auth });
    return ok(res, data, C.RECENT_ACTIVITIES_FETCHED, TK);
  };

  designerMetrics = async (req, res) => {
    const data = await this.usecase.designerMetrics({ query: req.query, authUser: req.auth });
    return ok(res, data, C.DESIGNER_METRICS_FETCHED, TK);
  };
}

export const dashboardController = new DashboardController(dashboardUsecase);
