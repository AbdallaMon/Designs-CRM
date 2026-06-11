"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { dictionary } from "@/app/helpers/constants.js";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import rtlPlugin from "stylis-plugin-rtl";
import {
  LanguageProvider as LanguageProviderV2,
  useLanguageContext as useLanguageContextV2,
} from "@/app/v2/providers/LanguageProvider";
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
  return (
    <LanguageProviderV2
      initialLng={initialLng}
      dontChecklocalStorage={dontChecklocalStorage}
    >
      {children}
    </LanguageProviderV2>
  );
  const [lng, setLang] = useState(initialLng);

  function changeLanguage(value) {
    setLang(value);
    window.localStorage.setItem("lng", value);
    const clonedLocationTitle = document.querySelector(
      ".cloned-location-title",
    );
    const locationDic = {
      "Inside UAE": "داخل الامارات",
      "Out side UAE": "خارج الامارات",
      "داخل الامارات": "Inside UAE",
      "خارج الامارات": "Out side UAE",
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
      setLang(window.localStorage.getItem("lng") || "ar");
    }
  }, []);
  return (
    <LanguageContext.Provider value={{ translate, changeLanguage, lng }}>
      <CacheProvider value={lng === "ar" ? cacheRtl : defaultCache}>
        {children}
      </CacheProvider>
    </LanguageContext.Provider>
  );
}
export const useLanguageContext = () => {
  return useLanguageContextV2();
  const context = useContext(LanguageContext);
  return context;
};
