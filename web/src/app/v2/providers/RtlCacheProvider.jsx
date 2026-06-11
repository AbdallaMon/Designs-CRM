"use client";

// RtlCacheProvider — the SSR-aware RTL emotion cache for the whole app.
//
// Wraps MUI's official <AppRouterCacheProvider> (@mui/material-nextjs) with the RTL options
// (key "muirtl" + stylis-plugin-rtl, prepend). AppRouterCacheProvider inserts emotion's styles
// through Next's useServerInsertedHTML, so the RTL flip is applied during the App Router's
// SERVER render — making the FIRST paint already RTL for every route (login, dashboard, lead
// detail) and removing the LTR-flash / hydration mismatch of a client-only cache.
//
// This must be a Client Component: `stylisPlugins: [rtlPlugin]` is a FUNCTION, which cannot be
// serialized as a prop across the Server→Client boundary (the root layout is a Server
// Component). Importing rtlPlugin here keeps the function on the client side only.
// Single-language Arabic / RTL.

import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import rtlPlugin from "stylis-plugin-rtl";

export function RtlCacheProvider({ children }) {
  return (
    <AppRouterCacheProvider
      options={{ key: "muirtl", stylisPlugins: [rtlPlugin], prepend: true }}
    >
      {children}
    </AppRouterCacheProvider>
  );
}

export default RtlCacheProvider;
