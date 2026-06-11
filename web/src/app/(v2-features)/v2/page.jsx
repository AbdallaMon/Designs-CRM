"use client";

// /v2 index — the per-role landing fan-out (UX plan Phase 2a). The post-login redirect, the
// domain-root redirect, and the authed-on-auth-route redirect all point HERE; this page resolves
// each user's default workspace + its primary destination and replaces the URL with it. It is a
// transient redirect surface, so it renders ONLY the <LandingRedirect> (which shows a centered
// loader while resolving) — no AppShellV2 chrome, no extra provider stack. The root layout
// already supplies MUIProvider + ToastProvider + AuthProvider, so usePermission/useAuth resolve
// here without an AuthedAppLayout wrapper (which would double-mount the shell + providers).
// Single-language Arabic / RTL.

import { Suspense } from "react";
import { LandingRedirect } from "@/app/v2/features/shell";

export default function Page() {
  return (
    <Suspense>
      <LandingRedirect />
    </Suspense>
  );
}
