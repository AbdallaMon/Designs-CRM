"use client";

// AuthedAppLayout — the SINGLE provider stack for every AUTHED v2 feature route, wrapping the
// persistent <AppSidebarShell>. Extracted from the (previously duplicated) per-feature layout.jsx
// shells (MUIProvider + ToastProvider + AuthProvider). Every authed feature layout.jsx is now a
// one-liner delegating here, so all authed v2 features render INSIDE the shell (left-drawer
// sidebar + glassy header). Strangler isolation from the legacy dashboard providers/nav is
// preserved. RTL is owned by the root-layout emotion cache ("muirtl") + <html dir="rtl">; this
// layout no longer creates its own cache, and no longer wraps a redundant nested dir="rtl" Box
// (which double-set direction and confused the RTL flip). Single-language Arabic / RTL.

import { MUIProvider } from "@/app/v2/providers/MUIProvider";
import { ToastProvider } from "@/app/v2/providers/ToastProvider";
import { AuthProvider } from "@/app/v2/providers/AuthProvider";
import { AppSidebarShell } from "@/app/v2/shared/layout/shell";

// AppSidebarShell (permanent left-drawer sidebar [RTL-flipped to the right] + sticky glassy
// header) is THE app shell, modeled on the working reference. The legacy AppShell and the rejected
// workspace-rail/command-palette AppShellV2 have both been retired. Every existing /v2 route
// renders inside this single shell.
export function AuthedAppLayout({ children }) {
  return (
    <MUIProvider>
      <ToastProvider>
        <AuthProvider>
          <AppSidebarShell>{children}</AppSidebarShell>
        </AuthProvider>
      </ToastProvider>
    </MUIProvider>
  );
}

export default AuthedAppLayout;
