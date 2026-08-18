import { generalMessagesCodes } from "@dms/shared";
import { env } from "../../config/env.js";

const MESSAGE_CODE_PATTERN = /^[A-Z][A-Z0-9_]*$/;

function resolveStatusCode(error) {
  for (const value of [error?.statusCode, error?.code]) {
    const statusCode = Number(value);
    if (Number.isInteger(statusCode) && statusCode >= 400 && statusCode <= 599) {
      return statusCode;
    }
  }

  return 500;
}

function resolveMessageCode(error, statusCode) {
  for (const value of [error?.code, error?.message]) {
    if (typeof value === "string" && MESSAGE_CODE_PATTERN.test(value)) {
      return value;
    }
  }

  return statusCode >= 500
    ? generalMessagesCodes.INTERNAL_SERVER_ERROR
    : generalMessagesCodes.UNEXPECTED_ERROR;
}

function buildFrontendErrorUrl(error) {
  const statusCode = resolveStatusCode(error);
  const messageCode = resolveMessageCode(error, statusCode);
  const errorUrl = new URL("/error", env.DASHBOARD_ORIGIN);

  if (
    !["http:", "https:"].includes(errorUrl.protocol) ||
    errorUrl.username ||
    errorUrl.password
  ) {
    throw new Error("Invalid dashboard origin");
  }

  errorUrl.searchParams.set("code", messageCode);
  errorUrl.searchParams.set("status", String(statusCode));
  return errorUrl.toString();
}

export function attachmentErrorRedirect(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  try {
    res.setHeader("Cache-Control", "no-store");
    return res.redirect(302, buildFrontendErrorUrl(error));
  } catch {
    return next(error);
  }
}

