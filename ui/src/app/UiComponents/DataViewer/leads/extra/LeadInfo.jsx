"use client";
import { Typography, Grid2 as Grid, useTheme } from "@mui/material";
import { InfoCard } from "./InfoCard";
import { FinalPriceCalc } from "./FinalPriceCalc";
import { BsBuilding } from "react-icons/bs";
import dayjs from "dayjs";
import { LeadCategory } from "@/app/helpers/constants";

export function LeadInfo({ lead }) {
  const theme = useTheme();
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
        <Grid size={{ xs: 12 }}>
          <Typography color="text.secondary" variant="caption">
            Description
          </Typography>
          <Typography variant="body1">{lead.description}</Typography>
        </Grid>
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
