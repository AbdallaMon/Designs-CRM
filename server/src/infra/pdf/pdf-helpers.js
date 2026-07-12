import fetch from "node-fetch";
import { v4 as uuidv4 } from "uuid";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "url";
import reshaper from "arabic-persian-reshaper";

import sharp from "sharp";
const __filename = fileURLToPath(import.meta.url);
import "dayjs/locale/ar.js";
import "dayjs/locale/en.js";
import dayjs from "dayjs";
const __dirname = path.dirname(__filename);
const fontPath = path.join(__dirname, "./fonts/Amiri-Regular.ttf");
const fontBoldPath = path.join(__dirname, "./fonts/Ya-ModernPro-Bold.otf");

// const enfontPath = path.join(__dirname, "./fonts/NotoSansArabic-Regular.ttf");
// const enfontBoldPath = path.join(__dirname, "./fonts/NotoSansArabic-Bold.ttf");
// const fontPath = path.join(__dirname, "./fonts/harir.otf");
// const fontBoldPath = path.join(__dirname, "./fonts/harir-bold.otf");

const enfontPath = path.join(__dirname, "./fonts/CairoPlay-Regular.ttf");
const enfontBoldPath = path.join(__dirname, "./fonts/CairoPlay-Bold.ttf");
export const fontBase64 = fs.readFileSync(fontPath);
export const fontBoldBase64 = fs.readFileSync(fontBoldPath);
export const enfontBase64 = fs.readFileSync(enfontPath);
export const enfontBoldBase64 = fs.readFileSync(enfontBoldPath);
export async function compressImageBuffer(buffer) {
  const sharpImage = sharp(buffer);
  const metadata = await sharpImage.metadata();

  // Resize logic
  sharpImage.resize({ width: 1000 });

  // Handle format appropriately
  if (metadata.format === "jpeg" || metadata.format === "jpg") {
    return await sharpImage.jpeg({ quality: 90 }).toBuffer();
  } else if (metadata.format === "png") {
    return await sharpImage.png({ compressionLevel: 6 }).toBuffer();
  } else {
    return await sharpImage.jpeg({ quality: 90 }).toBuffer();
  }
}

