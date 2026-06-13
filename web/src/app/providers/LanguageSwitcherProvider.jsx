"use client";
import { createContext, useContext, useEffect, useState } from "react";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import rtlPlugin from "stylis-plugin-rtl";
import { useSearchParams } from "next/navigation";
import { Box } from "@mui/material";
export const LanguageSwitcherContext = createContext(null);
const defaultCache = createCache({
  key: "mui",
});
const cacheRtl = createCache({
  key: "muirtl",
  stylisPlugins: [rtlPlugin],
});

export default function LanguageSwitcherProvider({
  children,
  initialLng = "ar",
  dontChecklocalStorage = false,
}) {
  const [lng, setLang] = useState(initialLng);
  const searchParams = useSearchParams();
  function changeLanguage(value) {
    setLang(value);
    window.localStorage.setItem("lng", value);
    const url = new URL(window.location.href);
    url.searchParams.set("lng", value);
    window.history.replaceState({}, "", url.toString());
  }

  useEffect(() => {
    if (typeof window !== "undefined" && !dontChecklocalStorage) {
      setLang(
        searchParams.get("lng") || window.localStorage.getItem("lng") || "ar"
      );
    }
  }, []);
  return (
    <LanguageSwitcherContext.Provider value={{ changeLanguage, lng }}>
      <Box
        sx={{
          direction: lng === "ar" ? "rtl" : "ltr",
          "& .MuiTypography-root": {
            textAlign: lng === "ar" ? "right" : "left",
          },
          "& .muirtl-1v3caum": {
            padding: 0,
          },
        }}
      >
        <CacheProvider value={lng === "ar" ? cacheRtl : defaultCache}>
          {children}
        </CacheProvider>
      </Box>
    </LanguageSwitcherContext.Provider>
  );
}
export const useLanguageSwitcherContext = () => {
  const context = useContext(LanguageSwitcherContext);
  return context;
};
