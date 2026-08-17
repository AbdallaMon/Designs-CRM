"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { dictionary } from "@/app/helpers/constants.js";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import rtlPlugin from "stylis-plugin-rtl";
export const LanguageContext = createContext(null);
const defaultCache = createCache({
  key: "mui",
});
const cacheRtl = createCache({
  key: "muirtl",
  stylisPlugins: [rtlPlugin],
});

export default function LanguageProvider({
  children,
  initialLng = "ar",
  dontChecklocalStorage = false,
}) {
  const [lng, setLang] = useState(initialLng);

  function changeLanguage(value) {
    setLang(value);
    window.localStorage.setItem("lng", value);
    const clonedLocationTitle = document.querySelector(
      ".cloned-location-title"
    );
    const locationDic = {
      "Inside UAE": "Inside UAE",
      "Out side UAE": "Outside UAE",
    };
    if (clonedLocationTitle) {
      clonedLocationTitle.textContent =
        locationDic[clonedLocationTitle.textContent];
    }
  }
  function translate(text) {
    return lng === "ar" ? dictionary[text] : text;
  }
  useEffect(() => {
    if (typeof window !== "undefined" && !dontChecklocalStorage) {
      // Keep the server default stable, then hydrate the user's stored preference.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLang(window.localStorage.getItem("lng") || "ar");
    }
  }, [dontChecklocalStorage]);
  return (
    <LanguageContext.Provider value={{ translate, changeLanguage, lng }}>
      <CacheProvider value={lng === "ar" ? cacheRtl : defaultCache}>
        {children}
      </CacheProvider>
    </LanguageContext.Provider>
  );
}
export const useLanguageContext = () => {
  const context = useContext(LanguageContext);
  return context;
};
