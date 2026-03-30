"use client";
import { Paper, Typography } from "@mui/material";

/**
 * Centered card wrapper used on all auth pages.
 *
 * @param {{ title: string, subtitle?: React.ReactNode, children: React.ReactNode }} props
 */
export default function AuthCard({ title, subtitle, children }) {
  return (
    <Paper
      elevation={6}
      sx={{
        width: "100%",
        maxWidth: 400,
        p: { xs: 3, sm: 4 },
        backgroundColor: "background.default",
        borderRadius: 2,
      }}
    >
      <Typography variant="h4" component="h1" gutterBottom align="center">
        {title}
      </Typography>

      {subtitle && (
        <Typography variant="body2" align="center" sx={{ mb: 2 }}>
          {subtitle}
        </Typography>
      )}

      {children}
    </Paper>
  );
}
