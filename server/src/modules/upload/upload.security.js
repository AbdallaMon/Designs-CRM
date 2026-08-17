import path from "node:path";
import { buildAssetAccessUrl } from "../../infra/upload/asset-access.js";
import sharp from "sharp";
import { env } from "../../config/env.js";
import { AppError } from "../../shared/errors/AppError.js";
import { generalMessagesCodes } from "@dms/shared";

const MB = 1024 * 1024;
const GENERIC_MIME = new Set(["application/octet-stream", ""]);
const FORMAT_BY_EXTENSION = Object.freeze({
  ".png": { format: "png", mime: "image/png" },
  ".jpg": { format: "jpeg", mime: "image/jpeg" },
  ".jpeg": { format: "jpeg", mime: "image/jpeg" },
  ".webp": { format: "webp", mime: "image/webp" },
  ".pdf": { format: "pdf", mime: "application/pdf" },
});

export const PUBLIC_UPLOAD_POLICIES = Object.freeze({
  CONTRACT: { extensions: [".png", ".jpg", ".jpeg", ".webp"], maxBytes: 10 * MB },
  IMAGE_SESSION: { extensions: [".png", ".jpg", ".jpeg", ".webp"], maxBytes: 10 * MB },
  PUBLIC_LEAD: {
    extensions: [".png", ".jpg", ".jpeg", ".webp", ".pdf"],
    maxBytes: 25 * MB,
  },
  CHAT: {
    extensions: [".png", ".jpg", ".jpeg", ".webp", ".pdf"],
    maxBytes: 25 * MB,
  },
  CALENDAR: {
    extensions: [".png", ".jpg", ".jpeg", ".webp", ".pdf"],
    maxBytes: 10 * MB,
  },
});

export const MAX_PUBLIC_CHUNKS = 100;
export const MAX_INTERNAL_CHUNKS = 1024;

function uploadError() {
  return new AppError({
    code: generalMessagesCodes.FILE_UPLOAD_ERROR,
    statusCode: 422,
  });
}

function isPdf(buffer) {
  if (buffer.length < 10 || buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
    return false;
  }
  return buffer.subarray(Math.max(0, buffer.length - 2048)).includes(Buffer.from("%%EOF"));
}

async function detectFormat(buffer) {
  if (isPdf(buffer)) return "pdf";
  try {
    const metadata = await sharp(buffer, { failOn: "error" }).metadata();
    return metadata.format || null;
  } catch {
    return null;
  }
}

export function assertChunkUploadBounds({ purpose, totalChunks, totalBytes }) {
  const policy = purpose ? PUBLIC_UPLOAD_POLICIES[purpose] : null;
  const maxChunks = policy ? MAX_PUBLIC_CHUNKS : MAX_INTERNAL_CHUNKS;
  const maxBytes = policy
    ? policy.maxBytes
    : Number(env.MAX_FILE_SIZE) || 1024 * MB;

  if (
    !Number.isInteger(totalChunks) ||
    totalChunks < 1 ||
    totalChunks > maxChunks ||
    !Number.isFinite(totalBytes) ||
    totalBytes < 0 ||
    totalBytes > maxBytes
  ) {
    throw uploadError();
  }
}

export async function validatePublicUploadContent({
  purpose,
  originalName,
  declaredMime,
  buffer,
  allowGenericMime = false,
}) {
  const policy = PUBLIC_UPLOAD_POLICIES[purpose];
  if (!policy || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw uploadError();
  }

  assertChunkUploadBounds({ purpose, totalChunks: 1, totalBytes: buffer.length });
  const extension = path.extname(path.basename(originalName || "")).toLowerCase();
  const expected = FORMAT_BY_EXTENSION[extension];
  if (!expected || !policy.extensions.includes(extension)) throw uploadError();

  const normalizedMime = String(declaredMime || "").trim().toLowerCase();
  if (
    normalizedMime !== expected.mime &&
    !(allowGenericMime && GENERIC_MIME.has(normalizedMime))
  ) {
    throw uploadError();
  }

  const detectedFormat = await detectFormat(buffer);
  if (detectedFormat !== expected.format) throw uploadError();

  return { extension, mime: expected.mime, format: detectedFormat };
}

export function buildSafeContentUrl(storageKey) {
  return buildAssetAccessUrl(`/uploads/${storageKey}`);
}
