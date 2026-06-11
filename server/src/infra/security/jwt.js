import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import {
  AUTH_COOKIE_NAME,
  AUTH_REFRESH_TOKEN_COOKIE_NAME,
} from "@dms/shared";

// Unified JWT scheme: we ISSUE and VERIFY exactly one access/refresh pair, always
// signed with the dedicated access/refresh secrets. The legacy `SECRET_KEY` 4h
// `"token"` scheme is fully retired (the read-shim was removed at cutover).
class JwtService {
  static #baseOptions = {
    httpOnly: true,
    secure: !env.ISLOCAL,
    sameSite: env.ISLOCAL ? "lax" : "none",
    path: "/",
    // Shared across subdomains only when explicitly configured in prod (e.g. ".domain.com").
    // undefined on localhost and when COOKIE_DOMAIN is unset → today's exact behavior.
    domain: env.ISLOCAL ? undefined : env.COOKIE_DOMAIN || undefined,
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
