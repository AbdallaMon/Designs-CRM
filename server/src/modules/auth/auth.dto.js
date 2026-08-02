import {
  AUTH_COOKIE_NAME,
  AUTH_REFRESH_TOKEN_COOKIE_NAME,
  buildNavigationTabs,
  getEffectivePermissions,
} from "@dms/shared";

const PROFILE_SELECT = {
  select: {
    id: true,
    key: true,
    label: true,
    family: true,
    isAdminTier: true,
  },
};

const USER_PROFILES_SELECT = {
  select: { profile: PROFILE_SELECT },
};

class AuthSchema {
  static userAuthSelect = {
    id: true,
    email: true,
    name: true,
    password: true,
    isActive: true,
    profilePicture: true,
    currentProfileId: true,
    currentProfile: PROFILE_SELECT,
    userProfiles: USER_PROFILES_SELECT,
  };

  static userRefreshSelect = {
    id: true,
    email: true,
    name: true,
    isActive: true,
    profilePicture: true,
    currentProfileId: true,
    currentProfile: PROFILE_SELECT,
    userProfiles: USER_PROFILES_SELECT,
  };

  static cookieNames = {
    ACCESS: AUTH_COOKIE_NAME,
    REFRESH: AUTH_REFRESH_TOKEN_COOKIE_NAME,
  };

  static toPublicUser(user) {
    const { password, ...safe } = user;
    return safe;
  }

  static resolveCurrentProfile(user) {
    if (!user) return null;
    const currentId = user.currentProfileId ?? user.currentProfile?.id ?? null;
    if (user.currentProfile?.id === currentId) return user.currentProfile;
    const held = Array.isArray(user.userProfiles)
      ? user.userProfiles.map((entry) => entry.profile).filter(Boolean)
      : [];
    return held.find((profile) => profile.id === currentId) ?? null;
  }

  static toMe(user) {
    const current = AuthSchema.resolveCurrentProfile(user);
    const profile = user.currentProfileKey ?? current?.key ?? null;
    const currentProfileId = user.currentProfileId ?? current?.id ?? null;
    const profiles = Array.isArray(user.profiles)
      ? user.profiles
      : Array.isArray(user.userProfiles)
        ? user.userProfiles.map((entry) => entry.profile).filter(Boolean)
        : [];

    const effective =
      Array.isArray(user.permissions) && user.permissionsByModule
        ? {
            permissions: user.permissions,
            permissionsByModule: user.permissionsByModule,
          }
        : getEffectivePermissions({ profile });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      profile,
      profileFamily: user.profileFamily ?? current?.family ?? null,
      isAdminTier: Boolean(user.isAdminTier ?? current?.isAdminTier),
      currentProfileId,
      profiles,
      profilePicture: user.profilePicture ?? null,
      permissions: effective.permissions,
      permissionsByModule: effective.permissionsByModule,
      navigationTabs: buildNavigationTabs({
        profile,
        permissions: effective.permissions,
      }),
    };
  }

  static toTokenPayload(user) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      currentProfileId: user.currentProfileId ?? user.currentProfile?.id ?? null,
      profileIds: Array.isArray(user.userProfiles)
        ? user.userProfiles.map((entry) => entry.profile?.id).filter((id) => id != null)
        : Array.isArray(user.profileIds)
          ? user.profileIds
          : [],
    };
  }
}

export { AuthSchema };
