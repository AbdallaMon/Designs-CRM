"use client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import {
  AppBar,
  Avatar,
  Box,
  ButtonBase,
  Chip,
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
import SignInWithDifferentUserRole from "@/features/users/UserRoles";
import ProfileDialogTrigger from "@/features/users/profile/ProfileDialogTrigger";
import ProfileDialog from "@/features/users/profile/ProfileDialog.jsx";
import Logout from "@/shared/components/buttons/Logout.jsx";
import SocketProvider from "@/app/providers/SocketProvider";
import ChatWidget from "@/features/chat/components/chat/ChatWidget";

const SIDENAV_COLLAPSED_KEY = "sidenav-collapsed";

export const adminLinks = [
  { name: "Dashboard", href: "/dashboard", icon: <FiGrid size={20} /> },
  { name: "Users", href: "/dashboard/users", icon: <FiUsers size={20} /> },
  { name: "Leads", href: "/dashboard/leads", icon: <FiTarget size={20} /> },
  {
    name: "Deals",
    href: "/dashboard/deals",
    active: "deals",
    icon: <FiDollarSign size={20} />,
    subLinks: [
      {
        name: "Current Deals",
        href: "/dashboard/deals",
        active: "deals",
        icon: <FiDollarSign size={20} />,
      },
      {
        name: "On hold Deals",
        href: "/dashboard/on-hold-deals",
        icon: <FiClock size={18} />,
        active: "on-hold",
      },
      {
        name: "All Deals",
        href: "/dashboard/all-deals",
        icon: <FiList size={18} />,
        active: "all-deals",
      },
    ],
  },
  {
    name: "Work stages",
    href: "/dashboard/work-stages",
    active: "work",
    icon: <FiDollarSign size={20} />,
    subLinks: [
      {
        name: "All projects",
        href: "/dashboard/projects",
        icon: <FiBriefcase size={20} />,
      },
      {
        name: "Plan study department",
        href: "/dashboard/work-stages/study",
        icon: <FiBriefcase size={20} />,
      },
      {
        name: "3D Work stage",
        href: "/dashboard/work-stages",
        icon: <FiBriefcase size={20} />,
      },
      {
        name: "Final plan department",
        href: "/dashboard/work-stages/final-plan",
        icon: <FiBriefcase size={20} />,
      },
      {
        name: "Quantity calcualtion department",
        href: "/dashboard/work-stages/quantity",
        icon: <FiBriefcase size={20} />,
      },
      {
        name: "Archived projects",
        href: "/dashboard/projects/archived",
        icon: <FiBriefcase size={20} />,
      },
      {
        name: "3D Modifcation",
        href: "/dashboard/work-stages/modification",
        icon: <FiBriefcase size={20} />,
      },
    ],
  },

  {
    name: "Reports",
    href: "/dashboard/report",
    active: "report",
    icon: <FiFileText size={20} />, // General report icon
    subLinks: [
      {
        name: "Leads report",
        href: "/dashboard/report",
        active: "report",
        icon: <FiTrendingUp size={20} />, // Icon representing trends or growth for leads
      },
      {
        name: "Staff report",
        href: "/dashboard/report/staff",
        icon: <FiUsers size={18} />, // Icon representing a group of people for staff
        active: "report/staff",
      },
    ],
  },
  {
    name: "Images session gallery",
    href: "/dashboard/image-sessions",
    icon: <FiImage size={20} />,
  },
  {
    name: "Calendar",
    href: "/dashboard/calendar",
    icon: <FiCalendar size={20} />,
  },
  {
    name: "Payments",
    href: "/dashboard/payments",
    icon: <FiDollarSign size={20} />,
  },
  {
    name: "Website utilities",
    href: "/dashboard/website-utilities",
    icon: <FiHome size={20} />,
  },
];

