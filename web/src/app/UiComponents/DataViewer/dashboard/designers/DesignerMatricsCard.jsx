"use client";
import React, { useEffect, useState } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  useMediaQuery,
  useTheme,
  Avatar,
  Divider,
  Stack,
} from "@mui/material";
import {
  FaCheckCircle,
  FaRulerCombined,
  FaProjectDiagram,
  FaClock,
  FaChartLine,
  FaSpinner,
  FaPauseCircle,
} from "react-icons/fa";
import LoadingOverlay from "@/app/UiComponents/feedback/loaders/LoadingOverlay.jsx";
import { getData } from "@/app/helpers/functions/getData.js";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useAuth } from "@/app/providers/AuthProvider";

const DesignerMetricsCard = ({ staff, staffId }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [designerMetrics, setDesignerMetrics] = useState({
    completedProjects: 0,
    totalArea: 0,
    totalProjects: 0,
    totalTimeSpent: 0, // in hours
    currentMonthArea: 0,
    previousMonthArea: 0,
    currentMonthTimeSpent: 0,
    previousMonthTimeSpent: 0,
  });

  const metricsData = [
    {
      title: "Total Projects",
      value: designerMetrics.totalProjects,
      icon: <FaProjectDiagram size={24} color="#ffffff" />,
      color: theme.palette.secondary.main,
    },
    {
      title: "Completed Projects",
      value: designerMetrics.completedProjects,
      icon: <FaCheckCircle size={24} color="#ffffff" />,
      color: theme.palette.success.main,
    },
    {
      title: "In Progress Projects",
      value: designerMetrics.inProgressProject,
      icon: <FaSpinner size={24} color="#ffffff" />,
      color: theme.palette.warning.main,
    },
    {
      title: "On Hold Projects",
      value: designerMetrics.holdProjects,
      icon: <FaPauseCircle size={24} color="#ffffff" />,
      color: theme.palette.error.main,
    },
    {
      title: "Total Area",
      value: `${designerMetrics.totalArea} m²`,
      icon: <FaRulerCombined size={24} color="#ffffff" />,
      color: theme.palette.primary.main,
    },
    {
      title: "Time Spent",
      value: `${designerMetrics.totalTimeSpent} hours`,
      icon: <FaClock size={24} color="#ffffff" />,
      color: theme.palette.info.main,
    },
  ];

  const monthlyAreaData = [
    {
      name: "Previous Month",
      area: designerMetrics.previousMonthArea,
      time: designerMetrics.previousMonthTimeSpent,
    },
    {
      name: "Current Month",
      area: designerMetrics.currentMonthArea,
      time: designerMetrics.currentMonthTimeSpent,
    },
  ];

  useEffect(() => {
    async function fetchData() {
      const extra = staffId
        ? "staffId=" + staffId
        : staff
        ? "staffId=" + user.id
        : "";
      const profile = staffId && `profile=true&`;
      const request = await getData({
        url: `shared/dashboard/designer-metrics?${extra}&${profile}`,
        setLoading,
      });
      if (request) setDesignerMetrics(request.data);
    }
    fetchData();
  }, [staffId]);

  return (
    <Card
      sx={{
        height: "100%",
        boxShadow: 3,
        borderRadius: 2,
        position: "relative",
      }}
    >
      {loading && <LoadingOverlay />}
      <CardContent>
        <Grid container spacing={2}>
          {metricsData.map((metric, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  padding: 2,
                  height: "100%",
                  boxShadow: 1,
                  borderRadius: 2,
                  backgroundColor: "#ffffff",
                  transition: "transform 0.3s, box-shadow 0.3s",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: 6,
                  },
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: metric.color,
                    width: 56,
                    height: 56,
                    marginRight: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {metric.icon}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    {metric.title}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: "bold", color: "#333" }}
                  >
                    {metric.value}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography
          variant="h6"
          gutterBottom
          sx={{ fontWeight: "bold", color: "#333", mb: 2 }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <FaChartLine style={{ marginRight: "8px" }} />
            Monthly Comparison
          </Box>
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ width: "100%", height: 300 }}>
              <Typography
                variant="subtitle1"
                align="center"
                sx={{ fontWeight: "medium", mb: 1 }}
              >
                Area (m²)
              </Typography>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyAreaData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} m²`, "Area"]} />
                  <Legend />
                  <Bar
                    dataKey="area"
                    name="Area (m²)"
                    fill={theme.palette.primary.main}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ width: "100%", height: 300 }}>
              <Typography
                variant="subtitle1"
                align="center"
                sx={{ fontWeight: "medium", mb: 1 }}
              >
                Time Spent (hours)
              </Typography>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyAreaData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [`${value} hours`, "Time Spent"]}
                  />
                  <Legend />
                  <Bar
                    dataKey="time"
                    name="Time (hours)"
                    fill={theme.palette.info.main}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default DesignerMetricsCard;
