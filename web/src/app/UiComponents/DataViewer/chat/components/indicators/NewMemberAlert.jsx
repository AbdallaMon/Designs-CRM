"use client";

import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { FaTimes } from "react-icons/fa";

export function NewMemberAlert({ newMembersAdded, onClose }) {
  if (!newMembersAdded || newMembersAdded.length === 0) return null;

  return (
    <Box
      sx={{
        mt: 2,
        p: 1.5,
        bgcolor: "info.lighter",
        borderRadius: 1,
        border: "1px solid",
        borderColor: "info.main",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
      }}
    >
      <Typography variant="caption" sx={{ color: "info.main" }}>
        {newMembersAdded
          .map((m) => m.name || m.user?.name || "A member")
          .join(", ")}{" "}
        {newMembersAdded.length === 1 ? "has" : "have"} been added to the chat.
      </Typography>
      <IconButton
        size="small"
        onClick={onClose}
        sx={{ ml: 1, minWidth: "auto" }}
      >
        <FaTimes size={12} />
      </IconButton>
    </Box>
  );
}
