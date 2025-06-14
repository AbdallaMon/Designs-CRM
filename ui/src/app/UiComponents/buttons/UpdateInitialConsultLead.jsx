"use client";
import React, { useState } from "react";
import { Button, Modal, Box, Typography } from "@mui/material";
import { FaCheckCircle } from "react-icons/fa";
import { useAuth } from "@/app/providers/AuthProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";

function UpdateInitialConsultButton({ clientLead }) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { setLoading } = useToastContext();
  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };
  const handleConfirm = async () => {
    try {
      const response = await handleRequestSubmit(
        { initialConsult: true },
        setLoading,
        `admin/leads/update/${clientLead.id}`,
        false,
        "Updating"
      );
      if (response.status === 200) {
        window.location.reload(); // Refresh the page after success
      } else {
        console.error("Failed to update initial consult");
      }
    } catch (error) {
      console.error("Error occurred while updating:", error);
    }
  };
  if (user.role !== "ADMIN") return;
  return (
    <div>
      {clientLead.initialConsult === false && (
        <Button
          variant="contained"
          color="primary"
          startIcon={<FaCheckCircle />}
          onClick={handleOpen}
        >
          Move to new Leads
        </Button>
      )}

      <Modal open={open} onClose={handleClose}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "white",
            borderRadius: 2,
            boxShadow: 24,
            padding: 2,
          }}
        >
          <Typography variant="h6" component="h2" gutterBottom>
            Are you sure you want to move this to new leads?
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Button variant="outlined" color="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="contained" color="primary" onClick={handleConfirm}>
              Confirm
            </Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
}

export default UpdateInitialConsultButton;
