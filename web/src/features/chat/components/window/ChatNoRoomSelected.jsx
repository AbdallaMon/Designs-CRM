"use client";

import { Box, Typography } from "@mui/material";

export function ChatNoRoomSelected({ clientId }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: clientId
          ? {
              xs: "calc(100vh - 32px)",
              md: "calc(100vh - 32px)",
            }
          : {
              xs: "calc(100vh - 62px)",
              md: "calc(100vh - 105px)",
            },

        color: "textSecondary",
      }}
    >
      <Typography>Select a chat to start messaging</Typography>
    </Box>
  );
}

export default ChatNoRoomSelected;
