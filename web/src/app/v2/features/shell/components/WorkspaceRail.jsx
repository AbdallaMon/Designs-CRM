"use client";

// <WorkspaceRail /> — the slim (72px) permanent icon-rail of the NEW app shell. Anchored to the
// INLINE-START (right edge in RTL). Contents, top → bottom:
//   • the logo (links to the default landing destination),
//   • one icon button per VISIBLE workspace (from buildWorkspaceNav + usePermission).
// The active workspace (derived from the current pathname matching ANY of its items) gets the
// caramel inline-start accent (borderInlineStart 3px primary.main) + a filled look. Selecting a
// workspace navigates to that workspace's FIRST destination (the panel then lists the rest).
// Tooltips point toward the content. a11y: ≥44px targets, aria-current on the active workspace.
// Single-language Arabic / RTL. Theme tokens only.

import NextLink from "next/link";
import { Box, IconButton, Tooltip, alpha } from "@mui/material";
import { MdSpaceDashboard } from "react-icons/md";

const RAIL_WIDTH = 72;

export function WorkspaceRail({
  workspaceNav, // [{ workspace, items }] — already permission-filtered
  activeWorkspaceKey,
  landingHref, // where the logo points (default workspace's first destination)
  onSelectWorkspace, // (wsKey, firstHref) => void  — lets the orchestrator sync the panel
}) {
  return (
    <Box
      component="nav"
      aria-label="مساحات العمل"
      sx={{
        width: RAIL_WIDTH,
        flexShrink: 0,
        height: "100vh",
        position: "sticky",
        top: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0.5,
        py: 1.5,
        bgcolor: "background.paper",
        // Logical inline-START divider — sits on the visual right edge in RTL (rail is at start).
        borderInlineEnd: 1,
        borderColor: "divider",
        zIndex: (t) => t.zIndex.appBar + 1,
      }}
    >
      {/* Logo → default landing. 44px target, brand mark. */}
      <Tooltip title="Dream Studio" placement="left">
        <IconButton
          component={NextLink}
          href={landingHref}
          aria-label="Dream Studio — الصفحة الرئيسية"
          sx={{
            width: 48,
            height: 48,
            mb: 1,
            borderRadius: 2,
            bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
            color: "primary.textOnLight",
            fontWeight: 800,
            fontSize: "1.1rem",
            "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.2) },
          }}
        >
          DS
        </IconButton>
      </Tooltip>

      {workspaceNav.map(({ workspace, items }) => {
        const Icon = workspace.icon ?? MdSpaceDashboard;
        const active = workspace.key === activeWorkspaceKey;
        const firstHref = items[0]?.href;
        return (
          <Tooltip key={workspace.key} title={workspace.label} placement="left">
            <IconButton
              component={NextLink}
              href={firstHref}
              onClick={() => onSelectWorkspace?.(workspace.key, firstHref)}
              aria-label={workspace.label}
              aria-current={active ? "page" : undefined}
              sx={{
                width: 52,
                height: 52,
                borderRadius: 2,
                color: active ? "primary.main" : "text.secondary",
                // The app's active motif: a logical inline-start accent (RTL = right edge,
                // nearest the content). Transparent by default so layout never shifts.
                borderInlineStart: "3px solid",
                borderColor: active ? "primary.main" : "transparent",
                bgcolor: active
                  ? (t) => alpha(t.palette.primary.main, 0.12)
                  : "transparent",
                "&:hover": {
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                },
                "& svg": { color: "inherit" },
              }}
            >
              <Icon size={22} />
            </IconButton>
          </Tooltip>
        );
      })}
    </Box>
  );
}

export default WorkspaceRail;
