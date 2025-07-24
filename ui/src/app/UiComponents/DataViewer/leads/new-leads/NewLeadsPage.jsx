"use client";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  Container,
  Grid2 as Grid,
  IconButton,
  Paper,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";

import React, { useEffect, useState } from "react";
import ConfirmWithActionModel from "@/app/UiComponents/models/ConfirmsWithActionModel.jsx";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit.js";
import LeadsSlider from "@/app/UiComponents/DataViewer/slider/LeadsSlider.jsx";
import dayjs from "dayjs";
import Link from "next/link";
import OnHoldLeads from "@/app/UiComponents/DataViewer/leads/OnHoldLeads.jsx";
import NextCalls from "@/app/UiComponents/DataViewer/leads/NextCalls.jsx";
import { FixedData } from "@/app/UiComponents/DataViewer/leads/FixedData.jsx";
import { useAuth } from "@/app/providers/AuthProvider.jsx";
import { NonConsultedLeads } from "./Non-consulted-leads";
import UpdateInitialConsultButton from "@/app/UiComponents/buttons/UpdateInitialConsultLead";
import {
  MdCheck,
  MdHourglassEmpty,
  MdPreview,
  MdTimelapse,
} from "react-icons/md";
import CreateNewLead from "../extra/AddNewLead";
import NextMeetings from "../NextMeetings";
import { FaEye } from "react-icons/fa";
import PreviewDialog from "../PreviewLead";
import { checkIfAdmin } from "@/app/helpers/functions/utility";
import FloatingIdBadge from "../extra/IdBadge";
import SearchComponent from "@/app/UiComponents/formComponents/SearchComponent";
import ReminderButtons from "../extra/ReminderButtons";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import LoadingOverlay from "@/app/UiComponents/feedback/loaders/LoadingOverlay";
import { EmailRedirect, WhatsAppRedirect } from "../extra/Utility";
import { LeadCategory } from "@/app/helpers/constants";

export default function NewLeadsPage({ searchParams, staff, withSearch }) {
  const {
    data,
    loading,
    setData,
    page,
    setPage,
    filters,
    limit,
    setLimit,
    total,
    totalPages,
    setFilters,
  } = useDataFetcher("shared/client-leads" + `?isNew=true&`, false, {
    clientId: searchParams.clientId ? searchParams.clientId : null,
  });
  useEffect(() => {
    if (filters) {
      setPage(1);
    }
  }, [filters]);
  const { user } = useAuth();

  return (
    <Container maxWidth="xxl">
      <FixedData />
      <CreateNewLead />
      <NonConsultedLeads />
      <Box mb={2}>
        <SearchComponent
          apiEndpoint="search?model=clientLead"
          setFilters={setFilters}
          inputLabel="Search lead by id ,name or phone"
          renderKeys={["id", "client.name", "client.phone", "client.email"]}
          mainKey="id"
          searchKey={"id"}
          localFilters={{
            status: {
              in: ["NEW"],
            },
            initialConsult: true,
          }}
        />
      </Box>
      <LeadsSlider
        title="New leads"
        loading={loading}
        data={data}
        total={total}
        limit={limit}
        page={page}
        setLimit={setLimit}
        setPage={setPage}
        totalPages={totalPages}
      >
        {data?.map((lead) => (
          <LeadSliderCard lead={lead} key={lead.id} setData={setData} />
        ))}
      </LeadsSlider>
      {user.role !== "CONTACT_INITIATOR" && (
        <>
          <NextCalls staff={staff} />
          <NextMeetings staff={staff} />
        </>
      )}
      {user.role !== "CONTACT_INITIATOR" && <OnHoldLeads />}
      {user.role === "CONTACT_INITIATOR" && <SearchForALead />}
    </Container>
  );
}

