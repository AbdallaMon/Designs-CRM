"use client";
import { Box, Grid, Typography, useTheme } from "@mui/material";
import { InfoCard } from "./InfoCard";
import { EmailRedirect, WhatsAppRedirect } from "./Utility";
import { checkIfAdmin } from "@/app/helpers/functions/utility";
import { useAuth } from "@/app/providers/AuthProvider";
import dayjs from "dayjs";
import { BsPerson } from "react-icons/bs";
import { EditFieldButton } from "./EditFieldButton";
export function LeadContactInfo({ lead, setleads, setLead }) {
  const { user } = useAuth();

  const admin = checkIfAdmin(user);
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
    <>
      {(lead.status === "NEW" || lead.status === "ON_HOLD") && !admin ? (
        ""
      ) : (
        <>
          <InfoCard title="Contact Information" icon={BsPerson} theme={theme}>
            <Grid container spacing={4}>
              <Grid
                size={{ xs: 12, md: 6 }}
                sx={{
                  "& .MuiBox-root": {
                    width: "100%",
                  },
                }}
              >
                <Box>
                  <EditFieldButton
                    path={`admin/client/update/${lead.client.id}`}
                    reqType="PUT"
                    field="name"
                    onUpdate={(data) => {
                      onUpdate("name", "Client", data);
                    }}
                  >
                    <Typography color="text.secondary" variant="caption">
                      Client Name
                    </Typography>

                    <Typography variant="body1">{lead.client.name}</Typography>
                  </EditFieldButton>
                </Box>
                <Box width="100%">
                  <EditFieldButton
                    path={`admin/client/update/${lead.client.id}`}
                    reqType="PUT"
                    field="phone"
                    onUpdate={(data) => {
                      onUpdate("phone", "Client", data);
                    }}
                  >
                    <WhatsAppRedirect lead={lead} />
                  </EditFieldButton>
                </Box>
                <Box width="100%">
                  <EditFieldButton
                    path={`admin/client/update/${lead.client.id}`}
                    reqType="PUT"
                    field="email"
                    onUpdate={(data) => {
                      onUpdate("email", "Client", data);
                    }}
                  >
                    <Typography color="text.secondary" variant="caption">
                      Client Email
                    </Typography>
                    <EmailRedirect email={lead.client.email} />
                  </EditFieldButton>
                </Box>
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
