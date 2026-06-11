"use client";

// PublicAppLayout — the provider stack for PUBLIC/client v2 surfaces (booking, contracts-sign,
// client-image-session). Deliberately mounts NO AuthProvider and NO nav: the per-session token
// (query param) is the auth, so the page never calls auth/me / never triggers a refresh-redirect
// and stays fully ungated (the services use apiFetch.public with _skipRefresh). Provides only the
// theme + Toast, plus a minimal logo-only header. RTL is owned by MUIProvider (one shared
// "muirtl" emotion cache for the whole app); this layout no longer creates its own cache.
// Preserves EXACTLY the previous public layout behavior. Single-language Arabic / RTL.

import { Box, AppBar, Toolbar, Typography } from "@mui/material";
import { MUIProvider } from "@/app/v2/providers/MUIProvider";
import { ToastProvider } from "@/app/v2/providers/ToastProvider";

export function PublicAppLayout({ children }) {
  return (
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
  );
}

export default PublicAppLayout;
