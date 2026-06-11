"use client";

// <LeadRecordList> — the SHARED primitive for the lead-hub record tabs (Calls / Meetings /
// Notes / Files). A SectionCard-wrapped list that renders the 5 canonical states
// (loading / error / empty / content) and a "عرض الكل (N)" expander past `maxVisible`, so the
// four record tabs share ONE idiom (mirrors LeadSessionsPanel: radius-12 SectionCard,
// consistent spacing, theme tokens only — no grey.50 / alpha hardcodes).
//
// It owns LAYOUT only — never authorization or mutations. The caller passes its already-gated
// add-button node (`headerAction`) and the per-row action node (`renderRowAction`), both of which
// self-gate on capabilities at the call site. Single Arabic / RTL.
//
// Props:
//   title           string            — SectionCard heading.
//   icon            node?             — leading glyph shown beside the title.
//   items           array             — the records to render.
//   headerAction    node?             — header-end control (the gated add button). Renders nothing
//                                       when null (the caller passes null when not permitted).
//   renderPrimary   (item) => node    — the row's primary line.
//   renderSecondary (item) => node?   — the row's secondary line.
//   renderStatus    (item) => node?   — an inline-end status indicator (e.g. a <StatusChip>).
//   renderRowAction (item) => node?   — an inline-end action node (e.g. the result dialog).
//   emptyTitle      string            — EmptyState headline.
//   emptyDescription string?          — EmptyState body.
//   emptyAction     {label,onClick}?  — EmptyState CTA (gate at the call site).
//   loading         bool              — show LoadingState.
//   error           any               — show ErrorState (truthy).
//   onRetry         () => void?       — ErrorState retry.
//   maxVisible      number = 5        — collapse the list past this many rows.

import { useState } from "react";
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  Stack,
} from "@mui/material";
import { MdExpandMore, MdExpandLess } from "react-icons/md";
import {
  SectionCard,
  LoadingState,
  EmptyState,
  ErrorState,
} from "@/app/v2/shared/components";
import { useT } from "@/app/v2/lib/i18n";

export function LeadRecordList({
  title,
  icon,
  items,
  headerAction,
  renderPrimary,
  renderSecondary,
  renderStatus,
  renderRowAction,
  emptyTitle,
  emptyDescription,
  emptyAction,
  loading = false,
  error = null,
  onRetry,
  maxVisible = 5,
}) {
  const { t } = useT();
  const [expanded, setExpanded] = useState(false);
  const resolvedEmptyTitle = emptyTitle ?? t("leadsDetails.recordList.empty");
  const list = Array.isArray(items) ? items : [];
  const collapsible = list.length > maxVisible;
  const visible = expanded || !collapsible ? list : list.slice(0, maxVisible);

  const heading = icon ? (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box sx={{ display: "flex", fontSize: 20, color: "primary.main" }}>{icon}</Box>
      <Box component="span">{title}</Box>
    </Stack>
  ) : (
    title
  );

  return (
    <SectionCard title={heading} actions={headerAction}>
      {loading ? (
        <LoadingState variant="table" rows={4} columns={3} />
      ) : error ? (
        <ErrorState error={error} onRetry={onRetry} />
      ) : list.length === 0 ? (
        <EmptyState title={resolvedEmptyTitle} description={emptyDescription} action={emptyAction} />
      ) : (
        <>
          <List disablePadding>
            {visible.map((item, i) => {
              const status = renderStatus?.(item);
              const rowAction = renderRowAction?.(item);
              return (
                <ListItem
                  key={item.id ?? i}
                  divider={i < visible.length - 1}
                  disableGutters
                  secondaryAction={rowAction || undefined}
                  sx={{ alignItems: "flex-start", py: 1.25 }}
                >
                  <ListItemText
                    primary={
                      status ? (
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          flexWrap="wrap"
                          rowGap={0.5}
                        >
                          <Box component="span" sx={{ minWidth: 0 }}>
                            {renderPrimary(item)}
                          </Box>
                          {status}
                        </Stack>
                      ) : (
                        renderPrimary(item)
                      )
                    }
                    secondary={renderSecondary?.(item)}
                    slotProps={{ secondary: { component: "div" } }}
                  />
                </ListItem>
              );
            })}
          </List>

          {collapsible && (
            <Box sx={{ mt: 1, textAlign: "center" }}>
              <Button
                size="small"
                variant="text"
                onClick={() => setExpanded((v) => !v)}
                startIcon={expanded ? <MdExpandLess /> : <MdExpandMore />}
              >
                {expanded
                  ? t("leadsDetails.recordList.showLess")
                  : t("leadsDetails.recordList.showAll").replace("{count}", list.length)}
              </Button>
            </Box>
          )}
        </>
      )}
    </SectionCard>
  );
}

export default LeadRecordList;
