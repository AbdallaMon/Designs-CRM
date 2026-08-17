export { PROFILE_FAMILY_BY_KEY } from "@dms/shared";

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
