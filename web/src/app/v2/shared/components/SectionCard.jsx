"use client";

// <SectionCard title actions>{children}</SectionCard> — a themed content card (MuiCard radius
// 12 from the v2 theme) with an optional header row (title + end-aligned actions). The
// canonical container for a section of a screen. RTL: header actions sit at the inline-END.
// Single-language Arabic.
//
// Props:
//   title    string?  — section heading (resolved Arabic).
//   subtitle string?  — optional secondary line.
//   actions  node?    — header-end controls (buttons, menus).
//   noPadding bool    — drop the default content padding (e.g. when wrapping a table).
//   sx       object?  — extra sx merged onto the Card.
//   children node     — section body.

import { Card, CardContent, Box, Stack, Typography, Divider } from "@mui/material";

export function SectionCard({
  title,
  subtitle,
  actions,
  noPadding = false,
  sx,
  children,
}) {
  const hasHeader = Boolean(title || actions);
  return (
    <Card sx={{ borderRadius: 3, ...sx }}>
      {hasHeader && (
        <>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            spacing={1}
            sx={{ px: 2.5, py: 2 }}
          >
            <Box sx={{ minWidth: 0 }}>
              {title && (
                <Typography variant="h6" component="h2">
                  {title}
                </Typography>
              )}
              {subtitle && (
                <Typography variant="body2" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
            {actions && (
              <Stack direction="row" spacing={1} alignItems="center">
                {actions}
              </Stack>
            )}
          </Stack>
          <Divider />
        </>
      )}
      {noPadding ? (
        <Box>{children}</Box>
      ) : (
        <CardContent sx={{ p: 2.5 }}>{children}</CardContent>
      )}
    </Card>
  );
}

export default SectionCard;
