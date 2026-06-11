"use client";

// v2 leads route shell → delegates to the shared AuthedAppLayout (provider stack + AppShell).
// The duplicated per-feature provider stack now lives in one place. Arabic, RTL.
import AuthedAppLayout from "@/app/v2/shared/layout/AuthedAppLayout";

export default function Layout({ children }) {
  return <AuthedAppLayout>{children}</AuthedAppLayout>;
}
