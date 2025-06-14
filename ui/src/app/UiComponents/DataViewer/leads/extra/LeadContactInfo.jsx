"use client";
import { Grid2 as Grid, Typography, useTheme } from "@mui/material";
import { InfoCard } from "./InfoCard";
import { EmailRedirect, WhatsAppRedirect } from "./Utility";
import { checkIfAdmin } from "@/app/helpers/functions/utility";
import { useAuth } from "@/app/providers/AuthProvider";
import dayjs from "dayjs";
import { BsPerson } from "react-icons/bs";
export function LeadContactInfo({ lead }) {
  const { user } = useAuth();

  const admin = checkIfAdmin(user);
  const theme = useTheme();
  return (
    <>
      {(lead.status === "NEW" || lead.status === "ON_HOLD") && !admin ? (
        ""
      ) : (
        <>
          <InfoCard title="Contact Information" icon={BsPerson} theme={theme}>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography color="text.secondary" variant="caption">
                  Client Name
                </Typography>
                <Typography variant="body1">{lead.client.name}</Typography>

                <WhatsAppRedirect lead={lead} />
                <Typography color="text.secondary" variant="caption">
                  Client Email
                </Typography>
                <EmailRedirect email={lead.client.email} />
              </Grid>
              {lead.assignedTo && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography color="text.secondary" variant="caption">
                    Assigned To
                  </Typography>
                  <Typography variant="body1">
                    {lead.assignedTo.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {lead.assignedTo.email}
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary">
                    Assigned at : {dayjs(lead.assignedAt).format("DD/MM/YYYY")}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </InfoCard>
        </>
      )}
    </>
  );
}
