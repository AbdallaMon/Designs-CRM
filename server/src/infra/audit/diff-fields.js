// Pure diff + redact helper for the action-audit trail. Computes the CHANGED-ONLY
// field set between a `before` and `after` snapshot and redacts a deny-list of
// sensitive keys so secrets NEVER reach the audit `detail` JSON. Framework-agnostic
// (no Prisma/Express) and side-effect-free — unit-tested in isolation.
//
// Redaction is a KEY-NAME rule (not value inspection): a field is replaced with
// "[redacted]" in both snapshots — even when it changed — when EITHER its name matches a
// case-insensitive substring pattern of known credential/token fragments, OR it is in the
// explicit deny-set below (belt-and-suspenders for camelCase secrets the substring rule
// might not obviously imply). The substring rule is what catches NEW schema secrets
// (e.g. `googleAccessToken`, `someSecretField`) without needing an exhaustive list.
const REDACT_PATTERN = /(password|passwordhash|token|secret|session|apihash|accesshash)/i;

// Explicit deny-set — exact key names always redacted regardless of the pattern. Includes
// the original exact-match keys plus the real schema secrets the earlier list missed.
const REDACT = new Set([
  "password",
  "passwordHash",
  "token",
  "googleAccessToken",
  "googleRefreshToken",
  "accessHash",
  "arToken",
  "enToken",
  "chatAccessToken",
  "sessionString",
  "apiHash",
  "refreshToken",
  "accessToken",
  "access_token",
  "refresh_token",
]);

// True when a key name must be redacted (substring pattern OR explicit deny-set).
export const isSensitiveKey = (key) =>
  typeof key === "string" && (REDACT_PATTERN.test(key) || REDACT.has(key));

const redact = (key, value) => (isSensitiveKey(key) ? "[redacted]" : value);

/**
 * Shallow-redact a flat snapshot object: any top-level key whose NAME is sensitive gets
 * its value replaced with "[redacted]". Only the TOP LEVEL is inspected — callers that
 * pass an explicit `detail` to recordAction must pass a FLAT snapshot (nested secrets
 * would not be caught). Non-object inputs are returned untouched.
 *
 * @param {*} obj  a plain, flat object (or any non-object value, returned as-is)
 * @returns {*} a shallow copy with sensitive values redacted, or the original non-object
 */
export function redactObject(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return obj;
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    out[key] = redact(key, value);
  }
  return out;
}

/**
 * Diff two plain objects, returning only the keys whose value changed.
 *
 * @param {object|null|undefined} before  snapshot before the write (null ⇒ all-added)
 * @param {object|null|undefined} after   snapshot after the write
 * @param {string[]} [allowedKeys]        when given, restrict the diff to these keys only
 * @returns {{ changed: string[], before: object, after: object }}
 *   `changed` — the keys that differ; `before`/`after` — the redacted values for those keys only.
 */
export function diffFields(before = {}, after = {}, allowedKeys) {
  const b = before || {};
  const a = after || {};
  const keys =
    Array.isArray(allowedKeys) && allowedKeys.length
      ? allowedKeys
      : [...new Set([...Object.keys(b), ...Object.keys(a)])];

  const changed = [];
  const outB = {};
  const outA = {};
  for (const key of keys) {
    // Structural comparison via JSON so nested arrays/objects compare by value.
    if (JSON.stringify(b[key]) === JSON.stringify(a[key])) continue;
    changed.push(key);
    outB[key] = redact(key, b[key]);
    outA[key] = redact(key, a[key]);
  }
  return { changed, before: outB, after: outA };
}
