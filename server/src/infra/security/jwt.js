import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import {
  AUTH_COOKIE_NAME,
  AUTH_REFRESH_TOKEN_COOKIE_NAME,
} from "@dms/shared";

// Unified JWT scheme: we ISSUE and VERIFY exactly one access/refresh pair, always
// signed with the dedicated access/refresh secrets. The legacy `SECRET_KEY` 4h
// `"token"` scheme is fully retired (the read-shim was removed at cutover).
function expiryToMilliseconds(value, fallback) {
  if (typeof value === "number" && Number.isFinite(value)) return value * 1000;
  const match = String(value ?? "")
    .trim()
    .match(/^(\d+(?:\.\d+)?)\s*(ms|milliseconds?|s|seconds?|m|minutes?|h|hours?|d|days?)?$/i);
  if (!match) return fallback;
  const amount = Number(match[1]);
  const unit = (match[2] || "ms").toLowerCase();
  const multipliers = {
    ms: 1,
    millisecond: 1,
    milliseconds: 1,
    s: 1000,
    second: 1000,
    seconds: 1000,
    m: 60_000,
    minute: 60_000,
    minutes: 60_000,
    h: 3_600_000,
    hour: 3_600_000,
    hours: 3_600_000,
    d: 86_400_000,
    day: 86_400_000,
    days: 86_400_000,
  };
  return amount * multipliers[unit];
}

const accessMaxAge = expiryToMilliseconds(env.ACCESS_TOKEN_EXPIRES_IN, 15 * 60 * 1000);
const refreshMaxAge = expiryToMilliseconds(env.REFRESH_TOKEN_EXPIRES_IN, 7 * 24 * 60 * 60 * 1000);

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
    access: { ...JwtService.#baseOptions, maxAge: accessMaxAge },
    refresh: { ...JwtService.#baseOptions, maxAge: refreshMaxAge },
    csrf: {
      ...JwtService.#baseOptions,
      httpOnly: false,
      maxAge: refreshMaxAge,
    },
    clear: { ...JwtService.#baseOptions, maxAge: 0, expires: new Date(0) },
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

  /** Signs a long-lived refresh token with session-family replay identifiers. */
  static signRefresh(payload) {
    return jwt.sign(
      {
        ...payload,
        sid: payload.sid || randomUUID(),
        jti: payload.jti || randomUUID(),
        sv: Number.isInteger(payload.sv) ? payload.sv : 0,
      },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.REFRESH_TOKEN_EXPIRES_IN },
    );
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
    return jwt.sign(
      { id: payload.id, jti: payload.jti || randomUUID() },
      env.JWT_RESET_SECRET,
      { expiresIn: env.JWT_RESET_EXPIRES_IN },
    );
  }

  static verifyReset(token) {
    return jwt.verify(token, env.JWT_RESET_SECRET);
  }

  static signUploadCapability({ purpose, subject }) {
    return jwt.sign(
      { purpose, subject },
      env.JWT_UPLOAD_SECRET,
      {
        audience: "public-upload",
        issuer: "dream-studio-api",
        expiresIn: env.JWT_UPLOAD_EXPIRES_IN,
      },
    );
  }

  static verifyUploadCapability(token) {
    return jwt.verify(token, env.JWT_UPLOAD_SECRET, {
      audience: "public-upload",
      issuer: "dream-studio-api",
    });
  }
}

export { JwtService };
