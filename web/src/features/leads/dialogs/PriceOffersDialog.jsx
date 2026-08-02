"use client";
import React, { useEffect, useState } from "react";
import {
  alpha,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { BsPlus } from "react-icons/bs";
import { FaMoneyBillWave } from "react-icons/fa";
import { useAlertContext } from "@/app/providers/MuiAlert.jsx";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit.js";
import { useAuth } from "@/app/providers/AuthProvider.jsx";
import { useToastContext } from "@/app/providers/ToastLoadingProvider.js";
import SimpleFileInput from "@/shared/components/formComponents/SimpleFileInput.jsx";
import dayjs from "dayjs";
import { MdDelete } from "react-icons/md";
import AddPayments from "@/features/leads/payments/AddPayments.jsx";

import utc from "dayjs/plugin/utc";

import { uploadInChunks } from "@/app/helpers/functions/uploadAsChunk";
import { useUploadContext } from "@/app/providers/UploadingProgressProvider";
import { OpenButton } from "@/features/leads/dialogs/OpenButton.jsx";

dayjs.extend(utc);

export const AddPriceOffers = ({
  lead,
  type = "button",
  children,
  setPriceOffers,
}) => {
  const [priceOffer, setPriceOffer] = useState({
    note: null,
    file: null,
  });
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { setLoading } = useToastContext();
  const { setAlertError } = useAlertContext();
  const { setProgress, setOverlay } = useUploadContext();
  const theme = useTheme();

  function handleOpen() {
    setOpen(true);
  }
  function onClose() {
    setPriceOffer({ minPrice: 0, maxPrice: 0 });
    setOpen(false);
  }
  const handleAddNewPriceOffer = async () => {
    if (!priceOffer.note) {
      setAlertError("You must enter note");
      return;
    }
    if (priceOffer.file) {
      const fileUpload = await uploadInChunks(
        priceOffer.file,
        setProgress,
        setOverlay
      );
      if (fileUpload.status === 200) {
        priceOffer.url = fileUpload.url;
      } else {
        return;
      }
    }
    const request = await handleRequestSubmit(
      {
        priceOffer,
        userId: user.id,
      },
      setLoading,
      `leads/${lead.id}/price-offers`,
      false,
      "Adding"
    );
    if (request.status === 200) {
      if (setPriceOffers) {
        setPriceOffers((oldPrices) => [request.data, ...oldPrices]);
      }
      setOpen(false);
    }
  };

  return (
    <>
      {type === "button" ? (
        <Button
          onClick={handleOpen}
          variant="contained"
          startIcon={<BsPlus size={20} />}
          sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 600 }}
        >
          Add New Offer
        </Button>
      ) : (
        <OpenButton handleOpen={handleOpen}>{children}</OpenButton>
      )}
      {open && (
        <Dialog
          open={open}
          onClose={onClose}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ borderBottom: 1, borderColor: "divider", py: 2.5 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                  color: theme.palette.primary.main,
                  fontSize: 18,
                }}
              >
                <FaMoneyBillWave />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                  New Price Offer
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Add a note and optionally attach a document
                </Typography>
              </Box>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ "&.MuiDialogContent-root": { pt: 4 } }}>
            <Stack spacing={3}>
              <TextField
                label="Note"
                value={priceOffer.note}
                onChange={(e) =>
                  setPriceOffer({ ...priceOffer, note: e.target.value })
                }
                fullWidth
                multiline
                minRows={3}
                placeholder="Describe the price offer..."
                InputLabelProps={{ shrink: true }}
              />
              <SimpleFileInput
                label="File"
                id="file"
                setData={setPriceOffer}
                variant="outlined"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: 1, borderColor: "divider" }}>
            <Button
              onClick={onClose}
              variant="outlined"
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddNewPriceOffer}
              variant="contained"
              color="primary"
              sx={{ textTransform: "none", fontWeight: 600, px: 3 }}
            >
              Add Offer
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};
