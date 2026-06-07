"use client";

import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import rtlPlugin from "stylis-plugin-rtl";
import { Box } from "@mui/material";
import { MUIProvider } from "@/app/v2/providers/MUIProvider";
import { ToastProvider } from "@/app/v2/providers/ToastProvider";

const rtlCache = createCache({ key: "muirtl", stylisPlugins: [rtlPlugin] });

/**
 * PUBLIC v2 contract e-sign route shell. The prospective/converted client has NO session — the
 * per-session signing token (query param `token`) is the auth. We deliberately do NOT mount
 * AuthProvider here so the page never calls auth/me, never triggers a refresh/redirect, and
 * stays fully ungated (contracts.service public helpers use apiFetch.public with _skipRefresh).
 * Only the RTL theme + Toast (signing success/error) are provided. Arabic, RTL, single-language.
 * Mirrors the booking (public calendar) layout exactly.
 */
export default function V2ContractsSignLayout({ children }) {
  return (
    <CacheProvider value={rtlCache}>
      <MUIProvider>
        <ToastProvider>
          <Box dir="rtl" sx={{ direction: "rtl", minHeight: "100vh" }}>
            {children}
          </Box>
        </ToastProvider>
      </MUIProvider>
    </CacheProvider>
  );
}
