"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import rtlPlugin from "stylis-plugin-rtl";
import { useSearchParams } from "next/navigation";
import { Box } from "@mui/material";

export const LanguageSwitcherContext = createContext(null);

const ltrCache = createCache({ key: "mui" });
const rtlCache = createCache({ key: "muirtl", stylisPlugins: [rtlPlugin] });

const RTL_BOX_SX = {
  direction: "rtl",
  "& .MuiTypography-root": { textAlign: "right" },
  "& .muirtl-1v3caum": { padding: 0 },
};

const LTR_BOX_SX = {
  direction: "ltr",
  "& .MuiTypography-root": { textAlign: "left" },
  "& .muirtl-1v3caum": { padding: 0 },
};

export function LanguageSwitcherProvider({
  children,
  initialLng = "ar",
  dontChecklocalStorage = false,
}) {
  const [lng, setLng] = useState(initialLng);
  const searchParams = useSearchParams();

  const changeLanguage = useCallback((value) => {
    setLng(value);
    window.localStorage.setItem("lng", value);
    const url = new URL(window.location.href);
    url.searchParams.set("lng", value);
    window.history.replaceState({}, "", url.toString());
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && !dontChecklocalStorage) {
      setLng(
        searchParams.get("lng") || window.localStorage.getItem("lng") || "ar",
      );
    }
  }, []);

  const isRtl = lng === "ar";

  const value = useMemo(() => ({ changeLanguage, lng }), [changeLanguage, lng]);

  return (
    <LanguageSwitcherContext.Provider value={value}>
      <Box sx={isRtl ? RTL_BOX_SX : LTR_BOX_SX}>
        <CacheProvider value={isRtl ? rtlCache : ltrCache}>
          {children}
        </CacheProvider>
      </Box>
    </LanguageSwitcherContext.Provider>
  );
}

export function useLanguageSwitcherContext() {
  const context = useContext(LanguageSwitcherContext);
  return context;
}
