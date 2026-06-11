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
import { AppShellV2 } from "@/app/v2/features/shell/components/AppShellV2";

// Frame swap: AppShellV2 (workspace icon-rail + contextual panel + glass command-bar with a ⌘K
// command palette) is the ACTIVE shell by default. The legacy left-drawer + topbar AppShell is
// kept reachable behind a flag for instant rollback — set NEXT_PUBLIC_LEGACY_SHELL=1 to restore
// it. Both shells render the SAME page children with the SAME provider stack; only the chrome
// differs, so every existing /v2 route works unchanged in either.
const USE_LEGACY_SHELL = process.env.NEXT_PUBLIC_LEGACY_SHELL === "1";

export function AuthedAppLayout({ children }) {
  const Shell = USE_LEGACY_SHELL ? AppShell : AppShellV2;
  return (
    <MUIProvider>
      <ToastProvider>
        <AuthProvider>
          <Box dir="rtl" sx={{ direction: "rtl", minHeight: "100vh" }}>
            <Shell>{children}</Shell>
          </Box>
        </AuthProvider>
      </ToastProvider>
    </MUIProvider>
  );
}

export default AuthedAppLayout;
