// Dashboard feature barrel.
export { DashboardPage, default as DashboardPageDefault } from "./pages/DashboardPage.jsx";
export { dashboardService } from "./dashboard.service.js";
export { runDashboardMutation } from "./dashboard.mutations.js";
export { resolveDashboardMessage, dashboardMessages } from "./config/dashboardMessages.js";
export { useDashboardScope, isAdminTier } from "./hooks/useDashboardScope.js";
