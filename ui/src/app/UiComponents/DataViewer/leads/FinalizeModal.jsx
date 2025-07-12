import React, { useEffect, useState } from "react";
import { useAlertContext } from "@/app/providers/MuiAlert.jsx";
import { useToastContext } from "@/app/providers/ToastLoadingProvider.js";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit.js";
import {
  Alert,
  Box,
  Button,
  Modal,
  TextField,
  Typography,
} from "@mui/material";
import { simpleModalStyle } from "@/app/helpers/constants.js";
import { useAuth } from "@/app/providers/AuthProvider.jsx";

export function FinalizeModal({
  open,
  setOpen,
  id,
  setleads,
  setId,
  setLead,
  setAnchorEl,
  updatePrice,
  lead,
  onUpdate,
}) {
  const [price, setPrice] = useState(lead.priceWithOutDiscount);
  const [discount, setDiscount] = useState(lead.discount);
  const [priceNote, setPriceNote] = useState(lead.priceNote);
  const [averagePrice, setAveragePrice] = useState(lead.averagePrice);
  const { setAlertError } = useAlertContext();
  const { setLoading } = useToastContext();
  const { user } = useAuth();
  useEffect(() => {
    if (discount >= 0 && price > 0) {
      const discountValue = (price * discount) / 100;
      setAveragePrice(price - discountValue);
    }
  }, [discount, price]);
  async function submit() {
    if (!price || price <= 0) {
      setAlertError("Please enter a valid price agreed upon by the client.");
      return;
    }
    const request = await handleRequestSubmit(
      {
        status: "FINALIZED",
        averagePrice,
        updatePrice,
        discount: discount,
        priceWithOutDiscount: price,
        oldStatus: lead.status,
        isAdmin: user.role === "ADMIN",
        priceNote,
      },
      setLoading,
      `shared/client-leads/${id}/status`,
      false,
      "Finalizing the lead",
      false,
      "PUT"
    );
    if (request.status === 200) {
      if (setLead) {
        setLead((oldLead) => ({
          ...oldLead,
          status: "FINALIZED",
          averagePrice,
          priceWithOutDiscount: price,
          discount,
        }));
      }
      if (setleads) {
        setleads((prev) =>
          prev.map((lead) =>
            lead.id === id
              ? { ...lead, status: "FINALIZED", averagePrice: price, priceNote }
              : lead
          )
        );
      }
      if (onUpdate) {
        onUpdate();
      }
      if (setAnchorEl) {
        setAnchorEl(null);
      }
      if (setId) {
        setId(null);
      }
      setOpen(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      aria-labelledby="finalize-modal-title"
      aria-describedby="finalize-modal-description"
    >
      <Box sx={simpleModalStyle}>
        <Typography variant="h5" id="finalize-modal-title" sx={{ mb: 2 }}>
          Finalize Lead Price
        </Typography>

        <Typography
          variant="body1"
          id="finalize-modal-description"
          sx={{ mb: 2 }}
        >
          {updatePrice
            ? "Please enter the new price (or average) that the client has agreed."
            : "Please enter the final price (or average) that the client has agreed upon to complete this lead."}
        </Typography>
        <TextField
          value={price}
          type="number"
          fullWidth
          label="Final Price without the discount"
          placeholder="Enter the agreed price"
          onChange={(e) => setPrice(e.target.value)}
          error={!price || price <= 0}
          helperText={
            !price || price <= 0
              ? "This field is required and must be a positive number."
              : ""
          }
          sx={{ mb: 2 }}
        />
        <TextField
          value={discount}
          type="number"
          fullWidth
          label="Discount (Percentage)"
          placeholder="Enter the discount"
          error={discount > 100 || discount < 0}
          onChange={(e) => {
            if (e.target.value > 100 || e.target.value < 0) {
              setAlertError("Discount must be less than 100 or more than 0");
              return;
            }
            setDiscount(e.target.value);
          }}
          sx={{ mb: 2 }}
        />
        <TextField
          value={priceNote}
          type="text"
          multiline
          rows={2}
          fullWidth
          label="Price note"
          placeholder="Enter any notes u want to add"
          onChange={(e) => setPriceNote(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Alert severity="info" sx={{ mb: 2 }}>
          The current price is : {averagePrice}
        </Alert>
        <Button onClick={submit} variant="contained" fullWidth>
          {updatePrice ? "Update" : "Submit"} Final Price
        </Button>
      </Box>
    </Modal>
  );
}
