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
  console.log(lng, "lng");
  console.log(initialLng, "initialLng");
  function changeLanguage(value) {
    setLang(value);
    window.localStorage.setItem("lng", value);
    const clonedLocationTitle = document.querySelector(
      ".cloned-location-title"
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
  const context = useContext(LanguageContext);
  return context;
};
