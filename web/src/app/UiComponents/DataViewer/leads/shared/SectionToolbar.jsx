"use client";
import React from "react";
import { Box, Chip, Stack, Typography, useTheme, alpha } from "@mui/material";

/**
 * Presentational-only section header: leading icon, title, optional count chip,
 * and a right-aligned action slot (e.g. a "Create" button). No business logic.
 */
export function SectionToolbar({
  icon,
  title,
  count,
  countLabel,
  action,
  sx,
}) {
  const theme = useTheme();
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1.5}
      alignItems={{ xs: "stretch", sm: "center" }}
      justifyContent="space-between"
      sx={{ mb: 0.5, ...sx }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        {icon && (
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: theme.palette.primary.main,
              fontSize: 20,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        )}
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h6" fontWeight={700} color="text.primary">
            {title}
          </Typography>
          {typeof count !== "undefined" && (
            <Chip
              label={
                countLabel ? `${count} ${countLabel}` : count
              }
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          )}
        </Stack>
      </Stack>
      {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
    </Stack>
  );
}

export default SectionToolbar;
