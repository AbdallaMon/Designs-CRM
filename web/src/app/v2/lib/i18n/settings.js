// i18n settings — the single source of truth for the bilingual (ar/en) layer.
//
// PHASE 1 of the bilingual migration. Modeled on the working reference project
// (Cases-Digital-Assets-Managment/web/src/i18n/settings.js) — we borrow the PATTERN
// (cookie → lng → getDirection), not its ar/en namespace files.
//
// CRITICAL CONTRACT: Arabic is the DEFAULT and must render IDENTICALLY to before this layer
// existed. `fallbackLng` is "ar" and every consumer defaults to "ar" when the cookie is absent,
// so an untouched browser is byte-for-byte the same RTL app it was. English is purely additive.
//
// LANGUAGE SOURCE precedence (resolved on the server in app/layout.js):
//   1. ?lang=en|ar  (searchParams — a shareable / one-off override)
//   2. cookie `lang` (the persisted user choice the LanguageSwitcher writes)
//   3. fallbackLng "ar"
//
// NOTE the cookie here is `lang` (the v2 dashboard bilingual layer). It is deliberately distinct
// from the legacy public-landing `lng` localStorage key used by LanguageProvider /
// LanguageSwitcherProvider — those drive the marketing funnel and are untouched by Phase 1.

export const fallbackLng = "ar";
export const languages = [fallbackLng, "en"];
export const cookieName = "lang";

/** ar → rtl, anything else → ltr. */
export function getDirection(lng) {
  return lng === "ar" ? "rtl" : "ltr";
}

/** Coerce an arbitrary value to a supported language code (defaults to ar). */
export function normalizeLang(value) {
  return languages.includes(value) ? value : fallbackLng;
}
