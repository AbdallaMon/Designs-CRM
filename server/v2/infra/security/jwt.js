import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

class JwtService {
  static #baseOptions = {
    httpOnly: true,
    secure: !env.ISLOCAL,
    sameSite: "none",
    path: "/",
  };

  static cookies = {
    access: { ...JwtService.#baseOptions, maxAge: 15 * 60 * 1000 }, // 15 min
    refresh: { ...JwtService.#baseOptions, maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days
    clear: { ...JwtService.#baseOptions, maxAge: -1 },
  };

  // ─── Sign ─────────────────────────────────────────────────────────────────

  /**
   * Signs a short-lived access token.
   * @param {object} payload
   * @returns {string}
   */
  static signAccess(payload) {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.ACCESS_TOKEN_EXPIRES_IN,
    });
  }

  /**
   * Signs a long-lived refresh token. Payload should be minimal — only { id }.
   * @param {{ id: number }} payload
   * @returns {string}
   */
  static signRefresh(payload) {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
    });
  }

  // ─── Verify ───────────────────────────────────────────────────────────────

  /**
   * Verifies an access token. Throws jwt error on failure — middleware converts it to AppError.
   * @param {string} token
   * @returns {object} Decoded payload
   */
  static verifyAccess(token) {
    return jwt.verify(token, env.JWT_ACCESS_SECRET);
  }

  /**
   * Verifies a refresh token. Throws jwt error on failure.
   * @param {string} token
   * @returns {object} Decoded payload
   */
  static verifyRefresh(token) {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
  }
}

export { JwtService };
