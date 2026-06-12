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

  // REMOUNT ON LANGUAGE CHANGE (the drawer-side / RTL-flip bug fix).
  // AppRouterCacheProvider builds its emotion cache ONCE, in a `useState(() => createCache(...))`
  // lazy initializer — it is NOT recreated when the `options` prop changes. When the user toggles
  // ar↔en, I18nProvider.changeLanguage() flips <html dir> and calls router.refresh(), which re-runs
  // the server root layout so this component receives the new `lng` (and the new `options`) — but
  // because the provider is a Client Component that is NOT unmounted by refresh(), its cached
  // emotion instance keeps the OLD key + stylisPlugins. So after ar→en the already-injected
  // RTL-flipped rules (e.g. the Drawer paper's `right:0; border-left`) stay attached while the DOM
  // is now dir="ltr": the drawer stays pinned to the right while the flex content offset moves
  // left — the exact "drawer doesn't switch sides" symptom.
  //
  // Keying the provider on `lng` forces React to UNMOUNT the old subtree and MOUNT a fresh one, so
  // the `useState` initializer re-runs with the correct key + plugins (en → "mui", no rtl flip;
  // ar → "muirtl" + rtlPlugin). The components get fresh class names from the new cache and the
  // stale flipped rules no longer match anything. The Arabic-default path is untouched: with no
  // toggle the key is constant ("ar") so nothing remounts and the first paint is byte-identical.
  return (
    <AppRouterCacheProvider key={lng} options={options}>
      {children}
    </AppRouterCacheProvider>
  );
}

export default RtlCacheProvider;
