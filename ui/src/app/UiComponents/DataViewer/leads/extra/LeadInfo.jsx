"use client";
import { Typography, Grid2 as Grid, useTheme } from "@mui/material";
import { InfoCard } from "./InfoCard";
import { FinalPriceCalc } from "./FinalPriceCalc";
import { BsBuilding } from "react-icons/bs";
import dayjs from "dayjs";
import { LEAD_SOURCE_LABELS, LeadCategory } from "@/app/helpers/constants";
import { EditFieldButton } from "./EditFieldButton";

export function LeadInfo({ lead, setleads, setLead }) {
  const theme = useTheme();
  function onUpdate(item, type, data) {
    const update = type
      ? {
          [type]: { ...lead[type], [item]: data[item] },
        }
      : {
          [item]: data[item],
        };
    if (setLead) {
      setLead((oldLead) => ({
        ...oldLead,
        update,
      }));
    }
    if (setleads) {
      setleads((oldLeads) =>
        oldLeads.map((l) => {
          if (l.id === lead.id) {
            return {
              ...lead,
              update,
            };
          } else {
            return l;
          }
        })
      );
    }
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
        {(lead.status === "FINALIZED" || lead.status === "ARCHIVED") && (
          <Grid
            size={{ xs: 6 }}
            sx={{
              "& .MuiBox-root": {
                width: "100%",
              },
            }}
          >
            <EditFieldButton
              path={`admin/leads/update/${lead.id}`}
              reqType="POST"
              field="finalizedDate"
              inputType="date"
              onUpdate={(data) => {
                onUpdate("finalizedDate", null, data);
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
