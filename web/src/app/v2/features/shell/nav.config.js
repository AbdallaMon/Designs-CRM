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

// ─────────────────────────────────────────────────────────────────────────────
// WORKSPACES (new app-shell model) — additive over the existing `group` buckets.
// A "workspace" is the top-level destination zone the icon-rail switches between.
// We map 1:1 onto the existing NAV groups so EVERY href / permission gate / icon
// stays exactly as it is — the rail just re-presents the same gated nav model.
// No "courses/learning" workspace (the learning module was removed).
// ─────────────────────────────────────────────────────────────────────────────
export const WORKSPACES = [
  { key: "home", labelKey: "home", icon: MdSpaceDashboard, order: 0 },
  { key: "sales", labelKey: "sales", icon: MdPeople, order: 1 },
  { key: "production", labelKey: "production", icon: MdWorkOutline, order: 2 },
  { key: "finance", labelKey: "finance", icon: MdAccountBalanceWallet, order: 3 },
  { key: "admin", labelKey: "admin", icon: MdSettings, order: 4 },
];

// Render order for the rail (mirrors NAV_GROUP_ORDER; derived so the two never drift).
export const WORKSPACE_ORDER = [...WORKSPACES]
  .sort((a, b) => a.order - b.order)
  .map((w) => w.key);

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
    // The daily cockpit — front-and-center as the SECOND top-level item, right after Dashboard.
    key: "leadsWorkspace",
    labelKey: "leadsWorkspace",
    href: "/v2/leads/workspace",
    icon: MdSpaceDashboard,
    group: "home",
    permission: P.LEAD.LIST,
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
  {
    key: "leads",
    labelKey: "leads",
    href: "/v2/leads",
    icon: MdPeople,
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

// Attach a `workspace` to each NAV_ITEM by mapping its existing `group` (home/sales/
// production/finance/admin map 1:1). Done here (not hand-written per item) so the workspace
// of an item can never drift from its group. hrefs/permissions/icons are untouched.
for (const item of NAV_ITEMS) {
  item.workspace = item.group;
}

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

/**
 * Build the permission-filtered WORKSPACE nav model for the new app-shell rail/panel:
 *   [{ workspace: { key, labelKey, icon, order }, items: [{ key, label, href, icon, ... }] }]
 * Mirrors buildVisibleNav (SAME `navItemVisible` predicate) but groups by `workspace`.
 * Workspaces with zero visible items are dropped — the rail only offers reachable zones.
 *
 * @param {object} perm          usePermission() return value.
 * @param {(labelKey:string)=>string} [resolveItem]  optional label resolver for item.label.
 */
export function buildWorkspaceNav(perm, resolveItem = (k) => k) {
  return WORKSPACE_ORDER.map((wsKey) => {
    const workspace = WORKSPACES.find((w) => w.key === wsKey);
    const items = NAV_ITEMS.filter(
      (it) => it.workspace === wsKey && navItemVisible(it, perm),
    ).map((it) => ({
      key: it.key,
      label: resolveItem(it.labelKey),
      href: it.href,
      icon: it.icon,
      workspace: it.workspace,
    }));
    return { workspace, items };
  }).filter((w) => w.items.length > 0);
}
