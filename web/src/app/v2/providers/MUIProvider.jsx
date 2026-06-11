"use client";

// MUIProvider — provides the v2 MUI theme (direction: "rtl") to the whole tree.
//
// The RTL emotion cache (key "muirtl" + stylis-plugin-rtl, prepend) now lives in the ROOT
// layout via <AppRouterCacheProvider> (@mui/material-nextjs), which is the official Next.js
// App Router integration: it inserts emotion's SSR styles through useServerInsertedHTML, so
// the RTL flip is applied during the server render and the FIRST paint is already RTL — for
// every route, including non-AppLayout pages (login, reset, redirect shells). A client-only
// @emotion/cache (the previous setup here) does NOT participate in SSR, which is why the app
// "looked LTR" on initial load. Keeping a second cache here would double-cache, so it's gone.
// Single-language Arabic / RTL.

import { ThemeProvider } from "@mui/material";
import { CssBaseline } from "@mui/material";
import theme from "./theme";

export function MUIProvider({ children }) {
  // <CssBaseline /> applies MUI's normalize + (crucially) the theme's MuiCssBaseline overrides
  // (e.g. the global prefers-reduced-motion reset). The reference mounts it inside ThemeProvider;
  // ours was missing it, so those overrides never took effect. RtlCacheProvider / the emotion
  // cache are untouched (owned by the root layout).
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
