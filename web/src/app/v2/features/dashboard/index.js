// Dashboard feature barrel.
export { DashboardPage, default as DashboardPageDefault } from "./pages/DashboardPage.jsx";
export { dashboardService } from "./dashboard.service.js";
export { runDashboardMutation } from "./dashboard.mutations.js";
export { resolveDashboardMessage, dashboardMessages } from "./config/dashboardMessages.js";

// Individual dashboard widgets (each fetches its own /v2/dashboard/* endpoint).
export {
  WidgetCard,
  KeyMetricsCard,
  LeadStatusChart,
  IncomeOverTimeChart,
  EmiratesAnalytics,
  LeadsMonthlyOverviewSingle,
  PerformanceMetrics,
  NewLeadsList,
  RecenteActivity,
} from "./components/index.js";
