// Central, namespace-agnostic CODE → display-string resolver. The universal backstop that
// guarantees a raw backend CODE is NEVER shown to the user.
//
// Every API envelope (success OR error) carries `message` (a language-neutral CODE) and an
// OPTIONAL `translationKey` (the namespace, e.g. "authMessages").
//
// BILINGUAL (Phase 1): resolution is LANGUAGE-AWARE via an optional `lang` (DEFAULT "ar").
//   • lang="ar" → resolves EXACTLY as before (Arabic maps only) — byte-identical to the
//     single-language app. This is the default for every caller that doesn't pass a language.
//   • lang="en" → tries the ENGLISH maps first; if a code isn't translated to English yet it
//     FALLS BACK to the Arabic maps (so an untranslated namespace still shows a real message,
//     never the raw CODE), then the generic fallback.
//
// Resolution order (per language):
//   1. translationKey namespace map (in the chosen language)
//   2. flat ALL_MESSAGE_CODES (in the chosen language)
//   3. [en only] the Arabic namespace + flat maps (graceful fallback for untranslated codes)
//   4. already-human prose passthrough (not an ALL_CAPS / P-code token)
//   5. `fallback` / a sensible generic string

import { MESSAGES_BY_NAMESPACE, ALL_MESSAGE_CODES } from "./messages/index.js";
import {
  MESSAGES_BY_NAMESPACE_EN,
  ALL_MESSAGE_CODES_EN,
} from "./messages/en/index.js";

const DEFAULT_ERROR_AR = "حدث خطأ، حاول مرة أخرى";
const DEFAULT_ERROR_EN = "Something went wrong, please try again";

// A "code token" is SCREAMING_SNAKE_CASE (LEAD_NOT_FOUND, INVALID_TOKEN, OK) or a Prisma
// known-error code (P2002, P2025). Anything else is treated as already-human text.
function looksLikeCode(value) {
  const s = String(value);
  return /^[A-Z][A-Z0-9_]*$/.test(s) || /^P\d{3,4}$/.test(s);
}

/**
 * Resolve a backend message CODE to a display string in the given language.
 *
 * @param {string} code                       the envelope `message` (a CODE) or raw text
 * @param {object} [opts]
 * @param {string} [opts.translationKey]      the envelope `translationKey` (namespace hint)
 * @param {string} [opts.fallback]            string returned when nothing resolves
 * @param {"ar"|"en"} [opts.lang]             display language (default "ar")
 * @returns {string} a localized string — never the raw code
 */
export function resolveMessageCode(
  code,
  { translationKey, fallback, lang = "ar" } = {},
) {
  const defaultError = lang === "en" ? DEFAULT_ERROR_EN : DEFAULT_ERROR_AR;

  if (code === undefined || code === null || code === "") {
    return fallback ?? defaultError;
  }

  const key = String(code);
  const isEn = lang === "en";

  // 1 + 2: chosen-language lookup (namespace, then flat).
  if (isEn) {
    if (translationKey) {
      const ns = MESSAGES_BY_NAMESPACE_EN[translationKey];
      if (ns && ns[key]) return ns[key];
    }
    if (ALL_MESSAGE_CODES_EN[key]) return ALL_MESSAGE_CODES_EN[key];
  }

  // Arabic lookup. For ar this is THE lookup (steps 1+2); for en it's the step-3 graceful
  // fallback when the code isn't translated to English yet.
  if (translationKey) {
    const ns = MESSAGES_BY_NAMESPACE[translationKey];
    if (ns && ns[key]) return ns[key];
  }
  if (ALL_MESSAGE_CODES[key]) return ALL_MESSAGE_CODES[key];

  // 4. Already-human prose passthrough (not a code token) — show it as-is.
  if (!looksLikeCode(key)) return key;

  // 5. Nothing matched a known code — never leak the raw code.
  return fallback ?? defaultError;
}

export default resolveMessageCode;
