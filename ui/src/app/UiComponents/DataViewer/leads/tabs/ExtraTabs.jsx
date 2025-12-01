import React, { useEffect, useState, useMemo } from "react";
import { Box, Chip, Paper, Stack, Typography, useTheme } from "@mui/material";

import { Card, CardContent, List, ListItem } from "@mui/material";

import { Grid, Button } from "@mui/material";
import { FaMoneyBillWave } from "react-icons/fa";
import { MdAttachFile } from "react-icons/md";
import SimpleFileInput from "../../../formComponents/SimpleFileInput";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import DeleteModelButton from "../../../inline-actions/DeleteModelButton";

import { uploadInChunks } from "@/app/helpers/functions/uploadAsChunk";
import { useUploadContext } from "@/app/providers/UploadingProgressProvider";

import { AddExtraService } from "../dialogs/AddExtraService";

export function ExtraServicesList({ admin, lead, notUser, setPayments }) {
  const [extraServices, setExtraServices] = useState(lead.extraServices);
  const theme = useTheme();

  const cardStyles = {
    height: "100%",
    boxShadow: theme.shadows[1],
    position: "relative",
    p: 2,
  };

  const listItemStyles = {
    borderRadius: 1,
    mb: 2,
    bgcolor: "background.paper",
    "&:hover": {
      bgcolor: theme.palette.grey[50],
      transition: "background-color 0.2s ease-in-out",
    },
  };

  const iconStyles = {
    color: theme.palette.primary.main,
    marginRight: theme.spacing(1),
    fontSize: "1.2rem",
  };
  return (
    <Card sx={cardStyles}>
      {!notUser && (
        <AddExtraService
          lead={lead}
          setExtraServices={setExtraServices}
          setPayments={setPayments}
        />
      )}

      <CardContent>
        <Box display="flex" alignItems="center" mb={3}>
          <FaMoneyBillWave style={{ ...iconStyles, fontSize: "1.5rem" }} />
          <Typography variant="h5" component="h2" color="primary">
            Extra services
          </Typography>
          <Chip
            label={`${extraServices?.length || 0} services`}
            size="small"
            sx={{ ml: 2 }}
            color="primary"
          />
        </Box>

        <List>
          {extraServices?.map((service) => (
            <ListItem key={service.id} sx={listItemStyles} disablePadding>
              <Box sx={{ width: "100%", p: 2 }}>
                <Grid container spacing={3}>
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
                  {service.note && (
                    <Grid size={{ xs: 12, md: 12 }}>
                      <Box display="flex" alignItems="center">
                        <Box>
                          <Typography variant="subtitle2" color="textSecondary">
                            Note
                          </Typography>
                          <Typography component="pre" textWrap="wrap">
                            {service.note}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                  {service.price && (
                    <Grid size={{ xs: 12, md: 12 }}>
                      <Box display="flex" alignItems="center">
                        <Box>
                          <Typography variant="subtitle2" color="textSecondary">
                            Price
                          </Typography>
                          <Typography component="pre" textWrap="wrap">
                            {service.price}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}

export function OurCostAndContractorCost({ lead, setLead }) {
  const { setLoading } = useToastContext();
  const { setAlertError } = useAlertContext();
  const { setProgress, setOverlay } = useUploadContext();

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

  return (
    <Paper sx={{ p: 3, mt: 2, borderLeft: "6px solid #1976d2" }}>
      <Typography
        variant="h6"
        sx={{ mb: 2, fontWeight: "bold", color: "#1976d2" }}
      >
        Cost Documents
      </Typography>

      <Stack spacing={3}>
        {/* Our Cost */}
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="body1">Our Cost:</Typography>
          {lead.ourCost ? (
            <Button
              href={lead.ourCost}
              target="_blank"
              variant="contained"
              color="primary"
              startIcon={<MdAttachFile />}
            >
              View File
            </Button>
          ) : (
            <>
              <SimpleFileInput
                label="File"
                id="file"
                handleUpload={(file) => handleUpload(file, "ourCost")}
                variant="outlined"
              />
            </>
          )}
        </Box>

        {/* Contractor Cost */}
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="body1">Contractor Cost:</Typography>
          {lead.contractorCost ? (
            <Button
              href={lead.contractorCost}
              target="_blank"
              variant="contained"
              color="success"
              startIcon={<MdAttachFile />}
            >
              View File
            </Button>
          ) : (
            <>
              <SimpleFileInput
                label="File"
                id="file"
                handleUpload={(file) => handleUpload(file, "contractorCost")}
                variant="outlined"
              />
            </>
          )}
        </Box>
      </Stack>
    </Paper>
  );
}
