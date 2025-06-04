"use client";
import { useAuth } from "@/app/providers/AuthProvider.jsx";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher.js";
import LeadsSlider from "@/app/UiComponents/DataViewer/slider/LeadsSlider.jsx";
import React from "react";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Typography,
} from "@mui/material";
import { InProgressCall } from "@/app/UiComponents/DataViewer/leads/InProgressCall.jsx";
import Link from "next/link.js";
import { hideMoreData } from "@/app/helpers/functions/utility.js";

export default function NextMeetings({ staff }) {
  const { user } = useAuth();

  const { data, loading, page, setPage, limit, setLimit, total, totalPages } =
    useDataFetcher(
      "shared/client-leads/meetings" + `?staffId=${staff && user.id}&`,
      false
    );

  return (
    <LeadsSlider
      title="Upcomming meetings"
      loading={loading}
      total={total}
      limit={limit}
      page={page}
      setLimit={setLimit}
      setPage={setPage}
      totalPages={totalPages}
      NextCalls={true}
    >
      {data?.map((meeting) => (
        <NextMeeting meeting={meeting} key={meeting.id} />
      ))}
    </LeadsSlider>
  );
}
function NextMeeting({ meeting }) {
  return (
    <Card>
      <CardContent>
        <Box>
          <Typography variant="h6" component="div">
            {meeting.clientLead.client.name}
          </Typography>
        </Box>
        <Typography variant="body2">
          Reason: {hideMoreData(meeting.reminderReason) || "N/A"}
        </Typography>
        <InProgressCall call={meeting} type="MEETING" simple={true} />
        <CardActions>
          <Button
            component={Link}
            href={`/dashboard/deals/${meeting.clientLead.id}`}
            variant="contained"
            size="small"
            color="primary"
            fullWidth
          >
            Preview
          </Button>
        </CardActions>
      </CardContent>
    </Card>
  );
}
