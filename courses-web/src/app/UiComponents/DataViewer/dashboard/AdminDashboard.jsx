"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Paper,
  Avatar,
  Chip,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  Container,
  useTheme,
  alpha,
} from "@mui/material";
import {
  FaUsers,
  FaBook,
  FaClipboardCheck,
  FaCertificate,
  FaChartLine,
  FaUserGraduate,
  FaPlayCircle,
  FaFileAlt,
  FaTasks,
  FaUserTie,
  FaBell,
  FaCalendarAlt,
  FaEye,
  FaDownload,
  FaExclamationTriangle,
  FaTrophy,
} from "react-icons/fa";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  // Mock data for development
  const mockData = {
    // User Statistics
    testStats: {
      totalAttempts: 1247,
      passedAttempts: 967,
      failedAttempts: 280,
      averageScore: 78.5,
    },
    // Course Statistics
    totalCourses: 89,
    publishedCourses: 67,
    totalLessons: 456,
    totalVideos: 789,
    totalPDFs: 234,

    totalTestAttempts: 2341,
    passedTests: 1876,

    // Progress & Engagement
    courseCompletions: 892,
    avgCourseProgress: 68.5,
    totalHomeworkSubmissions: 1456,

    topCourses: [
      {
        id: 1,
        title: "React Development Masterclass",
        enrollments: 45,
        completionRate: 78,
        averageScore: 82,
      },
      {
        id: 2,
        title: "Node.js Backend Development",
        enrollments: 38,
        completionRate: 65,
        averageScore: 75,
      },
      {
        id: 3,
        title: "JavaScript Fundamentals",
        enrollments: 52,
        completionRate: 89,
        averageScore: 88,
      },
      {
        id: 4,
        title: "Database Design & SQL",
        enrollments: 29,
        completionRate: 72,
        averageScore: 79,
      },
    ],
  };

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

  const StatCard = ({
    icon,
    title,
    value,
    color,
    subtitle,
    gradient = false,
  }) => (
    <Card
      sx={{
        height: "100%",
        background: gradient
          ? `linear-gradient(135deg, ${alpha(
              theme.palette[color].main,
              0.1
            )} 0%, ${alpha(theme.palette[color].main, 0.05)} 100%)`
          : "background.paper",
        border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 12px 24px ${alpha(theme.palette[color].main, 0.15)}`,
          border: `1px solid ${alpha(theme.palette[color].main, 0.4)}`,
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Box
            sx={{
              background: `linear-gradient(135deg, ${theme.palette[color].main} 0%, ${theme.palette[color].dark} 100%)`,
              borderRadius: "16px",
              p: 2,
              mr: 3,
              color: "white",
              boxShadow: `0 8px 16px ${alpha(theme.palette[color].main, 0.3)}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </Box>
          <Box flex={1}>
            <Typography
              variant="h3"
              fontWeight="800"
              sx={{
                background: `linear-gradient(135deg, ${theme.palette[color].main} 0%, ${theme.palette[color].dark} 100%)`,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 0.5,
              }}
            >
              {typeof value === "number" ? value.toLocaleString() : value}
            </Typography>
            <Typography
              variant="body1"
              fontWeight="600"
              color="text.primary"
              sx={{ mb: 0.5 }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  backgroundColor: alpha(theme.palette[color].main, 0.1),
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "0.75rem",
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff7300",
    "#00ff00",
  ];

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
          Loading Admin Dashboard...
        </Typography>
      </Box>
    );
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
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={<FaPlayCircle size={28} />}
              title="Total Lessons"
              value={dashboardData.totalLessons}
              color="info"
              gradient={true}
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
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              icon={<FaFileAlt size={24} />}
              title="PDF Materials"
              value={dashboardData.totalPDFs}
              color="success"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              icon={<FaTasks size={24} />}
              title="Homework Submissions"
              value={dashboardData.totalHomeworkSubmissions}
              color="warning"
            />
          </Grid>
        </Grid>

        {/* Test Performance & Top Courses */}
        <Grid container spacing={4} sx={{ mb: 6 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card
              sx={{
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.primary.main,
                  0.05
                )} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                transition: "all 0.3s ease",
                "&:hover": {
                  boxShadow: `0 12px 24px ${alpha(
                    theme.palette.primary.main,
                    0.1
                  )}`,
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
                        backgroundColor: alpha(
                          theme.palette.primary.main,
                          0.05
                        ),
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
                        backgroundColor: alpha(
                          theme.palette.success.main,
                          0.05
                        ),
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
                        backgroundColor: alpha(
                          theme.palette.warning.main,
                          0.05
                        ),
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
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card
              sx={{
                height: "100%",
                background: "background.paper",
                border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                transition: "all 0.3s ease",
                "&:hover": {
                  boxShadow: `0 12px 24px ${alpha(
                    theme.palette.success.main,
                    0.1
                  )}`,
                },
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box display="flex" alignItems="center" mb={3}>
                  <Box
                    sx={{
                      background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                      borderRadius: "12px",
                      p: 1.5,
                      mr: 2,
                      color: "white",
                    }}
                  >
                    <FaTrophy size={24} />
                  </Box>
                  <Typography variant="h5" fontWeight="700">
                    Top Performing Courses
                  </Typography>
                </Box>
                <List sx={{ p: 0 }}>
                  {dashboardData.topCourses.map((course, index) => (
                    <React.Fragment key={course.id}>
                      <ListItem
                        sx={{
                          px: 0,
                          py: 2,
                          "&:hover": {
                            backgroundColor: alpha(
                              theme.palette.success.main,
                              0.03
                            ),
                            borderRadius: 2,
                          },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor: "primary.main",
                              width: 40,
                              height: 40,
                              fontWeight: "bold",
                            }}
                          >
                            {index + 1}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography
                              variant="body1"
                              fontWeight="600"
                              sx={{ mb: 0.5 }}
                            >
                              {course.title}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography
                                variant="body2"
                                component="span"
                                color="text.secondary"
                                sx={{ mb: 1 }}
                              >
                                {course.enrollments} enrollments •{" "}
                                {course.completionRate}% completion
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={course.completionRate}
                                sx={{
                                  mt: 1,
                                  height: 6,
                                  borderRadius: 3,
                                  backgroundColor: alpha(
                                    theme.palette.primary.main,
                                    0.1
                                  ),
                                  "& .MuiLinearProgress-bar": {
                                    borderRadius: 3,
                                    background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                                  },
                                }}
                              />
                            </Box>
                          }
                        />
                        <Box sx={{ textAlign: "right" }}>
                          <Chip
                            label={`${course.averageScore}%`}
                            size="small"
                            color={
                              course.averageScore >= 80
                                ? "success"
                                : course.averageScore >= 70
                                ? "warning"
                                : "error"
                            }
                            sx={{ fontWeight: "bold" }}
                          />
                        </Box>
                      </ListItem>
                      {index < dashboardData.topCourses.length - 1 && (
                        <Divider
                          sx={{
                            mx: 2,
                            backgroundColor: alpha(theme.palette.divider, 0.3),
                          }}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default AdminDashboard;
