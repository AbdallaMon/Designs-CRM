"use client";

// <EmiratesAnalytics> — leads-by-emirate breakdown over getEmiratesAnalytics() (UX plan §3.1).
// Surfaced in the SALES board's row 3 BESIDE the leads-status breakdown (geographic context for
// the pipeline). A single bar chart via the shared ChartCard; own read + WidgetBoundary so a
// failed aggregation degrades only this card. Self-scoped by the token; admin-tier re-scopes via
// the filter staffId. The data layer is FIXED — this only PROJECTS analytics[] into a series.
// Single-language Arabic / RTL.

import { Box } from "@mui/material";
import { ChartCard, SectionCard } from "@/app/v2/shared/components";
import { useT } from "@/app/v2/lib/i18n";
import { WidgetBoundary } from "./WidgetBoundary.jsx";
import { useDashboardWidget } from "../hooks/useDashboardWidget.js";
import { EMIRATES_ANALYTICS_URL } from "../config/constant.js";
import { DASHBOARD_SECTION_KEYS } from "../config/dashboardConstants.js";

// Emirate enum value → its dictionary key; resolved to a label via t() at render time. Unknown
// values fall back to the raw enum value (same as before).
const EMIRATE_LABEL_KEYS = {
  DUBAI: "dashboard.emirate.DUBAI",
  ABU_DHABI: "dashboard.emirate.ABU_DHABI",
  SHARJAH: "dashboard.emirate.SHARJAH",
  AJMAN: "dashboard.emirate.AJMAN",
  UMM_AL_QUWAIN: "dashboard.emirate.UMM_AL_QUWAIN",
  RAS_AL_KHAIMAH: "dashboard.emirate.RAS_AL_KHAIMAH",
  FUJAIRAH: "dashboard.emirate.FUJAIRAH",
};

export function EmiratesAnalytics({ query, enabled }) {
  const { t } = useT();
  const { data, isLoading, error, refetch } = useDashboardWidget({
    base: EMIRATES_ANALYTICS_URL,
    query,
    enabled,
  });

  const analytics = Array.isArray(data?.analytics) ? data.analytics : [];
  const hasData = analytics.some((a) => (a.leads ?? 0) > 0);
  const isEmpty = analytics.length === 0 || !hasData;
  const title = t(DASHBOARD_SECTION_KEYS.emiratesAnalytics);
  const emirateLabel = (value) =>
    EMIRATE_LABEL_KEYS[value] ? t(EMIRATE_LABEL_KEYS[value]) : value;

  if (isLoading) {
    return <ChartCard title={title} loading height={260} />;
  }
  if (error || isEmpty) {
    return (
      <SectionCard title={title} sx={{ height: "100%" }}>
        <Box sx={{ minHeight: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <WidgetBoundary
            loading={false}
            error={error}
            onRetry={refetch}
            isEmpty={isEmpty}
            empty={{ title: t("dashboard.chart.empty") }}
          >
            {null}
          </WidgetBoundary>
        </Box>
      </SectionCard>
    );
  }

  return (
    <ChartCard
      title={title}
      type="bar"
      height={260}
      xAxis={[{ scaleType: "band", data: analytics.map((a) => emirateLabel(a.emirate)) }]}
      series={[{ label: t("dashboard.chart.leadsSeries"), data: analytics.map((a) => a.leads ?? 0) }]}
    />
  );
}

export default EmiratesAnalytics;
