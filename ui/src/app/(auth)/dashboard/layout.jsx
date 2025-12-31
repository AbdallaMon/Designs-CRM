"use client";

import { Box } from "@mui/material";
import colors from "@/app/helpers/colors.js";
import ChatWidget from "@/app/UiComponents/DataViewer/chat/components/chat/ChatWidget";

export default function AuthLayout({ children }) {
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        minHeight: { xs: "calc(100vh - 58px)", md: "calc(100vh - 86px)" },
        pt: { xs: 7, md: 10 },
        backgroundColor: colors.bgSecondary,
      }}
    >
      {children}
      <ChatWidget />
    </Box>
  );
}
