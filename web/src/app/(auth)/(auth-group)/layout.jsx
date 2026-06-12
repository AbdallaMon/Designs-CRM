"use client";

import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import rtlPlugin from "stylis-plugin-rtl";
import { Box } from "@mui/material";
import Image from "next/image";
import { MUIProvider } from "@/app/v2/providers/MUIProvider";
import { ToastProvider } from "@/app/v2/providers/ToastProvider";
import { AuthProvider } from "@/app/v2/providers/AuthProvider";

const rtlCache = createCache({ key: "muirtl", stylisPlugins: [rtlPlugin] });

// Self-contained auth route shell (mirrors the v2 feature layouts): its own emotion RTL
// cache + v2 MUI theme + Toast + Auth, so /login and /reset run on the v2 layer without
// needing global root providers.
export default function HandleAuth({ children }) {
  return (
    <CacheProvider value={rtlCache}>
      <MUIProvider>
        <ToastProvider>
          <AuthProvider>
            <Box
              sx={{
                position: "relative",
                minHeight: "100vh",
                width: "100vw",
                overflow: "hidden",
              }}
            >
              <Image
                src="/admin-background.jpg"
                alt="Admin Dashboard Background"
                fill
                style={{ objectFit: "cover" }}
                quality={100}
              />
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {children}
              </Box>
            </Box>
          </AuthProvider>
        </ToastProvider>
      </MUIProvider>
    </CacheProvider>
  );
}
