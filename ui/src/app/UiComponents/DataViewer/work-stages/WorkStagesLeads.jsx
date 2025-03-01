"use client";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Container,
  Typography,
} from "@mui/material";
import LeadsSlider from "../slider/LeadsSlider";
import ConfirmWithActionModel from "../../models/ConfirmsWithActionModel";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher";
import dayjs from "dayjs";
import { useAuth } from "@/app/providers/AuthProvider";
import Link from "next/link";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import NextCalls from "../leads/NextCalls";

export default function NewWrokstagesLeadsPage({
  searchParams,
  staff,
  nextCall,
  type,
}) {
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
  } = useDataFetcher(`shared/work-stages/new?type=${type}&`, false, {
    clientId: searchParams.clientId ? searchParams.clientId : null,
  });

  return (
    <Container maxWidth="xxl">
      <LeadsSlider
        title="Available leads"
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
          <WorkStageLeadSliderCard
            lead={lead}
            key={lead.id}
            setData={setData}
          />
        ))}
      </LeadsSlider>
      {nextCall && <NextCalls staff={staff} designer={true} />}
    </Container>
  );
}

function WorkStageLeadSliderCard({ lead, setData }) {
  const formattedDate = dayjs(lead.createdAt).format("YYYY-MM-DD");
  const { user } = useAuth();
  const { setLoading } = useToastContext();
  const type = user.role === "THREE_D_DESIGNER" ? "three-d" : "two-d";
  async function createADeal(lead) {
    const assign = await handleRequestSubmit(
      lead,
      setLoading,
      `shared/work-stages/assign?type=${type}&`,
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
        title={""}
        titleTypographyProps={{
          variant: "h6",
          fontWeight: "bold",
          color: "text.primary",
        }}
        sx={{ paddingBottom: 0 }}
      />
      <CardContent sx={{ paddingTop: 0, height: "100px", overflowY: "hidden" }}>
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
            title={lead.description}
          >
            <strong>Description:</strong> {lead.description}
          </Typography>
        )}
      </CardContent>

      {/* Card Actions */}
      <CardActions sx={{ justifyContent: "flex-end", gap: 1, paddingTop: 1.5 }}>
        {user.role !== "ADMIN" && (
          <ConfirmWithActionModel
            title="Are you sure you want to get this lead and assign it to you as a new work stage?"
            handleConfirm={() => createADeal(lead)}
            label="Start a work stage"
            fullWidth={false} // Adjust to fit nicely within the card
            size="small"
            variant="outlined" // Outlined style for better contrast
          />
        )}
        <Button
          component={Link}
          href={
            user.role === "ADMIN"
              ? `/dashboard/work-stages/${type}/${lead.id}`
              : `/dashboard/work-stages/${lead.id}`
          }
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
