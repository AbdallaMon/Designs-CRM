// pages/dashboard.js
"use client";

import React, { useEffect, useState } from "react";
import { Grid2 as Grid, Typography, Box } from "@mui/material";

import LeadStatusChart from "@/app/UiComponents/DataViewer/dashbaord/LeadStatusChart.jsx";
import KeyMetricsCard from "@/app/UiComponents/DataViewer/dashbaord/KeyMetricsCard.jsx";
import CallRemindersCard from "@/app/UiComponents/DataViewer/dashbaord/CallRemindersList.jsx";
import IncomeOverTimeChart from "@/app/UiComponents/DataViewer/dashbaord/IncomeOverTimeChart.jsx";
import EmiratesAnalytics from "@/app/UiComponents/DataViewer/dashbaord/EmiratesAnalytics.jsx";
import PerformanceMetricsCard from "@/app/UiComponents/DataViewer/dashbaord/PerformanceMetrics.jsx";
import NewLeadsList from "@/app/UiComponents/DataViewer/dashbaord/NewLeadsList.jsx";
import RecentActivities from "@/app/UiComponents/DataViewer/dashbaord/RecenteActivity.jsx";
import UserProfile from "@/app/UiComponents/DataViewer/UserProfile.jsx";
import DesignerDashboard from "./designers/DesignerDashboard";
import FullScreenLoader from "../../feedback/loaders/FullscreenLoader";
import { getData } from "@/app/helpers/functions/getData";
import DesignerMetricsCard from "./designers/DesignerMatricsCard";

const Dashboard = ({ staff, staffId, userRole = "STAFF" }) => {
  const [role, setRole] = useState(userRole);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function getUserRole() {
      const userRequest = await getData({
        url: `shared/users/role/${staffId}?`,
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
        minHeight: "100vh",
        mb: "-60px",
        maxWidth: "1800px",
        mx: "auto",
      }}
    >
      {!staffId ? (
        <Typography
          variant="h4"
          sx={{ mb: 4, fontWeight: "bold", color: "#333" }}
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
