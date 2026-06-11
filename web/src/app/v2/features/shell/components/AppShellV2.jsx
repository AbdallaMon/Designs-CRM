"use client";

// <AppShellV2 /> — the NEW app shell (frame swap). A flex row (RTL: rail + panel at the inline-
// start, content fills the rest):
//   [ WorkspaceRail | WorkspacePanel? | column( CommandBar, <main>{children} ) ]
//
// • activeWorkspace / activeDestination are derived from usePathname (reuse matchNavItem): the
//   workspace owning the matched nav item is "active"; the rail highlights it and the panel lists
//   its destinations. When the path matches nothing (e.g. a lead detail isn't a top-level item),
//   we fall back to the role-default workspace for orientation.
// • The panel auto-collapses when the active workspace has a single destination (the rail already
//   navigates straight there).
// • Responsive: md+ shows rail + panel inline. On xs the panel becomes a temporary Drawer opened
//   from the CommandBar menu button; the rail stays permanent.
// • A global ⌘K / Ctrl+K listener opens the CommandPalette (guarded so it ignores text fields).
//   Motion is sub-250ms and respects prefers-reduced-motion (via the palette transition).
// Theme tokens only. Single-language Arabic / RTL.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Drawer, useTheme, useMediaQuery } from "@mui/material";
import { usePathname } from "next/navigation";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { useAuth } from "@/app/v2/providers/AuthProvider";
import { WorkspaceRail } from "./WorkspaceRail";
import { WorkspacePanel } from "./WorkspacePanel";
import { CommandBar } from "./CommandBar";
import { CommandPalette } from "./CommandPalette";
import { buildWorkspaceNav, matchNavItem } from "../index";
import {
  resolveNavItem,
  resolveNavItemCaption,
  resolveWorkspaceLabel,
  resolveDefaultWorkspace,
} from "../navLabels";
import { isPathActive } from "../breadcrumbs";

export function AppShellV2({ children }) {
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up("md"));
  const pathname = usePathname();
  const perm = usePermission();
  const { user } = useAuth();

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  // Permission-filtered workspace nav model: [{ workspace: {key,label,icon}, items:[...] }].
  const workspaceNav = useMemo(() => {
    const nav = buildWorkspaceNav(perm, resolveNavItem, resolveNavItemCaption);
    // Attach the Arabic workspace label onto each workspace object for the rail/panel.
    return nav.map((w) => ({
      ...w,
      workspace: { ...w.workspace, label: resolveWorkspaceLabel(w.workspace.key) },
    }));
  }, [perm]);

  const accessibleKeys = useMemo(
    () => workspaceNav.map((w) => w.workspace.key),
    [workspaceNav],
  );

  // Active workspace: the workspace owning the nav item whose href best-matches the path. Falls
  // back to the role-default workspace (display-only orientation) when nothing matches.
  const activeWorkspaceKey = useMemo(() => {
    const item = matchNavItem(pathname);
    if (item?.workspace && accessibleKeys.includes(item.workspace)) {
      return item.workspace;
    }
    return resolveDefaultWorkspace(user, accessibleKeys);
  }, [pathname, accessibleKeys, user]);

  const activeWorkspace = useMemo(
    () => workspaceNav.find((w) => w.workspace.key === activeWorkspaceKey) ?? null,
    [workspaceNav, activeWorkspaceKey],
  );

  // Landing target for the logo: the default workspace's first destination.
  const landingHref = useMemo(() => {
    const defKey = resolveDefaultWorkspace(user, accessibleKeys);
    const ws = workspaceNav.find((w) => w.workspace.key === defKey);
    return ws?.items?.[0]?.href ?? "/v2/dashboard";
  }, [workspaceNav, accessibleKeys, user]);

  // Panel collapses when the active workspace has a single destination (rail goes direct).
  const panelCollapsed = !activeWorkspace || activeWorkspace.items.length <= 1;

  const isActiveHref = (href) => isPathActive(pathname, href);

  // Global ⌘K / Ctrl+K toggles the palette from anywhere (deliberate command-palette
  // accelerator). The Cmd/Ctrl modifier means this never collides with plain typing, so it
  // fires even from inside inputs — which is the intended "jump from anywhere" behavior.
  useEffect(() => {
    const onKey = (e) => {
      const isK = e.key === "k" || e.key === "K";
      if (isK && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close the mobile panel drawer on navigation.
  useEffect(() => {
    setMobilePanelOpen(false);
  }, [pathname]);

  const panelContent = activeWorkspace ? (
    <WorkspacePanel
      workspace={activeWorkspace.workspace}
      items={activeWorkspace.items}
      isActiveHref={isActiveHref}
      onNavigate={() => setMobilePanelOpen(false)}
    />
  ) : null;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Permanent icon rail (all breakpoints). */}
      <WorkspaceRail
        workspaceNav={workspaceNav}
        activeWorkspaceKey={activeWorkspaceKey}
        landingHref={landingHref}
        onSelectWorkspace={() => setMobilePanelOpen(false)}
      />

      {/* Contextual panel: inline on md+ (unless collapsed); a temporary Drawer on xs. */}
      {mdUp && !panelCollapsed && panelContent}
      {!mdUp && (
        <Drawer
          variant="temporary"
          // RTL: the rail is at the inline-start (visual right), so the panel drawer opens from
          // the right too. anchor="right" + dir rtl keeps it beside the rail.
          anchor="right"
          open={mobilePanelOpen}
          onClose={() => setMobilePanelOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ "& .MuiDrawer-paper": { boxSizing: "border-box" } }}
        >
          {panelContent}
        </Drawer>
      )}

      {/* Content column: CommandBar + main. */}
      <Box sx={{ flexGrow: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <CommandBar
          onOpenPalette={() => setPaletteOpen(true)}
          onMenuToggle={() => setMobilePanelOpen((o) => !o)}
          // Only offer the panel-drawer toggle on xs AND when there's a multi-item panel to show.
          showMenuButton={!mdUp && !panelCollapsed}
          // Persistent "where am I" (audit M1): when the contextual panel is collapsed the only
          // orientation cue is the rail tooltip — surface the active-workspace label inline instead.
          activeWorkspaceLabel={activeWorkspace?.workspace?.label ?? null}
          panelCollapsed={panelCollapsed}
        />
        <Box component="main" sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, md: 3 } }}>
          {children}
        </Box>
      </Box>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </Box>
  );
}

export default AppShellV2;
