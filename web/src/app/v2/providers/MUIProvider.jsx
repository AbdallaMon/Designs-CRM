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
import theme from "./theme";

export function MUIProvider({ children }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
