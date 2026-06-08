"use client";

// <KpiCards> — the KPI stat-card grid over getKeyMetrics() (UX plan §3.1). A SectionCard grid
// of compact stat cards; the data layer is FIXED, so this is pure projection of the envelope
// fields declared in KPI_CARDS. Self-scoped by the BE token (admin-tier may re-scope via the
// filter bar's staffId). Per-widget loading skeleton + error+retry via WidgetBoundary.
// Single-language Arabic / RTL.

import { Box, Grid, Card, CardContent, Typography, Stack } from "@mui/material";
import { LoadingState } from "@/app/v2/shared/components";
import { WidgetBoundary } from "./WidgetBoundary.jsx";
import { useDashboardWidget } from "../hooks/useDashboardWidget.js";
import { KEY_METRICS_URL } from "../config/constant.js";
import {
  KPI_CARDS,
  DASHBOARD_SECTIONS,
  formatMetric,
  ACCENT_COLOR,
} from "../config/dashboardConstants.js";

export function KpiCards({ query, enabled }) {
  const { data, isLoading, error, refetch } = useDashboardWidget({
    base: KEY_METRICS_URL,
    query,
    enabled,
  });

  const metrics = data && typeof data === "object" ? data : null;
  const isEmpty = !metrics;

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>
        {DASHBOARD_SECTIONS.kpis}
      </Typography>
      <WidgetBoundary
        loading={isLoading}
        error={error}
        onRetry={refetch}
        isEmpty={isEmpty}
        empty={{ title: "لا توجد مؤشرات لعرضها" }}
        skeleton={<LoadingState variant="cards" count={4} columns={4} height={104} />}
      >
        <Grid container spacing={2}>
          {KPI_CARDS.map((kpi) => (
            <Grid key={kpi.key} size={{ xs: 6, sm: 4, md: 3 }}>
              <KpiCard
                label={kpi.label}
                value={formatMetric(metrics?.[kpi.field], kpi.format)}
                accent={kpi.accent}
              />
            </Grid>
          ))}
        </Grid>
      </WidgetBoundary>
    </Box>
  );
}

function KpiCard({ label, value, accent }) {
  return (
    <Card sx={{ borderRadius: 3, height: "100%" }}>
      <CardContent sx={{ p: 2 }}>
        <Stack spacing={0.5}>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "start" }} noWrap>
            {label}
          </Typography>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: ACCENT_COLOR[accent] ?? "text.primary", textAlign: "start" }}
          >
            {value}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default KpiCards;
