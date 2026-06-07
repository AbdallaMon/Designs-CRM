"use client";

// Overview / details tab — read-only lead facts + the migrated booking-lead detail card
// (reused from features/leads). Mirrors the legacy "Details" tab's LeadInfo/Contact panels
// at a structural level (single Arabic). No mutations here.

import { Box, Chip, Divider, Grid, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import { BookingLeadDetailsCard } from "@/app/v2/features/leads";
import {
  statusLabel,
  paymentStatusLabel,
  categoryLabel,
} from "@/app/v2/features/leads/config/leadsConstants.js";

function Field({ label, value }) {
  return (
    <Box sx={{ p: 2, backgroundColor: "grey.50", borderRadius: 1 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
        {value ?? "—"}
      </Typography>
    </Box>
  );
}

export function OverviewTab({ lead }) {
  if (!lead) return null;
  return (
    <Stack spacing={3}>
      <Box>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }} alignItems="center" flexWrap="wrap">
          <Typography variant="h6">{lead?.client?.name ?? "—"}</Typography>
          <Chip size="small" label={`الحالة: ${statusLabel(lead.status)}`} color="secondary" variant="outlined" />
          <Chip size="small" label={`الدفع: ${paymentStatusLabel(lead.paymentStatus)}`} color="primary" variant="outlined" />
        </Stack>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Field label="التصنيف" value={categoryLabel(lead.selectedCategory)} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Field label="الموقع" value={lead.country || lead.emirate} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Field label="الهاتف" value={lead?.client?.phone} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Field label="البريد" value={lead?.client?.email} />
          </Grid>
          {lead.assignedTo && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Field
                label="مُسند إلى"
                value={`${lead.assignedTo.name}${lead.assignedAt ? ` — ${dayjs(lead.assignedAt).format("YYYY-MM-DD")}` : ""}`}
              />
            </Grid>
          )}
          {lead.description && (
            <Grid size={{ xs: 12 }}>
              <Field label="الوصف" value={lead.description} />
            </Grid>
          )}
        </Grid>
      </Box>
      <Divider />
      <BookingLeadDetailsCard lead={lead} />
    </Stack>
  );
}
