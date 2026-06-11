"use client";

// <EmiratesAnalytics> — leads-by-emirate breakdown over getEmiratesAnalytics() (UX plan §3.1).
// Surfaced in the SALES board's row 3 BESIDE the leads-status breakdown (geographic context for
// the pipeline). A single bar chart via the shared ChartCard; own read + WidgetBoundary so a
// failed aggregation degrades only this card. Self-scoped by the token; admin-tier re-scopes via
// the filter staffId. The data layer is FIXED — this only PROJECTS analytics[] into a series.
// Single-language Arabic / RTL.

import { Box } from "@mui/material";
import { ChartCard, SectionCard } from "@/app/v2/shared/components";
import { WidgetBoundary } from "./WidgetBoundary.jsx";
import { useDashboardWidget } from "../hooks/useDashboardWidget.js";
import { EMIRATES_ANALYTICS_URL } from "../config/constant.js";
import { DASHBOARD_SECTIONS } from "../config/dashboardConstants.js";

const EMIRATE_LABELS = {
  DUBAI: "دبي",
  ABU_DHABI: "أبوظبي",
  SHARJAH: "الشارقة",
  AJMAN: "عجمان",
  UMM_AL_QUWAIN: "أم القيوين",
  RAS_AL_KHAIMAH: "رأس الخيمة",
  FUJAIRAH: "الفجيرة",
};

export function EmiratesAnalytics({ query, enabled }) {
  const { data, isLoading, error, refetch } = useDashboardWidget({
    base: EMIRATES_ANALYTICS_URL,
    query,
    enabled,
  });

  const analytics = Array.isArray(data?.analytics) ? data.analytics : [];
  const hasData = analytics.some((a) => (a.leads ?? 0) > 0);
  const isEmpty = analytics.length === 0 || !hasData;

  if (isLoading) {
    return <ChartCard title={DASHBOARD_SECTIONS.emiratesAnalytics} loading height={260} />;
  }
  if (error || isEmpty) {
    return (
      <SectionCard title={DASHBOARD_SECTIONS.emiratesAnalytics} sx={{ height: "100%" }}>
        <Box sx={{ minHeight: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <WidgetBoundary
            loading={false}
            error={error}
            onRetry={refetch}
            isEmpty={isEmpty}
            empty={{ title: "لا توجد بيانات كافية لعرض الرسم" }}
          >
            {null}
          </WidgetBoundary>
        </Box>
      </SectionCard>
    );
  }

  return (
    <ChartCard
      title={DASHBOARD_SECTIONS.emiratesAnalytics}
      type="bar"
      height={260}
      xAxis={[{ scaleType: "band", data: analytics.map((a) => EMIRATE_LABELS[a.emirate] ?? a.emirate) }]}
      series={[{ label: "عملاء", data: analytics.map((a) => a.leads ?? 0) }]}
    />
  );
}

export default EmiratesAnalytics;
