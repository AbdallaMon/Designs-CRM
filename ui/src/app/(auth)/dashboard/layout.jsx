"use client";

import { Box } from "@mui/material";
import colors from "@/app/helpers/colors.js";
import ChatWidget from "@/app/UiComponents/DataViewer/chat/ChatWidget";

export default function AuthLayout({ children }) {
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        minHeight: "100vh",
        py: 10,
        backgroundColor: colors.bgSecondary,
      }}
    >
      {children}
      <ChatWidget />
    </Box>
  );
}
