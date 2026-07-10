"use client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import {
  AppBar,
  Box,
  Chip,
  Divider,
  IconButton,
  Toolbar,
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
} from "react-icons/fi";

import SideNav, {
  SIDENAV_COLLAPSED_WIDTH,
  SIDENAV_EXPANDED_WIDTH,
} from "@/shared/components/utility/SideNav.jsx";
import RouteGuard from "@/shared/components/utility/RouteGuard.jsx";
import NotificationsIcon from "@/shared/components/utility/NotificationIcon.jsx";
import SignInWithDifferentUserRole from "@/features/users/UserRoles";
import ProfileDialogTrigger from "@/features/users/profile/ProfileDialogTrigger";
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
  if (role === "STAFF") return user.isSuperSales ? superSalesLinks : staffLinks;
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
// same `key` NAVIGATION emits; icons are the exact ones master's link arrays
// above use for the equivalent item.
const ICON_BY_KEY = {
  dashboard: <FiGrid size={20} />,
  "users-admin": <FiUsers size={20} />,
  "users-super-sales": <FiUsers size={20} />,
  leads: <FiTarget size={20} />,
  deals: <FiDollarSign size={20} />,
  "work-stages": <FiDollarSign size={20} />,
  reports: <FiFileText size={20} />,
  "image-sessions": <FiImage size={20} />,
  calendar: <FiCalendar size={20} />,
  payments: <FiDollarSign size={20} />,
  "website-utilities": <FiHome size={20} />,
  "executor-leads": <FiTarget size={20} />,
  "executor-work-stage": <FiBriefcase size={20} />,
  "accountant-payments": <FiDollarSign size={20} />,
  "operational-expenses": <FiShoppingCart size={20} />,
  rents: <FiHome size={20} />,
  salaries: <FiUsers size={20} />,
  outcome: <FiTrendingDown size={20} />,
  "contact-initiator-leads": <FiTarget size={20} />,
};

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

// Sub-link icon lookup by href (navigationTabs sub-links carry no icons
// either). Mirrors the legacy sub-link icons exactly; any href not listed
// here is a work-stage item and falls back to FiBriefcase.
const SUB_ICON_BY_HREF = {
  "/dashboard/deals": <FiDollarSign size={20} />,
  "/dashboard/on-hold-deals": <FiClock size={18} />,
  "/dashboard/all-deals": <FiList size={18} />,
  "/dashboard/report": <FiTrendingUp size={20} />,
  "/dashboard/report/staff": <FiUsers size={18} />,
};

function resolveSubIcon(href) {
  return SUB_ICON_BY_HREF[href] ?? <FiBriefcase size={20} />;
}

// Map a sub-link { label, href, active } (from navigationTabs) to SideNav's shape.
function mapSubLink(s) {
  return {
    name: s.label,
    href: s.href,
    icon: resolveSubIcon(s.href),
    ...(s.active ? { active: s.active } : {}),
  };
}

// Map a top-level nav tab { key, label, href, active, subLinks } (from
// navigationTabs) to the { name, href, icon, active, subLinks } shape SideNav
// expects, attaching the client-only icon by `key` (role-aware for "dashboard").
function mapNavigationTab(tab, role) {
  return {
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
  if (user?.role === "STAFF") return user.isSuperSales ? "Super Sales" : "Sales";
  return ROLE_LABELS[user?.role] || user?.role || "";
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
          links={links}
          collapsed={collapsed}
          onToggleCollapsed={handleToggleCollapsed}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
          isMobile={isMobile}
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
