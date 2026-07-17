"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Chip,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  CircularProgress,
  Container,
  useTheme,
  alpha,
} from "@mui/material";
import {
  FaBook,
  FaGraduationCap,
  FaCertificate,
  FaFire,
  FaChartLine,
  FaClock,
  FaCheckCircle,
  FaTimes,
  FaPlay,
  FaFileAlt,
  FaLink,
  FaClipboardCheck,
  FaExclamationTriangle,
  FaTrophy,
} from "react-icons/fa";
import { MdVideoCall, MdAssignment } from "react-icons/md";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";

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
              {value}
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

  const getTestStatusIcon = (passed) => {
    return passed ? (
      <FaCheckCircle color="#4caf50" size={20} />
    ) : (
      <FaTimes color="#f44336" size={20} />
    );
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

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
        <Grid container spacing={4} sx={{ mb: 6 }}>
          <Grid size={{ xs: 12, md: 12 }}>
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
                    My Test Performance
                  </Typography>
                </Box>
                <Grid container spacing={4}>
                  <Grid size={{ xs: 6, md: 3 }}>
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
                  <Grid size={{ xs: 6, md: 3 }}>
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
                  <Grid size={{ xs: 6, md: 3 }}>
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
                  <Grid size={{ xs: 6, md: 3 }}>
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
        </Grid>

        {/* Course Progress & Recent Tests */}
        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card
              sx={{
                background: "background.paper",
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
                <Typography variant="h5" fontWeight="700" sx={{ mb: 3 }}>
                  📚 My Course Progress
                </Typography>
                <List sx={{ p: 0 }}>
                  {dashboardData.courseProgress
                    .slice(0, 4)
                    .map((course, index) => (
                      <React.Fragment key={course.id}>
                        <ListItem
                          sx={{
                            px: 0,
                            py: 3,
                            "&:hover": {
                              backgroundColor: alpha(
                                theme.palette.primary.main,
                                0.03
                              ),
                              borderRadius: 2,
                            },
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar
                              sx={{
                                bgcolor:
                                  course.completionPercentage === 100
                                    ? "success.main"
                                    : course.completionPercentage >= 50
                                    ? "warning.main"
                                    : "primary.main",
                                width: 48,
                                height: 48,
                                fontWeight: "bold",
                                fontSize: "0.9rem",
                              }}
                            >
                              {course.completionPercentage}%
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography
                                variant="h6"
                                fontWeight="600"
                                sx={{ mb: 1 }}
                              >
                                {course.title}
                              </Typography>
                            }
                            secondary={
                              <Box>
                                <Box
                                  display="flex"
                                  justifyContent="space-between"
                                  alignItems="center"
                                  sx={{ mb: 1 }}
                                >
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    fontWeight="500"
                                  >
                                    {course.completedLessons} of{" "}
                                    {course.totalLessons} lessons
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    fontWeight="500"
                                  >
                                    Last activity:{" "}
                                    {formatDate(course.lastActivity)}
                                  </Typography>
                                </Box>
                                <LinearProgress
                                  variant="determinate"
                                  value={course.completionPercentage}
                                  sx={{
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: alpha(
                                      theme.palette.primary.main,
                                      0.1
                                    ),
                                    "& .MuiLinearProgress-bar": {
                                      borderRadius: 4,
                                      background:
                                        course.completionPercentage === 100
                                          ? `linear-gradient(90deg, ${theme.palette.success.main} 0%, ${theme.palette.success.light} 100%)`
                                          : `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                                    },
                                  }}
                                />
                              </Box>
                            }
                          />
                          {course.completionPercentage === 100 && (
                            <Box sx={{ ml: 2 }}>
                              <FaTrophy
                                color={theme.palette.warning.main}
                                size={24}
                              />
                            </Box>
                          )}
                        </ListItem>
                        {index <
                          Math.min(
                            dashboardData.courseProgress.length - 1,
                            3
                          ) && (
                          <Divider
                            sx={{
                              mx: 2,
                              backgroundColor: alpha(
                                theme.palette.divider,
                                0.3
                              ),
                            }}
                          />
                        )}
                      </React.Fragment>
                    ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card
              sx={{
                background: "background.paper",
                border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                transition: "all 0.3s ease",
                "&:hover": {
                  boxShadow: `0 12px 24px ${alpha(
                    theme.palette.info.main,
                    0.1
                  )}`,
                },
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" fontWeight="700" sx={{ mb: 3 }}>
                  📝 Recent Test Results
                </Typography>
                <List sx={{ p: 0 }}>
                  {dashboardData.testStats.recentTestAttempts.map(
                    (attempt, index) => (
                      <React.Fragment key={attempt.id}>
                        <ListItem
                          sx={{
                            px: 0,
                            py: 2,
                            "&:hover": {
                              backgroundColor: alpha(
                                theme.palette.info.main,
                                0.03
                              ),
                              borderRadius: 2,
                            },
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar
                              sx={{
                                bgcolor: "transparent",
                                width: 40,
                                height: 40,
                              }}
                            >
                              {getTestStatusIcon(attempt.passed)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography
                                variant="body1"
                                fontWeight="600"
                                sx={{ mb: 0.5 }}
                              >
                                {attempt.testTitle}
                              </Typography>
                            }
                            secondary={
                              <Box>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ mb: 0.5 }}
                                >
                                  {attempt.courseTitle}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {formatDate(attempt.createdAt)}
                                </Typography>
                              </Box>
                            }
                          />
                          <Box sx={{ textAlign: "right" }}>
                            <Chip
                              label={`${attempt.score || 0}%`}
                              size="small"
                              color={attempt.passed ? "success" : "error"}
                              sx={{
                                fontWeight: "bold",
                                mb: 0.5,
                              }}
                            />
                            <Typography
                              variant="caption"
                              display="block"
                              color="text.secondary"
                              sx={{ textTransform: "capitalize" }}
                            >
                              {attempt.testType.toLowerCase()}
                            </Typography>
                          </Box>
                        </ListItem>
                        {index <
                          dashboardData.testStats.recentTestAttempts.length -
                            1 && (
                          <Divider
                            sx={{
                              mx: 2,
                              backgroundColor: alpha(
                                theme.palette.divider,
                                0.3
                              ),
                            }}
                          />
                        )}
                      </React.Fragment>
                    )
                  )}
                  {dashboardData.testStats.recentTestAttempts.length === 0 && (
                    <Box
                      textAlign="center"
                      sx={{
                        py: 4,
                        color: "text.secondary",
                      }}
                    >
                      <Typography variant="body1" fontWeight="500">
                        No test attempts yet
                      </Typography>
                      <Typography variant="body2">
                        Start taking tests to see your results here
                      </Typography>
                    </Box>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default StudentDashboard;
