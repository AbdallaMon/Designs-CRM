import React, { useState } from "react";
import { Button, Modal, Box, Typography, IconButton } from "@mui/material";
import { MdClose } from "react-icons/md";
import UpdatesList from "./UpdatesList";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 800,
  bgcolor: "background.paper",
  maxHeight: "90vh",
  overflow: "auto",
  boxShadow: 24,
  p: 2,
  borderRadius: 2,
};

export default function LeadListModal({ clientLeadId, currentUserDepartment }) {
  const [open, setOpen] = useState(false);
  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div>
      <Button
        variant="contained"
        color="primary"
        onClick={handleOpen}
        size="small"
      >
        View all
      </Button>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Box sx={style}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <IconButton onClick={handleClose} size="small">
              <MdClose />
            </IconButton>
          </Box>
          <Box>
            <UpdatesList
              clientLeadId={clientLeadId}
              currentUserDepartment={currentUserDepartment}
            />
          </Box>

          <Box display="flex" gap={2} justifyContent="flex-end">
            <Button variant="outlined" onClick={handleClose}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
}
