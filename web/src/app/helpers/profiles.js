// Browser mirror of the canonical active-profile families. Authorization and
// presentation derive from profile keys only; database role fields are never used.
export const PROFILE_FAMILY_BY_KEY = {
  ADMIN: "ADMIN",
  SUPER_ADMIN: "ADMIN",
  NORMAL_SALES: "SALES",
  PRIMARY_SALES: "SALES",
  SUPER_SALES: "SALES",
  ACCOUNTANT: "FINANCE",
  DESIGNER_3D: "DESIGN",
  DESIGNER_2D: "DESIGN",
  EXECUTOR_2D: "DESIGN",
  CONTACT_INITIATOR: "SALES",
};

export const FAMILY_META = {
  SALES: { label: "Sales", order: 1 },
  DESIGN: { label: "Design", order: 2 },
  FINANCE: { label: "Finance", order: 3 },
  ADMIN: { label: "Admin", order: 4 },
};

export const FAMILY_ORDER = ["SALES", "DESIGN", "FINANCE", "ADMIN"];

export function profileKeysOf(user) {
  const held = (user?.userProfiles ?? [])
    .map((item) => item.profile?.key ?? item.key)
    .filter(Boolean);
  const active = user?.currentProfile?.key ?? user?.profile ?? null;
  return Array.from(new Set(active ? [...held, active] : held));
}

export function familiesOf(user) {
  const families = new Set(
    profileKeysOf(user).map((key) => PROFILE_FAMILY_BY_KEY[key]).filter(Boolean),
  );
  return FAMILY_ORDER.filter((family) => families.has(family));
}

export function activeProfileLabel(profiles, currentProfileId) {
  if (!Array.isArray(profiles) || currentProfileId == null) return null;
  return profiles.find((profile) => profile.id === currentProfileId)?.label ?? null;
}

export function currentProfileLabel(user) {
  if (!user) return "";
  return (
    user.currentProfile?.label ??
    user.profiles?.find((profile) => profile.id === user.currentProfileId)?.label ??
    user.profile ??
    ""
  );
}

export function isAdminProfile(user) {
  return Boolean(
    user?.isAdminTier ||
      user?.currentProfile?.isAdminTier ||
      user?.profiles?.find((profile) => profile.id === user?.currentProfileId)?.isAdminTier,
  );
}
