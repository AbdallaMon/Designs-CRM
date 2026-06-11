"use client";

// PUBLIC v2 client-chat route shell → delegates to the shared PublicAppLayout (RTL theme +
// Toast + minimal logo header, NO AuthProvider / NO nav). The per-room ?token= IS the auth;
// the page validates it via apiFetch.public and runs the chat window in client mode. The
// guest AuthContext + SocketProvider are supplied by ClientChatProviders inside the page.
// Arabic, RTL.
import PublicAppLayout from "@/app/v2/shared/layout/PublicAppLayout";

export default function Layout({ children }) {
  return <PublicAppLayout>{children}</PublicAppLayout>;
}
