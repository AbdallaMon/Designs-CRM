"use client";
import {
  Box,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { MdAdminPanelSettings, MdPerson } from "react-icons/md";
import { AdminBookingPanel } from "./Calendar";
import { useEffect, useState } from "react";
import { getData } from "@/app/helpers/functions/getData";
import BigCalendar from "./BigCalendar";
import { useRouter, useSearchParams } from "next/navigation";
function StaffAdminCalendar() {
  const [adminId, setAdminId] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const loadAdminUsers = async () => {
    const response = await getData({
      url: "shared/users/admins",
      setLoading: setLoadingAdmins,
    });

    if (response.status === 200) {
      setAdminUsers(response.data);
    }
  };
  useEffect(() => {
    loadAdminUsers();
  }, []);
  return (
    <>
      <FormControl fullWidth>
        <InputLabel id="admin-select-label">Select Admin *</InputLabel>
        <Select
          labelId="admin-select-label"
          value={adminId || ""}
          label="Select Admin *"
          onChange={(e) => setAdminId(e.target.value)}
          disabled={loadingAdmins}
          sx={{ borderRadius: 2 }}
        >
          {loadingAdmins ? (
            <MenuItem disabled>
              <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={16} />
                Loading admins...
              </Box>
            </MenuItem>
          ) : (
            adminUsers.map((admin) => (
              <MenuItem key={admin.id} value={admin.id}>
                <Box>
                  <Typography variant="body1">{admin.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {admin.email}
                  </Typography>
                </Box>
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>
      {adminId && <AdminBookingPanel type="STAFF" adminId={adminId} />}
    </>
  );
}
const StaffCalendarPanel = () => {
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
        <Tabs onChange={handleTabChange} value={currentTab} variant="fullWidth">
          <Tab
            icon={<MdAdminPanelSettings />}
            label="Your Booking calendar"
            iconPosition="start"
          />
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

      <Box>{currentTab === 1 && <StaffAdminCalendar />}</Box>
      <Box>{currentTab === 2 && <BigCalendar isAdmin={false} />}</Box>
    </Container>
  );
};

export default StaffCalendarPanel;
