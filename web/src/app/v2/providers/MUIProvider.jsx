"use client";

// MUIProvider — owns the ENTIRE MUI + RTL setup for v2, ONCE. It wraps the app in a module-level
// emotion cache keyed "muirtl" (stylis-plugin-rtl, prepend) so EVERY page that renders under the
// root layout — including non-AppLayout pages (login, reset, redirect shells) — gets RTL flipping,
// not just AuthedAppLayout/PublicAppLayout. The theme itself carries direction: "rtl".
// Single-language Arabic / RTL.

import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { ThemeProvider } from "@mui/material";
import rtlPlugin from "stylis-plugin-rtl";
import theme from "./theme";

// Module-level so the cache is created once and shared across the tree (no per-render churn).
const cache = createCache({ key: "muirtl", prepend: true, stylisPlugins: [rtlPlugin] });

export function MUIProvider({ children }) {
  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </CacheProvider>
  );
}
