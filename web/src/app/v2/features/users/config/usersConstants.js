// Static option/label sets for the users feature UI. Single-language (Arabic). These are
// DISPLAY-only helpers; the server is the source of truth for every value. The role option
// list reuses the canonical ROLE_LABELS map (features/shell/roleLabels.js) so the create
// modal / roles editor / list chip all speak the same Arabic wording in ONE place.

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
// token map is out of scope). A small local chip carries the same Arabic-label + semantic
// guarantee (see components/UserStatusChip.jsx).
export const USER_STATUS = {
  ACTIVE: { key: "ACTIVE", label: "نشط", color: "success" },
  BANNED: { key: "BANNED", label: "موقوف", color: "default" },
};

/** Map the boolean isActive flag to its UI status bucket. */
export function userStatusOf(isActive) {
  return isActive ? USER_STATUS.ACTIVE : USER_STATUS.BANNED;
}

// Status filter options for the list toolbar (BE list is legacy-tolerant via the JSON
// `filters` string; the active flag is the only supported user status facet here).
export const USER_STATUS_FILTER_OPTIONS = {
  ACTIVE: "نشط",
  BANNED: "موقوف",
};

// Auto-assignment project types (legacy PROJECT_TYPES — the AutoAssignment.type free-form
// string values). The dual-list editor offers these; the diff sends { added, removed }. Values
// are the exact stored strings (the data contract); labels are Arabic.
export const AUTO_ASSIGNMENT_TYPES = [
  { value: "3D_Designer", label: "تصميم ثلاثي الأبعاد" },
  { value: "3D_Modification", label: "تعديل ثلاثي الأبعاد" },
  { value: "2D_Study", label: "دراسة ثنائية الأبعاد" },
  { value: "2D_Final_Plans", label: "مخططات نهائية ثنائية الأبعاد" },
  { value: "2D_Quantity_Calculation", label: "حساب الكميات ثنائي الأبعاد" },
];

/** Resolve an auto-assignment type value to its Arabic label (falls back to the raw value). */
export function resolveAutoAssignmentLabel(value) {
  return AUTO_ASSIGNMENT_TYPES.find((t) => t.value === value)?.label ?? value ?? "—";
}
