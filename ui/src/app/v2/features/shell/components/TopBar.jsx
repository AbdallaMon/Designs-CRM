"use client";

// <TopBar /> — the persistent top context bar (UX plan §1.2). Holds: a menu toggle (xs/md),
// the logo, the breadcrumb (group ‹ page ‹ record from usePathname), and an end-aligned identity
// cluster: <NotificationBell> (live unread), the <RoleChip> ("who am I"), and a profile/logout
// menu. Sticky; the content area pads for it so focus isn't obscured (a11y 2.4.11).
// Single-language Arabic / RTL.

import { useState } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Typography,
  Breadcrumbs,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  ListItemIcon,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { usePathname } from "next/navigation";
import { MdMenu, MdLogout, MdPerson } from "react-icons/md";
import { useAuth } from "@/app/v2/providers/AuthProvider";
import { buildBreadcrumbs } from "../breadcrumbs";
import { NotificationBell } from "./NotificationBell";
import { RoleChip } from "@/app/v2/shared/components/RoleChip";

export function TopBar({ onMenuToggle, drawerWidth }) {
  const theme = useTheme();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const lgUp = useMediaQuery(theme.breakpoints.up("lg"));

  const crumbs = buildBreadcrumbs(pathname);
  const [anchor, setAnchor] = useState(null);

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: (t) => t.zIndex.drawer + 1,
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Toolbar sx={{ gap: 1.5 }}>
        {/* Menu toggle: visible below lg (rail/drawer modes need it). */}
        {!lgUp && (
          <IconButton edge="start" onClick={onMenuToggle} aria-label="فتح القائمة">
            <MdMenu />
          </IconButton>
        )}

        <Typography
          variant="h6"
          component="span"
          sx={{ fontWeight: 700, color: "primary.textOnLight", whiteSpace: "nowrap" }}
        >
          Dream Studio
        </Typography>

        <Box sx={{ mx: 1, display: { xs: "none", sm: "block" }, minWidth: 0 }}>
          {crumbs.length > 0 && (
            <Breadcrumbs aria-label="مسار التنقل" sx={{ "& .MuiBreadcrumbs-li": { minWidth: 0 } }}>
              {crumbs.map((c, i) => (
                <Typography
                  key={i}
                  variant="body2"
                  color={i === crumbs.length - 1 ? "text.primary" : "text.secondary"}
                  noWrap
                >
                  {c.label}
                </Typography>
              ))}
            </Breadcrumbs>
          )}
        </Box>

        <Box sx={{ flex: 1 }} />

        {/* Identity cluster (inline-END). */}
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
          <Avatar
            src={user?.profilePicture ?? undefined}
            sx={{ width: 32, height: 32 }}
          >
            <MdPerson />
          </Avatar>
        </IconButton>
        <Menu
          anchorEl={anchor}
          open={Boolean(anchor)}
          onClose={() => setAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
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
      </Toolbar>
    </AppBar>
  );
}

export default TopBar;
