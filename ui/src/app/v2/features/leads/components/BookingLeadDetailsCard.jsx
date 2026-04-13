import {
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import {
  BOOKING_LEAD_FIELD_LABELS,
  BOOKING_LEAD_FIELDS,
  BOOKING_LEAD_VALUE_LABELS,
} from "../constants/bookingLeadFieldLabels";

function formatValue(fieldKey, value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (fieldKey === "bookingSubmittedAt") {
    const d = dayjs(value);
    return d.isValid() ? d.format("DD/MM/YYYY HH:mm") : String(value);
  }

  const fieldMap = BOOKING_LEAD_VALUE_LABELS[fieldKey];
  if (fieldMap) {
    return fieldMap[value] ?? String(value);
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
          <Typography variant="h6">تفاصيل الحجز</Typography>
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
