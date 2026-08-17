"use client";
import { PROFILES } from "@dms/shared";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import {
  AppBar,
  Avatar,
  Box,
  ButtonBase,
  Divider,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { FiMenu } from "react-icons/fi";
import colors from "@/app/helpers/colors";
import {
  FiGrid,
  FiUsers,
  FiTarget,
  FiDollarSign,
  FiClock,
  FiList,
  FiFileText,
  FiTrendingUp,
  FiBriefcase,
  FiShoppingCart,
  FiHome,
  FiTrendingDown,
  FiImage,
  FiCalendar,
  FiActivity,
  FiLayers,
  FiCreditCard,
  FiGlobe,
  FiUserCheck,
  FiSunrise,
} from "react-icons/fi";

import SideNav, {
  SIDENAV_COLLAPSED_WIDTH,
  SIDENAV_EXPANDED_WIDTH,
} from "@/shared/components/utility/SideNav.jsx";
import RouteGuard from "@/shared/components/utility/RouteGuard.jsx";
import NotificationsIcon from "@/shared/components/utility/NotificationIcon.jsx";
import ProfileSwitcher from "@/features/users/ProfileSwitcher";
import { activeProfileLabel, currentProfileLabel } from "@/app/helpers/profiles";
import ProfileDialogTrigger from "@/features/users/profile/ProfileDialogTrigger";
import ProfileDialog from "@/features/users/profile/ProfileDialog.jsx";
import Logout from "@/shared/components/buttons/Logout.jsx";
import SocketProvider from "@/app/providers/SocketProvider";
import ChatWidget from "@/features/chat/components/chat/ChatWidget";
import { resolveCurrentPage } from "./resolveCurrentPage.js";

const SIDENAV_COLLAPSED_KEY = "sidenav-collapsed";

// Client-side icon lookup for the backend-driven nav (`navigationTabs` carries
// no icons — see packages/shared/constants/access/navigation.js). Keyed by the
// same `key` NAVIGATION emits. Every key gets a DISTINCT icon so the rail is
// scannable (work-stages/payments no longer share the deals dollar sign;
// website-utilities no longer shares the rents home).
const ICON_BY_KEY = {
  dashboard: <FiGrid size={20} />,
  "my-day": <FiSunrise size={20} />,
  "audit-logs": <FiActivity size={20} />,
  "users-admin": <FiUsers size={20} />,
  "users-super-sales": <FiUsers size={20} />,
  leads: <FiTarget size={20} />,
  deals: <FiDollarSign size={20} />,
  "work-stages": <FiLayers size={20} />,
  reports: <FiFileText size={20} />,
  "image-sessions": <FiImage size={20} />,
  calendar: <FiCalendar size={20} />,
  payments: <FiCreditCard size={20} />,
  "website-utilities": <FiGlobe size={20} />,
  "executor-leads": <FiTarget size={20} />,
  "executor-work-stage": <FiBriefcase size={20} />,
  "accountant-payments": <FiCreditCard size={20} />,
  "operational-expenses": <FiShoppingCart size={20} />,
  rents: <FiHome size={20} />,
  salaries: <FiUserCheck size={20} />,
  outcome: <FiTrendingDown size={20} />,
  "contact-initiator-leads": <FiTarget size={20} />,
};

// Display-only grouping of nav tabs by `key`. Purely presentational — the
// backend `navigationTabs` stays the single source of WHICH links exist and
// in what order; this map only decides which section label a link renders
// under. Group order = first appearance in the backend-ordered tab list.
const SECTION_BY_KEY = {
  dashboard: "overview",
  "my-day": "overview",
  leads: "sales",
  "contact-initiator-leads": "sales",
  "executor-leads": "sales",
  deals: "sales",
  "work-stages": "projects",
  "image-sessions": "projects",
  calendar: "projects",
  "executor-work-stage": "projects",
  payments: "finance",
  "accountant-payments": "finance",
  "operational-expenses": "finance",
  rents: "finance",
  salaries: "finance",
  outcome: "finance",
  "users-admin": "admin",
  "users-super-sales": "admin",
  reports: "admin",
  "audit-logs": "admin",
  "website-utilities": "admin",
};

const SECTION_LABELS = {
  overview: "Overview",
  sales: "Sales",
  projects: "Projects",
  finance: "Finance",
  admin: "Admin",
  general: "General",
};

// Fixed display order of the groups: day-to-day work (sales, projects) right
// after the dashboard; admin utilities last. Links inside a group keep their
// backend order.
const GROUP_ORDER = [
  "overview",
  "sales",
  "projects",
  "finance",
  "admin",
  "general",
];

// Bucket the flat (already-mapped) links into display groups for SideNav,
// ordered by GROUP_ORDER.
function groupLinks(links) {
  const bySection = new Map();
  for (const link of links) {
    const sectionKey = SECTION_BY_KEY[link.key] ?? "general";
    let group = bySection.get(sectionKey);
    if (!group) {
      group = {
        key: sectionKey,
        label: SECTION_LABELS[sectionKey],
        items: [],
      };
      bySection.set(sectionKey, group);
    }
    group.items.push(link);
  }
  return GROUP_ORDER.filter((key) => bySection.has(key)).map((key) =>
    bySection.get(key)
  );
}

// Roles whose legacy "Dashboard" top-level link renders FiTarget instead of
// FiGrid (threeDLinks / twoDLinks in the pre-change arrays above).
const DASHBOARD_TARGET_PROFILES = new Set([PROFILES.DESIGNER_3D, PROFILES.DESIGNER_2D]);

// Resolve the client-only icon for a top-level nav tab by `key`, honoring the
// one role-dependent exception: the "dashboard" key renders FiTarget for
// 3D/2D designers (matching threeDLinks/twoDLinks) and FiGrid otherwise.
function resolveTopIcon(key, profile) {
  if (key === "dashboard" && DASHBOARD_TARGET_PROFILES.has(profile)) {
    return <FiTarget size={20} />;
  }
  return ICON_BY_KEY[key];
}

// Map a sub-link { label, href, active } (from navigationTabs) to SideNav's
// shape. Sub-links render as icon-less tree rows (dot marker) in SideNav, so
// no icon is attached.
function mapSubLink(s) {
  return {
    name: s.label,
    href: s.href,
    ...(s.active ? { active: s.active } : {}),
  };
}

// Map a top-level nav tab { key, label, href, active, subLinks } (from
// navigationTabs) to the { key, name, href, icon, active, subLinks } shape
// SideNav expects, attaching the client-only icon by `key` (role-aware for
// "dashboard"). `key` is kept for section grouping (groupLinks).
function mapNavigationTab(tab, profile) {
  return {
    key: tab.key,
    name: tab.label,
    href: tab.href,
    icon: resolveTopIcon(tab.key, profile),
    ...(tab.active ? { active: tab.active } : {}),
    ...(tab.subLinks?.length ? { subLinks: tab.subLinks.map(mapSubLink) } : {}),
  };
}

// Derive the rendered sidebar links from the backend-owned `navigationTabs`,
// which now follow the ACTIVE PROFILE (auth.dto.toMe → navRole). This is the
// SINGLE source for both the sidebar and RouteGuard, so they never diverge. The
// old client-side `linksForRole(user.profile)` override is gone — it desynced the
// sidebar from RouteGuard and pinned nav to a stale role.
function resolveLinks(user) {
  return (user?.navigationTabs ?? []).map((tab) => mapNavigationTab(tab, user?.profile));
}

// Prefer the active profile's own label (from /auth/me profiles[]); fall back to the
// derived role for unmigrated accounts. Keeps the drawer footer in step with the chip.
function profileLabel(user, profiles, currentProfileId) {
  return activeProfileLabel(profiles, currentProfileId) ?? currentProfileLabel(user);
}

function userInitials(user) {
  const source = user?.name || user?.email || "";
  const parts = source.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0][0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] || "" : "";
  return (first + last).toUpperCase();
}

