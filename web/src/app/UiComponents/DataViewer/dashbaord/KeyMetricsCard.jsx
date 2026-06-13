// components/KeyMetricsCard.js
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
  LinearProgress,
} from "@mui/material";
import {
  FaDollarSign,
  FaProjectDiagram,
  FaChartLine,
  FaTasks,
  FaMoneyBillWave,
} from "react-icons/fa";
import LoadingOverlay from "@/app/UiComponents/feedback/loaders/LoadingOverlay.jsx";
import { getData } from "@/app/helpers/functions/getData.js";
import { useAuth } from "@/app/providers/AuthProvider.jsx";

const KeyMetricsCard = ({ staff, staffId }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [financialMetrics, setMetrics] = useState({
    totalRevenue: 0,
    successRate: 0,
    leadsCounts: 0,
    successLeadsCount: 0,
    averageProjectValue: 0,
    totalCommission: 0,
    totalClreadCommission: 0,
    interactedLeads: 0,
    newLeadCounts: 0,
    inProgressLeadCounts: 0,
    interestedLeadCounts: 0,
    needsIdentifiedLeadCounts: 0,
    negotiatingLeadCounts: 0,
    rejectedLeadCounts: 0,
    finalizedLeadCounts: 0,
    convertedLeadCounts: 0,
    onHoldLeadCounts: 0,
    archivedLeadCounts: 0,
  });

  const metricsData = [
    {
      title: "Total leads",
      value: financialMetrics.leadsCounts,
      icon: <FaTasks size={24} color="#ffffff" />,
      color: theme.palette.info.main,
    },
    ...(staffId
      ? [
          {
            title: "Today interacted leads",
            value: financialMetrics.interactedLeads,
            icon: <FaTasks size={24} color="#ffffff" />,
            color: theme.palette.info.main,
          },
        ]
      : []),
    {
      title: "Total Success Leads",
      value: financialMetrics.successLeadsCount,
      icon: <FaTasks size={24} color="#ffffff" />,
      color: theme.palette.success.main,
    },
    {
      title: "Success Rate",
      value: `${financialMetrics.successRate}%`,
      icon: <FaChartLine size={24} color="#ffffff" />,
      color: theme.palette.success.main,
      isProgress: true,
    },
    {
      title: "Avg. lead Value",
      value: `AED ${financialMetrics.averageProjectValue.toLocaleString()}`,
      icon: <FaProjectDiagram size={24} color="#ffffff" />,
      color: theme.palette.secondary.main,
    },
    {
      title: "Total Revenue",
      value: `AED ${financialMetrics.totalRevenue.toLocaleString()}`,
      icon: <FaDollarSign size={24} color="#ffffff" />,
      color: theme.palette.primary.main,
    },
    {
      title: "Total Commission",
      value: `${financialMetrics.totalCommission}`,
      icon: <FaMoneyBillWave size={24} color="#ffffff" />,
      color: theme.palette.warning.main,
    },
    {
      title: "Total cleared Commission",
      value: `${financialMetrics.totalClreadCommission}`,
      icon: <FaMoneyBillWave size={24} color="#ffffff" />,
      color: theme.palette.warning.main,
    },
    // New lead status metrics
    {
      title: "New Leads",
      value: financialMetrics.newLeadCounts,
      icon: <FaTasks size={24} color="#ffffff" />,
      color: theme.palette.info.main,
    },
    {
      title: "In Progress Leads",
      value: financialMetrics.inProgressLeadCounts,
      icon: <FaTasks size={24} color="#ffffff" />,
      color: theme.palette.warning.main,
    },
    {
      title: "Interested Leads",
      value: financialMetrics.interestedLeadCounts,
      icon: <FaTasks size={24} color="#ffffff" />,
      color: theme.palette.success.main,
    },
    {
      title: "Needs Identified",
      value: financialMetrics.needsIdentifiedLeadCounts,
      icon: <FaTasks size={24} color="#ffffff" />,
      color: theme.palette.secondary.main,
    },
    {
      title: "Negotiating Leads",
      value: financialMetrics.negotiatingLeadCounts,
      icon: <FaTasks size={24} color="#ffffff" />,
      color: theme.palette.primary.main,
    },
    {
      title: "Rejected Leads",
      value: financialMetrics.rejectedLeadCounts,
      icon: <FaTasks size={24} color="#ffffff" />,
      color: theme.palette.error.main,
    },
    {
      title: "Finalized Leads",
      value: financialMetrics.finalizedLeadCounts,
      icon: <FaTasks size={24} color="#ffffff" />,
      color: theme.palette.success.main,
    },
    {
      title: "Converted Leads",
      value: financialMetrics.convertedLeadCounts,
      icon: <FaTasks size={24} color="#ffffff" />,
      color: theme.palette.success.main,
    },
    {
      title: "On Hold Leads",
      value: financialMetrics.onHoldLeadCounts,
      icon: <FaTasks size={24} color="#ffffff" />,
      color: theme.palette.warning.main,
    },
    {
      title: "Archived Leads",
      value: financialMetrics.archivedLeadCounts,
      icon: <FaTasks size={24} color="#ffffff" />,
      color: theme.palette.grey[600],
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
        url: `shared/dashboard/key-metrics?${extra}&${profile}`,
        setLoading,
      });
      if (request) setMetrics(request.data);
    }
    fetchData();
  }, []);

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
        <Typography
          variant={isMobile ? "h6" : "h5"}
          gutterBottom
          sx={{ fontWeight: "bold", color: "#333" }}
        >
          Key Metrics
        </Typography>
        <Grid container spacing={2}>
          {metricsData?.map((metric, index) => (
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
                  {metric.isProgress && (
                    <Box sx={{ width: "100%", mt: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={financialMetrics.successRate}
                        sx={{
                          height: 8,
                          borderRadius: 5,
                          backgroundColor: "#e0e0e0",
                          "& .MuiLinearProgress-bar": {
                            borderRadius: 5,
                            backgroundColor: theme.palette.success.main,
                          },
                        }}
                      />
                    </Box>
                  )}
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default KeyMetricsCard;
