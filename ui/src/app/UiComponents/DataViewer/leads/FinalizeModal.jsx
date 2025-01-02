import React, {useState} from "react";
import {useAlertContext} from "@/app/providers/MuiAlert.jsx";
import {useToastContext} from "@/app/providers/ToastLoadingProvider.js";
import {handleRequestSubmit} from "@/app/helpers/functions/handleSubmit.js";
import {Box, Button, Modal, TextField, Typography} from "@mui/material";
import {simpleModalStyle} from "@/app/helpers/constants.js";

export function FinalizeModal({ open, setOpen, id, setleads, setId,setLead,setAnchorEl,updatePrice }) {
    const [price, setPrice] = useState();
    const { setAlertError } = useAlertContext();
    const { setLoading } = useToastContext();

    async function submit() {
        if (!price || price <= 0) {
            setAlertError("Please enter a valid price agreed upon by the client.");
            return;
        }
        const request = await handleRequestSubmit(
              { status: "FINALIZED", price,updatePrice },
              setLoading,
              `staff/client-leads/${id}/status`,
              false,
              "Finalizing the lead",
              false,
              "PUT"
        );
        if (request.status === 200) {
            if (setLead) {
                setLead((oldLead) => ({...oldLead, status: "FINALIZED",averagePrice:price}));
            }
            setleads((prev) =>
                  prev.map((lead) =>
                        lead.id === id ? { ...lead, status: "FINALIZED",averagePrice:price } : lead
                  )
            );

            if(setAnchorEl){
            setAnchorEl(null);
            }
            if(setId){
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

                  <Typography variant="body1" id="finalize-modal-description" sx={{ mb: 2 }}>
                      {updatePrice?"Please enter the new price (or average) that the client has agreed."
                      :"Please enter the final price (or average) that the client has agreed upon to complete this lead."
                      }
                  </Typography>
                  <TextField
                        value={price}
                        type="number"
                        fullWidth
                        label="Agreed Price"
                        placeholder="Enter the agreed price"
                        onChange={(e) => setPrice(e.target.value)}
                        error={!price || price <= 0}
                        helperText={!price || price <= 0 ? "This field is required and must be a positive number." : ""}
                        sx={{ mb: 2 }}
                  />
                  <Button onClick={submit} variant="contained" fullWidth>
                      {updatePrice?"Update":
                      "Submit"} Final Price
                  </Button>
              </Box>
          </Modal>
    );
}
