"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  Button,
  Typography,
  CircularProgress,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import { BiRefresh, BiTime, BiCalendar } from "react-icons/bi";
import { MdExpandMore } from "react-icons/md";
import { getData } from "@/app/helpers/functions/getData";
import timezone from "dayjs/plugin/timezone"; // Import the timezone plugin
import utc from "dayjs/plugin/utc"; // Import the UTC plugin

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.locale("en");
const renderTimeInUAE = (time) => {
  return dayjs(time).tz("Asia/Dubai").format("HH:mm"); // Format time in HH:mm format for UAE time zone
};
export default function UserLastSeen({ userId, initialLastSeen, accountant }) {
  const [userLog, setUserLog] = useState(initialLastSeen);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [logsData, setLogsData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month() + 1); // 1-indexed month
  const [selectedYear, setSelectedYear] = useState(dayjs().year());

  // Function to fetch last seen data
  const fetchLastSeen = async (month, year) => {
    try {
      const res = await getData({
        url: accountant
          ? `accountant/users/${userId}/last-seen?month=${month}&year=${year}`
          : `admin/users/${userId}/last-seen?month=${month}&year=${year}`,
        setLoading,
      });
      setUserLog(res);
      setLogsData(res);
    } catch (error) {
      console.error("Failed to fetch last seen", error);
    }
  };

  // Function to fetch monthly logs

  // Open modal and fetch logs
  const handleOpenModal = async () => {
    setModalOpen(true);
    await fetchLastSeen(selectedMonth, selectedYear);
  };

  // Close modal
  const handleCloseModal = () => {
    setModalOpen(false);
  };

  // Handle month change
  const handleMonthChange = (event) => {
    const newMonth = event.target.value;
    setSelectedMonth(newMonth);
    fetchLastSeen(newMonth, selectedYear);
  };

  // Handle year change
  const handleYearChange = (event) => {
    const newYear = event.target.value;
    setSelectedYear(newYear);
    fetchLastSeen(selectedMonth, newYear);
  };

  useEffect(() => {
    fetchLastSeen(selectedMonth, selectedYear);

    // Set interval to update every 5 minutes
    const interval = setInterval(() => {
      fetchLastSeen();
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      clearInterval(interval);
    };
  }, [userId]);

  const isOnline =
    userLog &&
    userLog.lastSeenAt &&
    dayjs().diff(dayjs(userLog.lastSeenAt), "minute") < 5;

  // Generate years array (current year and 2 years back)
  const currentYear = dayjs().year();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  return (
    <>
      <Box display="flex" alignItems="center" gap={1}>
        {loading ? (
          <CircularProgress size={20} />
        ) : (
          <>
            <Typography variant="body2" color={isOnline ? "green" : "gray"}>
              {isOnline
                ? "Online"
                : `Last seen: ${
                    userLog && dayjs(userLog.lastSeenAt).fromNow()
                  }`}
            </Typography>
          </>
        )}
        <Button
          onClick={() => fetchLastSeen(selectedMonth, selectedYear)}
          variant="outlined"
          size="small"
          startIcon={<BiRefresh />}
          disabled={loading}
        >
          {loading ? <CircularProgress size={20} /> : "Refresh"}
        </Button>

        <Button
          variant="outlined"
          size="small"
          startIcon={<BiCalendar />}
          onClick={handleOpenModal}
        >
          Monthly Logs
        </Button>
      </Box>

      {/* Logs Modal */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">User Activity Logs</Typography>
            <Box display="flex" gap={2}>
              <FormControl size="small" style={{ minWidth: 100 }}>
                <InputLabel>Month</InputLabel>
                <Select
                  value={selectedMonth}
                  onChange={handleMonthChange}
                  label="Month"
                >
                  <MenuItem value={1}>January</MenuItem>
                  <MenuItem value={2}>February</MenuItem>
                  <MenuItem value={3}>March</MenuItem>
                  <MenuItem value={4}>April</MenuItem>
                  <MenuItem value={5}>May</MenuItem>
                  <MenuItem value={6}>June</MenuItem>
                  <MenuItem value={7}>July</MenuItem>
                  <MenuItem value={8}>August</MenuItem>
                  <MenuItem value={9}>September</MenuItem>
                  <MenuItem value={10}>October</MenuItem>
                  <MenuItem value={11}>November</MenuItem>
                  <MenuItem value={12}>December</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" style={{ minWidth: 100 }}>
                <InputLabel>Year</InputLabel>
                <Select
                  value={selectedYear}
                  onChange={handleYearChange}
                  label="Year"
                >
                  {years.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : logsData ? (
            <>
              <Paper elevation={2} sx={{ p: 2, mb: 3, bgcolor: "#f8f9fa" }}>
                <Typography variant="h6" gutterBottom>
                  Monthly Summary
                </Typography>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  flexWrap="wrap"
                >
                  <Typography variant="body1">
                    Total Hours This Month:{" "}
                    <strong>{logsData.totalMonthHours} hours</strong>
                  </Typography>
                  <Typography variant="body1">
                    Last Seen:{" "}
                    <strong>
                      {dayjs(logsData.lastSeenAt).format("MMM DD, YYYY h:mm A")}
                    </strong>
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  {logsData.logs?.length || 0} active days logged
                </Typography>
              </Paper>

              {!logsData.logs || logsData.logs.length === 0 ? (
                <Typography
                  variant="body1"
                  color="text.secondary"
                  align="center"
                  p={4}
                >
                  No activity logs found for this month.
                </Typography>
              ) : (
                logsData.logs.map((dayLog) => (
                  <Accordion key={dayLog.date}>
                    <AccordionSummary expandIcon={<MdExpandMore />}>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        width="100%"
                        alignItems="center"
                      >
                        <Typography>
                          <BiCalendar
                            style={{
                              verticalAlign: "middle",
                              marginRight: "8px",
                            }}
                          />
                          {dayLog.formattedDate}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <BiTime
                            style={{
                              verticalAlign: "middle",
                              marginRight: "4px",
                            }}
                          />
                          {dayLog.totalHours} hours
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense disablePadding>
                        {dayLog.entries.map((entry, index) => (
                          <Box key={entry.id || index}>
                            <ListItem>
                              <ListItemText
                                primary={entry.description}
                                secondary={
                                  <>
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      component="span"
                                      display="block"
                                    >
                                      {renderTimeInUAE(entry.time)}
                                    </Typography>
                                    <Typography
                                      variant="subtitle2"
                                      component="span"
                                      display="block"
                                    >
                                      <strong>Total hours :</strong>
                                      {entry.totalHours}
                                    </Typography>
                                  </>
                                }
                              />
                            </ListItem>
                            {index < dayLog.entries.length - 1 && (
                              <Divider component="li" />
                            )}
                          </Box>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                ))
              )}
            </>
          ) : (
            <Typography variant="body1" color="error" align="center" p={4}>
              Failed to load logs. Please try again.
            </Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseModal} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
