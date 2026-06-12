// <LeadsStatusBreakdown> — the leads-status breakdown over getLeadsStatus() (UX plan §3.1),
// rendered as a row of StatusChips each carrying its count. The BE returns
// [{ status, count }] where `status` has had underscores replaced by spaces (e.g. "NEW LEAD");
// we normalize back to the Prisma enum value so StatusChip resolves the right token + Arabic
// label. Self-scoped by the token; per-widget loading/error/empty. Single-language Arabic / RTL.

"use client";

import { Box, Stack, Typography } from "@mui/material";
import { LoadingState, StatusChip } from "@/app/v2/shared/components";
import { SectionCard } from "@/app/v2/shared/components";
import { useT } from "@/app/v2/lib/i18n";
import { WidgetBoundary } from "./WidgetBoundary.jsx";
import { useDashboardWidget } from "../hooks/useDashboardWidget.js";
import { LEADS_STATUS_URL } from "../config/constant.js";
import { DASHBOARD_SECTION_KEYS } from "../config/dashboardConstants.js";

// "NEW LEAD" → "NEW_LEAD" so it matches the Prisma enum keys StatusChip/statusLabels expect.
function toEnum(status) {
  return typeof status === "string" ? status.trim().replace(/\s+/g, "_") : status;
}

export function LeadsStatusBreakdown({ query, enabled }) {
  const { t } = useT();
  const { data, isLoading, error, refetch } = useDashboardWidget({
    base: LEADS_STATUS_URL,
    query,
    enabled,
  });

  const rows = Array.isArray(data) ? data.filter((r) => (r?.count ?? 0) > 0) : [];
  const isEmpty = rows.length === 0;

  return (
    <SectionCard title={t(DASHBOARD_SECTION_KEYS.leadsStatus)} sx={{ height: "100%" }}>
      <WidgetBoundary
        loading={isLoading}
        error={error}
        onRetry={refetch}
        isEmpty={isEmpty}
        empty={{ title: t("dashboard.leadsStatus.empty") }}
        skeleton={<LoadingState variant="cards" count={1} columns={1} height={120} />}
      >
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {rows.map((row) => {
            const value = toEnum(row.status);
            return (
              <Box key={value} sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, mb: 1 }}>
                <StatusChip status={value} domain="lead" />
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {row.count}
                </Typography>
              </Box>
            );
          })}
        </Stack>
      </WidgetBoundary>
    </SectionCard>
  );
}

export default LeadsStatusBreakdown;
