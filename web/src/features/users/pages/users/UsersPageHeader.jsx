"use client";
import { alpha, Box, Paper, Stack, Typography, useTheme } from "@mui/material";
import { FiUsers } from "react-icons/fi";

export default function UsersPageHeader() {
  const theme = useTheme();
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.primary.main,
          0.08
        )} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
        p: { xs: 2.5, md: 3 },
        mb: 2.5,
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "flex-start", sm: "center" }}
      >
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: alpha(theme.palette.primary.main, 0.14),
            color: theme.palette.primary.main,
            fontSize: 26,
            flexShrink: 0,
          }}
        >
          <FiUsers />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5" fontWeight={800} color="text.primary">
            Users
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage team accounts, access profiles, and permissions
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}
