// Browser mirror of the canonical active-profile families. Course access uses the
// active profile and backend permissions; database role fields are never consulted.
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
