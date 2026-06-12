"use client";

// <KpiCards> — the KPI stat-card grid over getKeyMetrics() (UX plan §3.1). A 4-up grid of MODERN
// stat cards: large numeral + small label + a semantic accent rail/icon. The data layer is FIXED
// (the BE returns ABSOLUTE values only — no per-period delta is in the payload, so we do NOT
// fabricate up/down numbers), so the "direction" we surface is the card's intrinsic semantic
// `accent` (positive | warning | neutral) rendered through the theme's success/warning tokens.
// Self-scoped by the BE token (admin-tier may re-scope via the filter bar's staffId). Per-widget
// loading skeleton + error+retry via WidgetBoundary. Single-language Arabic / RTL.

import { Box, Grid, Card, CardContent, Typography, Stack } from "@mui/material";
import { MdTrendingUp, MdTrendingFlat, MdPriorityHigh } from "react-icons/md";
import { LoadingState } from "@/app/v2/shared/components";
import { useT } from "@/app/v2/lib/i18n";
import { WidgetBoundary } from "./WidgetBoundary.jsx";
import { useDashboardWidget } from "../hooks/useDashboardWidget.js";
import { KEY_METRICS_URL } from "../config/constant.js";
import {
  KPI_CARDS,
  DASHBOARD_SECTION_KEYS,
  formatMetric,
} from "../config/dashboardConstants.js";

// Semantic accent → { color path, icon }. NOTE: this is the card's intrinsic meaning, NOT a
// computed delta — the BE payload carries no previous-period value to compare against.
const ACCENT = {
  positive: { color: "success.main", soft: "success.light", Icon: MdTrendingUp },
  warning: { color: "warning.main", soft: "warning.light", Icon: MdPriorityHigh },
  neutral: { color: "text.primary", soft: "action.hover", Icon: MdTrendingFlat },
};

export function KpiCards({ query, enabled }) {
  const { t } = useT();
  const { data, isLoading, error, refetch } = useDashboardWidget({
    base: KEY_METRICS_URL,
    query,
    enabled,
  });

  const metrics = data && typeof data === "object" ? data : null;
  const isEmpty = !metrics;

  return (
    <Box>
      <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>
        {t(DASHBOARD_SECTION_KEYS.kpis)}
      </Typography>
      <WidgetBoundary
        loading={isLoading}
        error={error}
        onRetry={refetch}
        isEmpty={isEmpty}
        empty={{ title: t("dashboard.kpi.empty") }}
        skeleton={<LoadingState variant="cards" count={4} columns={4} height={120} />}
      >
        <Grid container spacing={2}>
          {KPI_CARDS.map((kpi) => (
            <Grid key={kpi.key} size={{ xs: 6, sm: 4, md: 3 }}>
              <KpiCard
                label={t(kpi.labelKey)}
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
  const a = ACCENT[accent] ?? ACCENT.neutral;
  const { Icon } = a;
  return (
    <Card
      sx={{
        borderRadius: 3,
        height: "100%",
        position: "relative",
        overflow: "hidden",
        // A semantic accent rail at the inline-start edge (RTL-aware) — the "status.*" color cue.
        "&::before": {
          content: '""',
          position: "absolute",
          insetInlineStart: 0,
          top: 0,
          bottom: 0,
          width: 4,
          bgcolor: a.color,
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Stack spacing={0.75} sx={{ minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "start" }} noWrap>
              {label}
            </Typography>
            <Typography
              variant="h4"
              sx={{ fontWeight: 800, lineHeight: 1.1, color: a.color, textAlign: "start" }}
            >
              {value}
            </Typography>
          </Stack>
          <Box
            sx={{
              flexShrink: 0,
              width: 36,
              height: 36,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              bgcolor: a.soft,
              color: a.color,
              fontSize: 20,
            }}
          >
            <Icon />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default KpiCards;
