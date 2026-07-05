import React, { useEffect, useState } from "react";
import {
  alpha,
  Box,
  Button,
  Divider,
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

import { FaMoneyBillWave } from "react-icons/fa";
import { MdAttachFile } from "react-icons/md";
import SimpleFileInput from "../../../formComponents/SimpleFileInput";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import DeleteModelButton from "../../../common/DeleteModelButton";

import { uploadInChunks } from "@/app/helpers/functions/uploadAsChunk";
import { useUploadContext } from "@/app/providers/UploadingProgressProvider";

import { AddExtraService } from "../dialogs/AddExtraService";
import { SectionToolbar } from "../shared/SectionToolbar";
import { EmptyState } from "../shared/EmptyState";
import { useLeadDetails } from "../context/LeadDetailsContext";

export function ExtraServicesList({ admin, lead, notUser, setPayments }) {
  const details = useLeadDetails();
  const [extraServices, setExtraServices] = useState(lead.extraServices || []);
  const theme = useTheme();

  // Keep the list in sync with the core lead: after adding a service we refetch the core
  // lead (which carries the authoritative extraServices), so the optimistic item gets
  // reconciled with the real server record instead of requiring a manual page refresh.
  useEffect(() => {
    setExtraServices(lead?.extraServices || []);
  }, [lead?.extraServices]);

  const canCreate = lead?.capabilities
    ? Boolean(lead.capabilities.canAddPayment)
    : !notUser;

  return (
    <Stack spacing={3}>
      <SectionToolbar
        icon={<FaMoneyBillWave />}
        title="Extra Services"
        count={extraServices?.length || 0}
        countLabel="services"
        action={
          canCreate ? (
            <AddExtraService
              lead={lead}
              setExtraServices={setExtraServices}
              setPayments={setPayments}
              onAdded={() => details?.refetchCore?.()}
            />
          ) : null
        }
      />

      {!extraServices?.length ? (
        <EmptyState
          icon={<FaMoneyBillWave />}
          title="No extra services"
          description={
            !canCreate
              ? "There are no extra services for this lead."
              : "Add an extra service to bill additional work."
          }
        />
      ) : (
        <Stack spacing={2}>
          {extraServices.map((service) => (
            <Paper
              key={service.id}
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 2.5,
                border: `1px solid ${theme.palette.divider}`,
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  boxShadow: theme.shadows[3],
                  borderColor: alpha(theme.palette.primary.main, 0.4),
                },
              }}
            >
              <Stack spacing={2}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  {service.price ? (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Price
                      </Typography>
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        color="primary.main"
                      >
                        {service.price}
                      </Typography>
                    </Box>
                  ) : (
                    <Box />
                  )}
                  <DeleteModelButton
                    item={service}
                    model={"ExtraService"}
                    contentKey={service.note ? "note" : "price"}
                    onDelete={() => {
                      setExtraServices((oldServices) =>
                        oldServices.filter((s) => s.id !== service.id)
                      );
                    }}
                  />
                </Stack>
                {service.note && (
                  <>
                    <Divider />
                    <Box>
                      <Typography
                        variant="overline"
                        color="text.secondary"
                        sx={{ fontWeight: 700 }}
                      >
                        Note
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.primary"
                        sx={{ whiteSpace: "pre-wrap" }}
                      >
                        {service.note}
                      </Typography>
                    </Box>
                  </>
                )}
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

export function OurCostAndContractorCost({ lead, setLead }) {
  const { setLoading } = useToastContext();
  const { setAlertError } = useAlertContext();
  const { setProgress, setOverlay } = useUploadContext();
  const theme = useTheme();

  const handleUpload = async (file, type) => {
    if (!file) {
      setAlertError("Please select a file.");
      return;
    }

    setLoading(true);
    const fileUpload = await uploadInChunks(file, setProgress, setOverlay);

    if (fileUpload.status === 200) {
      const fileUrl = fileUpload.url;

      const updateData = {
        [type]: fileUrl,
      };

      const updateResponse = await handleRequestSubmit(
        updateData,
        setLoading,
        `shared/work-stages/${lead.id}/cost`,
        false,
        "Updating Lead",
        false,
        "PUT"
      );

      if (updateResponse.status === 200) {
        setLead((prevLead) => ({
          ...prevLead,
          [type]: fileUrl,
        }));
      }
    }
  };

  const CostRow = ({ label, value, type, color }) => (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      alignItems={{ xs: "flex-start", sm: "center" }}
      justifyContent="space-between"
      sx={{
        p: 2,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: alpha(theme.palette.background.default, 0.5),
      }}
    >
      <Typography variant="subtitle2" fontWeight={600}>
        {label}
      </Typography>
      {value ? (
        <Button
          href={value}
          target="_blank"
          variant="contained"
          color={color}
          startIcon={<MdAttachFile />}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          View File
        </Button>
      ) : (
        <SimpleFileInput
          label="File"
          id={type}
          handleUpload={(file) => handleUpload(file, type)}
          variant="outlined"
        />
      )}
    </Stack>
  );

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mt: 2,
        borderRadius: 2.5,
        border: `1px solid ${theme.palette.divider}`,
        borderLeft: `5px solid ${theme.palette.primary.main}`,
      }}
    >
      <Typography
        variant="h6"
        sx={{ mb: 2.5, fontWeight: 700, color: "primary.main" }}
      >
        Cost Documents
      </Typography>

      <Stack spacing={2}>
        <CostRow
          label="Our Cost"
          value={lead.ourCost}
          type="ourCost"
          color="primary"
        />
        <CostRow
          label="Contractor Cost"
          value={lead.contractorCost}
          type="contractorCost"
          color="success"
        />
      </Stack>
    </Paper>
  );
}