export const superAdminLinks = adminLinks;
// Regular user navigation links
export const staffLinks = [
  { name: "Dashboard", href: "/dashboard", icon: <FiGrid size={20} /> },
  { name: "Leads", href: "/dashboard/leads", icon: <FiTarget size={20} /> },
  {
    name: "Deals",
    href: "/dashboard/deals",
    icon: <FiDollarSign size={20} />,
    subLinks: [
      {
        name: "Current Deals",
        href: "/dashboard/deals",
        icon: <FiDollarSign size={20} />,
        active: "deals",
      },
      {
        name: "On hold Deals",
        href: "/dashboard/on-hold-deals",
        icon: <FiClock size={18} />,
        active: "on-hold",
      },
      {
        name: "All Deals",
        href: "/dashboard/all-deals",
        icon: <FiList size={18} />,
        active: "all-deals",
      },
    ],
  },
  {
    name: "Calendar",
    href: "/dashboard/calendar",
    icon: <FiCalendar size={20} />,
  },
  {
    name: "Payments",
    href: "/dashboard/payments",
    icon: <FiDollarSign size={20} />,
  },
];
export const contactInitiatorLinks = [
  { name: "Leads", href: "/dashboard", icon: <FiTarget size={20} /> },
];
export const superSalesLinks = [
  ...staffLinks,
  { name: "Users", href: "/dashboard/users", icon: <FiUsers size={20} /> },
];
export const threeDLinks = [
  { name: "Dashboard", href: "/dashboard", icon: <FiTarget size={20} /> },
  {
    name: "Work stages",
    href: "/dashboard/work-stages",
    active: "work",
    icon: <FiDollarSign size={20} />,
    subLinks: [
      {
        name: "3D Work stage",
        href: "/dashboard/work-stages",
        icon: <FiBriefcase size={20} />,
      },
      {
        name: "Modifcation stage",
        href: "/dashboard/modification",
        icon: <FiBriefcase size={20} />,
      },
      {
        name: "Archived projects",
        href: "/dashboard/archived",
        icon: <FiBriefcase size={20} />,
      },
    ],
  },
];
export const twoDLinks = [
  { name: "Dashboard", href: "/dashboard", icon: <FiTarget size={20} /> },
  {
    name: "Work stages",
    href: "/dashboard/work-stages",
    active: "work",
    icon: <FiDollarSign size={20} />,
    subLinks: [
      {
        name: "Plan study department",
        href: "/dashboard/study",
        icon: <FiBriefcase size={20} />,
      },

      {
        name: "Final plan department",
        href: "/dashboard/final-plan",
        icon: <FiBriefcase size={20} />,
      },
      {
        name: "Quantity calcualtion department",
        href: "/dashboard/quantity",
        icon: <FiBriefcase size={20} />,
      },
      {
        name: "Archived projects",
        href: "/dashboard/archived",
        icon: <FiBriefcase size={20} />,
      },
    ],
  },
];
export const exacuterLinks = [
  { name: "Leads", href: "/dashboard", icon: <FiTarget size={20} /> },
  {
    name: "Work stage",
    href: "/dashboard/work-stages",
    icon: <FiBriefcase size={20} />,
  },
];

export const accountantLinks = [
  { name: "Payments", href: "/dashboard", icon: <FiDollarSign size={20} /> }, // Dollar sign for payments

  {
    name: "Operational Expenses",
    href: "/dashboard/operational-expenses",
    icon: <FiShoppingCart size={20} />, // Shopping cart for expenses
  },
  {
    name: "Rents",
    href: "/dashboard/rents",
    icon: <FiHome size={20} />, // Home icon for rents
  },
  {
    name: "Salaries",
    href: "/dashboard/salaries",
    icon: <FiUsers size={20} />, // Users for salaries (employees)
  },
  {
    name: "Outstanding Payments",
    href: "/dashboard/outcome",
    icon: <FiTrendingDown size={20} />, // Trending down for outstanding payments
  },
];

export function linksForRole(user) {
  const role = user?.role;
  if (role === "ADMIN") return adminLinks;
  if (role === "STAFF")
    return user.profile === "SUPER_SALES" ? superSalesLinks : staffLinks;
  if (role === "THREE_D_DESIGNER") return threeDLinks;
  if (role === "TWO_D_DESIGNER") return twoDLinks;
  if (role === "ACCOUNTANT") return accountantLinks;
  if (role === "TWO_D_EXECUTOR") return exacuterLinks;
  if (role === "CONTACT_INITIATOR") return contactInitiatorLinks;
  if (role === "SUPER_SALES") return superSalesLinks;
  return adminLinks;
}

