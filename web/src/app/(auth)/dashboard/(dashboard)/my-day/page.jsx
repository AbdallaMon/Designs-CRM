"use client";
import { alpha, Box, Container, Paper, Stack, Typography, useTheme } from "@mui/material";
import { FiSunrise } from "react-icons/fi";
import { usePermission } from "@/app/hooks/usePermission.js";
import MyDay from "@/features/my-day/MyDay.jsx";

const MY_DAY_VIEW = "my_day.view";
const MY_DAY_TEAM_VIEW = "my_day.team.view";

export default function MyDayPage() {
  const theme = useTheme();
  const { hasAnyPermission } = usePermission();
  const canOpen = hasAnyPermission([MY_DAY_VIEW, MY_DAY_TEAM_VIEW]);

  return (
    <Container maxWidth="lg" sx={{ pt: { xs: 3, md: 4 }, pb: 4 }}>
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
            <FiSunrise />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" fontWeight={800} color="text.primary">
              My Day
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Everything that needs your action today, ranked — and for supervisors, who
              needs unblocking.
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {canOpen ? (
        <MyDay />
      ) : (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
            You don&apos;t have permission to view My Day
          </Typography>
        </Box>
      )}
    </Container>
  );
}
