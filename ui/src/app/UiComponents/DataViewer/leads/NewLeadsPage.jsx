"use client";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
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
      <OnHoldLeads />
    </Container>
  );
}

export function LeadSliderCard({ lead, setData }) {
  const formattedDate = dayjs(lead.createdAt).format("YYYY-MM-DD");
  const { user } = useAuth();
  const { setLoading } = useToastContext();
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
        boxShadow: 3,
        borderRadius: 2,
        padding: 2,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        transition: "transform 0.3s ease",
      }}
    >
      {/* Card Header */}
      <CardHeader
        title={lead.client.name}
        titleTypographyProps={{
          variant: "h6",
          fontWeight: "bold",
          color: "text.primary",
        }}
        sx={{ paddingBottom: 0 }}
      />

      {/* Card Content */}
      <CardContent sx={{ paddingTop: 0, height: "100px", overflowY: "hidden" }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          <strong>Email:</strong> {lead.client.email}
        </Typography>
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

      {/* Card Actions */}
      <CardActions sx={{ justifyContent: "flex-end", gap: 1, paddingTop: 1.5 }}>
        {user.role === "STAFF" && (
          <ConfirmWithActionModel
            title="Are you sure you want to get this lead and assign it to you as a new deal?"
            handleConfirm={() => createADeal(lead)}
            label="Start a Deal"
            fullWidth={false} // Adjust to fit nicely within the card
            size="small"
            variant="outlined" // Outlined style for better contrast
          />
        )}
        <Button
          component={Link}
          href={`/dashboard/deals/${lead.id}`}
          variant="contained"
          size="small"
          color="primary"
        >
          Preview
        </Button>
      </CardActions>
    </Card>
  );
}
