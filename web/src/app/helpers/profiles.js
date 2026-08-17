import {
  PROFILE_FAMILIES,
  PROFILE_FAMILY_BY_KEY,
} from "@dms/shared";

export { PROFILE_FAMILY_BY_KEY };

export const FAMILY_META = {
  [PROFILE_FAMILIES.SALES]: { label: "Sales", order: 1 },
  [PROFILE_FAMILIES.DESIGN]: { label: "Design", order: 2 },
  [PROFILE_FAMILIES.FINANCE]: { label: "Finance", order: 3 },
  [PROFILE_FAMILIES.ADMIN]: { label: "Admin", order: 4 },
};

export const FAMILY_ORDER = [
  PROFILE_FAMILIES.SALES,
  PROFILE_FAMILIES.DESIGN,
  PROFILE_FAMILIES.FINANCE,
  PROFILE_FAMILIES.ADMIN,
];

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
