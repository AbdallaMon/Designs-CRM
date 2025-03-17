"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Button, Typography, CircularProgress, Box } from "@mui/material";
import { BiRefresh } from "react-icons/bi";
import { getData } from "@/app/helpers/functions/getData";

dayjs.extend(relativeTime);
dayjs.locale("en");

export default function LastSeen({ userId, initialLastSeen, accountant }) {
  const [userLog, setUserLog] = useState(initialLastSeen);
  const [loading, setLoading] = useState(true); // Start with loading state

  // Function to fetch last seen data
  const fetchLastSeen = async () => {
    setLoading(true);
    try {
      const res = await getData({
        url: accountant
          ? `accountant/users/${userId}/last-seen`
          : `admin/users/${userId}/last-seen`,
        setLoading,
      });
      setUserLog(res);
    } catch (error) {
      console.error("Failed to fetch last seen", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Fetch data immediately on component mount
    fetchLastSeen();

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
  return (
    <Box display="flex" alignItems="center" gap={1}>
      {loading ? (
        <CircularProgress size={20} />
      ) : (
        <>
          <Typography variant="body2" color={isOnline ? "green" : "gray"}>
            {isOnline
              ? "Online"
              : `Last seen: ${dayjs(userLog.lastSeenAt).fromNow()}`}
          </Typography>
          <Typography variant="body2" color={isOnline ? "green" : "gray"}>
            {`Total hours: ${userLog.totalHours}`}
          </Typography>
          <Typography variant="body2" color={isOnline ? "green" : "gray"}>
            {`Month hours: ${userLog.totalMonthHours}`}
          </Typography>
        </>
      )}
      <Button
        onClick={fetchLastSeen}
        variant="outlined"
        size="small"
        startIcon={<BiRefresh />}
        disabled={loading}
      >
        {loading ? <CircularProgress size={20} /> : "Refresh"}
      </Button>
    </Box>
  );
}
