"use client";
import { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Typography,
  Container,
  useTheme,
  alpha,
} from "@mui/material";
import {
  FaBook,
  FaClipboardCheck,
  FaUserGraduate,
  FaPlayCircle,
  FaFileAlt,
  FaTasks,
} from "react-icons/fa";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import StatCard from "./components/StatCard";
import DashboardLoading from "./components/DashboardLoading";
import TestPerformanceCard from "./components/TestPerformanceCard";
import TopCoursesCard from "./components/TopCoursesCard";

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    // Simulate API call
    async function getDashboardData() {
      await getDataAndSet({
        url: `admin/courses/dashboard`,
        setLoading,
        setData: setDashboardData,
      });
    }
    getDashboardData();
  }, []);

  if (loading) {
    return <DashboardLoading theme={theme} />;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.primary.main,
          0.03
        )} 0%, ${alpha(theme.palette.secondary.main, 0.03)} 100%)`,
        py: 4,
      }}
    >
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h3"
            fontWeight="800"
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              mb: 1,
            }}
          >
            Admin Dashboard
          </Typography>
          <Typography variant="h6" color="text.secondary" fontWeight="400">
            Monitor platform performance and manage learning resources
          </Typography>
        </Box>

        {/* Overview Stats */}
        <Grid container spacing={4} sx={{ mb: 6 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={<FaBook size={28} />}
              title="Total Courses"
              value={dashboardData.totalCourses}
              color="success"
              subtitle={`${dashboardData.publishedCourses} published`}
              gradient={true}
              theme={theme}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={<FaClipboardCheck size={28} />}
              title="Test Attempts"
              value={dashboardData.totalTestAttempts}
              color="warning"
              subtitle={`${Math.round(
                (dashboardData.passedTests / dashboardData.totalTestAttempts) *
                  100
              )}% pass rate`}
              gradient={true}
              theme={theme}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={<FaUserGraduate size={28} />}
              title="Course Completions"
              value={dashboardData.courseCompletions}
              color="primary"
              subtitle={`${dashboardData.avgCourseProgress}% avg progress`}
              gradient={true}
              theme={theme}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={<FaPlayCircle size={28} />}
              title="Total Lessons"
              value={dashboardData.totalLessons}
              color="info"
              gradient={true}
              theme={theme}
            />
          </Grid>
        </Grid>

        {/* Detailed Stats Row */}
        <Grid container spacing={4} sx={{ mb: 6 }}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              icon={<FaPlayCircle size={24} />}
              title="Video Content"
              value={dashboardData.totalVideos}
              color="secondary"
              theme={theme}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              icon={<FaFileAlt size={24} />}
              title="PDF Materials"
              value={dashboardData.totalPDFs}
              color="success"
              theme={theme}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              icon={<FaTasks size={24} />}
              title="Homework Submissions"
              value={dashboardData.totalHomeworkSubmissions}
              color="warning"
              theme={theme}
            />
          </Grid>
        </Grid>

        {/* Test Performance & Top Courses */}
        <Grid container spacing={4} sx={{ mb: 6 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TestPerformanceCard dashboardData={dashboardData} theme={theme} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TopCoursesCard dashboardData={dashboardData} theme={theme} />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default AdminDashboard;
