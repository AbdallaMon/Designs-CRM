"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  Container,
  useTheme,
  alpha,
} from "@mui/material";
import {
  FaBook,
  FaFire,
  FaPlay,
  FaFileAlt,
  FaTrophy,
} from "react-icons/fa";
import { MdVideoCall } from "react-icons/md";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import StatCard from "./components/StatCard";
import TestPerformanceCard from "./components/TestPerformanceCard";
import CourseProgressCard from "./components/CourseProgressCard";
import RecentTestResultsCard from "./components/RecentTestResultsCard";

const StudentDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    async function getDashboardData() {
      await getDataAndSet({
        url: `shared/courses/dashboard`, // Changed to student endpoint
        setLoading,
        setData: setDashboardData,
      });
    }
    getDashboardData();
  }, []);

  if (loading) {
    return (
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
          Loading Your Dashboard...
        </Typography>
      </Box>
    );
  }

  if (!dashboardData) return null;

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
            My Learning Dashboard
          </Typography>
          <Typography variant="h6" color="text.secondary" fontWeight="400">
            Track your progress and continue your learning journey
          </Typography>
        </Box>

        {/* Overview Stats */}
        <Grid container spacing={4} sx={{ mb: 6 }}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              icon={<FaBook size={28} />}
              title="Enrolled Courses"
              value={dashboardData.overview.totalEnrolledCourses}
              color="primary"
              subtitle={`${dashboardData.overview.publishedEnrolledCourses} active`}
              gradient={true}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              icon={<FaTrophy size={28} />}
              title="Completed Courses"
              value={dashboardData.overview.completedCourses}
              color="success"
              gradient={true}
            />
          </Grid>
          {/* <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={<FaCertificate size={28} />}
              title="Certificates Earned"
              value={dashboardData.overview.totalCertificates}
              color="warning"
              gradient={true}
            />
          </Grid> */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              icon={<FaFire size={28} />}
              title="Learning Streak"
              value={dashboardData.overview.learningStreak}
              color="error"
              subtitle="days"
              gradient={true}
            />
          </Grid>
        </Grid>

        {/* Learning Content Stats */}
        <Grid container spacing={4} sx={{ mb: 6 }}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              icon={<FaPlay size={24} />}
              title="Accessible Lessons"
              value={dashboardData.learningStats.totalAccessibleLessons}
              color="primary"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              icon={<MdVideoCall size={26} />}
              title="Videos Available"
              value={dashboardData.learningStats.totalVideosAccessible}
              color="error"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              icon={<FaFileAlt size={24} />}
              title="Study Materials"
              value={
                dashboardData.learningStats.totalPDFsAccessible +
                dashboardData.learningStats.totalLinksAccessible
              }
              color="info"
              subtitle={`${dashboardData.learningStats.totalPDFsAccessible} PDFs, ${dashboardData.learningStats.totalLinksAccessible} links`}
            />
          </Grid>
        </Grid>

        {/* Test Performance & Homework Status */}
        <TestPerformanceCard testStats={dashboardData.testStats} />

        {/* Course Progress & Recent Tests */}
        <Grid container spacing={4} sx={{ mb: 4 }}>
          <CourseProgressCard courseProgress={dashboardData.courseProgress} />
          <RecentTestResultsCard
            recentTestAttempts={dashboardData.testStats.recentTestAttempts}
          />
        </Grid>
      </Container>
    </Box>
  );
};

export default StudentDashboard;
