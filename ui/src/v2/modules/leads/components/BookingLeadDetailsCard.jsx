import {
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import {
  BOOKING_LEAD_FIELD_LABELS,
  BOOKING_LEAD_FIELDS,
} from "../constants/bookingLeadFieldLabels";

function formatValue(fieldKey, value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (fieldKey === "bookingSubmittedAt") {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString();
  }

  if (fieldKey === "bookingRequestStatus") {
    return String(value).replace(/_/g, " ");
  }

  return String(value);
}

export default function BookingLeadDetailsCard({ lead }) {
  if (!lead) {
    return null;
  }

  const statusValue = formatValue(
    "bookingRequestStatus",
    lead.bookingRequestStatus,
  );

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
        >
          <Typography variant="h6">Booking Details</Typography>
          <Chip
            size="small"
            color={
              lead.bookingRequestStatus === "SUBMITTED" ? "success" : "default"
            }
            label={statusValue}
          />
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          {BOOKING_LEAD_FIELDS.map((fieldKey) => (
            <Grid size={{ xs: 12, md: 6 }} key={fieldKey}>
              <Typography variant="caption" color="text.secondary">
                {BOOKING_LEAD_FIELD_LABELS[fieldKey] || fieldKey}
              </Typography>
              <Typography
                variant="body2"
                sx={{ mt: 0.5, wordBreak: "break-word" }}
              >
                {formatValue(fieldKey, lead[fieldKey])}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}
