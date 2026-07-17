// Web mirror of packages/shared/constants/access/profiles.js PROFILE_META (the web
// workspace has no @dms/shared dependency, so the profile→family / profile→baseRole maps
// are kept in sync here). Used to drive the profile-aware per-user performance view: a
// user holds one or MORE profiles, and each profile belongs to a FAMILY whose metrics we
// render — so a user with both a SALES and a DESIGN profile sees BOTH sections.

export const PROFILE_FAMILY_BY_KEY = {
  ADMIN: "ADMIN",
  SUPER_ADMIN: "ADMIN",
  NORMAL_SALES: "SALES",
  PRIMARY_SALES: "SALES",
  SUPER_SALES: "SALES",
  SUPER_SALES_BASE: "SALES",
  ACCOUNTANT: "FINANCE",
  DESIGNER_3D: "DESIGN",
  DESIGNER_2D: "DESIGN",
  EXECUTOR_2D: "DESIGN",
  CONTACT_INITIATOR: "SALES",
};

// The legacy base role each profile key maps onto (used when a family section needs to
// hand a role to a downstream component).
export const PROFILE_BASE_ROLE_BY_KEY = {
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
  NORMAL_SALES: "STAFF",
  PRIMARY_SALES: "STAFF",
  SUPER_SALES: "STAFF",
  SUPER_SALES_BASE: "SUPER_SALES",
  ACCOUNTANT: "ACCOUNTANT",
  DESIGNER_3D: "THREE_D_DESIGNER",
  DESIGNER_2D: "TWO_D_DESIGNER",
  EXECUTOR_2D: "TWO_D_EXECUTOR",
  CONTACT_INITIATOR: "CONTACT_INITIATOR",
};

// Fallback: derive a family straight from a legacy role string (when a user has no
// userProfiles rows to read).
export const FAMILY_BY_ROLE = {
  STAFF: "SALES",
  SUPER_SALES: "SALES",
  CONTACT_INITIATOR: "SALES",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "ADMIN",
  ACCOUNTANT: "FINANCE",
  THREE_D_DESIGNER: "DESIGN",
  TWO_D_DESIGNER: "DESIGN",
  TWO_D_EXECUTOR: "DESIGN",
};

// Display metadata per family, in the order we render sections.
export const FAMILY_META = {
  SALES: { label: "Sales", order: 1 },
  DESIGN: { label: "Design", order: 2 },
  FINANCE: { label: "Finance", order: 3 },
  ADMIN: { label: "Admin", order: 4 },
};

export const FAMILY_ORDER = ["SALES", "DESIGN", "FINANCE", "ADMIN"];

// The held profile keys for a user (from the management row's userProfiles).
export function profileKeysOf(user) {
  return (user?.userProfiles ?? [])
    .map((up) => up.profile?.key ?? up.key)
    .filter(Boolean);
}

// The unique, ordered set of FAMILIES a user belongs to across ALL their profiles.
// Falls back to the legacy role when there are no userProfiles rows.
export function familiesOf(user) {
  const keys = profileKeysOf(user);
  const families = new Set(
    keys.map((k) => PROFILE_FAMILY_BY_KEY[k]).filter(Boolean),
  );
  if (families.size === 0 && user?.role && FAMILY_BY_ROLE[user.role]) {
    families.add(FAMILY_BY_ROLE[user.role]);
  }
  return FAMILY_ORDER.filter((f) => families.has(f));
}

// The base roles a user's DESIGN profiles map onto (e.g. THREE_D_DESIGNER, TWO_D_DESIGNER),
// so the design section can label/scope its metrics.
export function designRolesOf(user) {
  const keys = profileKeysOf(user);
  const roles = new Set(
    keys
      .filter((k) => PROFILE_FAMILY_BY_KEY[k] === "DESIGN")
      .map((k) => PROFILE_BASE_ROLE_BY_KEY[k])
      .filter(Boolean),
  );
  if (roles.size === 0 && FAMILY_BY_ROLE[user?.role] === "DESIGN") {
    roles.add(user.role);
  }
  return Array.from(roles);
}

// The label of the user's ACTIVE profile, from the /auth/me `profiles[]` array
// (each entry: { id, key, label, family, isAdminTier }). Returns null when there is
// no match — callers supply their own legacy fallback. This is the single source the
// toolbar chip and the drawer footer both read, so they always agree after a switch.
export function activeProfileLabel(profiles, currentProfileId) {
  if (!Array.isArray(profiles) || currentProfileId == null) return null;
  const active = profiles.find((p) => p.id === currentProfileId);
  return active?.label ?? null;
}

// Legacy role→label fallback for unmigrated accounts that hold no profiles (0 users in
// prod today). The active-profile label (activeProfileLabel) is always preferred; this is
// only reached when there is no active profile to read a label from.
export function legacyRoleLabel(user) {
  if (!user) return "";
  if (user.role === "STAFF") return user.profile === "SUPER_SALES" ? "Super Sales" : "Sales";
  const map = {
    ADMIN: "Admin", SUPER_ADMIN: "Admin", THREE_D_DESIGNER: "3D Designer",
    TWO_D_DESIGNER: "2D Designer", TWO_D_EXECUTOR: "Executor", ACCOUNTANT: "Accountant",
    CONTACT_INITIATOR: "Contact Initiator", SUPER_SALES: "Super Sales",
  };
  return map[user.role] || user.role || "";
}
