"use client";

// Shared chrome for every dashboard widget — a titled MUI Card with a relative position so
// a loading overlay can sit on top, plus an inline empty-state. Mirrors the legacy widget
// shell (Card + boxShadow + LoadingOverlay) but in the v2 design language. Single-language
// Arabic / RTL — the title is passed in already-Arabic.

import { Box, Card, CardContent, CircularProgress, Typography } from "@mui/material";

export function WidgetCard({
  title,
  subtitle,
  action,
  loading = false,
  isEmpty = false,
  emptyText = "لا توجد بيانات",
  minHeight,
  contentSx,
  children,
}) {
  return (
    <Card sx={{ height: "100%", boxShadow: 3, borderRadius: 2, position: "relative" }}>
      {loading && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255,255,255,0.6)",
            borderRadius: 2,
          }}
        >
          <CircularProgress size={32} />
        </Box>
      )}
      <CardContent sx={{ overflow: "auto", ...contentSx }}>
        {(title || action) && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 2,
              mb: subtitle ? 0.5 : 1.5,
            }}
          >
            {title && (
              <Typography variant="h6" sx={{ fontWeight: "bold", color: "text.primary" }}>
                {title}
              </Typography>
            )}
            {action}
          </Box>
        )}
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {subtitle}
          </Typography>
        )}

        {isEmpty && !loading ? (
          <Box
            sx={{
              minHeight: minHeight ?? 120,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography color="text.secondary">{emptyText}</Typography>
          </Box>
        ) : (
          <Box sx={{ minHeight: minHeight ?? "auto" }}>{children}</Box>
        )}
      </CardContent>
    </Card>
  );
}

export default WidgetCard;
