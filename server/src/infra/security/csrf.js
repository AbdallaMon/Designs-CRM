import { randomBytes, timingSafeEqual } from "node:crypto";
import { JwtService } from "./jwt.js";

export const CSRF_COOKIE_NAME = "csrf_token";
export const CSRF_HEADER_NAME = "x-csrf-token";

function validTokenShape(token) {
  return typeof token === "string" && /^[A-Za-z0-9_-]{43}$/.test(token);
}

export class CsrfService {
  static issue(req, res) {
    const current = req.cookies?.[CSRF_COOKIE_NAME];
    const token = validTokenShape(current)
      ? current
      : randomBytes(32).toString("base64url");
    res.cookie(CSRF_COOKIE_NAME, token, JwtService.cookies.csrf);
    return token;
  }

  static clear(res) {
    res.cookie(CSRF_COOKIE_NAME, "", JwtService.cookies.clear);
  }

  static matches(req) {
    const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
    const headerToken = req.get(CSRF_HEADER_NAME);
    if (!validTokenShape(cookieToken) || !validTokenShape(headerToken)) {
      return false;
    }

    const cookieBuffer = Buffer.from(cookieToken);
    const headerBuffer = Buffer.from(headerToken);
    return (
      cookieBuffer.length === headerBuffer.length &&
      timingSafeEqual(cookieBuffer, headerBuffer)
    );
  }
}
