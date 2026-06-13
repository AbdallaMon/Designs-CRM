"use client";
import React from "react";
import { Box, Stack, Typography, useTheme, alpha } from "@mui/material";

/**
 * Presentational-only empty state: a soft icon badge + short message.
 * No business logic. Used across lead tabs for "no items yet" states.
 */
export function EmptyState({ icon, title, description, action }) {
  const theme = useTheme();
  return (
    <Stack
      spacing={1.5}
      alignItems="center"
      justifyContent="center"
      sx={{
        textAlign: "center",
        py: 6,
        px: 3,
        borderRadius: 3,
        border: `1px dashed ${theme.palette.divider}`,
        bgcolor: alpha(theme.palette.background.default, 0.5),
      }}
    >
      {icon && (
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main,
            fontSize: 26,
          }}
        >
          {icon}
        </Box>
      )}
      <Typography variant="subtitle1" fontWeight={600} color="text.primary">
        {title}
      </Typography>
      {description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 360 }}
        >
          {description}
        </Typography>
      )}
      {action}
    </Stack>
  );
}

export default EmptyState;
