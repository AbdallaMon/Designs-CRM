"use client";

// <DashboardCharts> — the SECONDARY analytics tier (UX plan §3.1: charts BELOW the action queue
// + KPIs). x-charts widgets via the shared ChartCard wrapper. The two NAMED charts lead:
// monthly-performance + leads-monthly-overview; week-performance trails (kept so every read stays
// represented). Emirates analytics now lives in row 3 beside the leads-status breakdown — see
// <EmiratesAnalytics>. Each chart owns its own read + WidgetBoundary so a single failed
// aggregation doesn't blank the tier. Self-scoped by the token; admin-tier re-scopes via the
// filter staffId. Single-language Arabic / RTL.
//
// The data layer is FIXED — these components only PROJECT the envelope fields into x-charts
// series; the BE math is untouched.

import { Grid, Box, Typography } from "@mui/material";
import { ChartCard, SectionCard } from "@/app/v2/shared/components";
import { WidgetBoundary } from "./WidgetBoundary.jsx";
import { useDashboardWidget } from "../hooks/useDashboardWidget.js";
import {
  MONTHLY_PERFORMANCE_URL,
  WEEK_PERFORMANCE_URL,
  LEADS_MONTHLY_OVERVIEW_URL,
} from "../config/constant.js";
import { DASHBOARD_SECTIONS } from "../config/dashboardConstants.js";

export function DashboardCharts({ query, enabled }) {
  return (
    <Box>
      <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>
        {DASHBOARD_SECTIONS.charts}
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <MonthlyPerformanceChart query={query} enabled={enabled} />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <LeadsOverviewChart query={query} enabled={enabled} />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <WeekPerformanceChart query={query} enabled={enabled} />
        </Grid>
      </Grid>
    </Box>
  );
}

function MonthlyPerformanceChart({ query, enabled }) {
  const { data, isLoading, error, refetch } = useDashboardWidget({
    base: MONTHLY_PERFORMANCE_URL,
    query,
    enabled,
  });
  const rows = Array.isArray(data) ? data : [];
  const isEmpty = rows.length === 0;

  if (isLoading) return <ChartCard title={DASHBOARD_SECTIONS.monthlyPerformance} loading height={260} />;
  if (error || isEmpty) {
    return (
      <BoundaryCard title={DASHBOARD_SECTIONS.monthlyPerformance} error={error} onRetry={refetch} isEmpty={isEmpty} />
    );
  }

  return (
    <ChartCard
      title={DASHBOARD_SECTIONS.monthlyPerformance}
      type="line"
      height={260}
      xAxis={[{ scaleType: "point", data: rows.map((r) => r.month) }]}
      series={[
        { label: "العملاء", data: rows.map((r) => r.leads ?? 0) },
        { label: "المنتهية", data: rows.map((r) => r.finalized ?? 0) },
      ]}
    />
  );
}

function WeekPerformanceChart({ query, enabled }) {
  const { data, isLoading, error, refetch } = useDashboardWidget({
    base: WEEK_PERFORMANCE_URL,
    query,
    enabled,
  });
  const weekly = data?.weekly;
  const isEmpty = !weekly;

  if (isLoading) return <ChartCard title={DASHBOARD_SECTIONS.weekPerformance} loading height={260} />;
  if (error || isEmpty) {
    return (
      <BoundaryCard title={DASHBOARD_SECTIONS.weekPerformance} error={error} onRetry={refetch} isEmpty={isEmpty} />
    );
  }

  const labels = ["عملاء جدد", "نجاحات", "متابعات", "اجتماعات"];
  const values = [
    weekly.newLeads ?? 0,
    weekly.success ?? 0,
    weekly.followUps ?? 0,
    weekly.meetings ?? 0,
  ];

  return (
    <ChartCard
      title={DASHBOARD_SECTIONS.weekPerformance}
      type="bar"
      height={260}
      xAxis={[{ scaleType: "band", data: labels }]}
      series={[{ label: data?.currentWeek || "هذا الأسبوع", data: values }]}
    />
  );
}

function LeadsOverviewChart({ query, enabled }) {
  const { data, isLoading, error, refetch } = useDashboardWidget({
    base: LEADS_MONTHLY_OVERVIEW_URL,
    query,
    enabled,
  });
  const totals = data?.totals;
  const isEmpty = !totals || (totals.totalThisPeriod ?? 0) === 0;

  if (isLoading) return <ChartCard title={DASHBOARD_SECTIONS.leadsMonthlyOverview} loading height={260} />;
  if (error || isEmpty) {
    return (
      <BoundaryCard title={DASHBOARD_SECTIONS.leadsMonthlyOverview} error={error} onRetry={refetch} isEmpty={isEmpty} />
    );
  }

  return (
    <ChartCard
      title={DASHBOARD_SECTIONS.leadsMonthlyOverview}
      type="bar"
      height={260}
      xAxis={[{ scaleType: "band", data: ["داخل الدولة", "خارج الدولة", "غير مكتمل", "منتهية"] }]}
      series={[
        {
          label: "عملاء",
          data: [
            totals.insideCount ?? 0,
            totals.outsideCount ?? 0,
            totals.incompleteCount ?? 0,
            totals.finalizedTotal ?? 0,
          ],
        },
      ]}
    />
  );
}

// A chart slot that, instead of a chart, shows the per-widget error+retry or empty state inside
// the SAME SectionCard chrome ChartCard uses (so the tier degrades without parallel styling).
function BoundaryCard({ title, error, onRetry, isEmpty }) {
  return (
    <SectionCard title={title}>
      <Box sx={{ minHeight: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <WidgetBoundary
          loading={false}
          error={error}
          onRetry={onRetry}
          isEmpty={isEmpty}
          empty={{ title: "لا توجد بيانات كافية لعرض الرسم" }}
        >
          {null}
        </WidgetBoundary>
      </Box>
    </SectionCard>
  );
}

export default DashboardCharts;
