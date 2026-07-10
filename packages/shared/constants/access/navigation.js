// Sidebar navigation config — the single source of truth for the per-role
// dashboard sidebar. Ported 1:1 from master's `linksForRole(user)` and its
// per-role link arrays in
//   web/src/app/(auth)/dashboard/(dashboard)/layout.jsx
// (adminLinks / staffLinks / superSalesLinks / threeDLinks / twoDLinks /
//  accountantLinks / exacuterLinks / contactInitiatorLinks).
//
// RULES:
//   - `@dms/shared` is framework-agnostic: NO Prisma / Express / Next imports,
//     NO React (icons stay in the FE). This is a pure data table.
//   - Navigation is ROLE-DRIVEN. The primary visibility rule is
//     `role ∈ item.allowedRoles`. An OPTIONAL `requiredPermission` may be added
//     as a NON-NARROWING guard, but must never hide an item master shows for the
//     role (none are set today, on purpose).
//
// WHY SOME ITEMS ARE DUPLICATED PER ROLE:
//   Master's arrays disagree on the LABEL, HREF, or SUB-LIST of the "same" screen
//   depending on the role, so a single row cannot represent them:
//     - The `/dashboard` LANDING item is labelled "Dashboard" for most roles,
//       "Leads" for TWO_D_EXECUTOR / CONTACT_INITIATOR, and "Payments" for
//       ACCOUNTANT. Same href, different label ⇒ separate rows.
//     - "Users" is the 2nd item for ADMIN but the LAST item for SUPER_SALES /
//       super-sales STAFF. Same href, different position ⇒ separate rows.
//     - "Work stages" carries a DIFFERENT sub-list per role (ADMIN / 3D / 2D) and
//       is a plain link labelled "Work stage" (no sub-list) for TWO_D_EXECUTOR.
//       The ADMIN/3D/2D variants share one row whose SUB-LINKS carry their own
//       `allowedRoles` (buildNavigationTabs filters sub-links by role); the
//       executor variant is its own row.
//   The array ORDER below is chosen so that, after filtering to any single role,
//   the surviving rows appear in master's exact order for that role.

import { USER_ROLES } from "./roles.constants.js";

const R = USER_ROLES;
const ADMIN_SET = [R.ADMIN, R.SUPER_ADMIN];
// Roles that render master's "Dashboard/Leads/Deals/Calendar/Payments" sales set.
const SALES_SET = [R.ADMIN, R.SUPER_ADMIN, R.STAFF, R.SUPER_SALES];

