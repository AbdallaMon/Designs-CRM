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
  Dialog,
  DialogContent,
  ListItemIcon,
  Tooltip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import {
  MdMenu,
  MdLogout,
  MdPerson,
  MdSearch,
  MdMenuOpen,
} from "react-icons/md";
import { useAuth } from "@/app/v2/providers/AuthProvider";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { LeadSearchAutocomplete } from "@/app/v2/features/leads/components/LeadSearchAutocomplete";
import { buildBreadcrumbs } from "../breadcrumbs";
import { NotificationBell } from "./NotificationBell";
import { RoleChip } from "@/app/v2/shared/components/RoleChip";

export function TopBar({
  onMenuToggle,
  drawerWidth,
  showCollapseToggle = false,
  collapsed = false,
  onToggleCollapse,
}) {
  const theme = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { hasPermission } = usePermission();
  const lgUp = useMediaQuery(theme.breakpoints.up("lg"));

  const crumbs = buildBreadcrumbs(pathname);
  const [anchor, setAnchor] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const canSearchLeads = hasPermission(PERMISSIONS.LEAD.LIST);

  const goToLead = (lead) => {
    if (lead?.id == null) return;
    setSearchOpen(false);
    router.push(`/v2/leads/${lead.id}`);
  };

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

        {/* Rail collapse toggle (lg only): switches the side-nav between full and rail. */}
        {showCollapseToggle && (
          <Tooltip title={collapsed ? "توسيع القائمة" : "طي القائمة"}>
            <IconButton
              edge="start"
              onClick={onToggleCollapse}
              aria-label={collapsed ? "توسيع القائمة الجانبية" : "طي القائمة الجانبية"}
              aria-pressed={collapsed}
            >
              {collapsed ? <MdMenu /> : <MdMenuOpen />}
            </IconButton>
          </Tooltip>
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

        {/* Global lead search — the backbone of hub navigation (UX plan §1). On md+ it sits
            inline (~300-320px) between the breadcrumb and the identity cluster; on xs it
            collapses to a search IconButton that opens a Dialog with the same autocomplete.
            Gated on LEAD.LIST. RTL-correct (logical inline placement). */}
        {canSearchLeads && (
          <>
            <Box
              sx={{
                display: { xs: "none", md: "block" },
                width: 320,
                mx: 1,
              }}
            >
              <LeadSearchAutocomplete onSelect={goToLead} />
            </Box>
            <IconButton
              sx={{ display: { xs: "inline-flex", md: "none" } }}
              onClick={() => setSearchOpen(true)}
              aria-label="بحث عن عميل"
            >
              <MdSearch />
            </IconButton>
            <Dialog
              open={searchOpen}
              onClose={() => setSearchOpen(false)}
              fullWidth
              maxWidth="sm"
              dir="rtl"
            >
              <DialogContent sx={{ pt: 3 }}>
                <LeadSearchAutocomplete onSelect={goToLead} />
              </DialogContent>
            </Dialog>
          </>
        )}

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
          // RTL: the profile button sits at the inline-END (left edge in RTL). Anchoring the
          // menu to the button's inline-START (its RIGHT side) keeps it on-screen; "left"
          // would push it off the viewport. Open downward, aligned to the right edge.
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
      </Toolbar>
    </AppBar>
  );
}

export default TopBar;
