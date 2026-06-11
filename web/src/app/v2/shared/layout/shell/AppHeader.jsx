"use client";

// <AppHeader /> — the sticky, glassy top bar that lives INSIDE the content column (next to the
// sidebar), modeled on the reference's Header. Layout (RTL):
//   • inline-START: a collapse / menu IconButton (mobile → toggles the temporary drawer; desktop →
//     toggles the collapsed rail).
//   • center: breadcrumbs (group ‹ page ‹ record) derived from the path — reused from
//     features/shell/breadcrumbs; skipped when there are none.
//   • inline-END: the identity cluster — <NotificationBell> + <RoleChip> + profile/logout menu.
//     These are LIFTED VERBATIM (same imports/logic) from the retired <CommandBar>.
// Glass chrome: translucent paper + backdrop blur + bottom divider + a subtle elevation.
// Single-language Arabic / RTL.

import { useState } from "react";
import {
  Avatar,
  Box,
  Breadcrumbs,
  Divider,
  IconButton,
  Link as MuiLink,
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { HiOutlineMenuAlt3 } from "react-icons/hi";
import { LuPanelLeftClose, LuPanelLeftOpen } from "react-icons/lu";
import { MdLogout, MdPerson, MdNavigateNext } from "react-icons/md";
import { useAuth } from "@/app/v2/providers/AuthProvider";
import { NotificationBell } from "@/app/v2/features/shell/components/NotificationBell";
import { RoleChip } from "@/app/v2/shared/components/RoleChip";
import { buildBreadcrumbs } from "@/app/v2/features/shell/breadcrumbs";
import { useT } from "@/app/v2/lib/i18n/I18nProvider";
import { LanguageSwitcher } from "@/app/v2/shared/components/LanguageSwitcher";

export function AppHeader({ collapsed = false, isMobile = false, mobileOpen = false, onToggle }) {
  const theme = useTheme();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t, lang } = useT();
  const [anchor, setAnchor] = useState(null);

  // On mobile the same button shows a menu icon; on desktop a collapse/expand icon.
  const tooltip = isMobile
    ? mobileOpen
      ? t("shell.menu.close", "إغلاق القائمة")
      : t("shell.menu.open", "فتح القائمة")
    : collapsed
      ? t("shell.rail.expand", "توسيع القائمة")
      : t("shell.rail.collapse", "طيّ القائمة");

  const crumbs = buildBreadcrumbs(pathname, lang);

  return (
    <Box
      component="header"
      sx={(t) => ({
        position: "sticky",
        top: 0,
        zIndex: t.zIndex.appBar,
        minHeight: { xs: 64, md: 72 },
        display: "flex",
        alignItems: "center",
        gap: 2,
        px: { xs: 1.5, sm: 2, md: 3 },
        py: { xs: 1, md: 1.5 },
        borderBottom: `1px solid ${t.palette.divider}`,
        bgcolor: alpha(t.palette.background.paper, 0.84),
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        boxShadow: t.shadows[1],
      })}
    >
      <Tooltip title={tooltip} arrow>
        <IconButton
          onClick={onToggle}
          aria-label={tooltip}
          sx={(t) => ({
            flexShrink: 0,
            width: { xs: 42, md: 44 },
            height: { xs: 42, md: 44 },
            borderRadius: 2.5,
            color: "text.primary",
            border: `1px solid ${t.palette.divider}`,
          })}
        >
          {isMobile ? (
            <HiOutlineMenuAlt3 size={23} />
          ) : collapsed ? (
            <LuPanelLeftOpen size={22} />
          ) : (
            <LuPanelLeftClose size={22} />
          )}
        </IconButton>
      </Tooltip>

      {/* Breadcrumbs — group ‹ page ‹ record. Last crumb is the current page (no link). */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {crumbs.length > 0 && (
          <Breadcrumbs
            separator={<MdNavigateNext size={16} style={{ transform: "scaleX(-1)" }} />}
            aria-label={t("shell.breadcrumb.aria", "مسار التنقل")}
            sx={{ "& .MuiBreadcrumbs-ol": { flexWrap: "nowrap" } }}
          >
            {crumbs.map((crumb, i) => {
              const isLast = i === crumbs.length - 1;
              if (crumb.href && !isLast) {
                return (
                  <MuiLink
                    key={i}
                    component={NextLink}
                    href={crumb.href}
                    underline="hover"
                    color="text.secondary"
                    sx={{ fontSize: "0.875rem", whiteSpace: "nowrap" }}
                  >
                    {crumb.label}
                  </MuiLink>
                );
              }
              return (
                <Typography
                  key={i}
                  variant="body2"
                  noWrap
                  sx={{
                    color: isLast ? "text.primary" : "text.secondary",
                    fontWeight: isLast ? 700 : 500,
                  }}
                >
                  {crumb.label}
                </Typography>
              );
            })}
          </Breadcrumbs>
        )}
      </Box>

      {/* Identity cluster (inline-END) — lifted from the retired CommandBar, plus the bilingual
          language switcher (ع / EN). */}
      <Stack direction="row" alignItems="center" spacing={1}>
        <LanguageSwitcher />
        <NotificationBell />
        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <RoleChip />
        </Box>
        <IconButton
          onClick={(e) => setAnchor(e.currentTarget)}
          size="small"
          aria-label={t("shell.account.aria", "حساب المستخدم")}
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
            {t("shell.logout", "تسجيل الخروج")}
          </MenuItem>
        </Menu>
      </Stack>
    </Box>
  );
}

export default AppHeader;
