// pages/dashboard.js
"use client";

import React from 'react';
import {
    Grid2 as Grid,
    Typography,
    Box,

} from "@mui/material";

import LeadStatusChart from "@/app/UiComponents/DataViewer/dashbaord/LeadStatusChart.jsx";
import KeyMetricsCard from "@/app/UiComponents/DataViewer/dashbaord/KeyMetricsCard.jsx";
import CallRemindersCard from "@/app/UiComponents/DataViewer/dashbaord/CallRemindersList.jsx";
import IncomeOverTimeChart from "@/app/UiComponents/DataViewer/dashbaord/IncomeOverTimeChart.jsx";
import EmiratesAnalytics from "@/app/UiComponents/DataViewer/dashbaord/EmiratesAnalytics.jsx";
import PerformanceMetricsCard from "@/app/UiComponents/DataViewer/dashbaord/PerformanceMetrics.jsx";
import NewLeadsList from "@/app/UiComponents/DataViewer/dashbaord/NewLeadsList.jsx";
import RecentActivities from "@/app/UiComponents/DataViewer/dashbaord/RecenteActivity.jsx";




const Dashboard = ({staff}) => {
    return (
          <Box sx={{ padding: {xs:2,md:4}, backgroundColor: '#f0f2f5', minHeight: '100vh',mb:"-60px",maxWidth:"1800px",mx:"auto" }}>
              <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#333' }}>
                  Dashboard
              </Typography>

              <Grid container spacing={4}>
                  <Grid size={12}>
                      <KeyMetricsCard   staff={staff}/>
                  </Grid>

                  <Grid size={{xs:12,md:6}}>
                      <LeadStatusChart staff={staff}/>
                  </Grid>

                  <Grid size={{xs:12,md:6}}>
                      {staff?
                      <CallRemindersCard />
                            :
                            <RecentActivities />
                      }
                  </Grid>
                  <Grid size={{xs:12,md:6}}>
                      <PerformanceMetricsCard  staff={staff}/>
                  </Grid>

                  <Grid size={{xs:12,md:6}}>
                      <NewLeadsList />
                  </Grid>
                  <Grid size={12}>
                      <IncomeOverTimeChart  staff={staff}/>
                  </Grid>

                  <Grid size={12}>
                      <EmiratesAnalytics staff={staff}/>
                  </Grid>



              </Grid>
          </Box>
    );
};

export default Dashboard;
