"use client";
import { LEAD_STATUSES } from "@dms/shared";
import { Box, Grid, Typography, useTheme } from "@mui/material";
import { InfoCard } from "@/features/leads/core/InfoCard.jsx";
import { EmailRedirect, WhatsAppRedirect } from "@/features/leads/core/Utility.jsx";
import { checkIfAdmin } from "@/app/helpers/functions/utility";
import { useAuth } from "@/app/providers/AuthProvider";
import dayjs from "dayjs";
import { BsPerson } from "react-icons/bs";
import { EditFieldButton } from "@/shared/components/common/EditFieldButton.jsx";
import { usePermission } from "@/app/hooks/usePermission.js";
import { ADMIN_RESIDUAL_CODES } from "@/app/helpers/permissionCodes.js";
import { applyLeadFieldUpdate } from "./leadFieldState.js";
export function LeadContactInfo({ lead, setleads, setLead }) {
  const { user } = useAuth();

  const admin = checkIfAdmin(user);
  const theme = useTheme();
  const { hasPermission } = usePermission();
  const canEditClient = hasPermission(ADMIN_RESIDUAL_CODES.CLIENT_EDIT);

  function onUpdate(field, updatedEntity) {
    applyLeadFieldUpdate({
      leadId: lead.id,
      field,
      section: "client",
      updatedEntity,
      setLead,
      setLeads: setleads,
    });
  }
  return (
    <>
      {(lead.status === LEAD_STATUSES.NEW || lead.status === LEAD_STATUSES.ON_HOLD) && !admin ? (
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
                    canEdit={canEditClient}
                    path={`admin/client/update/${lead.client.id}`}
                    reqType="PUT"
                    field="name"
                    onUpdate={(data) => {
                      onUpdate("name", data);
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
                    canEdit={canEditClient}
                    path={`admin/client/update/${lead.client.id}`}
                    reqType="PUT"
                    field="phone"
                    onUpdate={(data) => {
                      onUpdate("phone", data);
                    }}
                  >
                    <WhatsAppRedirect lead={lead} />
                  </EditFieldButton>
                </Box>
                <Box width="100%">
                  {/* <EditFieldButton
                    path={`admin/client/update/${lead.client.id}`}
                    reqType="PUT"
                    field="email"
                    onUpdate={(data) => {
                      onUpdate("email", "Client", data);
                    }}
                  > */}
                  <Typography color="text.secondary" variant="caption">
                    Client Email
                  </Typography>
                  <EmailRedirect email={lead.client.email} />
                  {/* </EditFieldButton> */}
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