export function LeadSliderCard({ lead, setData }) {
  const formattedDate = dayjs(lead.createdAt).format("YYYY-MM-DD");
  const { user } = useAuth();
  const { setLoading } = useToastContext();
  const [previewDialogOpen, setPreviewDialogOpen] = React.useState(false);
  const admin = checkIfAdmin(user);
  const isFullyPaid = lead.paymentStatus === "FULLY_PAID";

  async function createADeal(lead) {
    const assign = await handleRequestSubmit(
      lead,
      setLoading,
      `shared/client-leads`,
      false,
      "Assigning",
      false,
      "PUT"
    );
    if (assign.status === 200) {
      setData((data) => data.filter((l) => l.id !== lead.id));
    }
    return assign;
  }

  return (
    <Card
      sx={{
        boxShadow: isFullyPaid
          ? "0 0 0 2px #4caf50, 0 4px 10px rgba(0,0,0,0.12)"
          : 3,
        borderRadius: 2,
        padding: 2,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        transition: "transform 0.3s ease",
        position: "relative",
        backgroundColor: isFullyPaid ? "rgba(76, 175, 80, 0.05)" : "inherit",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 10,
          left: 10,
          // color: "white",
          borderRadius: 10,
          padding: "4px 10px",
          fontSize: "0.75rem",
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          gap: 0.5,
        }}
      >
        #{lead?.id.toString().padStart(7, "0")}
      </Box>
      <Box
        sx={{
          position: "absolute",
          top: 10,
          right: 10,
          backgroundColor: isFullyPaid ? "#4caf50" : "#9e9e9e",
          color: "white",
          borderRadius: 10,
          padding: "4px 10px",
          fontSize: "0.75rem",
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          gap: 0.5,
        }}
      >
        {isFullyPaid ? <MdCheck size={16} /> : <MdHourglassEmpty size={16} />}
        {lead.paymentStatus}
      </Box>

      <CardHeader
        title={""}
        titleTypographyProps={{
          variant: "h6",
          fontWeight: "bold",
          color: "text.primary",
        }}
        sx={{ paddingBottom: 0 }}
      />
      <CardContent
        sx={{
          paddingTop: 0,
          height: user.role === "ADMIN" ? "140px" : "100px",
          overflowY: "hidden",
        }}
      >
        {(user.role === "ADMIN" ||
          user.role === "SUPER_ADMIN" ||
          user.role === "CONTACT_INITIATOR") && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {lead.client.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {lead.client.phone}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {lead.client.email}
            </Typography>
          </>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          <strong>Created at:</strong> {formattedDate}
        </Typography>
        {lead.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={lead.description} // Tooltip for full description
          >
            <strong>Description:</strong> {lead.description}
          </Typography>
        )}
      </CardContent>

      <CardActions sx={{ justifyContent: "flex-end", gap: 1, paddingTop: 1.5 }}>
        {user.role === "STAFF" && (
          <ConfirmWithActionModel
            title="Are you sure you want to get this lead and assign it to you as a new deal?"
            handleConfirm={() => createADeal(lead)}
            label="Start a Deal"
            fullWidth={false}
            size="small"
            variant="outlined"
          />
        )}
        <Box display="flex" flexDirection="column" gap={2}>
          <UpdateInitialConsultButton clientLead={lead} />
          {user.role !== "CONTACT_INITIATOR" && (
            <Button
              sx={{
                display: "flex",
                gap: 1,
                justifyContent: "flex-start",
                width: "100%",
              }}
              onClick={() => {
                setPreviewDialogOpen(true);
              }}
              variant={"text"}
            >
              <MdPreview fontSize="small" sx={{ mr: 1 }} />
              Preview Details
            </Button>
          )}
          <Box sx={{ width: "100%" }}>
            <ReminderButtons lead={lead} clientLeadId={lead.id} />
          </Box>
        </Box>
      </CardActions>
      <PreviewDialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        setleads={setData}
        id={lead.id}
        admin={admin}
      />
    </Card>
  );
}

export function SearchForALead() {
  const [lead, setLead] = useState();
  const [loading, setLoading] = useState();
  const [filters, setFilters] = useState();
  const theme = useTheme();
  console.log(filters, "filters");
  async function getALead() {
    await getDataAndSet({
      url: `shared/client-leads/${filters.id}`,
      setLoading,
      setData: setLead,
    });
  }
  useEffect(() => {
    if (filters && filters?.id) {
      getALead();
    }
  }, [filters, filters?.id]);

  return (
    <Box
      sx={{
        width: "100%",
        margin: "auto",
        py: 1,
        pb: 3,
        background: theme.palette.background.default,
        position: "relative",
        mb: 2,
        borderRadius: 3, // Rounded corners
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)", // Subtle shadow
      }}
    >
      {loading && <LoadingOverlay />}
      <Typography variant="h5" sx={{ pl: 2, mb: 0.5 }}>
        Search in deals
      </Typography>
      <SearchComponent
        apiEndpoint="search?model=clientLead"
        setFilters={setFilters}
        inputLabel="Search lead by id ,name or phone"
        renderKeys={["id", "client.name", "client.phone", "client.email"]}
        mainKey="id"
        searchKey={"id"}
        withParamsChange={false}
      />
      {lead && <LeadCard lead={lead} />}
    </Box>
  );
}

