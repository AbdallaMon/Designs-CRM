import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import {
  AUTH_COOKIE_NAME,
  AUTH_REFRESH_TOKEN_COOKIE_NAME,
} from "@dms/shared";

// Unified JWT scheme (Stage 3): we ISSUE exactly one access/refresh pair, always
// signed/verified with the dedicated access/refresh secrets. The legacy
// `SECRET_KEY` 4h `"token"` scheme and the `currentMainTokenName`/`LEGACY` bridge
// are retired. A transitional READ-shim that still accepts the legacy cookie lives
// in the auth middleware (it does not change how tokens are signed).
class JwtService {
  static #baseOptions = {
    httpOnly: true,
    secure: !env.ISLOCAL,
    sameSite: env.ISLOCAL ? "lax" : "none",
    path: "/",
  };

  static cookies = {
    access: { ...JwtService.#baseOptions, maxAge: 15 * 60 * 1000 }, // 15 min
    refresh: { ...JwtService.#baseOptions, maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days
    clear: { ...JwtService.#baseOptions, maxAge: -1 },
  };

  // Cookie names — sourced from @dms/shared (single source of truth).
  static cookieNames = {
    ACCESS: AUTH_COOKIE_NAME,
    REFRESH: AUTH_REFRESH_TOKEN_COOKIE_NAME,
  };

  // ─── Sign ─────────────────────────────────────────────────────────────────

  /** Signs a short-lived access token. */
  static signAccess(payload) {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.ACCESS_TOKEN_EXPIRES_IN,
    });
  }

  /** Signs a long-lived refresh token. Payload should be minimal — only { id }. */
  static signRefresh(payload) {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
    });
  }

  // ─── Verify ───────────────────────────────────────────────────────────────

  /** Verifies an access token. Throws jwt error on failure. */
  static verifyAccess(token) {
    return jwt.verify(token, env.JWT_ACCESS_SECRET);
  }

  /**
   * Transitional READ-shim: verifies a legacy `"token"` cookie that was signed
   * with the retired `SECRET_KEY` 4h scheme. We never SIGN with this anymore — it
   * exists only so already-issued legacy sessions keep working during the cutover
   * window. Remove together with the shim in the auth middleware.
   */
  static verifyLegacyAccess(token) {
    return jwt.verify(token, env.SECRET_KEY);
  }

  /** Verifies a refresh token. Throws jwt error on failure. */
  static verifyRefresh(token) {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
  }

  static signReset(payload) {
    return jwt.sign({ id: payload.id }, env.JWT_RESET_SECRET, {
      expiresIn: env.JWT_RESET_EXPIRES_IN,
    });
  }

  static verifyReset(token) {
    return jwt.verify(token, env.JWT_RESET_SECRET);
  }
}

export { JwtService };
