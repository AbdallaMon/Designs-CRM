// Declarative app-shell navigation — the ONE capability-driven nav that replaces the legacy 7
// `@<role>` route slots (UX plan §1.1). Each item renders IFF usePermission grants its gate
// (`permission` single code, or `anyPermission` array) — the SAME predicate that gates the page
// and the action. Nav never offers a 403. `group` buckets the side-nav into role-meaningful
// sections; each persona sees only the groups whose items it can access.
//
// Item shape: { key, labelKey, href, icon, group, permission? | anyPermission? }
//   - labelKey resolves via navLabels.js (no inline visible strings here).
//   - href targets the existing v2 App Router routes (/v2/<x>) — Phase 0 mounts the shell over
//     the CURRENT route tree; it does NOT move routes.
//   - codes verified against config/permissions.js (the complete FE mirror).
//
// Lead-scoped sub-tools (sales-stages, questions/SPIN/VERSA, image-session management,
// contracts) are intentionally NOT top-level nav — they live as tabs inside the lead/project
// detail (UX plan §1.1). Single-language Arabic / RTL.

import {
  MdDashboard,
  MdNotifications,
  MdChat,
  MdPeople,
  MdSpaceDashboard,
  MdFolderSpecial,
  MdPayments,
  MdWorkOutline,
  MdChecklist,
  MdImage,
  MdAccountBalanceWallet,
  MdReceiptLong,
  MdManageAccounts,
  MdSettings,
  MdAssessment,
  MdBuild,
} from "react-icons/md";
import { PERMISSIONS } from "@/app/v2/config/permissions";

const P = PERMISSIONS;

// Group display order (top → bottom in the side-nav).
export const NAV_GROUP_ORDER = [
  "home",
  "sales",
  "production",
  "finance",
  "admin",
];

export const NAV_ITEMS = [
  // ── الرئيسية ─────────────────────────────────────────────────────────────
  {
    key: "dashboard",
    labelKey: "dashboard",
    href: "/v2/dashboard",
    icon: MdDashboard,
    group: "home",
    permission: P.DASHBOARD.VIEW,
  },
  {
    key: "notifications",
    labelKey: "notifications",
    href: "/v2/notifications",
    icon: MdNotifications,
    group: "home",
    permission: P.NOTIFICATION.LIST,
  },
  {
    key: "chat",
    labelKey: "chat",
    href: "/v2/chat",
    icon: MdChat,
    group: "home",
    permission: P.CHAT.ROOM_LIST,
  },

  // ── المبيعات ─────────────────────────────────────────────────────────────
  // Two entry points into the SAME flat leads table, seeding the pool from ?segment=.
  {
    key: "leadsNew",
    labelKey: "leadsNew",
    href: "/v2/leads?segment=new",
    icon: MdPeople,
    group: "sales",
    permission: P.LEAD.LIST,
  },
  {
    key: "leadsDeals",
    labelKey: "leadsDeals",
    href: "/v2/leads?segment=deals",
    icon: MdSpaceDashboard,
    group: "sales",
    permission: P.LEAD.LIST,
  },
  {
    key: "adminProjects",
    labelKey: "adminProjects",
    href: "/v2/admin/projects",
    icon: MdFolderSpecial,
    group: "sales",
    permission: P.ADMIN_RESIDUAL.PROJECT_VIEW,
  },
  {
    key: "commissions",
    labelKey: "commissions",
    href: "/v2/admin/commissions",
    icon: MdPayments,
    group: "sales",
    permission: P.ADMIN_RESIDUAL.COMMISSION_VIEW,
  },

  // ── الإنتاج ──────────────────────────────────────────────────────────────
  {
    key: "projects",
    labelKey: "projects",
    href: "/v2/projects",
    icon: MdWorkOutline,
    group: "production",
    permission: P.PROJECT.LIST,
  },
  {
    key: "tasks",
    labelKey: "tasks",
    href: "/v2/tasks",
    icon: MdChecklist,
    group: "production",
    permission: P.TASK.LIST,
  },
  {
    key: "imageSessions",
    labelKey: "imageSessions",
    href: "/v2/image-sessions",
    icon: MdImage,
    group: "production",
    // lead-tab + admin surface; show the top-level entry if the user can see EITHER.
    anyPermission: [P.IMAGE_SESSION.SESSION_VIEW, P.IMAGE_SESSION.ADMIN_VIEW],
  },

  // ── المالية ──────────────────────────────────────────────────────────────
  {
    key: "accounting",
    labelKey: "accounting",
    href: "/v2/accounting",
    icon: MdAccountBalanceWallet,
    group: "finance",
    // "any accounting.*" — the whole feature is gated on holding at least one accounting code.
    anyPermission: Object.values(P.ACCOUNTING),
  },
  {
    key: "contractPayments",
    labelKey: "contractPayments",
    href: "/v2/contracts/payments",
    icon: MdReceiptLong,
    group: "finance",
    permission: P.CONTRACT.PAYMENT_LIST,
  },

  // ── الإدارة ──────────────────────────────────────────────────────────────
  {
    key: "users",
    labelKey: "users",
    href: "/v2/users",
    icon: MdManageAccounts,
    group: "admin",
    permission: P.USER.LIST,
  },
  {
    key: "siteUtilities",
    labelKey: "siteUtilities",
    href: "/v2/site-utilities",
    icon: MdSettings,
    group: "admin",
    permission: P.SITE_UTILITY.PDF_CONFIG_VIEW,
  },
  {
    key: "reports",
    labelKey: "reports",
    href: "/v2/admin/reports",
    icon: MdAssessment,
    group: "admin",
    permission: P.ADMIN_RESIDUAL.REPORT_GENERATE,
  },
  {
    key: "utilities",
    labelKey: "utilities",
    href: "/v2/utilities",
    icon: MdBuild,
    group: "admin",
    // "any utility.*"
    anyPermission: Object.values(P.UTILITY),
  },
];

/**
 * Does a user (via the usePermission helpers) pass a nav item's gate?
 * @param {object} item              a NAV_ITEMS entry.
 * @param {object} perm              the usePermission() return value.
 */
export function navItemVisible(item, perm) {
  if (item.permission) return perm.hasPermission(item.permission);
  if (item.anyPermission) return perm.hasAnyPermission(item.anyPermission);
  return true; // no gate → always visible
}

/**
 * Build the permission-filtered, grouped nav model for rendering:
 * [{ key, label, items: [{ key, label, href, icon, ...}] }] — empty groups dropped.
 */
export function buildVisibleNav(perm, resolveGroup, resolveItem) {
  return NAV_GROUP_ORDER.map((groupKey) => {
    const items = NAV_ITEMS.filter(
      (it) => it.group === groupKey && navItemVisible(it, perm),
    ).map((it) => ({
      key: it.key,
      label: resolveItem(it.labelKey),
      href: it.href,
      icon: it.icon,
    }));
    return { key: groupKey, label: resolveGroup(groupKey), items };
  }).filter((g) => g.items.length > 0);
}
