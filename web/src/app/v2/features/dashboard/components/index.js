// Dashboard widgets barrel. Each widget fetches its own /v2/dashboard/* endpoint via the
// web/ useRequest hook and renders an MUI card / recharts chart with Arabic labels and
// loading + empty states. The container (pages/DashboardPage.jsx) lays them out.
export { WidgetCard } from "./WidgetCard.jsx";
export { KeyMetricsCard } from "./KeyMetricsCard.jsx";
export { LeadStatusChart } from "./LeadStatusChart.jsx";
export { IncomeOverTimeChart } from "./IncomeOverTimeChart.jsx";
export { EmiratesAnalytics } from "./EmiratesAnalytics.jsx";
export { LeadsMonthlyOverviewSingle } from "./LeadsMonthlyOverviewSingle.jsx";
export { PerformanceMetrics } from "./PerformanceMetrics.jsx";
export { NewLeadsList } from "./NewLeadsList.jsx";
export { RecenteActivity } from "./RecenteActivity.jsx";
