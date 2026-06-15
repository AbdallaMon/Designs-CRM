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
  alpha,
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
import { formatCurrency } from "@/app/helpers/functions/utility";

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

  // Emphasized financial KPIs — money metrics get the prominent top row.
  const financialTiles = [
    {
      title: "Total Revenue",
      value: formatCurrency(financialMetrics.totalRevenue),
      icon: <FaDollarSign size={28} color={theme.palette.primary.contrastText} />,
      color: theme.palette.primary.main,
    },
    {
      title: "Total Commission",
      value: formatCurrency(financialMetrics.totalCommission),
      icon: (
        <FaMoneyBillWave size={28} color={theme.palette.warning.contrastText} />
      ),
      color: theme.palette.warning.main,
    },
    {
      title: "Total cleared Commission",
      value: formatCurrency(financialMetrics.totalClreadCommission),
      icon: (
        <FaMoneyBillWave size={28} color={theme.palette.warning.contrastText} />
      ),
      color: theme.palette.warning.dark,
    },
    {
      title: "Avg. lead Value",
      value: formatCurrency(financialMetrics.averageProjectValue),
      icon: (
        <FaProjectDiagram
          size={28}
          color={theme.palette.secondary.contrastText}
        />
      ),
      color: theme.palette.secondary.main,
    },
  ];

  // Secondary, lower-emphasis metrics — counts, rates and per-status lead tallies.
  const secondaryTiles = [
    {
      title: "Total leads",
      value: financialMetrics.leadsCounts,
      icon: <FaTasks size={24} color={theme.palette.info.contrastText} />,
      color: theme.palette.info.main,
    },
    ...(staffId
      ? [
          {
            title: "Today interacted leads",
            value: financialMetrics.interactedLeads,
            icon: <FaTasks size={24} color={theme.palette.info.contrastText} />,
            color: theme.palette.info.main,
          },
        ]
      : []),
    {
      title: "Total Success Leads",
      value: financialMetrics.successLeadsCount,
      icon: <FaTasks size={24} color={theme.palette.success.contrastText} />,
      color: theme.palette.success.main,
    },
    {
      title: "Success Rate",
      value: `${financialMetrics.successRate}%`,
      icon: <FaChartLine size={24} color={theme.palette.success.contrastText} />,
      color: theme.palette.success.main,
      isProgress: true,
    },
    // New lead status metrics
    {
      title: "New Leads",
      value: financialMetrics.newLeadCounts,
      icon: <FaTasks size={24} color={theme.palette.info.contrastText} />,
      color: theme.palette.info.main,
    },
    {
      title: "In Progress Leads",
      value: financialMetrics.inProgressLeadCounts,
      icon: <FaTasks size={24} color={theme.palette.warning.contrastText} />,
      color: theme.palette.warning.main,
    },
    {
      title: "Interested Leads",
      value: financialMetrics.interestedLeadCounts,
      icon: <FaTasks size={24} color={theme.palette.success.contrastText} />,
      color: theme.palette.success.main,
    },
    {
      title: "Needs Identified",
      value: financialMetrics.needsIdentifiedLeadCounts,
      icon: <FaTasks size={24} color={theme.palette.secondary.contrastText} />,
      color: theme.palette.secondary.main,
    },
    {
      title: "Negotiating Leads",
      value: financialMetrics.negotiatingLeadCounts,
      icon: <FaTasks size={24} color={theme.palette.primary.contrastText} />,
      color: theme.palette.primary.main,
    },
    {
      title: "Rejected Leads",
      value: financialMetrics.rejectedLeadCounts,
      icon: <FaTasks size={24} color={theme.palette.error.contrastText} />,
      color: theme.palette.error.main,
    },
    {
      title: "Finalized Leads",
      value: financialMetrics.finalizedLeadCounts,
      icon: <FaTasks size={24} color={theme.palette.success.contrastText} />,
      color: theme.palette.success.main,
    },
    {
      title: "Converted Leads",
      value: financialMetrics.convertedLeadCounts,
      icon: <FaTasks size={24} color={theme.palette.success.contrastText} />,
      color: theme.palette.success.main,
    },
    {
      title: "On Hold Leads",
      value: financialMetrics.onHoldLeadCounts,
      icon: <FaTasks size={24} color={theme.palette.warning.contrastText} />,
      color: theme.palette.warning.main,
    },
    {
      title: "Archived Leads",
      value: financialMetrics.archivedLeadCounts,
      icon: <FaTasks size={24} color={theme.palette.grey[600]} />,
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
          sx={{ fontWeight: "bold", color: "text.primary" }}
        >
          Key Metrics
        </Typography>

        {/* Emphasized financial KPIs */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {financialTiles.map((metric, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={`fin-${index}`}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  p: 2.5,
                  height: "100%",
                  boxShadow: 3,
                  borderRadius: 2,
                  bgcolor: "background.paper",
                  borderInlineStart: 4,
                  borderColor: metric.color,
                  background: (t) =>
                    `linear-gradient(135deg, ${alpha(
                      metric.color,
                      0.1
                    )} 0%, ${t.palette.background.paper} 60%)`,
                  transition: "transform 0.3s, box-shadow 0.3s",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: 8,
                  },
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: metric.color,
                    width: 64,
                    height: 64,
                    marginInlineEnd: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {metric.icon}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ color: "text.secondary" }}
                  >
                    {metric.title}
                  </Typography>
                  <Typography
                    variant={isMobile ? "h6" : "h5"}
                    sx={{
                      fontWeight: "bold",
                      color: "text.primary",
                      wordBreak: "break-word",
                    }}
                  >
                    {metric.value}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Secondary, denser metrics grid */}
        <Grid container spacing={1.5}>
          {secondaryTiles.map((metric, index) => (
            <Grid size={{ xs: 6, sm: 4, md: 3 }} key={`sec-${index}`}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  p: 1.5,
                  height: "100%",
                  boxShadow: 1,
                  borderRadius: 2,
                  bgcolor: "background.paper",
                  transition: "transform 0.3s, box-shadow 0.3s",
                  "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow: 4,
                  },
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: metric.color,
                    width: 40,
                    height: 40,
                    marginInlineEnd: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {metric.icon}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", display: "block" }}
                  >
                    {metric.title}
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: "bold", color: "text.primary" }}
                  >
                    {metric.value}
                  </Typography>
                  {metric.isProgress && (
                    <Box sx={{ width: "100%", mt: 0.5 }}>
                      <LinearProgress
                        variant="determinate"
                        value={financialMetrics.successRate}
                        sx={{
                          height: 6,
                          borderRadius: 5,
                          bgcolor: "action.disabledBackground",
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
