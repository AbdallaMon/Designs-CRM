// Code-defined permission profiles.
import {
  SHARED_AUTHED, LEAD_AUTHED, LEAD_ADMIN, PROJECT_AUTHED, PROJECT_ADMIN,
  USER_ADMIN, ACCOUNTING_ALL, STAFF_GATE, TELEGRAM_ADMIN, SITE_UTILITY_ADMIN,
  COURSE_ADMIN, IMAGE_SESSION_ADMIN, ADMIN_RESIDUAL, AUDIT_ADMIN,
  SUPER_SALES_EXTRA_PERMISSIONS, LEAD_SECTION_PRIMARY, LEAD_SECTION_ANALYSIS,
  LEAD_POOL_NON_CONSULTED, LEAD_POOL_ON_HOLD, MY_DAY_PERSONAL, MY_DAY_TEAM,
} from "./profile-permission-blocks.js";
import { ALL_PERMISSIONS } from "./permissions.constants.js";

const dedupe = (arr) => Array.from(new Set(arr));

// Sales family.
const NORMAL_SALES = dedupe([...SHARED_AUTHED, ...LEAD_AUTHED, ...PROJECT_AUTHED, ...STAFF_GATE, ...LEAD_SECTION_ANALYSIS, ...LEAD_POOL_ON_HOLD, ...MY_DAY_PERSONAL]);
const PRIMARY_SALES = dedupe([...NORMAL_SALES, ...LEAD_SECTION_PRIMARY]);
const SUPER_SALES = dedupe([...PRIMARY_SALES, ...SUPER_SALES_EXTRA_PERMISSIONS, ...LEAD_POOL_NON_CONSULTED, ...MY_DAY_TEAM]);

// Admin-tier profiles receive every defined permission.
const ADMIN = dedupe(ALL_PERMISSIONS);

// Designer and executor profiles.
const DESIGNER = dedupe([...SHARED_AUTHED, ...LEAD_AUTHED, ...PROJECT_AUTHED, ...STAFF_GATE, ...LEAD_POOL_ON_HOLD, ...MY_DAY_PERSONAL]);
// 2026-07-15 additive: accountant collections queue + initiator first-touch queue in
// My Day (new surface only — no data widening; see productivity-pass spec §6).
const ACCOUNTANT = dedupe([...SHARED_AUTHED, ...LEAD_AUTHED, ...PROJECT_AUTHED, ...ACCOUNTING_ALL, ...STAFF_GATE, ...LEAD_POOL_ON_HOLD, ...MY_DAY_PERSONAL]);
const CONTACT_INITIATOR = dedupe([...SHARED_AUTHED, ...LEAD_AUTHED, ...PROJECT_AUTHED, ...LEAD_POOL_NON_CONSULTED, ...MY_DAY_PERSONAL]);

export const PROFILES = Object.freeze({
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
  NORMAL_SALES: "NORMAL_SALES",
  PRIMARY_SALES: "PRIMARY_SALES",
  SUPER_SALES: "SUPER_SALES",
  ACCOUNTANT: "ACCOUNTANT",
  DESIGNER_3D: "DESIGNER_3D",
  DESIGNER_2D: "DESIGNER_2D",
  EXECUTOR_2D: "EXECUTOR_2D",
  CONTACT_INITIATOR: "CONTACT_INITIATOR",
});

export const PROFILE_FAMILIES = Object.freeze({
  ADMIN: "ADMIN",
  SALES: "SALES",
  FINANCE: "FINANCE",
  DESIGN: "DESIGN",
});

export const PROFILE_PERMISSION_DEFAULTS = Object.freeze({
  [PROFILES.ADMIN]: ADMIN,
  [PROFILES.SUPER_ADMIN]: ADMIN,
  [PROFILES.NORMAL_SALES]: NORMAL_SALES,
  [PROFILES.PRIMARY_SALES]: PRIMARY_SALES,
  [PROFILES.SUPER_SALES]: SUPER_SALES,
  [PROFILES.ACCOUNTANT]: ACCOUNTANT,
  [PROFILES.DESIGNER_3D]: DESIGNER,
  [PROFILES.DESIGNER_2D]: DESIGNER,
  [PROFILES.EXECUTOR_2D]: DESIGNER,
  [PROFILES.CONTACT_INITIATOR]: CONTACT_INITIATOR,
});

export const PROFILE_KEYS = Object.freeze(Object.values(PROFILES));

// Display metadata used by the frontend and authorization cache.
export const PROFILE_META = {
  [PROFILES.ADMIN]:             { label: "Admin",             family: PROFILE_FAMILIES.ADMIN },
  [PROFILES.SUPER_ADMIN]:       { label: "Super admin",       family: PROFILE_FAMILIES.ADMIN },
  [PROFILES.NORMAL_SALES]:      { label: "Sales",             family: PROFILE_FAMILIES.SALES },
  [PROFILES.PRIMARY_SALES]:     { label: "Primary sales",     family: PROFILE_FAMILIES.SALES },
  [PROFILES.SUPER_SALES]:       { label: "Super sales",       family: PROFILE_FAMILIES.SALES },
  [PROFILES.ACCOUNTANT]:        { label: "Accountant",        family: PROFILE_FAMILIES.FINANCE },
  [PROFILES.DESIGNER_3D]:       { label: "3D Designer",       family: PROFILE_FAMILIES.DESIGN },
  [PROFILES.DESIGNER_2D]:       { label: "2D Designer",       family: PROFILE_FAMILIES.DESIGN },
  [PROFILES.EXECUTOR_2D]:       { label: "2D Executor",       family: PROFILE_FAMILIES.DESIGN },
  [PROFILES.CONTACT_INITIATOR]: { label: "Contact initiator", family: PROFILE_FAMILIES.SALES },
};

export const PROFILE_FAMILY_BY_KEY = Object.freeze(
  Object.fromEntries(
    Object.entries(PROFILE_META).map(([key, metadata]) => [key, metadata.family]),
  ),
);

// Resolve a profile key from an authenticated user or profile record.
export function resolveProfileKey(user) {
  const key = user?.currentProfileKey ?? user?.profile ?? user?.currentProfile?.key;
  return key && PROFILE_PERMISSION_DEFAULTS[key] ? key : null;
}