// Identity footer pinned at the bottom of the drawer: avatar + name + role.
// Clicking opens the same ProfileDialog as the AppBar trigger, with the same
// `profileOpen` query-param behavior (the AppBar trigger stays untouched).
// Lives here (not in SideNav) because SideNav is a shared utility and must
// not import from features/users.
function DrawerUserFooter({ user, label, collapsed }) {
  const [open, setOpen] = useState(false);

  const openProfile = () => {
    const newUrl = new URL(window.location);
    newUrl.searchParams.set("profileOpen", "true");
    window.history.replaceState({}, "", newUrl);
    setOpen(true);
  };

  const closeProfile = () => {
    const newUrl = new URL(window.location);
    newUrl.searchParams.delete("profileOpen");
    window.history.replaceState({}, "", newUrl);
    setOpen(false);
  };

  const button = (
    <ButtonBase
      onClick={openProfile}
      aria-label="Profile"
      sx={{
        width: "100%",
        borderRadius: 2,
        p: 0.75,
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "flex-start",
        gap: 1,
        textAlign: "start",
        transition: "background-color .15s ease",
        "&:hover": { backgroundColor: colors.primaryAlt },
      }}
    >
      <Avatar
        sx={{
          width: 32,
          height: 32,
          fontSize: "0.8rem",
          fontWeight: 600,
          bgcolor: colors.primary,
          color: colors.textOnPrimary,
        }}
      >
        {userInitials(user)}
      </Avatar>
      {!collapsed && (
        <Box sx={{ minWidth: 0 }}>
          <Typography
            noWrap
            sx={{
              fontSize: "0.85rem",
              fontWeight: 600,
              color: colors.textPrimary,
              lineHeight: 1.3,
            }}
          >
            {user.name || user.email}
          </Typography>
          {label && (
            <Typography
              noWrap
              sx={{
                fontSize: "0.72rem",
                color: colors.textTertiary,
                lineHeight: 1.3,
              }}
            >
              {label}
            </Typography>
          )}
        </Box>
      )}
    </ButtonBase>
  );

  return (
    <>
      {collapsed ? (
        <Tooltip
          title={`${user.name || user.email} — Profile`}
          placement="right"
          arrow
        >
          {button}
        </Tooltip>
      ) : (
        button
      )}
      <ProfileDialog open={open} onClose={closeProfile} userId={user.id} />
    </>
  );
}

