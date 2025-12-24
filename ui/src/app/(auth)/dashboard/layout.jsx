"use client";

import { Box } from "@mui/material";
import colors from "@/app/helpers/colors.js";
import ChatWidget from "@/app/UiComponents/DataViewer/chat/ChatWidget";
import { Suspense } from "react";
import SocketProvider from "@/app/providers/SocketProvider";

export default function AuthLayout({ children }) {
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        minHeight: `calc(100vh - 80px)`,
        pt: 10,
        backgroundColor: colors.bgSecondary,
      }}
    >
      <Suspense fallback={null}>
        <SocketProvider>
          {children}
          <ChatWidget />
        </SocketProvider>
      </Suspense>
    </Box>
  );
}
