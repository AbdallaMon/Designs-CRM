"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { dictionary } from "@/app/helpers/constants.js";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import rtlPlugin from "stylis-plugin-rtl";

export const LanguageContext = createContext(null);

const ltrCache = createCache({ key: "mui" });
const rtlCache = createCache({ key: "muirtl", stylisPlugins: [rtlPlugin] });

const LOCATION_LABELS = {
  "Inside UAE": "داخل الامارات",
  "Out side UAE": "خارج الامارات",
  "داخل الامارات": "Inside UAE",
  "خارج الامارات": "Out side UAE",
};

export function LanguageProvider({
  children,
  initialLng = "ar",
  dontChecklocalStorage = false,
}) {
  const [lng, setLng] = useState(initialLng);

  const changeLanguage = useCallback((value) => {
    setLng(value);
    window.localStorage.setItem("lng", value);

    const clonedLocationTitle = document.querySelector(
      ".cloned-location-title",
    );
    if (clonedLocationTitle) {
      clonedLocationTitle.textContent =
        LOCATION_LABELS[clonedLocationTitle.textContent];
    }
  }, []);

  const translate = useCallback(
    (text) => (lng === "ar" ? dictionary[text] : text),
    [lng],
  );

  useEffect(() => {
    if (typeof window !== "undefined" && !dontChecklocalStorage) {
      setLng(window.localStorage.getItem("lng") || "ar");
    }
  }, []);

  const value = useMemo(
    () => ({ translate, changeLanguage, lng }),
    [translate, changeLanguage, lng],
  );

  return (
    <LanguageContext.Provider value={value}>
      <CacheProvider value={lng === "ar" ? rtlCache : ltrCache}>
        {children}
      </CacheProvider>
    </LanguageContext.Provider>
  );
}

export function useLanguageContext() {
  const context = useContext(LanguageContext);
  return context;
}
