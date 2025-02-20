"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Button, Typography, CircularProgress, Box } from "@mui/material";
import { getData } from "@/app/helpers/functions/getData";
import { BiRefresh } from "react-icons/bi";

dayjs.extend(relativeTime);
dayjs.locale("en");
export default function LastSeen({ userId, initialLastSeen }) {
  const [lastSeen, setLastSeen] = useState(initialLastSeen);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const interval = setInterval(fetchLastSeen, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchLastSeen = async () => {
    try {
      const res = await getData({
        url: `admin/users/${userId}/last-seen`,
        setLoading,
      });
      setLastSeen(res.lastSeenAt);
    } catch (error) {
      console.error("Failed to fetch last seen", error);
    }
  };

  const updateLastSeen = async () => {
    await fetchLastSeen();
  };

  const isOnline = lastSeen && dayjs().diff(dayjs(lastSeen), "minute") < 5;

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Typography variant="body2" color={isOnline ? "green" : "gray"}>
        {isOnline ? "Online" : `Last seen: ${dayjs(lastSeen).fromNow()}`}
      </Typography>
      <Button
        onClick={updateLastSeen}
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
