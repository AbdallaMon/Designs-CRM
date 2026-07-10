"use client";

import { Box, Stack, Card, Typography, useTheme, alpha } from "@mui/material";

export default function SectionCard({
  icon,
  title,
  subheader,
  actions,
  children,
}) {
  const theme = useTheme();
  return (
    <Card
      sx={{
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.primary.main,
          0.03
        )} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        borderRadius: 2.5,
      }}
    >
      <Stack sx={{ p: 2.5 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                fontSize: 24,
                color: "primary.main",
                display: "flex",
                alignItems: "center",
              }}
            >
              {icon}
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {title}
              </Typography>
              {subheader && (
                <Typography variant="caption" color="text.secondary">
                  {subheader}
                </Typography>
              )}
            </Box>
          </Stack>
          <Stack direction="row" spacing={0.5}>
            {actions}
          </Stack>
        </Stack>
        {children}
      </Stack>
    </Card>
  );
}
