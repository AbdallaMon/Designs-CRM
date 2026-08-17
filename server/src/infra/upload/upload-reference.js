import { env } from "../../config/env.js";

const CANONICAL_PREFIX = "/uploads/";
const SIGNED_CONTENT_MARKER = "/v2/files/content/";

function normalizeOrigin(value) {
  if (!value) return null;
  try {
    return new URL(value).origin.toLowerCase();
  } catch {
    return null;
  }
}

function trustedOrigins(extraOrigins = []) {
  const configured = [
    env.IMAGE_DOMAIN,
    env.CRM_DOMAIN,
    env.DASHBOARD_ORIGIN,
    env.SERVER_URL,
    env.ASSET_DELIVERY_ORIGIN,
    ...String(env.UPLOAD_LEGACY_ORIGINS || "").split(","),
    ...extraOrigins,
  ];
  return new Set(configured.map(normalizeOrigin).filter(Boolean));
}

export function isTrustedAssetOrigin(value, extraOrigins = []) {
  const origin = normalizeOrigin(value);
  return Boolean(origin && trustedOrigins(extraOrigins).has(origin));
}

function safeDecodePath(value) {
  try {
    return value
      .split("/")
      .map((segment) => decodeURIComponent(segment))
      .join("/");
  } catch {
    return null;
  }
}

function canonicalFromKey(value) {
  const decoded = safeDecodePath(String(value || "").replace(/\\/g, "/"))?.replace(
    /\\/g,
    "/",
  );
  if (!decoded) return null;
  const key = decoded.replace(/^\/+/, "").replace(/\/+$/, "");
  if (!key || /[\u0000-\u001f\u007f]/.test(key)) return null;
  const segments = key.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) {
    return null;
  }
  return `${CANONICAL_PREFIX}${segments.join("/")}`;
}

function canonicalFromPathname(pathname) {
  const normalized = String(pathname || "")
    .split(/[?#]/, 1)[0]
    .replace(/\\/g, "/");
  const lower = normalized.toLowerCase();
  if (lower.startsWith(SIGNED_CONTENT_MARKER)) {
    return canonicalFromKey(normalized.slice(SIGNED_CONTENT_MARKER.length));
  }

  const publicUploadsMarker = "/public_html/uploads/";
  const publicIndex = lower.indexOf(publicUploadsMarker);
  const looksLikeFilesystemPath =
    normalized.startsWith("/") || /^[a-z]:\//i.test(normalized);
  if (publicIndex >= 0 && looksLikeFilesystemPath) {
    return canonicalFromKey(
      normalized.slice(publicIndex + publicUploadsMarker.length),
    );
  }

  if (lower.startsWith(CANONICAL_PREFIX)) {
    return canonicalFromKey(normalized.slice(CANONICAL_PREFIX.length));
  }
  if (lower.startsWith("uploads/")) {
    return canonicalFromKey(normalized.slice("uploads/".length));
  }

  const relativePublicMarker = "public_html/uploads/";
  if (lower.startsWith(relativePublicMarker)) {
    return canonicalFromKey(normalized.slice(relativePublicMarker.length));
  }
  return null;
}

export function normalizeUploadReference(
  value,
  { extraOrigins = [], allowAnyOrigin = false } = {},
) {
  if (typeof value !== "string") return null;
  const candidate = value.trim();
  if (!candidate || candidate.includes("\0")) return null;

  if (/^https?:\/\//i.test(candidate)) {
    let parsed;
    try {
      parsed = new URL(candidate);
    } catch {
      return null;
    }
    if (
      !allowAnyOrigin &&
      !trustedOrigins(extraOrigins).has(parsed.origin.toLowerCase())
    ) {
      return null;
    }
    return canonicalFromPathname(parsed.pathname);
  }

  return canonicalFromPathname(candidate);
}

export function storageKeyFromUploadReference(value, options) {
  const canonical = normalizeUploadReference(value, options);
  return canonical ? canonical.slice(CANONICAL_PREFIX.length) : null;
}

const EMBEDDED_ASSET_REFERENCE = /https?:\/\/[^\s"'<>]+|\/uploads\/[^\s"'<>]+/giu;
const TRAILING_PROSE_PUNCTUATION = /[),.;:!?\]}]+$/u;

export function replaceEmbeddedAssetReferences(value, mapper, options) {
  if (typeof value !== "string") return value;
  const exact = normalizeUploadReference(value, options);
  if (exact) return mapper(exact);

  return value.replace(EMBEDDED_ASSET_REFERENCE, (candidate) => {
    const trailing = candidate.match(TRAILING_PROSE_PUNCTUATION)?.[0] || "";
    const reference = trailing
      ? candidate.slice(0, -trailing.length)
      : candidate;
    const canonical = normalizeUploadReference(reference, options);
    return canonical ? `${mapper(canonical)}${trailing}` : candidate;
  });
}

function isPlainObject(value) {
  if (!value || typeof value !== "object") return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function mapAssetReferences(value, mapper) {
  if (typeof value === "string") return mapper(value);
  if (Array.isArray(value)) {
    return value.map((item) => mapAssetReferences(item, mapper));
  }
  if (!isPlainObject(value)) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      mapAssetReferences(item, mapper),
    ]),
  );
}

export function canonicalizeAssetReferences(value, options) {
  return mapAssetReferences(value, (item) => {
    return replaceEmbeddedAssetReferences(item, (canonical) => canonical, options);
  });
}

export { CANONICAL_PREFIX };
