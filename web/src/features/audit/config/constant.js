import { AUDIT_ACTIONS, AUDIT_MODULES } from "@dms/shared";

// Audit-log feature constants. The admin-only action-audit viewer reads the /v2
// backend module mounted at `audit-logs` (apiClient adds the /v2 base + cookie auth).
// Web has no dependency on @dms/shared, so the MODULE/ACTION vocabularies are mirrored
// here from packages/shared/constants/access/audit-actions.js (kept in sync by hand,
// same convention as features/users/pages/users/config.jsx PROFILE_OPTIONS).
export const AUDIT_LOGS_URL = "audit-logs";

// The audited business modules (the `module` column / filter). Mirrors AUDIT_MODULES.
export const AUDIT_MODULE_OPTIONS = [
  { value: AUDIT_MODULES.AUTH, label: "Auth" },
  { value: AUDIT_MODULES.LEAD, label: "Lead" },
  { value: AUDIT_MODULES.CONTRACT, label: "Contract" },
  { value: AUDIT_MODULES.PAYMENT, label: "Payment" },
  { value: AUDIT_MODULES.PROJECT, label: "Project" },
  { value: AUDIT_MODULES.TASK, label: "Task" },
  { value: AUDIT_MODULES.USER, label: "User" },
];

// The audited actions (the `action` column / filter). Mirrors AUDIT_ACTIONS. Labels are
// human-readable; the value is the stored language-neutral code.
export const AUDIT_ACTION_OPTIONS = [
  { value: AUDIT_ACTIONS.PROFILE_SWITCH, label: "Profile switched" },
  { value: AUDIT_ACTIONS.PROFILE_ASSIGN, label: "Profile assigned" },
  { value: AUDIT_ACTIONS.PROFILE_REMOVE, label: "Profile removed" },
  { value: AUDIT_ACTIONS.LEAD_CREATED, label: "Lead created" },
  { value: AUDIT_ACTIONS.LEAD_STATUS_CHANGED, label: "Lead status changed" },
  { value: AUDIT_ACTIONS.PRICE_OFFER_CREATED, label: "Price offer created" },
  { value: AUDIT_ACTIONS.LEAD_CALL_LOGGED, label: "Lead call logged" },
  { value: AUDIT_ACTIONS.CONTRACT_CREATED, label: "Contract created" },
  { value: AUDIT_ACTIONS.CONTRACT_PAYMENT_PAID, label: "Contract payment paid" },
  { value: AUDIT_ACTIONS.USER_CREATED, label: "User created" },
  { value: AUDIT_ACTIONS.USER_UPDATED, label: "User updated" },
  { value: AUDIT_ACTIONS.USER_ROLE_CHANGED, label: "User role changed" },
];

// The audited entity types (the `entityType` column / filter). Free-form on the backend,
// but these are the ones the starter events write.
export const AUDIT_ENTITY_TYPE_OPTIONS = [
  { value: "ClientLead", label: "Client lead" },
  { value: "Contract", label: "Contract" },
  { value: "Payment", label: "Payment" },
  { value: "User", label: "User" },
];

export const AUDIT_MODULE_LABEL = Object.fromEntries(
  AUDIT_MODULE_OPTIONS.map((m) => [m.value, m.label])
);
export const AUDIT_ACTION_LABEL = Object.fromEntries(
  AUDIT_ACTION_OPTIONS.map((a) => [a.value, a.label])
);
