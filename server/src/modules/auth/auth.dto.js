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
  select: { profile: { select: { id: true, key: true, label: true, family: true, isAdminTier: true } } },
};

class AuthSchema {
  // ─── Prisma select shapes ───────────────────────────────────────────────────
  // Used in auth.repository.js — keeps query projections consistent and centralized.

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
   * permission CODES; role/subRoles/isSuperSales/activeRole are DISPLAY-only.
   * `subRoles` is normalized to a plain string[] for the client.
   *
   * @param {object} user  the auth payload on `req.auth` (already has effective
   *                        permissions attached by `requireAuth`) OR a raw user.
   */
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
    // falls back to the legacy role rule (unmigrated parity).
    const navRole =
      user.currentProfile || user.currentProfileKey || user.baseRole
        ? currentProfileKey === "SUPER_SALES"
          ? "SUPER_SALES"
          : baseRole
        : undefined;

    const navigationTabs = buildNavigationTabs({
      role: user.role,
      activeRole: user.activeRole,
      isSuperSales: user.isSuperSales,
      navRole,
      subRoles,
      permissions,
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      activeRole: user.activeRole ?? user.role,
      subRoles,
      isSuperSales: Boolean(user.isSuperSales),
      isPrimary: Boolean(user.isPrimary),
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
   * in requireAuth, no DB hit). role/subRoles/isSuperSales are retained for
   * display + the transitional legacy fallback only.
   */
  static toTokenPayload(user) {
    const subRoles = Array.isArray(user.subRoles)
      ? user.subRoles.map((s) => (typeof s === "string" ? s : s?.subRole)).filter(Boolean)
      : [];
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      activeRole: user.role,
      isActive: user.isActive,
      isPrimary: user.isPrimary,
      isSuperSales: user.isSuperSales,
      subRoles,
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
