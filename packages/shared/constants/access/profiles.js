// Code-defined permission PROFILES — one profile per user (mutually exclusive).
// A profile's code set is BUILT from the same blocks as ROLE_PERMISSIONS, so the
// effective access is parity-equal to master by construction (see helpers.js).
import {
  SHARED_AUTHED, LEAD_AUTHED, LEAD_ADMIN, PROJECT_AUTHED, PROJECT_ADMIN,
  USER_ADMIN, ACCOUNTING_ALL, STAFF_GATE, TELEGRAM_ADMIN, SITE_UTILITY_ADMIN,
  COURSE_ADMIN, IMAGE_SESSION_ADMIN, ADMIN_RESIDUAL, SUPER_SALES_EXTRA_PERMISSIONS,
  LEAD_SECTION_PRIMARY, LEAD_SECTION_ANALYSIS,
} from "./role-permissions.js";
import { USER_ROLES } from "./roles.constants.js";

const dedupe = (arr) => Array.from(new Set(arr));

// Sales family (STAFF base role + the retained flags → three profiles).
const NORMAL_SALES = dedupe([...SHARED_AUTHED, ...LEAD_AUTHED, ...PROJECT_AUTHED, ...STAFF_GATE, ...LEAD_SECTION_ANALYSIS]);
const PRIMARY_SALES = dedupe([...NORMAL_SALES, ...LEAD_SECTION_PRIMARY]);
const SUPER_SALES = dedupe([...PRIMARY_SALES, ...SUPER_SALES_EXTRA_PERMISSIONS]);

// Admin tier (mirror ROLE_PERMISSIONS.ADMIN / SUPER_ADMIN exactly + the new view codes,
// which admins would obviously hold — additive, no parity impact).
const ADMIN = dedupe([
  ...SHARED_AUTHED, ...TELEGRAM_ADMIN, ...SITE_UTILITY_ADMIN, ...COURSE_ADMIN,
  ...LEAD_AUTHED, ...LEAD_ADMIN, ...USER_ADMIN, ...PROJECT_AUTHED, ...PROJECT_ADMIN,
  ...IMAGE_SESSION_ADMIN, ...ADMIN_RESIDUAL, ...LEAD_SECTION_PRIMARY, ...LEAD_SECTION_ANALYSIS,
]);

// Designers/executor (mirror their role codes; the 3D-only MODIFICATION-task
// visibility stays role-derived via baseRole in the frozen service — see spec §5.1).
const DESIGNER = dedupe([...SHARED_AUTHED, ...LEAD_AUTHED, ...PROJECT_AUTHED, ...STAFF_GATE]);
const ACCOUNTANT = dedupe([...SHARED_AUTHED, ...LEAD_AUTHED, ...PROJECT_AUTHED, ...ACCOUNTING_ALL, ...STAFF_GATE]);
const SUPER_SALES_BASE = dedupe([...SHARED_AUTHED, ...LEAD_AUTHED, ...PROJECT_AUTHED]);
const CONTACT_INITIATOR = dedupe([...SHARED_AUTHED, ...LEAD_AUTHED, ...PROJECT_AUTHED]);

export const PROFILES = {
  ADMIN,
  SUPER_ADMIN: ADMIN, // SUPER_ADMIN has the identical code set to ADMIN in ROLE_PERMISSIONS
  NORMAL_SALES,
  PRIMARY_SALES,
  SUPER_SALES,
  SUPER_SALES_BASE,
  ACCOUNTANT,
  DESIGNER_3D: DESIGNER,
  DESIGNER_2D: DESIGNER,
  EXECUTOR_2D: DESIGNER,
  CONTACT_INITIATOR,
};

export const PROFILE_KEYS = Object.keys(PROFILES);

// Display + the legacy fields to keep in sync when a profile is assigned (Phase 2).
export const PROFILE_META = {
  ADMIN:            { label: "مدير",          family: "ADMIN",    baseRole: USER_ROLES.ADMIN },
  SUPER_ADMIN:      { label: "مدير أعلى",     family: "ADMIN",    baseRole: USER_ROLES.SUPER_ADMIN },
  NORMAL_SALES:     { label: "موظف مبيعات",   family: "SALES",    baseRole: USER_ROLES.STAFF, isPrimary: false, isSuperSales: false },
  PRIMARY_SALES:    { label: "مبيعات أساسي",  family: "SALES",    baseRole: USER_ROLES.STAFF, isPrimary: true,  isSuperSales: false },
  SUPER_SALES:      { label: "سوبر مبيعات",   family: "SALES",    baseRole: USER_ROLES.STAFF, isPrimary: false, isSuperSales: true },
  SUPER_SALES_BASE: { label: "سوبر سيلز (دور)", family: "SALES",  baseRole: USER_ROLES.SUPER_SALES },
  ACCOUNTANT:       { label: "محاسب",         family: "FINANCE",  baseRole: USER_ROLES.ACCOUNTANT },
  DESIGNER_3D:      { label: "مصمم 3D",       family: "DESIGN",   baseRole: USER_ROLES.THREE_D_DESIGNER },
  DESIGNER_2D:      { label: "مصمم 2D",       family: "DESIGN",   baseRole: USER_ROLES.TWO_D_DESIGNER },
  EXECUTOR_2D:      { label: "منفّذ 2D",      family: "DESIGN",   baseRole: USER_ROLES.TWO_D_EXECUTOR },
  CONTACT_INITIATOR:{ label: "مبادر تواصل",   family: "SALES",    baseRole: USER_ROLES.CONTACT_INITIATOR },
};

// Map a legacy user row (role + retained flags) to its profile key.
export function deriveProfileFromLegacy(user) {
  const role = user?.role;
  if (role === USER_ROLES.STAFF) {
    if (user?.isSuperSales) return "SUPER_SALES"; // super ⊇ primary
    if (user?.isPrimary) return "PRIMARY_SALES";
    return "NORMAL_SALES";
  }
  switch (role) {
    case USER_ROLES.ADMIN: return "ADMIN";
    case USER_ROLES.SUPER_ADMIN: return "SUPER_ADMIN";
    case USER_ROLES.SUPER_SALES: return "SUPER_SALES_BASE";
    case USER_ROLES.ACCOUNTANT: return "ACCOUNTANT";
    case USER_ROLES.THREE_D_DESIGNER: return "DESIGNER_3D";
    case USER_ROLES.TWO_D_DESIGNER: return "DESIGNER_2D";
    case USER_ROLES.TWO_D_EXECUTOR: return "EXECUTOR_2D";
    case USER_ROLES.CONTACT_INITIATOR: return "CONTACT_INITIATOR";
    default: return "NORMAL_SALES";
  }
}

// The single place that decides a user's profile: the stored column if valid,
// else the legacy derivation (transitional, for rows not yet backfilled).
export function resolveProfileKey(user) {
  if (user?.profile && PROFILES[user.profile]) return user.profile;
  return deriveProfileFromLegacy(user);
}
