// Code-defined permission profiles.
import {
  SHARED_AUTHED, LEAD_AUTHED, LEAD_ADMIN, PROJECT_AUTHED, PROJECT_ADMIN,
  USER_ADMIN, ACCOUNTING_ALL, STAFF_GATE, TELEGRAM_ADMIN, SITE_UTILITY_ADMIN,
  COURSE_ADMIN, IMAGE_SESSION_ADMIN, ADMIN_RESIDUAL, AUDIT_ADMIN,
  SUPER_SALES_EXTRA_PERMISSIONS, LEAD_SECTION_PRIMARY, LEAD_SECTION_ANALYSIS,
  MY_DAY_PERSONAL, MY_DAY_TEAM,
} from "./profile-permission-blocks.js";
import { ALL_PERMISSIONS } from "./permissions.constants.js";

const dedupe = (arr) => Array.from(new Set(arr));

// Sales family.
const NORMAL_SALES = dedupe([...SHARED_AUTHED, ...LEAD_AUTHED, ...PROJECT_AUTHED, ...STAFF_GATE, ...LEAD_SECTION_ANALYSIS, ...MY_DAY_PERSONAL]);
const PRIMARY_SALES = dedupe([...NORMAL_SALES, ...LEAD_SECTION_PRIMARY]);
const SUPER_SALES = dedupe([...PRIMARY_SALES, ...SUPER_SALES_EXTRA_PERMISSIONS, ...MY_DAY_TEAM]);

// Admin-tier profiles receive every defined permission.
const ADMIN = dedupe(ALL_PERMISSIONS);

// Designer and executor profiles.
const DESIGNER = dedupe([...SHARED_AUTHED, ...LEAD_AUTHED, ...PROJECT_AUTHED, ...STAFF_GATE, ...MY_DAY_PERSONAL]);
// 2026-07-15 additive: accountant collections queue + initiator first-touch queue in
// My Day (new surface only — no data widening; see productivity-pass spec §6).
const ACCOUNTANT = dedupe([...SHARED_AUTHED, ...LEAD_AUTHED, ...PROJECT_AUTHED, ...ACCOUNTING_ALL, ...STAFF_GATE, ...MY_DAY_PERSONAL]);
const CONTACT_INITIATOR = dedupe([...SHARED_AUTHED, ...LEAD_AUTHED, ...PROJECT_AUTHED, ...MY_DAY_PERSONAL]);

export const PROFILES = {
  ADMIN,
  SUPER_ADMIN: ADMIN,
  NORMAL_SALES,
  PRIMARY_SALES,
  SUPER_SALES,
  ACCOUNTANT,
  DESIGNER_3D: DESIGNER,
  DESIGNER_2D: DESIGNER,
  EXECUTOR_2D: DESIGNER,
  CONTACT_INITIATOR,
};

export const PROFILE_KEYS = Object.keys(PROFILES);

// Display metadata used by the frontend and authorization cache.
export const PROFILE_META = {
  ADMIN:             { label: "Admin",             family: "ADMIN" },
  SUPER_ADMIN:       { label: "Super admin",       family: "ADMIN" },
  NORMAL_SALES:      { label: "Sales",             family: "SALES" },
  PRIMARY_SALES:     { label: "Primary sales",     family: "SALES" },
  SUPER_SALES:       { label: "Super sales",       family: "SALES" },
  ACCOUNTANT:        { label: "Accountant",        family: "FINANCE" },
  DESIGNER_3D:       { label: "3D Designer",       family: "DESIGN" },
  DESIGNER_2D:       { label: "2D Designer",       family: "DESIGN" },
  EXECUTOR_2D:       { label: "2D Executor",       family: "DESIGN" },
  CONTACT_INITIATOR: { label: "Contact initiator", family: "SALES" },
};

// Resolve a profile key from an authenticated user or profile record.
export function resolveProfileKey(user) {
  const key = user?.currentProfileKey ?? user?.profile ?? user?.currentProfile?.key;
  return key && PROFILES[key] ? key : null;
}
