// Central, namespace-agnostic CODE → Arabic resolver. The universal backstop that
// guarantees a raw backend CODE is NEVER shown to the user.
//
// Every API envelope (success OR error) carries `message` (a language-neutral CODE) and an
// OPTIONAL `translationKey` (the namespace, e.g. "authMessages"). Resolution order:
//   1. If `translationKey` is given and we have that namespace map, look the code up there.
//   2. Otherwise (or if the namespace lacks the code), look it up in the FLAT ALL_MESSAGE_CODES.
//   3. If `code` is already human Arabic prose (not an ALL_CAPS / P-code token), pass it through.
//   4. Else return `fallback`, or a sensible generic Arabic string.
// The raw code is never returned.

import { MESSAGES_BY_NAMESPACE, ALL_MESSAGE_CODES } from "./messages/index.js";

const DEFAULT_ERROR = "حدث خطأ، حاول مرة أخرى";

// A "code token" is SCREAMING_SNAKE_CASE (LEAD_NOT_FOUND, INVALID_TOKEN, OK) or a Prisma
// known-error code (P2002, P2025). Anything else is treated as already-human text.
function looksLikeCode(value) {
  const s = String(value);
  return /^[A-Z][A-Z0-9_]*$/.test(s) || /^P\d{3,4}$/.test(s);
}

/**
 * Resolve a backend message CODE to an Arabic display string.
 *
 * @param {string} code                       the envelope `message` (a CODE) or raw text
 * @param {object} [opts]
 * @param {string} [opts.translationKey]      the envelope `translationKey` (namespace hint)
 * @param {string} [opts.fallback]            string returned when nothing resolves
 * @returns {string} an Arabic string — never the raw code
 */
export function resolveMessageCode(code, { translationKey, fallback } = {}) {
  if (code === undefined || code === null || code === "") {
    return fallback ?? DEFAULT_ERROR;
  }

  const key = String(code);

  // 1. Namespace-scoped lookup (the envelope's translationKey).
  if (translationKey) {
    const ns = MESSAGES_BY_NAMESPACE[translationKey];
    if (ns && ns[key]) return ns[key];
  }

  // 2. Flat, namespace-agnostic lookup.
  if (ALL_MESSAGE_CODES[key]) return ALL_MESSAGE_CODES[key];

  // 3. Already-human Arabic/prose passthrough (not a code token) — show it as-is.
  if (!looksLikeCode(key)) return key;

  // 4. Nothing matched a known code — never leak the raw code.
  return fallback ?? DEFAULT_ERROR;
}

export default resolveMessageCode;
