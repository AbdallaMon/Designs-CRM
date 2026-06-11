"use client";

// Overview / details tab — read-only lead facts + the migrated booking-lead detail card
// (reused from features/leads). The hub header above already shows the lead name + status +
// payment chips, so this tab no longer repeats them — it leads with the FACTS, grouped into
// two labelled sub-sections inside SectionCards: "معلومات الاتصال" and "تفاصيل الطلب".
// No mutations here. Single Arabic / RTL.

import { Box, Divider, Grid, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import { BookingLeadDetailsCard } from "@/app/v2/features/leads";
import { SectionCard } from "@/app/v2/shared/components";
import { useT } from "@/app/v2/lib/i18n";
import {
  categoryLabel,
} from "@/app/v2/features/leads/config/leadsConstants.js";

function Field({ label, value }) {
  return (
    <Box sx={{ p: 2, backgroundColor: "action.hover", borderRadius: 1 }}>
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
  const { t } = useT();
  if (!lead) return null;
  return (
    <Stack spacing={3}>
      <SectionCard title={t("leadsDetails.overview.contact")}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Field label={t("leadsDetails.overview.phone")} value={lead?.client?.phone} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Field label={t("leadsDetails.overview.email")} value={lead?.client?.email} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Field label={t("leadsDetails.overview.location")} value={lead.country} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Field label={t("leadsDetails.overview.emirate")} value={lead.emirate} />
          </Grid>
        </Grid>
      </SectionCard>

      <SectionCard title={t("leadsDetails.overview.request")}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Field label={t("leadsDetails.overview.category")} value={categoryLabel(lead.selectedCategory)} />
          </Grid>
          {lead.assignedTo && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Field
                label={t("leadsDetails.overview.assignedTo")}
                value={`${lead.assignedTo.name}${lead.assignedAt ? ` — ${dayjs(lead.assignedAt).format("YYYY-MM-DD")}` : ""}`}
              />
            </Grid>
          )}
          {lead.description && (
            <Grid size={{ xs: 12 }}>
              <Field label={t("leadsDetails.overview.description")} value={lead.description} />
            </Grid>
          )}
        </Grid>
      </SectionCard>

      <Divider />
      <BookingLeadDetailsCard lead={lead} />
    </Stack>
  );
}

export default OverviewTab;
