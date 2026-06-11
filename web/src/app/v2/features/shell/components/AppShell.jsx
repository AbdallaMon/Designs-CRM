"use client";

// <AppShell /> — the persistent app chrome (UX plan §1.2): a sticky <TopBar> + a side-nav that
// sits at the inline-START (RTL = right). Responsive:
//   lg+ : permanent full side-nav (labels + icons).
//   md  : permanent icon-RAIL (tooltips).
//   xs/sm: temporary Drawer (anchor="right") toggled from the TopBar menu button.
// The content area pads for the TopBar height and the permanent nav width so nothing is
// obscured (a11y 2.4.11). All authed v2 features render INSIDE this via AuthedAppLayout.
// Single-language Arabic / RTL.

import { useEffect, useState } from "react";
import {
  Box,
  Drawer,
  Toolbar,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { SideNav } from "./SideNav";
import { TopBar } from "./TopBar";

const FULL_WIDTH = 264;
const RAIL_WIDTH = 72;
const COLLAPSE_KEY = "nav:collapsed";

export function AppShell({ children }) {
  const theme = useTheme();
  const lgUp = useMediaQuery(theme.breakpoints.up("lg"));
  const mdUp = useMediaQuery(theme.breakpoints.up("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  // lg-only rail collapse, persisted in localStorage and restored on load. Below lg the
  // collapse toggle is hidden and this flag is ignored (md is always a rail, xs a drawer).
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* localStorage unavailable — keep default */
    }
  }, []);

  const toggleCollapsed = () =>
    setCollapsed((c) => {
      const next = !c;
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* ignore persistence failure */
      }
      return next;
    });

  const permanent = mdUp; // md+ shows a permanent nav (rail at md, full at lg+).
  // lg+: full unless the user collapsed it to a rail. md: always a rail.
  const lgCollapsed = lgUp && collapsed;
  const navWidth = lgUp && !collapsed ? FULL_WIDTH : RAIL_WIDTH;
  const navVariant = lgUp && !collapsed ? "full" : "rail";

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <TopBar
        onMenuToggle={() => setMobileOpen((o) => !o)}
        drawerWidth={navWidth}
        showCollapseToggle={lgUp}
        collapsed={lgCollapsed}
        onToggleCollapse={toggleCollapsed}
      />

      {/* Permanent side-nav (md+). */}
      {permanent && (
        <Drawer
          variant="permanent"
          anchor="right"
          sx={{
            width: navWidth,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: navWidth,
              boxSizing: "border-box",
            },
          }}
        >
          <Toolbar />
          <Box sx={{ overflowY: "auto" }}>
            <SideNav variant={navVariant} />
          </Box>
        </Drawer>
      )}

      {/* Temporary Drawer (xs/sm). */}
      {!permanent && (
        <Drawer
          variant="temporary"
          anchor="right"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            "& .MuiDrawer-paper": { width: FULL_WIDTH, boxSizing: "border-box" },
          }}
        >
          <Toolbar />
          <Box sx={{ overflowY: "auto" }}>
            <SideNav variant="full" onNavigate={() => setMobileOpen(false)} />
          </Box>
        </Drawer>
      )}

      {/* Main content. */}
      <Box component="main" sx={{ flexGrow: 1, minWidth: 0 }}>
        <Toolbar /> {/* spacer so content clears the fixed TopBar (a11y 2.4.11) */}
        <Box sx={{ p: { xs: 2, md: 3 } }}>{children}</Box>
      </Box>
    </Box>
  );
}

export default AppShell;
