"use client";
import { LEAD_STATUSES } from "@dms/shared";
import { Typography, Grid, Link, useTheme } from "@mui/material";
import { InfoCard } from "@/features/leads/core/InfoCard.jsx";
import { FinalPriceCalc } from "@/features/leads/core/FinalPriceCalc.jsx";
import { BsBuilding } from "react-icons/bs";
import dayjs from "dayjs";
import { LEAD_SOURCE_LABELS, LeadCategory } from "@/app/helpers/constants";
import { EditFieldButton } from "@/shared/components/common/EditFieldButton.jsx";
import { usePermission } from "@/app/hooks/usePermission.js";
import { ADMIN_RESIDUAL_CODES } from "@/app/helpers/permissionCodes.js";
import { applyLeadFieldUpdate } from "./leadFieldState.js";

function safeLeadSource(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export function LeadInfo({ lead, setleads, setLead }) {
  const theme = useTheme();
  const { hasPermission } = usePermission();
  const canEditLead = hasPermission(ADMIN_RESIDUAL_CODES.LEAD_EDIT);
  const sourceUrl = safeLeadSource(lead.source);

  function onUpdate(field, updatedEntity) {
    applyLeadFieldUpdate({
      leadId: lead.id,
      field,
      updatedEntity,
      setLead,
      setLeads: setleads,
    });
  }
  return (
    <InfoCard title="Lead Information" icon={BsBuilding} theme={theme}>
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography color="text.secondary" variant="caption">
            Category
          </Typography>
          <Typography variant="body1">
            {LeadCategory[lead.selectedCategory]}
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography color="text.secondary" variant="caption">
            Lead source
          </Typography>
          {sourceUrl ? (
            <Link
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ display: "block", overflowWrap: "anywhere" }}
            >
              {lead.source}
            </Link>
          ) : (
            <Typography variant="body1">Unknown</Typography>
          )}
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography color="text.secondary" variant="caption">
            Location
          </Typography>
          <Typography variant="body1">
            {lead.country ? lead.country : lead.emirate}
          </Typography>
        </Grid>
        <FinalPriceCalc lead={lead} />
        <Grid size={{ xs: 6 }}>
          <Typography color="text.secondary" variant="caption">
            Description
          </Typography>
          <Typography variant="body1">{lead.description}</Typography>
        </Grid>
        <Grid size={{ xs: 6 }}>
          <Typography color="text.secondary" variant="caption">
            Where did you know us?
          </Typography>
          <Typography variant="body1">
            {lead.discoverySource
              ? LEAD_SOURCE_LABELS[lead.discoverySource].ar
              : "Unknown"}
          </Typography>
        </Grid>
        {(lead.status === LEAD_STATUSES.FINALIZED || lead.status === "ARCHIVED") && (
          <Grid
            size={{ xs: 6 }}
            sx={{
              "& .MuiBox-root": {
                width: "100%",
              },
            }}
          >
            <EditFieldButton
              canEdit={canEditLead}
              path={`admin/leads/update/${lead.id}`}
              reqType="POST"
              field="finalizedDate"
              inputType="date"
              onUpdate={(data) => {
                onUpdate("finalizedDate", data);
              }}
            >
              <Typography color="text.secondary" variant="caption">
                Finalzed Date
              </Typography>
              <Typography variant="body1">
                {" "}
                {lead.finalizedDate
                  ? dayjs(lead.finalizedDate).format("DD-MM-YYYY")
                  : "Unknown"}
              </Typography>
            </EditFieldButton>
          </Grid>
        )}
        {lead.clientDescription && (
          <Grid size={{ xs: 12 }}>
            <Typography color="text.secondary" variant="caption">
              Client description
            </Typography>
            <Typography
              variant="body1"
              component="pre"
              sx={{ textWrap: "auto", wordBreak: "break-all" }}
            >
              {lead.clientDescription}
            </Typography>
          </Grid>
        )}
        {lead.timeToContact && (
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography color="text.secondary" variant="caption">
              Client selected time to contact
            </Typography>
            <Typography variant="body1">
              {dayjs(lead.timeToContact).format("DD-MM-YYYY, HH:mm")}
            </Typography>
          </Grid>
        )}
      </Grid>
    </InfoCard>
  );
}
