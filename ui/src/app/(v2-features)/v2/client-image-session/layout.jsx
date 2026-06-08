"use client";

// PUBLIC v2 client route shell → delegates to the shared PublicAppLayout (RTL theme + Toast +
// minimal logo header, NO AuthProvider / NO nav). The per-session token (query param) is the
// auth; the page never calls auth/me and stays ungated (services use apiFetch.public with
// _skipRefresh). Behavior preserved EXACTLY from the previous public shell. Arabic, RTL.
import PublicAppLayout from "@/app/v2/shared/layout/PublicAppLayout";

export default function Layout({ children }) {
  return <PublicAppLayout>{children}</PublicAppLayout>;
}
