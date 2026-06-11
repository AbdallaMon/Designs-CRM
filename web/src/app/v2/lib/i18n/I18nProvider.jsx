"use client";

// I18nProvider + useT — the bilingual (ar/en) React context for the AUTHED v2 shell.
//
// Modeled on the reference's I18nProvider (Cases-Digital-Assets-Managment) but WITHOUT the
// react-i18next dependency: a small custom context over our flat uiDictionary. This keeps Phase 1
// dependency-free and matches the repo's existing custom-context style (LanguageProvider etc.).
//
// SEEDING: the server (app/layout.js) reads the `lang` cookie / ?lang and passes `initialLng`, so
// the FIRST client render already matches the server's <html lang dir> — no flash, no hydration
// mismatch. Default "ar" everywhere → identical to the pre-bilingual app.
//
// CHANGING THE LANGUAGE: changeLanguage(next) writes the cookie, updates the URL `?lang`, syncs
// <html lang dir>, and updates state. Because the emotion cache key (muirtl vs mui) is chosen on
// the SERVER from the cookie (RtlCacheProvider/MUIProvider), a full re-render with the correct
// cache requires a navigation/refresh — changeLanguage triggers router.refresh() so the server
// re-runs the root layout with the new cookie and the cache/dir/theme flip cleanly. ar stays the
// default; this only ever runs when the user actively toggles.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  cookieName,
  fallbackLng,
  getDirection,
  languages,
  normalizeLang,
} from "./settings.js";
import { translate as translateKey } from "./uiDictionary.js";
import { setCurrentLang } from "./langRuntime.js";

const I18nContext = createContext(null);

function writeLangCookie(lng) {
  // 1 year, root path. Mirrors the reference's setCookie(cookieName, lng, { path: "/" }).
  document.cookie = `${cookieName}=${lng}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

export function I18nProvider({ children, initialLng = fallbackLng }) {
  const [lang, setLang] = useState(() => normalizeLang(initialLng));
  const router = useRouter();
  const searchParams = useSearchParams();

  // Keep the non-React runtime holder (read by the toast layer) in sync — synchronously on
  // first render too, so a toast fired before any effect resolves uses the right language.
  setCurrentLang(lang);

  useEffect(() => {
    setCurrentLang(lang);
  }, [lang]);

  // `?lang=en|ar` override: a shared link carries the language in the URL. The server seeds from
  // the COOKIE, so on first mount we reconcile — if the URL asks for a different supported
  // language than the seeded one, persist it (cookie + refresh) so SSR and the cache agree.
  // Runs once on mount; the normal toggle path keeps URL and cookie in sync thereafter.
  useEffect(() => {
    const urlLang = searchParams?.get("lang");
    if (urlLang && languages.includes(urlLang) && urlLang !== lang) {
      changeLanguage(urlLang);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeLanguage = useCallback(
    (next) => {
      const lng = normalizeLang(next);
      if (lng === lang) return;

      writeLangCookie(lng);

      // Reflect in the URL so the choice is shareable and the server read on refresh agrees.
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set("lang", lng);
      const url = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, "", url);

      // Sync the document root immediately for a snappy flip of dir/lang on the client…
      document.documentElement.lang = lng;
      document.documentElement.dir = getDirection(lng);

      setLang(lng);
      setCurrentLang(lng);

      // …then re-run the server root layout so the emotion cache (muirtl vs mui) + theme are
      // rebuilt for the new language (the cache key is decided server-side from the cookie).
      router.refresh();
    },
    [lang, router, searchParams],
  );

  const toggleLanguage = useCallback(() => {
    changeLanguage(lang === "ar" ? "en" : "ar");
  }, [lang, changeLanguage]);

  const t = useCallback(
    (key, fallback) => translateKey(lang, key, fallback),
    [lang],
  );

  const value = useMemo(
    () => ({ lang, dir: getDirection(lang), t, changeLanguage, toggleLanguage }),
    [lang, t, changeLanguage, toggleLanguage],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * useT — the hook every shell/common component uses.
 * @returns {{ t:(key:string, fallback?:string)=>string, lang:string, dir:string,
 *            changeLanguage:(l:string)=>void, toggleLanguage:()=>void }}
 *
 * Safe outside the provider (e.g. a stray usage): returns an Arabic-default no-op so nothing
 * crashes and ar wording is preserved.
 */
export function useT() {
  const ctx = useContext(I18nContext);
  if (ctx) return ctx;
  return {
    lang: fallbackLng,
    dir: getDirection(fallbackLng),
    t: (key, fallback) => translateKey(fallbackLng, key, fallback),
    changeLanguage: () => {},
    toggleLanguage: () => {},
  };
}

export default I18nProvider;
