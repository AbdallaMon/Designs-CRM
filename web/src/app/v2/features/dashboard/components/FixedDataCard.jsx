"use client";

// <FixedDataCard> — a READ-ONLY dashboard view of the studio's fixed-data list (the same list the
// admin edits under adminResidual/FixedDataView, here surfaced to every employee as reference).
// NO add / edit / delete: it is purely a reference card. Mirrors the dashboard card primitives
// (SectionCard shell + WidgetBoundary's loading/error/empty/content states, like <LatestLeads>),
// fetching via useRequest (non-paginated GET /v2/utilities/fixed-data). Gated at the CALL SITE on
// PERMISSIONS.UTILITY.FIXED_DATA_LIST (the same code the BE enforces). Single-language Arabic / RTL.

import {
  Box,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { MdLabelOutline } from "react-icons/md";
import { SectionCard, LoadingState } from "@/app/v2/shared/components";
import { useRequest } from "@/app/v2/hooks/useRequest";
import { useT } from "@/app/v2/lib/i18n";
import { FIXED_DATA_URL } from "@/app/v2/features/utilities/config/constant.js";
import { WidgetBoundary } from "./WidgetBoundary.jsx";

export function FixedDataCard({ enabled = true }) {
  const { t } = useT();
  const { data, isLoading, error, refetch } = useRequest({
    url: FIXED_DATA_URL,
    method: "get",
    autoFetch: enabled,
  });

  const rows = Array.isArray(data) ? data : [];
  const isEmpty = rows.length === 0;

  return (
    <SectionCard
      title={t("dashboard.fixedData.title")}
      subtitle={t("dashboard.fixedData.subtitle")}
      noPadding
    >
      <Box sx={{ px: 1, py: isEmpty || isLoading || error ? 1 : 0 }}>
        <WidgetBoundary
          loading={isLoading}
          error={error}
          onRetry={refetch}
          isEmpty={isEmpty}
          empty={{
            title: t("dashboard.fixedData.empty.title"),
            description: t("dashboard.fixedData.empty.description"),
            icon: <MdLabelOutline />,
          }}
          skeleton={<LoadingState variant="cards" count={1} columns={1} height={160} />}
        >
          <List disablePadding>
            {rows.map((row) => (
              <ListItem
                key={`fixed-${row.id}`}
                sx={{ borderRadius: 2, py: 1, minHeight: 48 }}
                secondaryAction={
                  <Chip
                    size="small"
                    label={`#${row.id}`}
                    sx={{ fontVariantNumeric: "tabular-nums" }}
                  />
                }
              >
                <ListItemIcon sx={{ minWidth: 40, color: "primary.main", fontSize: 22 }}>
                  <MdLabelOutline />
                </ListItemIcon>
                <ListItemText
                  primary={row?.title || "—"}
                  primaryTypographyProps={{ noWrap: true, sx: { textAlign: "start" } }}
                />
              </ListItem>
            ))}
          </List>
        </WidgetBoundary>
      </Box>
    </SectionCard>
  );
}

export default FixedDataCard;
