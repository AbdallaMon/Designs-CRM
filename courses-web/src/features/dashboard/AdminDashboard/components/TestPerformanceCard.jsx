"use client";
import { Box, Card, CardContent, Typography, Grid, alpha } from "@mui/material";
import { FaChartLine } from "react-icons/fa";

const TestPerformanceCard = ({ dashboardData, theme }) => (
  <Card
    sx={{
      background: `linear-gradient(135deg, ${alpha(
        theme.palette.primary.main,
        0.05
      )} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      transition: "all 0.3s ease",
      "&:hover": {
        boxShadow: `0 12px 24px ${alpha(theme.palette.primary.main, 0.1)}`,
      },
    }}
  >
    <CardContent sx={{ p: 4 }}>
      <Box display="flex" alignItems="center" mb={4}>
        <Box
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.info.main} 100%)`,
            borderRadius: "12px",
            p: 1.5,
            mr: 2,
            color: "white",
          }}
        >
          <FaChartLine size={24} />
        </Box>
        <Typography variant="h5" fontWeight="700">
          Test Performance Overview
        </Typography>
      </Box>
      <Grid container spacing={4}>
        <Grid size={{ xs: 6, md: 6 }}>
          <Box
            textAlign="center"
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
            }}
          >
            <Typography
              variant="h4"
              color="primary"
              fontWeight="800"
              sx={{ mb: 1 }}
            >
              {dashboardData.testStats.totalAttempts}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              fontWeight="600"
            >
              Total Attempts
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 6, md: 6 }}>
          <Box
            textAlign="center"
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.success.main, 0.05),
            }}
          >
            <Typography
              variant="h4"
              color="success.main"
              fontWeight="800"
              sx={{ mb: 1 }}
            >
              {dashboardData.testStats.passedAttempts}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              fontWeight="600"
            >
              Passed
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 6, md: 6 }}>
          <Box
            textAlign="center"
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.error.main, 0.05),
            }}
          >
            <Typography
              variant="h4"
              color="error.main"
              fontWeight="800"
              sx={{ mb: 1 }}
            >
              {dashboardData.testStats.failedAttempts}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              fontWeight="600"
            >
              Failed
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 6, md: 6 }}>
          <Box
            textAlign="center"
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.warning.main, 0.05),
            }}
          >
            <Typography
              variant="h4"
              color="warning.main"
              fontWeight="800"
              sx={{ mb: 1 }}
            >
              {dashboardData.testStats.averageScore}%
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              fontWeight="600"
            >
              Average Score
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
);

export default TestPerformanceCard;
