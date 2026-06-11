"use client";

// RtlCacheProvider — the SSR-aware RTL emotion cache for the whole app.
//
// Mechanism mirrored EXACTLY from the working reference project
// (Cases-Digital-Assets-Managment/web/src/providers/ThemeRegistery.jsx):
//   options = { key: "muirtl", stylisPlugins: [prefixer, rtlPlugin] }
// where `prefixer` is stylis's vendor-prefixer and `rtlPlugin` is MUI's own
// @mui/stylis-plugin-rtl. The prefixer MUST come first: passing `stylisPlugins`
// REPLACES emotion's default plugin chain, so the prefixer has to be re-added
// explicitly or vendor-prefixing (and correct RTL flipping order) is lost — that
// was the bug (we previously passed `[rtlPlugin]` alone with `prepend: true`).
//
// AppRouterCacheProvider (@mui/material-nextjs) inserts emotion's styles through
// Next's useServerInsertedHTML, so the RTL flip is applied during the App Router's
// SERVER render — the FIRST paint is already RTL for every route (login, dashboard,
// lead detail) with no LTR-flash / hydration mismatch.
//
// Client Component: `stylisPlugins` contains FUNCTIONS, which cannot be serialized
// as props across the Server→Client boundary (the root layout is a Server Component).
// Single-language Arabic / RTL.

import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { prefixer } from "stylis";
import rtlPlugin from "@mui/stylis-plugin-rtl";

export function RtlCacheProvider({ children }) {
  return (
    <AppRouterCacheProvider
      options={{ key: "muirtl", stylisPlugins: [prefixer, rtlPlugin] }}
    >
      {children}
    </AppRouterCacheProvider>
  );
}

export default RtlCacheProvider;