export const NAVIGATION = [
  // 1) Landing "Dashboard" — every role whose master landing is labelled
  //    "Dashboard": ADMIN/SUPER_ADMIN, STAFF, SUPER_SALES, 3D, 2D.
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: "FiGrid",
    allowedRoles: [
      R.ADMIN,
      R.SUPER_ADMIN,
      R.STAFF,
      R.SUPER_SALES,
      R.THREE_D_DESIGNER,
      R.TWO_D_DESIGNER,
    ],
  },

  // 2) Users — ADMIN position (2nd). Kept for ADMIN/SUPER_ADMIN here so it
  //    renders right after the dashboard, matching master's adminLinks order.
  {
    key: "users-admin",
    label: "Users",
    href: "/dashboard/users",
    icon: "FiUsers",
    allowedRoles: [...ADMIN_SET],
  },

  // 3) Leads (the dedicated `/dashboard/leads` screen) — sales roles only.
  {
    key: "leads",
    label: "Leads",
    href: "/dashboard/leads",
    icon: "FiTarget",
    allowedRoles: [...SALES_SET],
  },

  // 4) Deals — sales roles. Sub-links are identical across those roles.
  {
    key: "deals",
    label: "Deals",
    href: "/dashboard/deals",
    icon: "FiDollarSign",
    active: "deals",
    allowedRoles: [...SALES_SET],
    subLinks: [
      {
        label: "Current Deals",
        href: "/dashboard/deals",
        active: "deals",
        allowedRoles: [...SALES_SET],
      },
      {
        label: "On hold Deals",
        href: "/dashboard/on-hold-deals",
        active: "on-hold",
        allowedRoles: [...SALES_SET],
      },
      {
        label: "All Deals",
        href: "/dashboard/all-deals",
        active: "all-deals",
        allowedRoles: [...SALES_SET],
      },
    ],
  },

  // 5) Work stages — ONE row shared by ADMIN/SUPER_ADMIN, THREE_D, TWO_D. The
  //    sub-list differs per role, so each sub-link carries its own allowedRoles
  //    and buildNavigationTabs filters the sub-list to the role. (The
  //    TWO_D_EXECUTOR "Work stage" plain link is a separate row — see below.)
  {
    key: "work-stages",
    label: "Work stages",
    href: "/dashboard/work-stages",
    icon: "FiDollarSign",
    active: "work",
    allowedRoles: [...ADMIN_SET, R.THREE_D_DESIGNER, R.TWO_D_DESIGNER],
    subLinks: [
      // ── ADMIN / SUPER_ADMIN sub-list (master adminLinks "Work stages") ──
      {
        label: "All projects",
        href: "/dashboard/projects",
        allowedRoles: [...ADMIN_SET],
      },
      {
        label: "Plan study department",
        href: "/dashboard/work-stages/study",
        allowedRoles: [...ADMIN_SET],
      },
      {
        label: "3D Work stage",
        href: "/dashboard/work-stages",
        allowedRoles: [...ADMIN_SET],
      },
      {
        label: "Final plan department",
        href: "/dashboard/work-stages/final-plan",
        allowedRoles: [...ADMIN_SET],
      },
      {
        label: "Quantity calcualtion department",
        href: "/dashboard/work-stages/quantity",
        allowedRoles: [...ADMIN_SET],
      },
      {
        label: "Archived projects",
        href: "/dashboard/projects/archived",
        allowedRoles: [...ADMIN_SET],
      },
      {
        label: "3D Modifcation",
        href: "/dashboard/work-stages/modification",
        allowedRoles: [...ADMIN_SET],
      },
      // ── THREE_D_DESIGNER sub-list (master threeDLinks "Work stages") ──
      {
        label: "3D Work stage",
        href: "/dashboard/work-stages",
        allowedRoles: [R.THREE_D_DESIGNER],
      },
      {
        label: "Modifcation stage",
        href: "/dashboard/modification",
        allowedRoles: [R.THREE_D_DESIGNER],
      },
      {
        label: "Archived projects",
        href: "/dashboard/archived",
        allowedRoles: [R.THREE_D_DESIGNER],
      },
      // ── TWO_D_DESIGNER sub-list (master twoDLinks "Work stages") ──
      {
        label: "Plan study department",
        href: "/dashboard/study",
        allowedRoles: [R.TWO_D_DESIGNER],
      },
      {
        label: "Final plan department",
        href: "/dashboard/final-plan",
        allowedRoles: [R.TWO_D_DESIGNER],
      },
      {
        label: "Quantity calcualtion department",
        href: "/dashboard/quantity",
        allowedRoles: [R.TWO_D_DESIGNER],
      },
      {
        label: "Archived projects",
        href: "/dashboard/archived",
        allowedRoles: [R.TWO_D_DESIGNER],
      },
    ],
  },

  // 6) Reports — ADMIN/SUPER_ADMIN only.
  {
    key: "reports",
    label: "Reports",
    href: "/dashboard/report",
    icon: "FiFileText",
    active: "report",
    allowedRoles: [...ADMIN_SET],
    subLinks: [
      {
        label: "Leads report",
        href: "/dashboard/report",
        active: "report",
        allowedRoles: [...ADMIN_SET],
      },
      {
        label: "Staff report",
        href: "/dashboard/report/staff",
        active: "report/staff",
        allowedRoles: [...ADMIN_SET],
      },
    ],
  },

  // 6b) Audit Log — ADMIN/SUPER_ADMIN only (a NEW admin-cluster screen, no master
  //     equivalent). Placed right after Reports in the admin sidebar cluster.
  {
    key: "audit-logs",
    label: "Audit Log",
    href: "/dashboard/audit-logs",
    icon: "FiActivity",
    allowedRoles: [...ADMIN_SET],
  },

  // 6c) Command Center — ADMIN/SUPER_ADMIN only (a NEW admin-cluster operational
  //     cockpit, no master equivalent). Placed right after the Audit Log row in the
  //     admin sidebar cluster. RouteGuard auto-gates the segment (not in
  //     ALWAYS_ALLOWED_SEGMENTS); the page also gates on `command_center.view`.
  {
    key: "command-center",
    label: "Command Center",
    href: "/dashboard/command-center",
    icon: "FiActivity",
    allowedRoles: [...ADMIN_SET],
  },

  // 7) Images session gallery — ADMIN/SUPER_ADMIN only.
  {
    key: "image-sessions",
    label: "Images session gallery",
    href: "/dashboard/image-sessions",
    icon: "FiImage",
    allowedRoles: [...ADMIN_SET],
  },

  // 8) Calendar — sales roles.
  {
    key: "calendar",
    label: "Calendar",
    href: "/dashboard/calendar",
    icon: "FiCalendar",
    allowedRoles: [...SALES_SET],
  },

  // 9) Payments (the dedicated `/dashboard/payments` screen) — sales roles.
  {
    key: "payments",
    label: "Payments",
    href: "/dashboard/payments",
    icon: "FiDollarSign",
    allowedRoles: [...SALES_SET],
  },

  // 10) Website utilities — ADMIN/SUPER_ADMIN only.
  {
    key: "website-utilities",
    label: "Website utilities",
    href: "/dashboard/website-utilities",
    icon: "FiHome",
    allowedRoles: [...ADMIN_SET],
  },

  // 11) Users — SUPER_SALES position (LAST). master superSalesLinks appends
  //     "Users" after Payments. Filtered to SUPER_SALES; super-sales STAFF is
  //     mapped onto SUPER_SALES in buildNavigationTabs (matching linksForRole).
  {
    key: "users-super-sales",
    label: "Users",
    href: "/dashboard/users",
    icon: "FiUsers",
    allowedRoles: [R.SUPER_SALES],
  },

  // ── TWO_D_EXECUTOR (master exacuterLinks) ──
  // 12) Landing labelled "Leads" → `/dashboard`.
  {
    key: "executor-leads",
    label: "Leads",
    href: "/dashboard",
    icon: "FiTarget",
    allowedRoles: [R.TWO_D_EXECUTOR],
  },
  // 13) "Work stage" — a plain link (NO sub-list), distinct from the
  //     ADMIN/3D/2D "Work stages" row.
  {
    key: "executor-work-stage",
    label: "Work stage",
    href: "/dashboard/work-stages",
    icon: "FiBriefcase",
    allowedRoles: [R.TWO_D_EXECUTOR],
  },

  // ── ACCOUNTANT (master accountantLinks) ──
  // 14) Landing labelled "Payments" → `/dashboard`.
  {
    key: "accountant-payments",
    label: "Payments",
    href: "/dashboard",
    icon: "FiDollarSign",
    allowedRoles: [R.ACCOUNTANT],
  },
  {
    key: "operational-expenses",
    label: "Operational Expenses",
    href: "/dashboard/operational-expenses",
    icon: "FiShoppingCart",
    allowedRoles: [R.ACCOUNTANT],
  },
  {
    key: "rents",
    label: "Rents",
    href: "/dashboard/rents",
    icon: "FiHome",
    allowedRoles: [R.ACCOUNTANT],
  },
  {
    key: "salaries",
    label: "Salaries",
    href: "/dashboard/salaries",
    icon: "FiUsers",
    allowedRoles: [R.ACCOUNTANT],
  },
  {
    key: "outcome",
    label: "Outstanding Payments",
    href: "/dashboard/outcome",
    icon: "FiTrendingDown",
    allowedRoles: [R.ACCOUNTANT],
  },

  // ── CONTACT_INITIATOR (master contactInitiatorLinks) ──
  // 15) Landing labelled "Leads" → `/dashboard`.
  {
    key: "contact-initiator-leads",
    label: "Leads",
    href: "/dashboard",
    icon: "FiTarget",
    allowedRoles: [R.CONTACT_INITIATOR],
  },
];

