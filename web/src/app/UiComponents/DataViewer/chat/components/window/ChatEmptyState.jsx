"use client";

import { Box, Typography } from "@mui/material";

export function ChatEmptyState() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 1,
        flex: 1,
        color: "text.secondary",
        textAlign: "center",
        px: 2,
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          fontSize: 26,
        }}
      >
        💬
      </Box>
      <Typography sx={{ fontWeight: 600 }}>No messages yet</Typography>
      <Typography variant="caption" color="text.secondary">
        Start the conversation now
      </Typography>
    </Box>
  );
}

export default ChatEmptyState;
