import { AppError } from "../errors/AppError.js";
import { JwtService } from "../../infra/security/jwt.js";
import { profileCache } from "../../infra/auth/profile-cache.js";
import {
  AUTH_COOKIE_NAME,
  authMessagesCodes,
  getEffectivePermissions,
  messagesNames,
  USER_ROLES,
} from "@dms/shared";

// Legacy admin-tier predicate — used ONLY in the transitional fallback path
// (tokens minted before currentProfileId existed, or an unmigrated user). The
// authoritative source is the current profile's `isAdminTier` (see requireAuth).
function legacyIsAdminTier(payload) {
  return (
    payload?.role === USER_ROLES.ADMIN ||
    payload?.role === USER_ROLES.SUPER_ADMIN ||
    Boolean(payload?.isSuperSales)
  );
}

// Authorization = authentication + permission code + object scope (+ status).
// `requireAuth` runs once per router; `requirePermissions` is the coarse code
// gate; `requireSpecialChecker` is the fine object-scope gate (throws on denial).
class AuthMiddleware {
  /**
   * Verify the session and attach `req.auth` with flattened effective
   * permissions. Single unified JWT scheme: only the `access_token` cookie is
   * accepted (the legacy `"token"` read-shim was removed at cutover).
   */
  static requireAuth(req, res, next) {
    const accessToken = req.cookies?.[AUTH_COOKIE_NAME];

    if (!accessToken) {
      return next(new AppError(authMessagesCodes.UNAUTHORIZED, 401));
    }

    let payload;
    try {
      payload = JwtService.verifyAccess(accessToken);
    } catch {
      return next(new AppError(authMessagesCodes.INVALID_TOKEN, 401));
    }

    // Authoritative resolution: the current profile's codes, from the in-process
    // cache (zero DB hit). The token carries `currentProfileId`.
    const resolved = profileCache.resolve(payload.currentProfileId);
    if (resolved) {
      req.auth = {
        ...payload,
        currentProfileKey: resolved.key,
        baseRole: resolved.baseRole,
        isAdminTier: Boolean(resolved.isAdminTier),
        permissions: resolved.permissions,
        permissionsByModule: resolved.permissionsByModule,
      };
      return next();
    }

    // TRANSITIONAL fallback: a token minted before `currentProfileId` existed, an
    // unmigrated user, or a deleted profile. Resolve from the legacy code-map so
    // access is never broken during rollout; the next refresh mints a
    // currentProfile-bearing token. (Removed once the migration is complete.)
    const { permissions, permissionsByModule } = getEffectivePermissions(payload);
    req.auth = {
      ...payload,
      isAdminTier: legacyIsAdminTier(payload),
      permissions,
      permissionsByModule,
    };
    return next();
  }

  /**
   * Coarse permission-code gate (gate 1). Two modes:
   *   - `required`: the user must hold ALL of these codes.
   *   - `anyOf`:    if `required` is empty, the user must hold ANY of these.
   * Throws 403 FORBIDDEN otherwise. Mount AFTER `requireAuth`.
   *
   * @param {string[]} [required]
   * @param {string[]} [anyOf]
   */
  static requirePermissions(required = [], anyOf = []) {
    return (req, res, next) => {
      if (!req.auth) {
        return next(new AppError(authMessagesCodes.UNAUTHORIZED, 401));
      }
      const have = req.auth.permissions || [];
      const ok = required.length
        ? required.every((p) => have.includes(p))
        : anyOf.some((p) => have.includes(p));

      if (!ok) {
        const requiredPermissions = required.length ? required : anyOf;
        return next(
          new AppError(authMessagesCodes.PERMISSION_DENIED, 403, { requiredPermissions }, {
            translationKey: messagesNames.authMessages,
            reason: `missing permission(s): ${requiredPermissions.join(", ")}`,
          }),
        );
      }
      return next();
    };
  }

  /**
   * Fine object-scope gate (gate 2 — the IDOR fix). Wraps a checker
   * `checkIfUserCanAccessX` / `checkIfUserCanMutateX` that MUST THROW an AppError
   * on denial (a `return false`/`undefined` would silently let the request
   * through). On success the checker may return the loaded row; we stash it on
   * `req.scoped` so the controller can reuse it. Mount AFTER `requirePermissions`.
   *
   * @param {(req: import('express').Request) => Promise<any>|any} checker
   */
  static requireSpecialChecker(checker) {
    return async (req, res, next) => {
      try {
        const result = await checker(req);
        req.scoped = result;
        return next();
      } catch (error) {
        return next(error);
      }
    };
  }

  /**
   * @deprecated Role-only gating. Kept for any not-yet-migrated importer; new code
   * MUST use `requirePermissions` (+ `requireSpecialChecker` for object scope).
   * Never authorize on role alone.
   */
  static requireRole(allowedRoles) {
    return (req, res, next) => {
      if (!req.auth) {
        return next(new AppError(authMessagesCodes.UNAUTHORIZED, 401));
      }
      if (!allowedRoles.includes(req.auth.activeRole || req.auth.role)) {
        return next(new AppError(authMessagesCodes.FORBIDDEN, 403));
      }
      return next();
    };
  }
}

export { AuthMiddleware };
