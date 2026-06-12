// Static option/label sets for the users feature UI. Bilingual (ar/en) via factories — every
// USER-VISIBLE label is sourced from t("users.*"); the role labels remain the canonical ROLE_LABELS
// enum VALUE map (features/shell/roleLabels.js) so the create modal / roles editor / list chip all
// speak the same wording in ONE place. DISPLAY-only helpers; the server is the source of truth for
// every value.
//
// i18n: labels live behind buildX(t) factories called inside components (where useT is available);
// NEVER call a hook at module scope. VALUES (enum keys, stored strings) are language-neutral.

import { ROLE_LABELS, resolveRoleLabel } from "@/app/v2/features/shell/roleLabels.js";

// Base UserRole enum values offered when creating/updating a user (Prisma UserRole). Order =
// display order. Values are the enum KEYS (the data contract); labels come from ROLE_LABELS.
export const USER_ROLE_OPTIONS = Object.keys(ROLE_LABELS).map((value) => ({
  value,
  label: resolveRoleLabel(value),
}));

export { resolveRoleLabel };

// Account status (derived from the boolean `isActive`). Not a Prisma enum — a UI bucket. We
// deliberately do NOT route this through <StatusChip> because that primitive's domains are
// locked to lead/contract/payment/task/session (no `user` domain, and editing the shared
// token map is out of scope). A small local chip carries the same label + semantic guarantee
// (see components/UserStatusChip.jsx). Label keys resolve at render time via t().
export const USER_STATUS = {
  ACTIVE: { key: "ACTIVE", labelKey: "users.status.active", color: "success" },
  BANNED: { key: "BANNED", labelKey: "users.status.banned", color: "default" },
};

/** Map the boolean isActive flag to its UI status bucket. */
export function userStatusOf(isActive) {
  return isActive ? USER_STATUS.ACTIVE : USER_STATUS.BANNED;
}

// Status filter options for the list toolbar (BE list is legacy-tolerant via the JSON
// `filters` string; the active flag is the only supported user status facet here).
// Factory: build the enum option map { ACTIVE: <label>, BANNED: <label> } at render time.
export function buildUserStatusFilterOptions(t) {
  return {
    ACTIVE: t("users.status.active"),
    BANNED: t("users.status.banned"),
  };
}

// Auto-assignment project types (legacy PROJECT_TYPES — the AutoAssignment.type free-form
// string values). The dual-list editor offers these; the diff sends { added, removed }. Values
// are the exact stored strings (the data contract); labels resolve via t() at render time.
export const AUTO_ASSIGNMENT_TYPES = [
  { value: "3D_Designer", labelKey: "users.autoAssignment.3dDesigner" },
  { value: "3D_Modification", labelKey: "users.autoAssignment.3dModification" },
  { value: "2D_Study", labelKey: "users.autoAssignment.2dStudy" },
  { value: "2D_Final_Plans", labelKey: "users.autoAssignment.2dFinalPlans" },
  { value: "2D_Quantity_Calculation", labelKey: "users.autoAssignment.2dQuantity" },
];

/** Build the auto-assignment options with resolved labels (call inside a component with t). */
export function buildAutoAssignmentTypes(t) {
  return AUTO_ASSIGNMENT_TYPES.map((opt) => ({ value: opt.value, label: t(opt.labelKey) }));
}

/** Resolve an auto-assignment type value to its label (falls back to the raw value). */
export function resolveAutoAssignmentLabel(t, value) {
  const opt = AUTO_ASSIGNMENT_TYPES.find((o) => o.value === value);
  return opt ? t(opt.labelKey) : value ?? "—";
}
