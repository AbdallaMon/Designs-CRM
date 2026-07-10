"use client";

import { Alert, Snackbar } from "@mui/material";

export function ChatErrorSnackbar({ chatError, onClose }) {
  return (
    <Snackbar
      open={Boolean(chatError)}
      autoHideDuration={6000}
      onClose={onClose}
    >
      <Alert onClose={onClose} severity="error" sx={{ width: "100%" }}>
        {chatError}
      </Alert>
    </Snackbar>
  );
}

export default ChatErrorSnackbar;
