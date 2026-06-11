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
import { InProgressCall } from "@/app/UiComponents/DataViewer/leads/widgets/InProgressCall.jsx";
import Link from "next/link.js";
import { hideMoreData } from "@/app/helpers/functions/utility.js";

export default function NextCalls({ staff, designer = false }) {
  const { user } = useAuth();

  const { data, loading, page, setPage, limit, setLimit, total, totalPages } =
    useDataFetcher(
      designer
        ? "shared/work-stages/calls"
        : "shared/client-leads/calls" + `?staffId=${staff && user.id}&`,
      false
    );

  return (
    <LeadsSlider
      title="Upcomming calls"
      loading={loading}
      total={total}
      limit={limit}
      page={page}
      setLimit={setLimit}
      setPage={setPage}
      totalPages={totalPages}
      NextCalls={true}
    >
      {data?.map((call) => (
        <NextCall call={call} key={call.id} designer={designer} />
      ))}
    </LeadsSlider>
  );
}
function NextCall({ call, designer }) {
  return (
    <Card>
      <CardContent>
        <Box>
          <Typography variant="h6" component="div">
            {call.clientLead.client.name}
          </Typography>
        </Box>
        <Typography variant="body2">
          Reason: {hideMoreData(call.reminderReason) || "N/A"}
        </Typography>
        <InProgressCall call={call} simple={true} />
        <CardActions>
          <Button
            component={Link}
            href={
              designer
                ? `/dashboard/work-stages/${call.clientLead.id}`
                : `/dashboard/deals/${call.clientLead.id}`
            }
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
