function keepExistingWhenMissing(existing, updated, key) {
  return Object.prototype.hasOwnProperty.call(updated, key)
    ? updated[key]
    : existing[key];
}

export function mergeUserManagementRow(existing, updated) {
  return {
    ...existing,
    ...updated,
    currentProfileId: keepExistingWhenMissing(existing, updated, "currentProfileId"),
    currentProfile: keepExistingWhenMissing(existing, updated, "currentProfile"),
    userProfiles: keepExistingWhenMissing(existing, updated, "userProfiles"),
  };
}

export function applyProfilesToUserRows(
  rows,
  { userId, profileIds, currentProfileId, availableProfiles },
) {
  if (!Array.isArray(rows)) return rows;

  const selectedIds = new Set((profileIds ?? []).map(Number));
  const profilesById = new Map(
    (availableProfiles ?? []).map((profile) => [Number(profile.id), profile]),
  );
  const userProfiles = [...selectedIds]
    .map((profileId) => {
      const profile = profilesById.get(profileId);
      return profile ? { profileId, profile } : null;
    })
    .filter(Boolean);
  const activeProfileId = Number(currentProfileId);

  return rows.map((row) =>
    Number(row.id) === Number(userId)
      ? {
          ...row,
          currentProfileId: activeProfileId,
          currentProfile: profilesById.get(activeProfileId) ?? null,
          userProfiles,
        }
      : row,
  );
}
