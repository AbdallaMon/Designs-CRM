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
  Typography,
} from "@mui/material";

import React from "react";
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
import { MdCheck, MdHourglassEmpty, MdTimelapse } from "react-icons/md";
import CreateNewLead from "../extra/AddNewLead";
import NextMeetings from "../NextMeetings";

export default function NewLeadsPage({ searchParams, staff }) {
  const {
    data,
    loading,
    setData,
    page,
    setPage,
    limit,
    setLimit,
    total,
    totalPages,
    setFilters,
  } = useDataFetcher("shared/client-leads" + `?isNew=true&`, false, {
    clientId: searchParams.clientId ? searchParams.clientId : null,
  });

  return (
    <Container maxWidth="xxl">
      <FixedData />
      <CreateNewLead />
      <NonConsultedLeads />
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
      <NextCalls staff={staff} />
      <NextMeetings staff={staff} />
      <OnHoldLeads />
    </Container>
  );
}

export function LeadSliderCard({ lead, setData }) {
  const formattedDate = dayjs(lead.createdAt).format("YYYY-MM-DD");
  const { user } = useAuth();
  const { setLoading } = useToastContext();

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
        {user.role === "ADMIN" && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {lead.client.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {lead.client.phone}
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
          <Button
            component={Link}
            href={`/dashboard/deals/${lead.id}`}
            variant="contained"
            size="small"
            color="primary"
          >
            Preview
          </Button>
        </Box>
      </CardActions>
    </Card>
  );
}
