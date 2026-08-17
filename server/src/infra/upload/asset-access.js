import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../../config/env.js";
import {
  mapAssetReferences,
  normalizeUploadReference,
  replaceEmbeddedAssetReferences,
  storageKeyFromUploadReference,
} from "./upload-reference.js";

function signingSecret() {
  if (
    !env.ASSET_URL_SIGNING_SECRET ||
    env.ASSET_URL_SIGNING_SECRET.length < 32 ||
    env.ASSET_URL_SIGNING_SECRET.startsWith("REPLACE_")
  ) {
    throw new Error("ASSET_URL_SIGNING_SECRET is required");
  }
  return env.ASSET_URL_SIGNING_SECRET;
}

function signatureFor(storageKey, expires) {
  return createHmac("sha256", signingSecret())
    .update(`${storageKey}\n${expires}`)
    .digest("base64url");
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left || ""));
  const b = Buffer.from(String(right || ""));
  return a.length === b.length && timingSafeEqual(a, b);
}

function encodedStorageKey(storageKey) {
  return storageKey.split("/").map(encodeURIComponent).join("/");
}

export function buildAssetAccessUrl(reference, { ttlSeconds } = {}) {
  const storageKey = storageKeyFromUploadReference(reference);
  if (!storageKey) return reference;

  const parsedTtl = Number(ttlSeconds);
  const requestedTtl = Number.isInteger(parsedTtl) && parsedTtl > 0
    ? parsedTtl
    : env.ASSET_URL_TTL_SECONDS;
  const ttl = Math.min(requestedTtl, env.ASSET_URL_MAX_TTL_SECONDS);
  const expires = Math.floor(Date.now() / 1000) + ttl;
  const signature = signatureFor(storageKey, expires);
  const origin = String(env.ASSET_DELIVERY_ORIGIN || env.SERVER_URL || "")
    .replace(/\/+$/, "");
  const pathname = `/v2/files/content/${encodedStorageKey(storageKey)}`;
  return `${origin}${pathname}?expires=${expires}&signature=${encodeURIComponent(signature)}`;
}

export function verifyAssetAccess({ storageKey, expires, signature }) {
  const canonical = normalizeUploadReference(`/uploads/${storageKey}`);
  const normalizedKey = storageKeyFromUploadReference(canonical);
  const parsedExpires = Number(expires);
  const now = Math.floor(Date.now() / 1000);
  if (
    !normalizedKey ||
    !Number.isInteger(parsedExpires) ||
    parsedExpires <= now ||
    parsedExpires > now + env.ASSET_URL_MAX_TTL_SECONDS ||
    !safeEqual(signatureFor(normalizedKey, parsedExpires), signature)
  ) {
    return null;
  }
  return { storageKey: normalizedKey, expires: parsedExpires };
}

export function exposeAssetReferences(value, options) {
  return mapAssetReferences(value, (item) => {
    return replaceEmbeddedAssetReferences(
      item,
      (canonical) => buildAssetAccessUrl(canonical, options),
    );
  });
}
