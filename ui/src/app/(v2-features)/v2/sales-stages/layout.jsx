"use client";

// v2 authed feature route shell → delegates to the shared AuthedAppLayout (provider stack +
// persistent AppShell). The previously duplicated per-feature provider stack now lives in ONE
// place; this file is intentionally a one-liner. Arabic, RTL, single-language.
import AuthedAppLayout from "@/app/v2/shared/layout/AuthedAppLayout";

export default function Layout({ children }) {
  return <AuthedAppLayout>{children}</AuthedAppLayout>;
}
