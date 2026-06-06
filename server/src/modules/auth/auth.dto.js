import {
  AUTH_COOKIE_NAME,
  AUTH_REFRESH_TOKEN_COOKIE_NAME,
  getEffectivePermissions,
} from "@dms/shared";

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

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      activeRole: user.activeRole ?? user.role,
      subRoles,
      isSuperSales: Boolean(user.isSuperSales),
      isPrimary: Boolean(user.isPrimary),
      profilePicture: user.profilePicture ?? null,
      permissions,
      permissionsByModule,
    };
  }

  // ─── JWT payload shape ─────────────────────────────────────────────────────

  /**
   * Builds the minimal payload embedded in every token. Includes role + subRoles
   * + isSuperSales so the auth middleware can compute effective permissions from
   * the token without a DB hit.
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
    };
  }
}

export { AuthSchema };
