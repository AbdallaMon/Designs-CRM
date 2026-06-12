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
//
// BILINGUAL (Phase 1): the cache is now LANGUAGE-AWARE. The server reads the `lang` cookie and
// passes `lng`:
//   • ar (DEFAULT) → { key: "muirtl", stylisPlugins: [prefixer, rtlPlugin] }  ← UNCHANGED, the
//     exact options used before this layer existed, so Arabic RTL is byte-identical.
//   • en           → { key: "mui",   stylisPlugins: [prefixer] }              ← no rtl flip → LTR.
// The cache `key` differs per language so emotion never mixes RTL- and LTR-flipped class hashes.
// Because the cache key is decided HERE (server-driven from the cookie), the RTL/LTR choice is
// correct on the FIRST server render for every route — no flash, no hydration mismatch.

import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { prefixer } from "stylis";
import rtlPlugin from "@mui/stylis-plugin-rtl";

export function RtlCacheProvider({ children, lng = "ar" }) {
  const options =
    lng === "ar"
      ? { key: "muirtl", stylisPlugins: [prefixer, rtlPlugin] }
      : { key: "mui", stylisPlugins: [prefixer] };

  // key={lng} REMOUNTS the cache provider when the language changes. The emotion cache `options`
  // (key + stylisPlugins) are read by AppRouterCacheProvider ONCE on mount, so a bare options swap
  // would not re-seed the rtl/ltr plugin chain on a language toggle. Keying on `lng` forces a fresh
  // cache (muirtl ↔ mui) so the drawer + every flipped style re-mount on the new direction.
  return (
    <AppRouterCacheProvider key={lng} options={options}>
      {children}
    </AppRouterCacheProvider>
  );
}

export default RtlCacheProvider;
