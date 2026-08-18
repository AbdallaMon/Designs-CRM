import { resolveMessage } from "@/app/helpers/messages/resolveMessage";

const MESSAGE_CODE_PATTERN = /^[A-Z][A-Z0-9_]*$/;

const CODE_STATUS = {
  UNAUTHORIZED: 401,
  INVALID_TOKEN: 401,
  REFRESH_TOKEN_MISSING: 401,
  FORBIDDEN: 403,
  PERMISSION_DENIED: 403,
  ACCESS_DENIED: 403,
  LEAD_ACCESS_DENIED: 403,
  LEAD_CLAIM_REQUIRED: 403,
  LEAD_NOT_FOUND: 404,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  TOO_MANY_REQUESTS: 429,
  RATE_LIMIT_EXCEEDED: 429,
  SERVICE_UNAVAILABLE: 503,
  INTERNAL_SERVER_ERROR: 500,
  UNEXPECTED_ERROR: 500,
};

const STATUS_CONTENT = {
  401: {
    title: "Sign in required",
    description: "Sign in with an account that can access this item.",
    actionLabel: "Go to sign in",
    actionHref: "/login",
  },
  403: {
    title: "Access denied",
    description: "Your account cannot access this item.",
    actionLabel: "Back to dashboard",
    actionHref: "/dashboard",
  },
  404: {
    title: "Item unavailable",
    description: "This item may have been removed or is no longer available.",
    actionLabel: "Back to dashboard",
    actionHref: "/dashboard",
  },
  422: {
    title: "Invalid request",
    description: "The link is incomplete or invalid.",
    actionLabel: "Back to dashboard",
    actionHref: "/dashboard",
  },
  429: {
    title: "Too many requests",
    description: "Please wait a moment, then try again.",
    actionLabel: "Back to dashboard",
    actionHref: "/dashboard",
  },
  500: {
    title: "Something went wrong",
    description: "We could not complete your request. Please try again later.",
    actionLabel: "Back to dashboard",
    actionHref: "/dashboard",
  },
};

function firstQueryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeCode(value) {
  const code = firstQueryValue(value);
  return typeof code === "string" &&
    code.length <= 100 &&
    MESSAGE_CODE_PATTERN.test(code)
    ? code
    : "INTERNAL_SERVER_ERROR";
}

function normalizeStatus(value, code) {
  if (CODE_STATUS[code]) return CODE_STATUS[code];

  const status = Number(firstQueryValue(value));
  return Number.isInteger(status) && status >= 400 && status <= 599
    ? status
    : 500;
}

function statusGroup(status) {
  if (STATUS_CONTENT[status]) return status;
  if (status >= 500) return 500;
  if (status === 401) return 401;
  if (status === 403) return 403;
  if (status === 404) return 404;
  if (status === 429) return 429;
  return 422;
}

export function getErrorPresentation({ code: rawCode, status: rawStatus } = {}) {
  const code = normalizeCode(rawCode);
  const status = normalizeStatus(rawStatus, code);
  const content = STATUS_CONTENT[statusGroup(status)];

  return {
    code,
    status,
    message: resolveMessage(code),
    ...content,
  };
}
