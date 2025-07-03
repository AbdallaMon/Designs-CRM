"use client";
import { Box, Container, Paper, Tab, Tabs } from "@mui/material";
import { MdAdminPanelSettings, MdPerson } from "react-icons/md";
import { AdminBookingPanel } from "./Calendar";
import { useState } from "react";
import BigCalendar from "./BigCalendar";
import { useRouter, useSearchParams } from "next/navigation";

const CalendarBookingSystem = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const getInitialTab = () => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      const tabIndex = parseInt(tabParam, 10);
      // Validate that the tab index is within valid range
      if (!isNaN(tabIndex) && tabIndex >= 0) {
        return tabIndex;
      }
    }
    return 0; // Default to first tab
  };
  const [currentTab, setCurrentTab] = useState(getInitialTab());

  useEffect(() => {
    const tabFromURL = getInitialTab();
    if (tabFromURL !== currentTab) {
      setCurrentTab(tabFromURL);
    }
  }, [searchParams]);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);

    // Update URL search params
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", newValue.toString());

    // Use replace to avoid creating new history entries for each tab change
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Paper elevation={0} sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange} variant="fullWidth">
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