export default function Layout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  let { user, isLoggedIn, validatingAuth, profiles, currentProfileId } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Collapsed state persisted in localStorage; shared by the drawer + the
  // content offset so they always stay in sync.
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(SIDENAV_COLLAPSED_KEY);
    if (stored == null) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setCollapsed(stored === "true");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggleCollapsed = (next) => {
    setCollapsed((prev) => {
      const value = typeof next === "boolean" ? next : !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(SIDENAV_COLLAPSED_KEY, String(value));
      }
      return value;
    });
  };

  // Session validation is SILENT — no per-page "validating/validated" toast. On a real
  // logout (not logged in once validation settles) we redirect to /login; the redirect is
  // the feedback, so no toast noise on every dashboard page.
  useEffect(() => {
    if (!isLoggedIn && !validatingAuth) {
      window.localStorage.setItem("redirect", window.location.pathname);
      router.push("/login");
    }
  }, [isLoggedIn, router, validatingAuth]);
  if (!user || !user.profile) return null;

  const links = resolveLinks(user);
  const navGroups = groupLinks(links);
  const currentPage = resolveCurrentPage(links, pathname);
  const userRoleLabel = profileLabel(user, profiles, currentProfileId);
  // Desktop content sits next to the permanent drawer; mobile has none.
  const drawerWidth = isMobile
    ? 0
    : collapsed
      ? SIDENAV_COLLAPSED_WIDTH
      : SIDENAV_EXPANDED_WIDTH;

  return (
    <SocketProvider>
      <Box sx={{ display: "flex", backgroundColor: colors.bgSecondary }}>
        <SideNav
          groups={navGroups}
          collapsed={collapsed}
          onToggleCollapsed={handleToggleCollapsed}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
          isMobile={isMobile}
          footer={
            <DrawerUserFooter
              user={user}
              label={userRoleLabel}
              collapsed={!isMobile && collapsed}
            />
          }
        />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            minWidth: 0,
            width: { md: `calc(100% - ${drawerWidth}px)` },
            transition: "width .2s ease",
          }}
        >
          <AppBar
            position="sticky"
            elevation={0}
            sx={{
              backgroundColor: colors.paperBg,
              color: colors.textPrimary,
              borderBottom: `1px solid ${colors.borderLight}`,
            }}
          >
            <Toolbar
              variant="dense"
              sx={{
                minHeight: 56,
                display: "flex",
                justifyContent: "space-between",
                gap: 1,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  minWidth: 0,
                  gap: 1,
                }}
              >
                {isMobile && (
                  <IconButton
                    edge="start"
                    aria-label="Open menu"
                    onClick={() => setMobileOpen(true)}
                    sx={{ color: colors.textSecondary }}
                  >
                    <FiMenu size={22} />
                  </IconButton>
                )}
                {currentPage && (
                  <Typography
                    variant="subtitle1"
                    component="h1"
                    noWrap
                    sx={{
                      fontWeight: 600,
                      color: colors.textPrimary,
                      minWidth: 0,
                    }}
                  >
                    {currentPage.section && (
                      <Box
                        component="span"
                        sx={{
                          color: colors.textTertiary,
                          fontWeight: 400,
                          display: { xs: "none", sm: "inline" },
                        }}
                      >
                        {currentPage.section}
                        <Box
                          component="span"
                          sx={{ mx: 0.75, color: colors.textMuted }}
                        >
                          ›
                        </Box>
                      </Box>
                    )}
                    {currentPage.page}
                  </Typography>
                )}
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: { xs: 0.5, sm: 1 },
                }}
              >
                <ProfileSwitcher />
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{
                    my: 1,
                    borderColor: colors.borderLight,
                    display: { xs: "none", sm: "block" },
                  }}
                />
                <NotificationsIcon />
                <ProfileDialogTrigger userId={user.id} />
                <Logout fit />
              </Box>
            </Toolbar>
          </AppBar>

          <Box
            sx={{
              minHeight: "calc(100vh - 56px)",
              backgroundColor: colors.bgSecondary,
            }}
          >
            <RouteGuard>{children}</RouteGuard>
          </Box>
        </Box>

        <ChatWidget />
      </Box>
    </SocketProvider>
  );
}
