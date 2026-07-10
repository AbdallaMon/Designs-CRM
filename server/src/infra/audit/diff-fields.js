// Pure diff + redact helper for the action-audit trail. Computes the CHANGED-ONLY
// field set between a `before` and `after` snapshot and redacts a deny-list of
// sensitive keys so secrets NEVER reach the audit `detail` JSON. Framework-agnostic
// (no Prisma/Express) and side-effect-free — unit-tested in isolation.
//
// Redaction is a KEY-NAME deny-list (not value inspection): any field whose name is a
// known credential/token is replaced with "[redacted]" in both snapshots, even when it
// changed. Keep this list in sync with the sensitive columns the audited entities carry.
const REDACT = new Set([
  "password",
  "passwordHash",
  "token",
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

const redact = (key, value) => (REDACT.has(key) ? "[redacted]" : value);

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
