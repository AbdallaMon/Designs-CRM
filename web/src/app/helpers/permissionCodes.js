// Local mirror of the lead section-visibility permission codes. The web workspace
// has no @dms/shared dependency, so these strings mirror
// packages/shared/constants/access/permissions.constants.js (LEAD_PERMISSIONS.*_VIEW).
// Keep in sync if those change.
export const LEAD_CODES = {
  PRICE_OFFER_VIEW: "lead.price_offer.view",
  PROJECTS_VIEW: "lead.projects.view",
  MODIFICATIONS_VIEW: "lead.modifications.view",
  UPDATES_VIEW: "lead.updates.view",
  ANALYSIS_VIEW: "lead.analysis.view",
  ASSIGN_OTHER: "lead.assign.other",
};

// Mirror of packages/shared/constants/access/permissions.constants.js PROJECT_PERMISSIONS.
// MANAGE ("project.manage") is the admin-tier management set (assign/unassign a designer,
// change a project's board status) granted to ADMIN/SUPER_ADMIN + isSuperSales.
export const PROJECT_CODES = {
  MANAGE: "project.manage",
  LIST: "project.list",
};

// Mirror of packages/shared/constants/access/permissions.constants.js USER_PERMISSIONS.
// Admin-tier user-management codes (granted to ADMIN/SUPER_ADMIN base + isSuperSales).
export const USER_CODES = {
  MANAGE_ROLES: "user.manage_roles",
  MANAGE_AUTO_ASSIGNMENTS: "user.manage_auto_assignments",
};

// Mirror of packages/shared/constants/access/permissions.constants.js
// ADMIN_RESIDUAL_PERMISSIONS. Residual admin-tier codes (ADMIN/SUPER_ADMIN base +
// isSuperSales) for the project-group-create affordance and the telegram management actions.
export const ADMIN_RESIDUAL_CODES = {
  PROJECT_GROUP_CREATE: "admin_residual.project.group_create",
  TELEGRAM_MANAGE: "admin_residual.telegram.manage",
};
