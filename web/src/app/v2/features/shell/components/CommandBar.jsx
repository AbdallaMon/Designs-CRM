"use client";

// <CommandBar /> — the sticky glass top bar of the new shell. Layout:
//   • inline-START: an optional menu button (xs — opens the mobile workspace drawer) + a
//     prominent Command Palette trigger ("ابحث أو نفّذ أمراً… ⌘K") that opens <CommandPalette>.
//   • inline-END: the identity cluster — <NotificationBell> + <RoleChip> + profile/logout menu.
// The bar is translucent (alpha(paper, 0.84) + backdrop blur) with a bottom divider. No
// breadcrumb (the rail + panel own orientation). The NotificationBell / RoleChip / profile menu
// are LIFTED from the legacy TopBar (same imports/logic). Single-language Arabic / RTL.

import { useState } from "react";
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

export function CommandBar({ onOpenPalette, onMenuToggle, showMenuButton = false }) {
  const { user, logout } = useAuth();
  const [anchor, setAnchor] = useState(null);

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

      {/* Command palette trigger — prominent, at the inline-start. */}
      <ButtonBase
        onClick={onOpenPalette}
        aria-label="افتح لوحة الأوامر"
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
          ابحث أو نفّذ أمراً…
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
          }}
        >
          ⌘K
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
