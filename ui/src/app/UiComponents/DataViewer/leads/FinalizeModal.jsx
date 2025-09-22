import React, { useEffect, useState } from "react";
import { useAlertContext } from "@/app/providers/MuiAlert.jsx";
import { useToastContext } from "@/app/providers/ToastLoadingProvider.js";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit.js";
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { CONTRACT_LEVELS, simpleModalStyle } from "@/app/helpers/constants.js";
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
    const [formData, setFormData] = useState({
      purpose: "",
      contractLevel: [],
      startDate: "",
      endDate: "",
    });
    const handleSaveContract = async () => {
      if (!formData.purpose || !formData.contractLevel || formData.contractLevel.length < 1) {
        setAlertError("Please fill in all required fields.");
        return;
      }
      
      const url =    `shared/client-leads/${lead.id}/contracts`;
      const method = "POST";
      
      const req = await handleRequestSubmit(
        formData,
        setLoading,
        url,
        false,
        "Saving Contract",
        false,
        method
      );
      
      if (req.status === 200 || req.status === 201) {
     return true
      }
    };
  
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
    if(!lead.contracts||lead.contracts.length===0){
      const pass=await handleSaveContract()
      if(!pass){
        return
      }
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
             {(!lead.contracts||lead.contracts.length===0)&&
        
        <Box sx={{mb:2}}>
        <Typography variant="h4" sx={{mb:1.5}}>
          Contract Details
        </Typography>
             <Grid container spacing={2}>
                      <Grid size={12}>
                        <TextField
                          fullWidth
                          label="Purpose"
                          value={formData.purpose}
                          onChange={(e) =>
                            setFormData({ ...formData, purpose: e.target.value })
                          }
                        />
                      </Grid>
                      <Grid size={12}>
                        <FormControl fullWidth>
                          <InputLabel>Contract Level</InputLabel>
                          <Select
                            multiple
                            value={formData.contractLevel}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                contractLevel: e.target.value,
                              })
                            }
                            label="Contract Level"
                            renderValue={(selected) => {
                              return (
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                  {selected.map((value) => (
                                    <Chip 
                                      key={value} 
                                      label={`${value.replace("_", " ")} - ${CONTRACT_LEVELS[value]}`} 
                                      size="small"
                                    />
                                  ))}
                                </Box>
                              );
                            }}
                          >
                            {Object.keys(CONTRACT_LEVELS)
                            .map((level) => (
                              <MenuItem key={level} value={level}>
                                <Box>
                                  <Typography variant="body1">
                                    {level.replace("_", " ")}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {CONTRACT_LEVELS[level]}
                                  </Typography>
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <TextField
                          fullWidth
                          label="Start Date"
                          type="date"
                          value={formData.startDate}
                          helperText="Optional start date for the level"
                          onChange={(e) =>
                            setFormData({ ...formData, startDate: e.target.value })
                          }
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <TextField
                          fullWidth
                          label="End Date"
                          type="date"
                          helperText="Optional end date for the level"
                          value={formData.endDate}
                          onChange={(e) =>
                            setFormData({ ...formData, endDate: e.target.value })
                          }
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                    </Grid>
        </Box>
        }
        <Button onClick={submit} variant="contained" fullWidth>
          {updatePrice ? "Update" : "Submit"} Final Price
        </Button>
   
      </Box>
    </Modal>
  );
}
