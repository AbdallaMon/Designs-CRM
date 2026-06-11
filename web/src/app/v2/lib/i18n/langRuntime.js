// langRuntime — a tiny module-level holder for the CURRENT language, so NON-React code can read
// it. The toast layer (lib/toast/toastUtils.js → resolveMessageCode) runs outside the React tree
// and cannot call useT(); it reads getCurrentLang() to localize a backend CODE.
//
// The I18nProvider is the single writer: it calls setCurrentLang(lng) on mount and whenever the
// language changes, keeping this holder in sync with the React context. Default "ar" guarantees
// that before any provider mounts (and on the server) the value is the Arabic default — so toast
// resolution is byte-identical to before the bilingual layer existed.

import { fallbackLng, normalizeLang } from "./settings.js";

let currentLang = fallbackLng;

export function setCurrentLang(lng) {
  currentLang = normalizeLang(lng);
}

export function getCurrentLang() {
  return currentLang;
}
