"use client";

// <LatestLeads> — a COMPACT, deep-linkable list of the newest leads over getLatestLeads()
// (UX plan §3.1, row 5 of the sales board). Reinforces the lead-as-hub model: every row links
// to the lead hub /v2/leads/{id}. Distinct from the ActionQueue (which fuses leads + activities
// into a prioritized "needs attention" feed) — this is a plain "latest" roster for quick access.
// Own read + WidgetBoundary; self-scoped by the token (latest-leads takes no scope args).
// Single-language Arabic / RTL.

import NextLink from "next/link";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Stack,
} from "@mui/material";
import { MdPerson, MdChevronLeft } from "react-icons/md";
import { SectionCard, StatusChip, LoadingState } from "@/app/v2/shared/components";
import { useT } from "@/app/v2/lib/i18n";
import { WidgetBoundary } from "./WidgetBoundary.jsx";
import { useDashboardWidget } from "../hooks/useDashboardWidget.js";
import { LATEST_LEADS_URL } from "../config/constant.js";
import { DASHBOARD_SECTION_KEYS, LATEST_LEADS_COPY_KEYS } from "../config/dashboardConstants.js";

function formatWhen(value) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("ar-AE", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

export function LatestLeads({ query, enabled }) {
  const { t } = useT();
  const { data, isLoading, error, refetch } = useDashboardWidget({
    base: LATEST_LEADS_URL,
    query,
    enabled,
    scoped: false,
  });

  const rows = Array.isArray(data) ? data : [];
  const isEmpty = rows.length === 0;

  return (
    <SectionCard title={t(DASHBOARD_SECTION_KEYS.latestLeads)} noPadding>
      <Box sx={{ px: 1, py: isEmpty || isLoading || error ? 1 : 0 }}>
        <WidgetBoundary
          loading={isLoading}
          error={error}
          onRetry={refetch}
          isEmpty={isEmpty}
          empty={{ title: t(LATEST_LEADS_COPY_KEYS.empty) }}
          skeleton={<LoadingState variant="cards" count={1} columns={1} height={160} />}
        >
          <List disablePadding>
            {rows.map((lead) => (
              <ListItemButton
                key={`latest-${lead.id}`}
                component={NextLink}
                href={`/v2/leads/${lead.id}`}
                scroll={false}
                sx={{ borderRadius: 2, py: 1, alignItems: "center", minHeight: 48 }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: "primary.main", fontSize: 22 }}>
                  <MdPerson />
                </ListItemIcon>
                <ListItemText
                  primary={lead?.client?.name || `${t("dashboard.queue.leadFallback")}${lead.id}`}
                  secondary={formatWhen(lead.createdAt)}
                  primaryTypographyProps={{ noWrap: true, sx: { textAlign: "start" } }}
                  secondaryTypographyProps={{ sx: { textAlign: "start" } }}
                />
                <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
                  {lead.status ? <StatusChip status={lead.status} domain="lead" /> : null}
                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: "primary.main" }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {t(LATEST_LEADS_COPY_KEYS.actionLabel)}
                    </Typography>
                    <Box component={MdChevronLeft} sx={{ fontSize: 20 }} />
                  </Stack>
                </Stack>
              </ListItemButton>
            ))}
          </List>
        </WidgetBoundary>
      </Box>
    </SectionCard>
  );
}

export default LatestLeads;
