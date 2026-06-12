"use client";

// Dashboard — the real admin/sales multi-widget dashboard, wired to the migrated
// /v2/dashboard/* backend. Permission-gated on dashboard.view (the BE additionally
// self-scopes EACH of the 9 aggregations by token: admin-tier → global / optional staffId,
// every other role → own id). Each widget owns its fetch (web/ useRequest → the dashboard
// service, the SOLE caller pointed at /v2/dashboard) and renders an MUI card / recharts
// chart with Arabic labels + loading/empty states. Layout mirrors the legacy Dashboard.jsx:
// key-metrics row → monthly overview → status + activity → performance + new leads →
// monthly income → emirates analytics. Single-language Arabic / RTL.

import { Box, Container, Grid, Typography } from "@mui/material";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import {
  EmiratesAnalytics,
  IncomeOverTimeChart,
  KeyMetricsCard,
  LeadStatusChart,
  LeadsMonthlyOverviewSingle,
  NewLeadsList,
  PerformanceMetrics,
  RecenteActivity,
} from "../components/index.js";

const P = PERMISSIONS.DASHBOARD;

export function DashboardPage() {
  const { hasPermission } = usePermission();
  const canView = hasPermission(P.VIEW);

  if (!canView) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <Typography color="text.secondary">لا تملك صلاحية الوصول إلى لوحة التحكم</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1800, mx: "auto" }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: "bold", color: "text.primary" }}>
        لوحة التحكم
      </Typography>

      <Grid container spacing={4}>
        {/* Key metrics — full width */}
        <Grid size={12}>
          <KeyMetricsCard enabled={canView} />
        </Grid>

        {/* Leads monthly overview — full width (own month picker + sub-tables/charts) */}
        <Grid size={12}>
          <LeadsMonthlyOverviewSingle enabled={canView} />
        </Grid>

        {/* Lead-status distribution + recent activity */}
        <Grid size={{ xs: 12, md: 6 }}>
          <LeadStatusChart enabled={canView} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <RecenteActivity enabled={canView} />
        </Grid>

        {/* Weekly performance + newest leads */}
        <Grid size={{ xs: 12, md: 6 }}>
          <PerformanceMetrics enabled={canView} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <NewLeadsList enabled={canView} />
        </Grid>

        {/* Monthly income/performance trend — full width */}
        <Grid size={12}>
          <IncomeOverTimeChart enabled={canView} />
        </Grid>

        {/* Emirates analytics — full width */}
        <Grid size={12}>
          <EmiratesAnalytics enabled={canView} />
        </Grid>
      </Grid>
    </Box>
  );
}

export default DashboardPage;
