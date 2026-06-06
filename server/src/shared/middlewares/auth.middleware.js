import { AppError } from "../errors/AppError.js";
import { JwtService } from "../../infra/security/jwt.js";
import {
  AUTH_COOKIE_NAME,
  LEGACY_AUTH_COOKIE_NAME,
  authMessagesCodes,
  getEffectivePermissions,
} from "@dms/shared";

// Authorization = authentication + permission code + object scope (+ status).
// `requireAuth` runs once per router; `requirePermissions` is the coarse code
// gate; `requireSpecialChecker` is the fine object-scope gate (throws on denial).
class AuthMiddleware {
  /**
   * Verify the session and attach `req.auth` with flattened effective
   * permissions. Unified JWT: we issue only the `access_token` cookie, but a
   * transitional READ-shim still accepts the legacy `"token"` cookie (signed with
   * the retired SECRET_KEY) so existing sessions are not logged out.
   */
  static requireAuth(req, res, next) {
    const accessToken = req.cookies?.[AUTH_COOKIE_NAME];
    const legacyToken = req.cookies?.[LEGACY_AUTH_COOKIE_NAME];

    if (!accessToken && !legacyToken) {
      return next(new AppError(authMessagesCodes.UNAUTHORIZED, 401));
    }

    let payload;
    try {
      if (accessToken) {
        payload = JwtService.verifyAccess(accessToken);
      } else {
        // transitional read-shim — accept the legacy cookie only.
        payload = JwtService.verifyLegacyAccess(legacyToken);
      }
    } catch {
      return next(new AppError(authMessagesCodes.INVALID_TOKEN, 401));
    }

    // Compute effective permissions from the code-defined role map (base role ∪
    // sub-roles ∪ isSuperSales). The token payload carries role/subRoles/
    // isSuperSales, so this needs no extra DB hit.
    const { permissions, permissionsByModule } =
      getEffectivePermissions(payload);

    req.auth = { ...payload, permissions, permissionsByModule };
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
        return next(new AppError(authMessagesCodes.FORBIDDEN, 403));
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