// module → { permissionCode → actionFlagName } for the action-flag
// permissionsByModule (Task 5). `getEffectivePermissions` uses this to derive
// boolean `canX` flags per module (in addition to the raw `codes` array), so
// the FE can gate on `permissionsByModule.<module>.canList` etc. without
// re-deriving code strings. Only the modules the FE actually gates on need an
// entry here — an unmapped module still gets `{ codes: [...] }` with no flags.
export const NAVIGATION_PERMISSION_ACTIONS = {
  lead: {
    "lead.list": "canList",
    "lead.view": "canView",
    "lead.edit": "canEdit",
  },
  project: {
    "project.list": "canList",
    "project.view": "canView",
    "project.edit": "canEdit",
  },
  task: {
    "task.list": "canList",
    "task.view": "canView",
    "task.create": "canCreate",
    "task.edit": "canEdit",
  },
  user: {
    "user.list": "canList",
    "user.profile.view": "canView",
    "user.create": "canCreate",
    "user.update": "canEdit",
  },
  contract: {
    "contract.list": "canList",
    "contract.view": "canView",
    "contract.create": "canCreate",
    "contract.edit": "canEdit",
  },
  accounting: {
    "accounting.payment.list": "canList",
    "accounting.payment.process": "canEdit",
  },
  course: {
    "course.view": "canView",
    "course.manage": "canEdit",
  },
  image_session: {
    "image_session.session.view": "canView",
    "image_session.session.manage": "canEdit",
  },
};
