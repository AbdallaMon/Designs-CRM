"use client";

// Presentational kit shared by the contract create / clone form dialogs and their
// editors. Pure UI — no business logic, no data fetching, no payload shaping.
// One vocabulary so every editor (stages, payments, special items, drawings) reads
// as the same system: a labelled section header, soft accent cards, and tidy
// empty states. RTL-safe (logical spacing only; MUI flips direction globally).

import React from "react";
import { Box, Button, Stack, Typography, alpha, useTheme } from "@mui/material";

/** Section header: icon tile + title (+ optional subtitle/count) + optional action. */
export function SectionHeader({
  icon,
  title,
  subtitle,
  count,
  color,
  action,
}) {
  const theme = useTheme();
  const c = color || theme.palette.primary.main;
  const hasCount = typeof count === "number";
  return (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="center"
      justifyContent="space-between"
    >
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
        {icon && (
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: alpha(c, 0.12),
              color: c,
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        )}
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle1" fontWeight={700} color="text.primary" noWrap>
              {title}
            </Typography>
            {hasCount && (
              <Box
                sx={{
                  px: 1,
                  py: 0.1,
                  borderRadius: 1.5,
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: c,
                  bgcolor: alpha(c, 0.12),
                }}
              >
                {count}
              </Box>
            )}
          </Stack>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
      {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
    </Stack>
  );
}

/** A soft, accent-tinted card used for each editor row (payment, item, stage…). */
export function EditorCard({ accent, index, label, badge, onRemove, children, sx }) {
  const theme = useTheme();
  const c = accent || theme.palette.primary.main;
  return (
    <Box
      sx={{
        borderRadius: 2.5,
        border: `1px solid ${alpha(c, 0.25)}`,
        borderInlineStart: `3px solid ${c}`,
        bgcolor: alpha(c, 0.04),
        p: 2,
        transition: "box-shadow .2s ease, border-color .2s ease",
        "&:hover": { boxShadow: theme.shadows[2] },
        ...sx,
      }}
    >
      {(label || typeof index === "number" || onRemove || badge) && (
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 1.5 }}
        >
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
            {typeof index === "number" && (
              <Box
                sx={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: c,
                  color: "#fff",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {index}
              </Box>
            )}
            {label && (
              <Typography variant="subtitle2" fontWeight={700} color="text.primary" noWrap>
                {label}
              </Typography>
            )}
            {badge}
          </Stack>
          {onRemove}
        </Stack>
      )}
      {children}
    </Box>
  );
}

/** Tidy empty state for editors with no rows yet. */
export function EmptyState({ icon, text, action, color }) {
  const theme = useTheme();
  const c = color || theme.palette.text.secondary;
  return (
    <Box
      sx={{
        borderRadius: 2.5,
        border: `1px dashed ${theme.palette.divider}`,
        bgcolor: alpha(c, 0.03),
        p: 3,
        textAlign: "center",
      }}
    >
      {icon && (
        <Box sx={{ color: alpha(c, 0.6), fontSize: 26, mb: 1, display: "flex", justifyContent: "center" }}>
          {icon}
        </Box>
      )}
      <Typography variant="body2" color="text.secondary" sx={{ mb: action ? 1.5 : 0 }}>
        {text}
      </Typography>
      {action}
    </Box>
  );
}

/** Compact "add row" button used in every editor header. */
export function AddButton({ onClick, label, color, startIcon }) {
  const theme = useTheme();
  const c = color || theme.palette.primary.main;
  return (
    <Button
      onClick={onClick}
      startIcon={startIcon}
      variant="outlined"
      size="small"
      sx={{
        borderColor: alpha(c, 0.5),
        color: c,
        fontWeight: 700,
        borderRadius: 2,
        px: 1.75,
        "&:hover": { borderColor: c, bgcolor: alpha(c, 0.06) },
      }}
    >
      {label}
    </Button>
  );
}
