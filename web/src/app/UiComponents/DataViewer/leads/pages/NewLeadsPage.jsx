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
  Grid,
  IconButton,
  Paper,
  Stack,
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
import OnHoldLeads from "@/app/UiComponents/DataViewer/leads/pages/OnHoldLeads.jsx";
import NextCalls from "@/app/UiComponents/DataViewer/leads/widgets/NextCalls.jsx";
import { FixedData } from "@/app/UiComponents/DataViewer/leads/widgets/FixedData.jsx";
import { useAuth } from "@/app/providers/AuthProvider.jsx";
import { NonConsultedLeads } from "./NonConsultedLeads";
import UpdateInitialConsultButton from "@/app/UiComponents/buttons/UpdateInitialConsultLead";
import { MdCheck, MdHourglassEmpty, MdPreview } from "react-icons/md";
import CreateNewLead from "../features/AddNewLead";
import NextMeetings from "../widgets/NextMeetings";
import PreviewDialog from "../PreviewLeadDialog";
import { checkIfAdmin } from "@/app/helpers/functions/utility";
import SearchComponent from "@/app/UiComponents/formComponents/SearchComponent";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import LoadingOverlay from "@/app/UiComponents/feedback/loaders/LoadingOverlay";
import { EmailRedirect, WhatsAppRedirect } from "../core/Utility";
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
    <Container maxWidth="xxl" sx={{ py: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        {/* Page header */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 3 },
            borderRadius: 3,
            border: 1,
            borderColor: "divider",
            background: (t) =>
              `linear-gradient(135deg, ${t.palette.primary.main}14 0%, ${t.palette.background.paper} 60%)`,
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", md: "center" }}
            spacing={2}
          >
            <Box>
              <Typography variant="h4" fontWeight={800} color="text.primary">
                Leads
              </Typography>
              <Typography variant="body2" color="text.secondary">
                New, unconsulted and on-hold leads — pick one up and start a deal.
              </Typography>
            </Box>
            <Box sx={{ flexShrink: 0 }}>
              <CreateNewLead />
            </Box>
          </Stack>

          <Box sx={{ mt: 2.5 }}>
            <SearchComponent
              apiEndpoint="search?model=clientLead"
              setFilters={setFilters}
              inputLabel="Search lead by id, name or phone"
              renderKeys={["id", "client.name", "client.phone", "client.email"]}
              mainKey="id"
              searchKey={"id"}
              localFilters={{
                status: { in: ["NEW"] },
                initialConsult: true,
              }}
            />
          </Box>
        </Paper>

        {/* Needs attention — unconsulted leads */}
        <NonConsultedLeads />

        {/* New leads */}
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

        {/* Upcoming activity */}
        {user.role !== "CONTACT_INITIATOR" && (
          <>
            <NextCalls staff={staff} />
            <NextMeetings staff={staff} />
          </>
        )}

        {/* On-hold pool */}
        {user.role !== "CONTACT_INITIATOR" && <OnHoldLeads />}

        {/* Targets / fixed data */}
        <FixedData />

        {/* Admin: look up any lead */}
        <SearchForALead />
      </Stack>
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

  const showContact =
    user.role === "ADMIN" ||
    user.role === "SUPER_ADMIN" ||
    user.role === "CONTACT_INITIATOR" ||
    user.isSuperSales;

  return (
    <Card
      sx={{
        width: 280,
        borderRadius: 3,
        border: 1,
        borderColor: isFullyPaid ? "success.main" : "divider",
        borderLeft: 4,
        borderLeftColor: isFullyPaid ? "success.main" : "primary.main",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "none",
        transition: "box-shadow .2s ease, transform .2s ease",
        bgcolor: isFullyPaid ? "rgba(76,175,80,0.04)" : "background.paper",
        "&:hover": { boxShadow: 4, transform: "translateY(-2px)" },
      }}
    >
      <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1, flex: 1 }}>
        {/* id + payment */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
          <Chip
            size="small"
            label={`#${lead?.id.toString().padStart(7, "0")}`}
            sx={{ fontFamily: "monospace", fontWeight: 700, borderRadius: 1.5 }}
          />
          <Chip
            size="small"
            icon={isFullyPaid ? <MdCheck size={14} /> : <MdHourglassEmpty size={14} />}
            label={lead.paymentStatus}
            color={isFullyPaid ? "success" : "default"}
            variant={isFullyPaid ? "filled" : "outlined"}
            sx={{ fontWeight: 700, borderRadius: 1.5 }}
          />
        </Stack>

        {/* identity / contact */}
        {showContact && (
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={700} color="text.primary" noWrap>
              {lead.client.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {lead.client.phone}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {lead.client.email}
            </Typography>
          </Box>
        )}

        <Typography variant="caption" color="text.secondary">
          Created {formattedDate}
        </Typography>

        {lead.description && (
          <Typography
            variant="body2"
            color="text.primary"
            title={lead.description}
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {lead.description}
          </Typography>
        )}
      </Box>

      {/* actions */}
      <Box
        sx={{
          p: 1.5,
          pt: 0,
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        {user.role === "STAFF" && !user.isSuperSales && (
          <ConfirmWithActionModel
            title="Are you sure you want to get this lead and assign it to you as a new deal?"
            handleConfirm={() => createADeal(lead)}
            label="Start a Deal"
            fullWidth={true}
            size="small"
            variant="contained"
          />
        )}
        <UpdateInitialConsultButton clientLead={lead} />
        {user.role !== "CONTACT_INITIATOR" && (
          <Button
            fullWidth
            onClick={() => setPreviewDialogOpen(true)}
            variant="outlined"
            size="small"
            startIcon={<MdPreview />}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Preview details
          </Button>
        )}
      </Box>
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
  const { user } = useAuth();
  const isAdmin = checkIfAdmin(user);
  const theme = useTheme();
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
  if (!isAdmin) return;
  return (
    <Box
      sx={{
        width: "100%",
        margin: "auto",
        py: 1,
        pb: 3,
        background: theme.palette.background.default,
        position: "relative",
        mb: 10,
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
  const { user } = useAuth();
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
          {user.role === "ADMIN" || user.role === "SUPER_ADMIN" ? (
            <Button
              variant="text"
              color="text.secondary"
              component="a"
              href={`/dashboard/deals/${lead.id}`}
              sx={{
                fontFamily: "monospace",
                backgroundColor: "grey.100",
                px: 1,
                py: 0.5,
                borderRadius: 1,
              }}
            >
              #{lead.id.toString().padStart(7, "0")}
            </Button>
          ) : (
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
          )}
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
