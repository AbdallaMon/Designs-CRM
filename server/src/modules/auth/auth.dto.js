import {
  AUTH_COOKIE_NAME,
  AUTH_REFRESH_TOKEN_COOKIE_NAME,
  getEffectivePermissions,
  buildNavigationTabs,
  resolveProfileKey,
} from "@dms/shared";

// Prisma nested-select fragments for the profile relations (shared by the auth
// selects so /auth/me + switch validation see the user's profiles + current one).
const CURRENT_PROFILE_SELECT = {
  select: { id: true, key: true, baseRole: true, isAdminTier: true },
};
const USER_PROFILES_SELECT = {
  // baseRole is needed so the auth boundary can derive `role` for the EFFECTIVE
  // active profile even on the login/refresh correction path (where the stored
  // currentProfileId was corrected but user.currentProfile still points at the old one).
  select: { profile: { select: { id: true, key: true, label: true, family: true, isAdminTier: true, baseRole: true } } },
};

class AuthSchema {
  // ─── Prisma select shapes ───────────────────────────────────────────────────
  // Used in auth.repo.js — keeps query projections consistent and centralized.

  /** Fields needed for login + active status checks. Includes password for bcrypt. */
  static userAuthSelect = {
    id: true,
    email: true,
    name: true,
    password: true,
    role: true,
    isActive: true,
    isPrimary: true,
    isSuperSales: true,
    profilePicture: true,
    subRoles: { select: { subRole: true } },
    currentProfileId: true,
    currentProfile: CURRENT_PROFILE_SELECT,
    userProfiles: USER_PROFILES_SELECT,
  };

  /** Minimal fields for refresh-token rotation — no password needed. */
  static userRefreshSelect = {
    id: true,
    email: true,
    name: true,
    role: true,
    isActive: true,
    isPrimary: true,
    isSuperSales: true,
    profilePicture: true,
    subRoles: { select: { subRole: true } },
    currentProfileId: true,
    currentProfile: CURRENT_PROFILE_SELECT,
    userProfiles: USER_PROFILES_SELECT,
  };

  // ─── Cookie names ──────────────────────────────────────────────────────────
  // Single source of truth in @dms/shared/auth.js.

  static cookieNames = {
    ACCESS: AUTH_COOKIE_NAME,
    REFRESH: AUTH_REFRESH_TOKEN_COOKIE_NAME,
  };

  // ─── Response DTOs ─────────────────────────────────────────────────────────

  /**
   * Strips password before sending user data to the client.
   * Always call this before putting a user object in a response.
   */
  static toPublicUser(user) {
    const { password, ...safe } = user;
    return safe;
  }

  /**
   * Shape the `/auth/me` payload: the user's display fields PLUS the flattened
   * effective `permissions[]` + `permissionsByModule{}`. The FE gates on the
   * permission CODES; role/subRoles/activeRole are DISPLAY-only. `profile` (the
   * resolved profile key) is the single source of the user's tier — the legacy
   * `isSuperSales`/`isPrimary` flags are no longer exposed here.
   * `subRoles` is normalized to a plain string[] for the client.
   *
   * @param {object} user  the auth payload on `req.auth` (already has effective
   *                        permissions attached by `requireAuth`) OR a raw user.
   */
  /**
   * The baseRole of the user's EFFECTIVE active profile.
   *
   * "Effective" = the resolved `currentProfileId`, which login/refresh may have
   * corrected away from the eagerly-loaded `user.currentProfile` object. We therefore
   * prefer `currentProfile` ONLY when its id matches, else look the id up in the held
   * `userProfiles`, else use the cache-resolved `user.baseRole` (the DB-free /auth/me
   * path). Returns null when the user holds no profile → callers fall back to user.role.
   */
  static activeBaseRole(user) {
    if (!user) return null;
    const effectiveId = user.currentProfileId ?? user.currentProfile?.id ?? null;
    if (user.currentProfile && user.currentProfile.id === effectiveId && user.currentProfile.baseRole) {
      return user.currentProfile.baseRole;
    }
    const held = Array.isArray(user.userProfiles)
      ? user.userProfiles.map((up) => up.profile).filter(Boolean)
      : [];
    const match = held.find((p) => p?.id === effectiveId);
    if (match?.baseRole) return match.baseRole;
    return user.baseRole ?? null;
  }

