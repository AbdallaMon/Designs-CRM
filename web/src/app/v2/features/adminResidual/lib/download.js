"use client";

// Blob-download helper — NET-NEW, feature-local. The 🔒 frozen report generators
// (/v2/admin/reports/*/excel|/pdf) return a FILE (binary), but the canonical v2 ApiFetch
// (lib/api/ApiFetch.js) parses JSON only and is OFF-LIMITS for this feature. So this helper
// does a raw `fetch` to the SAME v2 API base with the SAME cookie auth (credentials:"include")
// the app uses, then turns the binary response into a browser download (blob + object URL),
// honoring the server's Content-Disposition filename when present. It is intentionally
// self-contained to the adminResidual feature.
//
// It does NOT change the report contract: the caller POSTs the exact frozen payload the *data*
// endpoint shaped (the service already builds it); we only forward it and stream the result.
//
// On a JSON error envelope (e.g. 403 / validation) the server returns application/json instead
// of a file — we parse it and throw an Error carrying the envelope so the caller can resolve the
// CODE → Arabic via the message resolver (same as the mutation runner does).

import config from "@/app/v2/lib/config";

// Mirror ApiFetch._buildUrl: `${base}/${path-without-leading-slash}`.
function buildUrl(path) {
  const base = config.apiUrl ?? "";
  return `${base}/${String(path).replace(/^\//, "")}`;
}

// Parse `attachment; filename="x.xlsx"` (and filename*=UTF-8''...) → a clean filename.
function parseFilename(disposition, fallback) {
  if (!disposition) return fallback;
  const star = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(disposition);
  if (star && star[1]) {
    try {
      return decodeURIComponent(star[1].replace(/^"|"$/g, "").trim());
    } catch {
      /* fall through */
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(disposition);
  if (plain && plain[1]) return plain[1].trim();
  return fallback;
}

function triggerBrowserDownload(blob, filename) {
  if (typeof window === "undefined") return;
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so the navigation/click has consumed the URL.
  setTimeout(() => window.URL.revokeObjectURL(url), 0);
}

/**
 * POST a JSON payload to a binary endpoint and download the response as a file.
 * @param {string} path     v2-relative path (e.g. "admin/reports/lead-report/excel").
 * @param {object} body     the frozen report payload (forwarded verbatim).
 * @param {object} [opts]
 * @param {string} [opts.fallbackFilename] used when no Content-Disposition header.
 * @returns {Promise<{ filename:string }>}
 * @throws  {Error} with `.data` = the parsed JSON error envelope, when the server errors.
 */
export async function downloadFileFromPost(path, body = {}, { fallbackFilename = "download" } = {}) {
  const response = await fetch(buildUrl(path), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });

  const contentType = response.headers.get("content-type") || "";

  // Error path: the server answered with the JSON envelope, not a file.
  if (!response.ok || contentType.includes("application/json")) {
    let envelope = null;
    try {
      envelope = await response.json();
    } catch {
      envelope = { message: response.statusText };
    }
    const err = new Error(envelope?.message || "DOWNLOAD_FAILED");
    err.status = response.status;
    err.data = envelope;
    throw err;
  }

  const blob = await response.blob();
  const filename = parseFilename(response.headers.get("content-disposition"), fallbackFilename);
  triggerBrowserDownload(blob, filename);
  return { filename };
}

export default downloadFileFromPost;
