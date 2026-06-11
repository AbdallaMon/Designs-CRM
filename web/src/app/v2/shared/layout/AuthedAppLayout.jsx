"use client";

// AuthedAppLayout — the SINGLE provider stack for every AUTHED v2 feature route, wrapping the
// persistent <AppShell>. Extracted from the (previously duplicated) per-feature layout.jsx
// shells (RTL emotion cache + MUIProvider + ToastProvider + AuthProvider). Every authed feature
// layout.jsx is now a one-liner delegating here, so all authed v2 features render INSIDE the
// shell (side-nav + TopBar + breadcrumbs). Strangler isolation from the legacy dashboard
// providers/nav is preserved. RTL is owned by MUIProvider (one "muirtl" emotion cache for the
// whole app); this layout no longer creates its own cache. Single-language Arabic / RTL.

import { Box } from "@mui/material";
import { MUIProvider } from "@/app/v2/providers/MUIProvider";
import { ToastProvider } from "@/app/v2/providers/ToastProvider";
import { AuthProvider } from "@/app/v2/providers/AuthProvider";
import { AppShell } from "@/app/v2/features/shell/components/AppShell";

export function AuthedAppLayout({ children }) {
  return (
    <MUIProvider>
      <ToastProvider>
        <AuthProvider>
          <Box dir="rtl" sx={{ direction: "rtl", minHeight: "100vh" }}>
            <AppShell>{children}</AppShell>
          </Box>
        </AuthProvider>
      </ToastProvider>
    </MUIProvider>
  );
}

export default AuthedAppLayout;