// Uploaded assets are stored as domain-relative paths (e.g. "/uploads/xyz.png").
// Node's fetch() requires an absolute URL, so resolve relative paths against the
// CRM domain (same base used for signature/upload URLs elsewhere in the PDF flow).
function toAbsoluteAssetUrl(url) {
  if (typeof url !== "string" || !url) return url;
  if (/^https?:\/\//i.test(url)) return url; // already absolute
  if (url.startsWith("/")) {
    const base = (
      process.env.CRM_DOMAIN ||
      process.env.SERVER_URL ||
      ""
    ).replace(/\/+$/, "");
    if (base) return `${base}${url}`;
  }
  return url;
}

export async function fetchImageBuffer(url, options = {}) {
  const {
    retries = 3,
    retryDelayMs = 1000,
    timeoutMs = 15000, // Default timeout for each fetch attempt
  } = options;

  url = toAbsoluteAssetUrl(url);
  const errors = [];

  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      // Set a timeout for the fetch request
      const id = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(id); // Clear the timeout if the fetch completes

      if (!res.ok) {
        throw new Error(
          `HTTP Error ${res.status}: ${res.statusText} for URL: ${url}`,
        );
      }

      return await compressImageBuffer(await res.arrayBuffer());
    } catch (error) {
      // Store specific error messages for debugging
      let errorMessage = `Attempt ${i + 1} failed: ${error.message}`;
      if (error.name === "AbortError") {
        errorMessage = `Attempt ${i + 1} timed out after ${timeoutMs}ms: ${
          error.message
        }`;
      } else if (
        error instanceof TypeError &&
        error.message.includes("network error")
      ) {
        errorMessage = `Attempt ${
          i + 1
        } network error (possibly CORS or connectivity): ${error.message}`;
      }
      errors.push(errorMessage);

      // Only retry if it's not the last attempt
      if (i < retries - 1) {
        console.warn(
          `Retrying fetch for ${url} in ${retryDelayMs}ms... (Error: ${errorMessage})`,
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }
  }

  // If all retries fail, throw a comprehensive error message
  const detailedErrorMessage = `Failed to fetch image from ${url} after ${retries} attempts.\nDetailed Errors:\n${errors.join(
    "\n",
  )}`;
  console.error(detailedErrorMessage);
  throw new Error(`Could not load image: ${url}. See console for details.`);
}

// Validate a company PDF-signature image referenced by `url` (a stored SiteUtility
// value \u2014 root-relative "/\u2026", "/uploads/\u2026", or an absolute http(s) URL). Unlike
// fetchImageBuffer, this does NOT run compressImageBuffer (which resizes to width
// 1000) \u2014 it inspects the ORIGINAL bytes so the crop check is meaningful.
//
// Returns null when valid; otherwise a validation code string:
//   "SIGNATURE_MUST_BE_PNG"     \u2014 not a PNG
//   "SIGNATURE_MUST_BE_CROPPED" \u2014 has excess uniform margins (sharp.trim shrinks it)
// Network/decode failures are thrown (they are infra errors, not validation results).
export async function validatePdfSignatureImage(url, { timeoutMs = 15000 } = {}) {
  const absolute = toAbsoluteAssetUrl(url);
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  let buffer;
  try {
    const res = await fetch(absolute, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}: ${res.statusText} for ${absolute}`);
    }
    buffer = Buffer.from(await res.arrayBuffer());
  } finally {
    clearTimeout(id);
  }

  return validateSignatureBuffer(buffer);
}

// Buffer-level signature validation (no network) \u2014 split out so it can be unit
// tested with sharp-generated PNGs. Returns null when valid, otherwise a code.
export async function validateSignatureBuffer(buffer) {
  const metadata = await sharp(buffer).metadata();

  if (metadata.format !== "png") return "SIGNATURE_MUST_BE_PNG";

  // "Cropped" = tight to content: trimming uniform (transparent) margins must not
  // shrink the image. sharp.trim() reports the trimmed dimensions; allow a small
  // tolerance for anti-aliased edges.
  const TOLERANCE_PX = 2;
  const origW = metadata.width || 0;
  const origH = metadata.height || 0;
  let trimmed;
  try {
    trimmed = await sharp(buffer).trim().toBuffer({ resolveWithObject: true });
  } catch {
    // trim throws if the whole image is uniform (nothing to keep) \u2014 treat as not cropped.
    return "SIGNATURE_MUST_BE_CROPPED";
  }
  const trimmedW = trimmed.info.width || 0;
  const trimmedH = trimmed.info.height || 0;
  if (origW - trimmedW > TOLERANCE_PX || origH - trimmedH > TOLERANCE_PX) {
    return "SIGNATURE_MUST_BE_CROPPED";
  }
  return null;
}

export function isArabicText(t = "") {
  return /[\u0600-\u06FF]/.test(t);
}
export function reText(text) {
  if (!text) return "";
  const reshaped = reshaper.ArabicShaper.convertArabic(String(text));
  const clean = reshaped
    .replace(/\r?\n|\r/g, " ")
    .replace(/\u200B/g, "")
    .replace(/\u200E/g, "")
    .replace(/\u200F/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/[\u0610-\u061A\u064B-\u065F\u06D6-\u06ED]/g, "")
    .trim();
  return clean;
}
export function getRTLTextX(text, fontSize, font, startX, width) {
  const tw = font.widthOfTextAtSize(text, fontSize);
  return startX + width - tw;
}
export function splitTextIntoLines(text, maxWidth, font, fontSize) {
  const words = String(text || "").split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    const testW = font.widthOfTextAtSize(test, fontSize);
    if (testW <= maxWidth) cur = test;
    else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}
export function formatDate(date, lng) {
  try {
    const locale = lng === "ar" ? "ar-AE" : "en-US";
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(dayjs().toDate());
  } catch (e) {
    console.error("formatDate error:", e);
    return date;
  }
}
export function reverseString(s) {
  return Array.from(s).reverse().join("");
}
export function reverseNumber(n) {
  const s = String(n); // handles numbers too
  return Array.from(s).reverse().join("");
}
export function formatCurrencyNumber(n, lng) {
  try {
    n = Number(n).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return lng === "ar" ? reverseNumber(n) : n;
  } catch (e) {
    console.error("formatNumber error:", e);
    return n;
  }
}
export function formatNumber(n, lng) {
  try {
    n = Number(n).toLocaleString("en-US", {});
    return lng === "ar" ? reverseNumber(n) : n;
  } catch (e) {
    console.error("formatNumber error:", e);
    return n;
  }
}
export function formatAED(n, lng) {
  try {
    // make n to string with commas as thousands separators
    n = Number(n).toLocaleString(lng === "ar" ? "ar-AE" : "en-US", {});
    const lngBasedValue = lng === "ar" ? reverseNumber(n) : n;
    const lngSuffix = lng === "ar" ? " درهم إماراتي " : " AED ";
    return `${lngBasedValue}${lngSuffix}`;
  } catch (e) {
    console.error("formatAED error:", e);
    return `${n} AED`;
  }
}
