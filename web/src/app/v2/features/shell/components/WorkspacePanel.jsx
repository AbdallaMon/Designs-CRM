"use client";

// <WorkspacePanel /> — the ~240px contextual panel beside the rail. Lists the ACTIVE
// workspace's destinations as a clean column of NextLink rows (active row highlighted with the
// app's logical inline-start caramel accent). The workspace title is an `overline` header.
// If the active workspace has only ONE destination the panel auto-collapses (the rail already
// navigates straight there) — see the orchestrator's `panelCollapsed` derivation; this component
// simply renders nothing when handed an empty/one-item workspace via `collapsed`.
// Single-language Arabic / RTL. Theme tokens only.

import NextLink from "next/link";
import {
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
} from "@mui/material";
import { useRecentLeads } from "../hooks/useRecentLeads.js";

const PANEL_WIDTH = 240;

export function WorkspacePanel({
  workspace, // { key, label, ... }
  items, // [{ key, label, href, icon }]
  isActiveHref, // (href) => boolean
  onNavigate, // optional — close the mobile drawer on select
}) {
  const recentLeads = useRecentLeads();

  if (!workspace || !items || items.length === 0) return null;

  // Recent-leads block only makes sense inside the sales workspace; elsewhere it'd be noise.
  const showRecent = workspace.key === "sales" && recentLeads.length > 0;

  return (
    <Box
      component="aside"
      aria-label={workspace.label}
      sx={{
        width: PANEL_WIDTH,
        flexShrink: 0,
        height: "100vh",
        position: "sticky",
        top: 0,
        overflowY: "auto",
        bgcolor: "background.paper",
        borderInlineEnd: 1,
        borderColor: "divider",
        py: 2,
      }}
    >
      <Typography
        variant="overline"
        component="h2"
        sx={{ px: 2.5, display: "block", color: "text.secondary" }}
      >
        {workspace.label}
      </Typography>

      <List dense disablePadding sx={{ mt: 1, px: 1 }}>
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActiveHref(item.href);
          return (
            <ListItemButton
              key={item.key}
              component={NextLink}
              href={item.href}
              selected={active}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              sx={{
                borderRadius: 2,
                my: 0.25,
                minHeight: 44, // a11y 2.5.8
                borderInlineStart: "3px solid",
                borderColor: "transparent",
                "&.Mui-selected": {
                  bgcolor: "action.selected",
                  borderColor: "primary.main",
                  "& .MuiListItemIcon-root svg": { color: "primary.main" },
                },
              }}
            >
              {Icon && (
                <ListItemIcon sx={{ minWidth: 36, justifyContent: "center" }}>
                  <Icon size={18} />
                </ListItemIcon>
              )}
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ variant: "body2" }}
              />
            </ListItemButton>
          );
        })}
      </List>

      {/* Recent leads — populated from localStorage by the lead-detail page (useRecentLeads /
          pushRecentLead). Sales workspace only; renders nothing when there's nothing to show. */}
      {showRecent && (
        <Box component="section" aria-label="آخر العملاء">
          <Divider sx={{ my: 1.5, mx: 1 }} />
          <Typography
            variant="overline"
            component="h3"
            sx={{ px: 2.5, display: "block", color: "text.secondary" }}
          >
            آخر العملاء
          </Typography>
          <List dense disablePadding sx={{ mt: 0.5, px: 1 }}>
            {recentLeads.map((lead) => {
              const href = `/v2/leads/${lead.id}`;
              const active = isActiveHref(href);
              return (
                <ListItemButton
                  key={lead.id}
                  component={NextLink}
                  href={href}
                  selected={active}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  sx={{
                    borderRadius: 2,
                    my: 0.25,
                    minHeight: 40,
                    borderInlineStart: "3px solid",
                    borderColor: "transparent",
                    "&.Mui-selected": {
                      bgcolor: "action.selected",
                      borderColor: "primary.main",
                    },
                  }}
                >
                  <ListItemText
                    primary={lead.name || `عميل #${lead.id}`}
                    primaryTypographyProps={{
                      variant: "body2",
                      noWrap: true,
                      sx: { color: "text.secondary" },
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      )}
    </Box>
  );
}

export default WorkspacePanel;
