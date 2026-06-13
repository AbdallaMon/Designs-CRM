"use client";
import React, { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
} from "@mui/material";
import { BsPlus } from "react-icons/bs";
import { useAlertContext } from "@/app/providers/MuiAlert.jsx";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit.js";
import { useAuth } from "@/app/providers/AuthProvider.jsx";
import { useToastContext } from "@/app/providers/ToastLoadingProvider.js";
import SimpleFileInput from "@/app/UiComponents/formComponents/SimpleFileInput.jsx";
import dayjs from "dayjs";
import { MdDelete } from "react-icons/md";
import AddPayments from "../payments/AddPayments";

import utc from "dayjs/plugin/utc";

import { uploadInChunks } from "@/app/helpers/functions/uploadAsChunk";
import { useUploadContext } from "@/app/providers/UploadingProgressProvider";
import { OpenButton } from "./OpenButton";

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
      `shared/client-leads/${lead.id}/price-offers`,
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
          sx={{ alignSelf: "flex-start" }}
        >
          Add New Offer
        </Button>
      ) : (
        <OpenButton handleOpen={handleOpen}>{children}</OpenButton>
      )}
      {open && (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ borderBottom: 1, borderColor: "divider" }}>
            New Price Offer
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField
                label="Note"
                value={priceOffer.note}
                onChange={(e) =>
                  setPriceOffer({ ...priceOffer, note: e.target.value })
                }
                fullWidth
                multiline
                rows={3}
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
          <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
            <Button onClick={onClose} variant="outlined">
              Cancel
            </Button>
            <Button
              onClick={handleAddNewPriceOffer}
              variant="contained"
              color="primary"
            >
              Add
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};
