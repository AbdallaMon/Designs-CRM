import {
  AUTH_COOKIE_NAME,
  AUTH_REFRESH_TOKEN_COOKIE_NAME,
  authMessagesCodes,
  messagesNames,
} from "@dms/shared";
import { env } from "../../config/env.js";
import { CsrfService } from "../../infra/security/csrf.js";
import { AppError } from "../errors/AppError.js";

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const PUBLIC_COOKIE_INDEPENDENT_PATHS = [
  /^\/v2\/auth\/(?:login|request-password-reset|reset-password)\/?$/,
  /^\/v2\/files\/client(?:\/|$)/,
  /^\/v2\/client\/new-lead(?:\/register|\/complete-register\/[1-9][0-9]*)?\/?$/,
  /^\/v2\/client\/cooperation-requests\/?$/,
  /^\/v2\/client\/booking-leads(?:\/[1-9][0-9]*(?:\/actions\/submit)?)?\/?$/,
  /^\/v2\/client\/pay\/?$/,
];

function configuredOrigins() {
  return [
    ...(env.ALLOW_ORIGIN || "").split(","),
    env.DASHBOARD_ORIGIN,
    env.COURSES_ORIGIN,
    env.PORTFOLIO_ORIGIN,
    env.CONTACT_ORIGIN,
    env.BOOKING_ORIGIN,
    env.SERVER_URL,
  ]
    .filter(Boolean)
    .map((origin) => {
      try {
        return new URL(String(origin).trim()).origin;
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function allowedDomains() {
  return [
    ...(env.ALLOWED_DOMAINS || "").split(","),
    env.COOKIE_DOMAIN,
  ]
    .filter(Boolean)
    .map((domain) => String(domain).trim().replace(/^\./, "").toLowerCase());
}

function requestOrigin(req) {
  const directOrigin = req.get("origin");
  if (directOrigin) return directOrigin.split(",")[0].trim().replace(/\/$/, "");

  const referer = req.get("referer");
  if (!referer) return null;
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

export function isTrustedRequestOrigin(req) {
  const origin = requestOrigin(req);
  if (!origin) return false;
  if (configuredOrigins().includes(origin)) return true;

  let hostname;
  try {
    hostname = new URL(origin).hostname.toLowerCase();
  } catch {
    return false;
  }
  return allowedDomains().some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
  );
}

function isCookieIndependentPublicPath(req) {
  return PUBLIC_COOKIE_INDEPENDENT_PATHS.some((pattern) =>
    pattern.test(req.path),
  );
}

function csrfError(reason) {
  return new AppError({
    code: authMessagesCodes.FORBIDDEN,
    statusCode: 403,
    translationKey: messagesNames.authMessages,
    reason,
  });
}

export function authCsrfProtection(req, res, next) {
  if (!UNSAFE_METHODS.has(req.method)) return next();
  if (isCookieIndependentPublicPath(req)) return next();

  const hasAuthCookie = Boolean(
    req.cookies?.[AUTH_COOKIE_NAME] ||
      req.cookies?.[AUTH_REFRESH_TOKEN_COOKIE_NAME],
  );
  if (!hasAuthCookie) return next();

  if (!isTrustedRequestOrigin(req)) {
    return next(csrfError("untrusted request origin"));
  }
  if (!CsrfService.matches(req)) {
    return next(csrfError("csrf token mismatch"));
  }
  return next();
}
