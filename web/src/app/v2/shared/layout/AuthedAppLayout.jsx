"use client";

// AuthedAppLayout — the SINGLE provider stack for every AUTHED v2 feature route, wrapping the
// persistent <AppShellV2>. Extracted from the (previously duplicated) per-feature layout.jsx
// shells (RTL emotion cache + MUIProvider + ToastProvider + AuthProvider). Every authed feature
// layout.jsx is now a one-liner delegating here, so all authed v2 features render INSIDE the
// shell (workspace rail + contextual panel + command bar + ⌘K palette). Strangler isolation
// from the legacy dashboard providers/nav is preserved. RTL is owned by MUIProvider (one
// "muirtl" emotion cache for the whole app); this layout no longer creates its own cache.
// Single-language Arabic / RTL.

import { Box } from "@mui/material";
import { MUIProvider } from "@/app/v2/providers/MUIProvider";
import { ToastProvider } from "@/app/v2/providers/ToastProvider";
import { AuthProvider } from "@/app/v2/providers/AuthProvider";
import { AppShellV2 } from "@/app/v2/features/shell/components/AppShellV2";

// AppShellV2 (workspace icon-rail + contextual panel + glass command-bar with a ⌘K command
// palette) is THE app shell. The legacy left-drawer + topbar AppShell has been retired. Every
// existing /v2 route renders inside this single shell.
export function AuthedAppLayout({ children }) {
  return (
    <MUIProvider>
      <ToastProvider>
        <AuthProvider>
          <Box dir="rtl" sx={{ direction: "rtl", minHeight: "100vh" }}>
            <AppShellV2>{children}</AppShellV2>
          </Box>
        </AuthProvider>
      </ToastProvider>
    </MUIProvider>
  );
}

export default AuthedAppLayout;
