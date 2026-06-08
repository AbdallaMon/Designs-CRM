"use client";

import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import rtlPlugin from "stylis-plugin-rtl";
import { Box } from "@mui/material";
import { MUIProvider } from "@/app/v2/providers/MUIProvider";
import { ToastProvider } from "@/app/v2/providers/ToastProvider";
import { AuthProvider } from "@/app/v2/providers/AuthProvider";

const rtlCache = createCache({ key: "muirtl", stylisPlugins: [rtlPlugin] });

/**
 * Self-contained v2 dashboard route shell. Composes the v2 provider stack (RTL emotion cache +
 * v2 theme + v2 Toast + v2 Auth) so the dashboard feature runs on the canonical v2 layer WITHOUT
 * entangling the legacy dashboard providers/nav (strangler isolation). Mirrors the accounting/
 * calendar layout exactly. Arabic, RTL, single-language.
 */
export default function V2DashboardLayout({ children }) {
  return (
    <CacheProvider value={rtlCache}>
      <MUIProvider>
        <ToastProvider>
          <AuthProvider>
            <Box dir="rtl" sx={{ direction: "rtl", minHeight: "100vh" }}>
              {children}
            </Box>
          </AuthProvider>
        </ToastProvider>
      </MUIProvider>
    </CacheProvider>
  );
}