  static toMe(user) {
    const subRoles = Array.isArray(user.subRoles)
      ? user.subRoles.map((s) => (typeof s === "string" ? s : s?.subRole)).filter(Boolean)
      : [];

    // requireAuth already attached effective permissions; recompute defensively
    // if they're absent (e.g. called from a raw user row).
    const { permissions, permissionsByModule } =
      Array.isArray(user.permissions) && user.permissionsByModule
        ? {
            permissions: user.permissions,
            permissionsByModule: user.permissionsByModule,
          }
        : getEffectivePermissions({ ...user, subRoles });

    // The user's assigned profiles (for the switcher) + the active one. Prefer the
    // cache-resolved list attached to req.auth; fall back to a raw DB user's relation.
    const profiles = Array.isArray(user.profiles)
      ? user.profiles
      : Array.isArray(user.userProfiles)
        ? user.userProfiles.map((up) => up.profile).filter(Boolean)
        : [];
    // Prefer the cache-resolved fields attached to req.auth (currentProfileKey /
    // baseRole) — the `currentProfile` OBJECT only exists when toMe is called with a
    // raw DB user (switch/login), NOT on the /auth/me path (req.auth). Without this,
    // /auth/me silently fell back to the legacy role and nav stopped following the
    // active profile.
    const currentProfileId = user.currentProfileId ?? user.currentProfile?.id ?? null;
    const currentProfileKey =
      user.currentProfile?.key ?? user.currentProfileKey ?? resolveProfileKey(user);
    const baseRole = user.currentProfile?.baseRole ?? user.baseRole ?? null;

    // Nav follows the ACTIVE profile: the SUPER_SALES profile (baseRole STAFF)
    // renders the super-sales sidebar; every other profile renders its baseRole
    // sidebar. Undefined only when there's truly no active profile → buildNavigationTabs
    // falls back to the plain role (un-migrated users are waived onto the base-role nav;
    // no flag read here).
    const navRole =
      user.currentProfile || user.currentProfileKey || user.baseRole
        ? currentProfileKey === "SUPER_SALES"
          ? "SUPER_SALES"
          : baseRole
        : undefined;

    const navigationTabs = buildNavigationTabs({
      role: user.role,
      activeRole: user.activeRole,
      navRole,
      subRoles,
      permissions,
    });

    // role is now a VIEW of the active profile's baseRole, not the legacy column.
    // Fallback to user.role only when the user holds no profile (unmigrated row).
    const derivedRole = AuthSchema.activeBaseRole(user) ?? user.role;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: derivedRole,
      activeRole: derivedRole,
      subRoles: [],
      profile: currentProfileKey,
      currentProfileId,
      profiles,
      profilePicture: user.profilePicture ?? null,
      permissions,
      permissionsByModule,
      navigationTabs,
    };
  }

  // ─── JWT payload shape ─────────────────────────────────────────────────────

  /**
   * Builds the minimal payload embedded in every token. `currentProfileId` is the
   * AUTHORITATIVE source of effective permissions (resolved via the profile cache
   * in requireAuth, no DB hit). role/subRoles are retained for display + the
   * transitional legacy-code-map fallback only (`isSuperSales`/`isPrimary` are
   * NOT carried in the token — profiles only).
   */
  static toTokenPayload(user) {
    // role/activeRole are a VIEW of the effective active profile's baseRole (see
    // activeBaseRole) — NOT the stored column, which goes stale after a self-switch.
    const derivedRole = AuthSchema.activeBaseRole(user) ?? user.role;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: derivedRole,
      activeRole: derivedRole,
      isActive: user.isActive,
      subRoles: [],
      currentProfileId: user.currentProfileId ?? user.currentProfile?.id ?? null,
      // The ids of the profiles the user holds — so /auth/me can build the switcher
      // list from the cache (no DB read). Stale only until the next refresh.
      profileIds: Array.isArray(user.userProfiles)
        ? user.userProfiles.map((up) => up.profile?.id).filter((x) => x != null)
        : Array.isArray(user.profileIds)
          ? user.profileIds
          : [],
    };
  }
}

export { AuthSchema };
