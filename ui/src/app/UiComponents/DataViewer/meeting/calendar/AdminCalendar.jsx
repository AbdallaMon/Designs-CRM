"use client";
import { Box, Container, Paper, Tab, Tabs } from "@mui/material";
import { MdAdminPanelSettings, MdPerson } from "react-icons/md";
import { AdminBookingPanel } from "./Calendar";
import { useState } from "react";
import BigCalendar from "./BigCalendar";

const CalendarBookingSystem = () => {
  const [currentTab, setCurrentTab] = useState(0);

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Paper elevation={0} sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(e, newValue) => setCurrentTab(newValue)}
          variant="fullWidth"
        >
          <Tab
            icon={<MdAdminPanelSettings />}
            label="Admin booking calendar"
            iconPosition="start"
          />
          <Tab
            icon={<MdPerson />}
            label="Meeting & Calls calender"
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      <Box>{currentTab === 0 && <AdminBookingPanel />}</Box>
      <Box>{currentTab === 1 && <BigCalendar isAdmin={true} />}</Box>
    </Container>
  );
};

export default CalendarBookingSystem;