function LeadCard({ lead }) {
  return (
    <Box
      sx={{
        p: 3,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        backgroundColor: "background.paper",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        transition: "box-shadow 0.2s ease-in-out",
        "&:hover": {
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
        },
      }}
    >
      {/* Header Section */}
      <Box
        sx={{ mb: 3, borderBottom: "1px solid", borderColor: "divider", pb: 2 }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1,
          }}
        >
          <Typography variant="h5" fontWeight={600} color="text.primary">
            {lead.client.name}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontFamily: "monospace",
              backgroundColor: "grey.100",
              px: 1,
              py: 0.5,
              borderRadius: 1,
            }}
          >
            #{lead.id.toString().padStart(7, "0")}
          </Typography>
        </Box>
        <Chip
          label={`Payment: ${lead.paymentStatus}`}
          color="primary"
          variant="outlined"
          size="small"
          sx={{ fontWeight: 500 }}
        />
        <Chip
          label={`Status: ${lead.status}`}
          color="secondary"
          variant="outlined"
          size="small"
          sx={{ fontWeight: 500 }}
        />
      </Box>

      {/* Lead Details Section */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h6"
          fontWeight={500}
          color="text.primary"
          sx={{ mb: 2 }}
        >
          Lead Details
        </Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ p: 2, backgroundColor: "grey.50", borderRadius: 1 }}>
              <Typography
                color="text.secondary"
                variant="caption"
                sx={{
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Category
              </Typography>
              <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                {LeadCategory[lead.selectedCategory]}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ p: 2, backgroundColor: "grey.50", borderRadius: 1 }}>
              <Typography
                color="text.secondary"
                variant="caption"
                sx={{
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Location
              </Typography>
              <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                {lead.country ? lead.country : lead.emirate}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Box sx={{ p: 2, backgroundColor: "grey.50", borderRadius: 1 }}>
              <Typography
                color="text.secondary"
                variant="caption"
                sx={{
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Description
              </Typography>
              <Typography variant="body1" sx={{ mt: 1, lineHeight: 1.6 }}>
                {lead.description}
              </Typography>
            </Box>
          </Grid>
          {lead.clientDescription && (
            <Grid size={{ xs: 12 }}>
              <Box sx={{ p: 2, backgroundColor: "grey.50", borderRadius: 1 }}>
                <Typography
                  color="text.secondary"
                  variant="caption"
                  sx={{
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Client Description
                </Typography>
                <Typography
                  variant="body1"
                  component="pre"
                  sx={{
                    textWrap: "auto",
                    wordBreak: "break-all",
                    mt: 1,
                    lineHeight: 1.6,
                    fontFamily: "inherit",
                  }}
                >
                  {lead.clientDescription}
                </Typography>
              </Box>
            </Grid>
          )}
          {lead.timeToContact && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ p: 2, backgroundColor: "grey.50", borderRadius: 1 }}>
                <Typography
                  color="text.secondary"
                  variant="caption"
                  sx={{
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Preferred Contact Time
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                  {dayjs(lead.timeToContact).format("DD-MM-YYYY, HH:mm")}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Contact Information Section */}
      <Box>
        <Typography
          variant="h6"
          fontWeight={500}
          color="text.primary"
          sx={{ mb: 2 }}
        >
          Contact Information
        </Typography>
        <Grid container spacing={3}>
          <Grid
            size={{ xs: 12, md: 6 }}
            sx={{
              "& .MuiBox-root": {
                width: "100%",
              },
            }}
          >
            <Box
              sx={{
                p: 2,
                backgroundColor: "primary.50",
                borderRadius: 1,
                border: "1px solid",
                borderColor: "primary.200",
              }}
            >
              <Typography
                color="text.secondary"
                variant="caption"
                sx={{
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Client Name
              </Typography>
              <Typography
                variant="body1"
                sx={{ mt: 0.5, fontWeight: 500, mb: 2 }}
              >
                {lead.client.name}
              </Typography>

              <Box sx={{ mb: 2 }}>
                <WhatsAppRedirect lead={lead} />
              </Box>

              <Box>
                <Typography
                  color="text.secondary"
                  variant="caption"
                  sx={{
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Client Email
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <EmailRedirect email={lead.client.email} />
                </Box>
              </Box>
            </Box>
          </Grid>

          {lead.assignedTo && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  p: 2,
                  backgroundColor: "success.50",
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "success.200",
                }}
              >
                <Typography
                  color="text.secondary"
                  variant="caption"
                  sx={{
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    mb: 1,
                    display: "block",
                  }}
                >
                  Assigned To
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
                  {lead.assignedTo.name}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  {lead.assignedTo.email}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontStyle: "italic" }}
                >
                  Assigned: {dayjs(lead.assignedAt).format("DD/MM/YYYY")}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>
    </Box>
  );
}
