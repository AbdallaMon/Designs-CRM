// pages/dashboard.js
"use client";

import React, { useEffect, useState } from "react";
import { Grid, Typography, Box } from "@mui/material";

import LeadStatusChart from "@/features/dashboard/LeadStatusChart.jsx";
import KeyMetricsCard from "@/features/dashboard/KeyMetricsCard.jsx";
import CallRemindersCard from "@/features/dashboard/CallRemindersList.jsx";
import IncomeOverTimeChart from "@/features/dashboard/IncomeOverTimeChart.jsx";
import EmiratesAnalytics from "@/features/dashboard/EmiratesAnalytics.jsx";
import PerformanceMetricsCard from "@/features/dashboard/PerformanceMetrics.jsx";
import NewLeadsList from "@/features/dashboard/NewLeadsList.jsx";
import RecentActivities from "@/features/dashboard/RecentActivity.jsx";
import UserProfile from "@/features/users/UserProfile.jsx";
import DesignerDashboard from "@/features/dashboard/designers/DesignerDashboard.jsx";
import FullScreenLoader from "@/shared/components/feedback/loaders/FullscreenLoader.jsx";
import { getData } from "@/app/helpers/functions/getData";
import LeadsMonthlyOverviewSingle from "@/features/dashboard/LeadsMonthlyOverviewSingle.jsx";

const Dashboard = ({ staff, staffId, userRole = "STAFF" }) => {
  const [role, setRole] = useState(userRole);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function getUserRole() {
      const userRequest = await getData({
        url: `shared/utilities/users/role/${staffId}?`,
        setLoading,
      });
      if (userRequest && userRequest.status === 200) {
        setRole(userRequest.data.role);
      }
    }

    if (staffId) {
      getUserRole();
    } else {
      setLoading(false);
    }
  }, [staffId]);
  if (loading) return <FullScreenLoader />;
  return (
    <Box
      sx={{
        padding: { xs: 2, md: 4 },
        // minHeight: "100vh",
        maxWidth: "1800px",
        mx: "auto",
      }}
    >
      {!staffId ? (
        <Typography
          variant="h4"
          sx={{ mb: 4, fontWeight: "bold", color: "text.primary" }}
        >
          Dashboard
        </Typography>
      ) : (
        <>
          <UserProfile id={staffId} role={role} />
        </>
      )}
      {role === "THREE_D_DESIGNER" || role === "TWO_D_DESIGNER" ? (
        <DesignerDashboard staff={staff} staffId={staffId} />
      ) : (
        <Grid container spacing={4}>
          <Grid size={12}>
            <KeyMetricsCard staff={staff} staffId={staffId} />
          </Grid>
          {!staff && (
            <Grid size={{ xs: 12, md: 12 }}>
              <LeadsMonthlyOverviewSingle staff={staff} staffId={staffId} />
            </Grid>
          )}
          <Grid size={{ xs: 12, md: 6 }}>
            <LeadStatusChart staff={staff} staffId={staffId} />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            {staff ? (
              <CallRemindersCard />
            ) : (
              <RecentActivities staffId={staffId} />
            )}
          </Grid>
          {!staffId && (
            <>
              <Grid size={{ xs: 12, md: 6 }}>
                <PerformanceMetricsCard staff={staff} staffId={staffId} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <NewLeadsList />
              </Grid>
            </>
          )}
          <Grid size={12}>
            <IncomeOverTimeChart staff={staff} staffId={staffId} />
          </Grid>

          <Grid size={12}>
            <EmiratesAnalytics staff={staff} staffId={staffId} />
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Dashboard;
