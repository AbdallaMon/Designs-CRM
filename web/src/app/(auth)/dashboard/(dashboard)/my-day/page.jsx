"use client";
import { Box, Container, Typography } from "@mui/material";
import { FiSunrise } from "react-icons/fi";
import { usePermission } from "@/app/hooks/usePermission.js";
import MyDay from "@/features/my-day/MyDay.jsx";

const MY_DAY_VIEW = "my_day.view";
const MY_DAY_TEAM_VIEW = "my_day.team.view";

export default function MyDayPage() {
  const { hasAnyPermission } = usePermission();
  const canOpen = hasAnyPermission([MY_DAY_VIEW, MY_DAY_TEAM_VIEW]);

  return (
    <Container maxWidth="lg" sx={{ pt: { xs: 3, md: 4 }, pb: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
        <FiSunrise size={24} />
        <Typography variant="h5" component="h1" fontWeight={800}>
          My Day
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Everything that needs your action today, ranked — and for supervisors, who needs
        unblocking.
      </Typography>

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
