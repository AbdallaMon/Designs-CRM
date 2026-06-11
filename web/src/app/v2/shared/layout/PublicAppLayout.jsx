"use client";

// PublicAppLayout — the provider stack for PUBLIC/client v2 surfaces (booking, contracts-sign,
// client-image-session). Deliberately mounts NO AuthProvider and NO nav: the per-session token
// (query param) is the auth, so the page never calls auth/me / never triggers a refresh-redirect
// and stays fully ungated (the services use apiFetch.public with _skipRefresh). Provides only the
// RTL emotion cache + theme + Toast, plus a minimal logo-only header. Preserves EXACTLY the
// previous public layout behavior. Single-language Arabic / RTL.

import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import rtlPlugin from "stylis-plugin-rtl";
import { Box, AppBar, Toolbar, Typography } from "@mui/material";
import { MUIProvider } from "@/app/v2/providers/MUIProvider";
import { ToastProvider } from "@/app/v2/providers/ToastProvider";

const rtlCache = createCache({ key: "muirtl", stylisPlugins: [rtlPlugin] });

export function PublicAppLayout({ children }) {
  return (
    <CacheProvider value={rtlCache}>
      <MUIProvider>
        <ToastProvider>
          <Box dir="rtl" sx={{ direction: "rtl", minHeight: "100vh" }}>
            <AppBar position="static" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Toolbar>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "primary.textOnLight" }}>
                  Dream Studio
                </Typography>
              </Toolbar>
            </AppBar>
            {children}
          </Box>
        </ToastProvider>
      </MUIProvider>
    </CacheProvider>
  );
}

export default PublicAppLayout;
