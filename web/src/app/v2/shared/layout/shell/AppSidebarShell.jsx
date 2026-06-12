"use client";

// <AppSidebarShell /> — THE app shell (frame swap). Modeled on the reference PageLayout: a flex
// row of [ <AppSidebar/> | desktop spacer | <main>( <AppHeader/> + page content ) ]. The sidebar
// is a permanent Drawer on desktop and a temporary Drawer on mobile; the spacer Box reserves the
// permanent drawer's width so the content never sits under it. The whole frame is RTL via the
// emotion stylis-rtl cache + <html dir="rtl"> — the Drawer's anchor="left" renders visually RIGHT.
//
// State:
//   • collapsed — desktop icon-only rail, persisted to localStorage("v2.sidebarCollapsed").
//   • mobileOpen — the temporary drawer's open state (xs/sm).
//   • isMobile = down("md").
// The single header button toggles collapsed (desktop) or mobileOpen (mobile). Single-language
// Arabic / RTL.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { buildVisibleNav } from "@/app/v2/features/shell";
import { resolveNavGroup, resolveNavItem } from "@/app/v2/features/shell/navLabels";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";

const STORAGE_KEY = "v2.sidebarCollapsed";
const FALLBACK_HREF = "/v2/dashboard";

export function AppSidebarShell({ children }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const perm = usePermission();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Restore the persisted desktop collapse preference once on mount (client-only).
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "true" || saved === "false") setCollapsed(saved === "true");
    } catch {
      // ignore storage access errors (private mode, etc.)
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const onToggle = useCallback(() => {
    if (isMobile) setMobileOpen((o) => !o);
    else toggleCollapsed();
  }, [isMobile, toggleCollapsed]);

  // Landing destination for the brand block: the FIRST visible nav destination (a standard admin
  // panel "home" link), else the dashboard fallback. No per-role cockpit fan-out.
  const landingHref = useMemo(() => {
    const groups = buildVisibleNav(perm, resolveNavGroup, resolveNavItem);
    return groups[0]?.items?.[0]?.href ?? FALLBACK_HREF;
  }, [perm]);

  return (
    <Box sx={{ display: "flex", flexDirection: "row", minHeight: "100vh", bgcolor: "background.default" }}>
      <AppSidebar
        collapsed={collapsed}
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        landingHref={landingHref}
      />

      {/*
        No desktop spacer Box here. <AppSidebar>'s permanent <Drawer> already reserves its own
        footprint in this flex row — its Drawer root carries `width` + `flexShrink: 0` (the standard
        MUI permanent-drawer layout). Adding a separate spacer would double-count the width and push
        content an extra 264px. The width is reserved exactly ONCE by the Drawer root.
      */}

      <Box
        component="main"
        sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}
      >
        <AppHeader
          collapsed={collapsed}
          isMobile={isMobile}
          mobileOpen={mobileOpen}
          onToggle={onToggle}
        />
        <Box sx={{ flex: 1, p: { xs: 2, md: 3 } }}>{children}</Box>
      </Box>
    </Box>
  );
}

export default AppSidebarShell;
