"use client";

// <CommandBar /> — the sticky glass top bar of the new shell. Layout:
//   • inline-START: an optional menu button (xs — opens the mobile workspace drawer) + a
//     prominent Command Palette trigger ("ابحث أو نفّذ أمراً… ⌘K") that opens <CommandPalette>.
//   • inline-END: the identity cluster — <NotificationBell> + <RoleChip> + profile/logout menu.
// The bar is translucent (alpha(paper, 0.84) + backdrop blur) with a bottom divider. No
// breadcrumb (the rail + panel own orientation). The NotificationBell / RoleChip / profile menu
// are LIFTED from the legacy TopBar (same imports/logic). Single-language Arabic / RTL.

import { useState, useMemo } from "react";
import {
  Box,
  IconButton,
  ButtonBase,
  Typography,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  ListItemIcon,
  alpha,
} from "@mui/material";
import { MdMenu, MdSearch, MdLogout, MdPerson } from "react-icons/md";
import { useAuth } from "@/app/v2/providers/AuthProvider";
import { NotificationBell } from "./NotificationBell";
import { RoleChip } from "@/app/v2/shared/components/RoleChip";

const BAR_HEIGHT = 64;

export function CommandBar({
  onOpenPalette,
  onMenuToggle,
  showMenuButton = false,
  activeWorkspaceLabel = null,
  panelCollapsed = false,
}) {
  const { user, logout } = useAuth();
  const [anchor, setAnchor] = useState(null);

  // Platform-aware ⌘K / Ctrl K hint (audit L1): the kbd glyph is Mac-centric. Show "Ctrl K" on
  // non-Mac, "⌘K" on Mac. navigator.platform is deprecated but still the most reliable sync
  // signal here; guarded for SSR (renders the Mac glyph until hydration, then corrects).
  const isMac = useMemo(() => {
    if (typeof navigator === "undefined") return true;
    const p = navigator.platform || navigator.userAgent || "";
    return /Mac|iPhone|iPad|iPod/i.test(p);
  }, []);
  const kbdHint = isMac ? "⌘K" : "Ctrl K";

  // "Where am I" inline title — only when the contextual panel is collapsed (audit M1).
  const showWorkspaceTitle = panelCollapsed && Boolean(activeWorkspaceLabel);

  return (
    <Box
      component="header"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: (t) => t.zIndex.appBar,
        height: BAR_HEIGHT,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: { xs: 1.5, md: 3 },
        // Glass chrome — translucent paper + blur, with a bottom divider.
        bgcolor: (t) => alpha(t.palette.background.paper, 0.84),
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      {showMenuButton && (
        <IconButton
          edge="start"
          onClick={onMenuToggle}
          aria-label="فتح قائمة مساحات العمل"
        >
          <MdMenu />
        </IconButton>
      )}

      {/* Persistent "where am I" title (audit M1) — shown at the inline-start, next to the
          menu/search trigger, ONLY while the contextual panel is collapsed (otherwise the panel
          header already states the workspace). Subtle, static, RTL. */}
      {showWorkspaceTitle && (
        <Typography
          component="h1"
          variant="subtitle2"
          noWrap
          sx={{
            color: "text.primary",
            fontWeight: 600,
            display: { xs: "none", sm: "block" },
            maxWidth: 180,
          }}
        >
          {activeWorkspaceLabel}
        </Typography>
      )}

      {/* Command palette trigger — prominent, at the inline-start. */}
      <ButtonBase
        onClick={onOpenPalette}
        aria-label="ابحث عن عميل أو صفحة أو أمر"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          height: 40,
          px: 1.5,
          borderRadius: 2,
          border: 1,
          borderColor: "divider",
          bgcolor: (t) => alpha(t.palette.action.selected, 0.4),
          color: "text.secondary",
          width: { xs: "auto", sm: 360 },
          justifyContent: "flex-start",
          transition: (t) =>
            t.transitions.create(["border-color", "background-color"], {
              duration: 180,
            }),
          "&:hover": {
            borderColor: "primary.main",
            bgcolor: (t) => alpha(t.palette.primary.main, 0.06),
          },
        }}
      >
        <MdSearch size={18} />
        <Typography
          variant="body2"
          sx={{ flex: 1, textAlign: "start", color: "inherit" }}
          noWrap
        >
          ابحث عن عميل أو صفحة أو أمر…
        </Typography>
        <Box
          component="kbd"
          sx={{
            display: { xs: "none", sm: "inline-flex" },
            alignItems: "center",
            px: 0.75,
            py: 0.25,
            borderRadius: 1,
            border: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
            fontSize: "0.7rem",
            fontFamily: "monospace",
            color: "text.secondary",
            whiteSpace: "nowrap",
          }}
        >
          {kbdHint}
        </Box>
      </ButtonBase>

      <Box sx={{ flex: 1 }} />

      {/* Identity cluster (inline-END) — lifted from the legacy TopBar. */}
      <NotificationBell />
      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <RoleChip />
      </Box>
      <IconButton
        onClick={(e) => setAnchor(e.currentTarget)}
        size="small"
        aria-label="حساب المستخدم"
        aria-haspopup="true"
      >
        <Avatar src={user?.profilePicture ?? undefined} sx={{ width: 32, height: 32 }}>
          <MdPerson />
        </Avatar>
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        // RTL: the profile button sits at the inline-END (left edge in RTL). Anchor the menu to
        // the button's right side so it stays on-screen (mirrors the legacy TopBar).
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="body2" noWrap>
            {user?.name ?? "—"}
          </Typography>
          <Box sx={{ mt: 0.5 }}>
            <RoleChip />
          </Box>
        </Box>
        <Divider />
        <MenuItem
          onClick={() => {
            setAnchor(null);
            logout?.();
          }}
        >
          <ListItemIcon>
            <MdLogout />
          </ListItemIcon>
          تسجيل الخروج
        </MenuItem>
      </Menu>
    </Box>
  );
}

export default CommandBar;