// Client-side icon lookup for the backend-driven nav (`navigationTabs` carries
// no icons — see packages/shared/constants/access/navigation.js). Keyed by the
// same `key` NAVIGATION emits. Every key gets a DISTINCT icon so the rail is
// scannable (work-stages/payments no longer share the deals dollar sign;
// website-utilities no longer shares the rents home).
const ICON_BY_KEY = {
  dashboard: <FiGrid size={20} />,
  "command-center": <FiActivity size={20} />,
  "my-day": <FiSunrise size={20} />,
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
  "command-center": "overview",
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
const DASHBOARD_TARGET_ROLES = new Set(["THREE_D_DESIGNER", "TWO_D_DESIGNER"]);

// Resolve the client-only icon for a top-level nav tab by `key`, honoring the
// one role-dependent exception: the "dashboard" key renders FiTarget for
// 3D/2D designers (matching threeDLinks/twoDLinks) and FiGrid otherwise.
function resolveTopIcon(key, role) {
  if (key === "dashboard" && DASHBOARD_TARGET_ROLES.has(role)) {
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
function mapNavigationTab(tab, role) {
  return {
    key: tab.key,
    name: tab.label,
    href: tab.href,
    icon: resolveTopIcon(tab.key, role),
    ...(tab.active ? { active: tab.active } : {}),
    ...(tab.subLinks?.length ? { subLinks: tab.subLinks.map(mapSubLink) } : {}),
  };
}

// Same target shape, but from the legacy client-side link arrays (used only
// for the dev role-override fallback below, since navigationTabs reflects the
// REAL backend role and won't match an overridden one). The legacy arrays
// already carry the correct (role-specific) icon directly, so no lookup is
// needed here for either top-level or sub-link icons.
function mapLegacyLink(link) {
  return {
    name: link.name,
    href: link.href,
    icon: link.icon,
    ...(link.active ? { active: link.active } : {}),
    ...(link.subLinks?.length
      ? {
          subLinks: link.subLinks.map((s) => ({
            name: s.name,
            href: s.href,
            icon: s.icon,
            ...(s.active ? { active: s.active } : {}),
          })),
        }
      : {}),
  };
}

// Is the dev role-switcher override active for this user? Mirrors the exact
// condition AuthProvider uses to patch `user.role` from localStorage — when
// active, `navigationTabs` (computed server-side from the REAL role) no
// longer matches what should render, so we fall back to the client-side
// `linksForRole` arrays (which honor the overridden role).
function isRoleOverrideActive(user) {
  if (typeof window === "undefined") return false;
  const overrideRole = window.localStorage.getItem("role");
  const overrideUserId = window.localStorage.getItem("userId");
  return Boolean(
    overrideRole &&
      overrideUserId &&
      user?.id === parseInt(overrideUserId)
  );
}

// Derive the rendered sidebar links from the backend-owned `navigationTabs`,
// which now follow the ACTIVE PROFILE (auth.dto.toMe → navRole). This is the
// SINGLE source for both the sidebar and RouteGuard, so they never diverge. The
// old client-side `linksForRole(user.role)` override is gone — it desynced the
// sidebar from RouteGuard and pinned nav to a stale role.
function resolveLinks(user) {
  return (user?.navigationTabs ?? []).map((tab) => mapNavigationTab(tab, user?.role));
}

// Mirror SideNav's matching so the AppBar title agrees with the active nav item.
function matchLink(link, pathname) {
  if (link.active) return pathname.includes(link.active);
  return pathname === link.href;
}

// Resolve the current page into { section, page } from the role's nav links.
// `section` is the parent group name (only when matching a subLink), so the
// AppBar can render a 2-level breadcrumb like "Work stages › All projects".
function resolveCurrentPage(links, pathname) {
  let fallback = null;
  for (const link of links) {
    if (link.subLinks?.length) {
      const sub = link.subLinks.find((s) => matchLink(s, pathname));
      if (sub) return { section: link.name, page: sub.name };
      if (matchLink(link, pathname)) fallback = { section: null, page: link.name };
    } else if (matchLink(link, pathname)) {
      return { section: null, page: link.name };
    }
  }
  return fallback;
}

const ROLE_LABELS = {
  ADMIN: "Admin",
  SUPER_ADMIN: "Admin",
  THREE_D_DESIGNER: "3D Designer",
  TWO_D_DESIGNER: "2D Designer",
  TWO_D_EXECUTOR: "Executor",
  ACCOUNTANT: "Accountant",
  CONTACT_INITIATOR: "Contact Initiator",
  SUPER_SALES: "Super Sales",
};

function roleLabel(user) {
  if (user?.role === "STAFF")
    return user.profile === "SUPER_SALES" ? "Super Sales" : "Sales";
  return ROLE_LABELS[user?.role] || user?.role || "";
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
  let { user, isLoggedIn, validatingAuth } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Collapsed state persisted in localStorage; shared by the drawer + the
  // content offset so they always stay in sync.
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(SIDENAV_COLLAPSED_KEY);
    if (stored != null) setCollapsed(stored === "true");
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
  }, [validatingAuth]);
  if (!user || !user.role) return null;

  const links = resolveLinks(user);
  const navGroups = groupLinks(links);
  const currentPage = resolveCurrentPage(links, pathname);
  const userRoleLabel = roleLabel(user);
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
                {userRoleLabel && (
                  <Chip
                    size="small"
                    label={userRoleLabel}
                    sx={{
                      fontWeight: 600,
                      color: colors.textOnPrimary,
                      backgroundColor: theme.palette.status.neutral,
                      display: { xs: "none", sm: "inline-flex" },
                    }}
                  />
                )}
                <SignInWithDifferentUserRole />
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
