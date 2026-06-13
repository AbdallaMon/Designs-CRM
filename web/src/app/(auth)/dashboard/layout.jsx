"use client";

import { Box } from "@mui/material";
import colors from "@/app/helpers/colors.js";
import ChatWidget from "@/app/UiComponents/DataViewer/chat/components/chat/ChatWidget";
import SocketProvider from "@/app/providers/SocketProvider";

export default function AuthLayout({ children }) {
  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        backgroundColor: colors.bgSecondary,
      }}
    >
      {children}
    </Box>
  );
}
