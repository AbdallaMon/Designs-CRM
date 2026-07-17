"use client";
import { Box, CircularProgress, Typography, alpha } from "@mui/material";

const DashboardLoading = ({ theme }) => (
  <Box
    display="flex"
    flexDirection="column"
    justifyContent="center"
    alignItems="center"
    minHeight="400px"
    sx={{
      background: `linear-gradient(135deg, ${alpha(
        theme.palette.primary.main,
        0.05
      )} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
    }}
  >
    <CircularProgress size={60} thickness={4} />
    <Typography variant="h6" sx={{ mt: 2, color: "text.secondary" }}>
      Loading Admin Dashboard...
    </Typography>
  </Box>
);

export default DashboardLoading;
