// Barrel for the bilingual (ar/en) i18n layer (Phase 1).
export {
  cookieName,
  fallbackLng,
  languages,
  getDirection,
  normalizeLang,
} from "./settings.js";
export { uiDictionary, translate } from "./uiDictionary.js";
export { getCurrentLang, setCurrentLang } from "./langRuntime.js";
export { I18nProvider, useT } from "./I18nProvider.jsx";
