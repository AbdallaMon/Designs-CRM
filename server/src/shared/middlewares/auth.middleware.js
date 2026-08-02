import { AppError } from "../errors/AppError.js";
import { JwtService } from "../../infra/security/jwt.js";
import { profileCache } from "../../infra/auth/profile-cache.js";
import { AuthUseCase } from "../../modules/auth/auth.usecase.js";
import {
  AUTH_COOKIE_NAME,
  AUTH_REFRESH_TOKEN_COOKIE_NAME,
  authMessagesCodes,
  messagesNames,
} from "@dms/shared";

// Authorization = authentication + permission code + object scope (+ status).
// `requireAuth` runs once per router; `requirePermissions` is the coarse code
// gate; `requireSpecialChecker` is the fine object-scope gate (throws on denial).
class AuthMiddleware {
  /**
   * Verify the session and attach `req.auth` with flattened effective
   * permissions. Single unified JWT scheme: only the `access_token` cookie is
   * accepted (the legacy `"token"` read-shim was removed at cutover).
   *
   * SILENT REFRESH: a missing/expired/malformed access token is NOT an immediate
   * 401. If a valid `refresh_token` cookie is present, we transparently mint a
   * fresh token pair (via AuthUseCase.refreshTokens — which re-loads and
   * re-validates the user), set the new cookies on the response, and let the
   * request proceed with the new payload. This keeps the session alive across
   * the 15-min access-token expiry for EVERY request — not only those routed
   * through the frontend refresh-retry wrapper. It cannot widen access: a
   * cryptographically valid refresh token is still required and the user is
   * re-checked for `isActive`. Only when there is neither a valid access token
   * nor a usable refresh token does the request 401.
   */
  static async requireAuth(req, res, next) {
    const accessToken = req.cookies?.[AUTH_COOKIE_NAME];

    let payload = null;
    if (accessToken) {
      try {
        payload = JwtService.verifyAccess(accessToken);
      } catch {
        payload = null; // expired/malformed → fall through to silent refresh
      }
    }

    // No valid access token: try a silent refresh from the refresh cookie.
    if (!payload) {
      const refreshToken = req.cookies?.[AUTH_REFRESH_TOKEN_COOKIE_NAME];
      if (!refreshToken) {
        return next(new AppError({ code: authMessagesCodes.UNAUTHORIZED, statusCode: 401 }));
      }
      try {
        const { accessToken: newAccess, refreshToken: newRefresh } =
          await AuthUseCase.refreshTokens(refreshToken);
        res
          .cookie(AUTH_COOKIE_NAME, newAccess, JwtService.cookies.access)
          .cookie(
            AUTH_REFRESH_TOKEN_COOKIE_NAME,
            newRefresh,
            JwtService.cookies.refresh,
          );
        payload = JwtService.verifyAccess(newAccess);
      } catch (err) {
        // Refresh token missing/expired/invalid, or the user is gone/inactive.
        return next(
          err instanceof AppError
            ? err
            : new AppError({ code: authMessagesCodes.INVALID_TOKEN, statusCode: 401 }),
        );
      }
    }

    // Authoritative resolution: the current profile's codes, from the in-process
    // cache (zero DB hit). The token carries `currentProfileId`. Wrapped so any
    // unexpected throw is forwarded to the error handler rather than becoming an
    // unhandled rejection (this method is async for the silent-refresh path).
    try {
      const resolved = profileCache.resolve(payload.currentProfileId);
      if (!resolved) {
        return next(new AppError({ code: authMessagesCodes.PROFILE_REQUIRED, statusCode: 403 }));
      }
      const profiles = Array.isArray(payload.profileIds)
        ? payload.profileIds.map((id) => profileCache.resolveMeta(id)).filter(Boolean)
        : [];
      req.auth = {
        ...payload,
        currentProfileKey: resolved.key,
        profileFamily: resolved.family,
        isAdminTier: Boolean(resolved.isAdminTier),
        permissions: resolved.permissions,
        permissionsByModule: resolved.permissionsByModule,
        profiles,
      };
      return next();
    } catch (err) {
      return next(err);
    }
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
        return next(new AppError({ code: authMessagesCodes.UNAUTHORIZED, statusCode: 401 }));
      }
      const have = req.auth.permissions || [];
      const ok = required.length
        ? required.every((p) => have.includes(p))
        : anyOf.some((p) => have.includes(p));

      if (!ok) {
        const requiredPermissions = required.length ? required : anyOf;
        return next(
          new AppError({
            code: authMessagesCodes.PERMISSION_DENIED,
            statusCode: 403,
            details: { requiredPermissions },
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

}

export { AuthMiddleware };
