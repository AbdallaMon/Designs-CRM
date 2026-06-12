"use client";

// <DesignerBoard> — the production board over getDesignerMetrics() (UX plan §3.1 / §4 designer
// journey: todo / in-progress / hold / done). A by-status card row + a small meta strip
// (total projects / area / hours). Self-scoped by the token (a designer sees their own
// projects; admin-tier may re-scope via the filter staffId). Per-widget loading/error/empty.
// Single-language Arabic / RTL.
//
// Role-adaptivity: the page only MOUNTS this for production-leaning personas (see DashboardPage
// roleView), and even when mounted, an all-zero / null payload collapses to the empty state — a
// sales user who happens to mount it never sees a misleading board.

import { Box, Grid, Card, CardContent, Typography, Stack, Divider } from "@mui/material";
import { LoadingState, SectionCard, StatusChip } from "@/app/v2/shared/components";
import { useT } from "@/app/v2/lib/i18n";
import { WidgetBoundary } from "./WidgetBoundary.jsx";
import { useDashboardWidget } from "../hooks/useDashboardWidget.js";
import { DESIGNER_METRICS_URL } from "../config/constant.js";
import {
  DESIGNER_CARDS,
  DESIGNER_META,
  DASHBOARD_SECTION_KEYS,
  formatMetric,
} from "../config/dashboardConstants.js";

export function DesignerBoard({ query, enabled }) {
  const { t } = useT();
  const { data, isLoading, error, refetch } = useDashboardWidget({
    base: DESIGNER_METRICS_URL,
    query,
    enabled,
  });

  const metrics = data && typeof data === "object" ? data : null;
  // Treat an all-zero / total-less payload as "nothing to show" (role-aware empty).
  const hasProjects = Number(metrics?.totalProjects ?? 0) > 0;
  const isEmpty = !metrics || !hasProjects;

  return (
    <SectionCard title={t(DASHBOARD_SECTION_KEYS.designerBoard)} sx={{ mb: 3 }}>
      <WidgetBoundary
        loading={isLoading}
        error={error}
        onRetry={refetch}
        isEmpty={isEmpty}
        empty={{
          title: t("dashboard.designer.empty.title"),
          description: t("dashboard.designer.empty.description"),
        }}
        skeleton={<LoadingState variant="cards" count={4} columns={4} height={96} />}
      >
        <Grid container spacing={2}>
          {DESIGNER_CARDS.map((card) => (
            <Grid key={card.key} size={{ xs: 6, md: 3 }}>
              <Card variant="outlined" sx={{ borderRadius: 3, height: "100%" }}>
                <CardContent sx={{ p: 2 }}>
                  <Stack spacing={1} alignItems="flex-start">
                    <StatusChip status={card.status} domain={card.domain} label={t(card.labelKey)} />
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {formatMetric(metrics?.[card.field], "number")}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
          {DESIGNER_META.map((m) => (
            <Box key={m.key} sx={{ minWidth: 120 }}>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: "start" }}>
                {t(m.labelKey)}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, textAlign: "start" }}>
                {formatMetric(metrics?.[m.field], m.format)}
              </Typography>
            </Box>
          ))}
        </Stack>
      </WidgetBoundary>
    </SectionCard>
  );
}

export default DesignerBoard;
