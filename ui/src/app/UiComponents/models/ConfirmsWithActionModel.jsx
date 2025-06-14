import { Box, Button, Fade, Modal, Typography } from "@mui/material";
import { simpleModalStyle } from "@/app/helpers/constants";
import React, { useState } from "react";

export default function ConfirmWithActionModel({
  children,
  title,
  isDelete,
  handleConfirm,
  description,
  removeAfterConfirm = true,
  label,
  color,
  fullWidth,
  size,
}) {
  const [open, setOpen] = useState(false);

  async function handleAfterConfirm() {
    const confirm = await handleConfirm();
    if (!confirm || confirm.status !== 200) return;
    if (removeAfterConfirm) setOpen(false);
  }

  return (
    <>
      <Button
        variant="contained"
        color={color ? color : isDelete ? "error" : "secondary"}
        fullWidth={fullWidth}
        size={size}
        onClick={() => setOpen(true)}
        sx={{ textTransform: "none", color: "text.white" }}
      >
        {label}
      </Button>
      {open && (
        <Modal open={open} onClose={() => setOpen(false)} closeAfterTransition>
          <Fade in={open}>
            <Box sx={{ ...simpleModalStyle }}>
              <Typography variant="h6" component="h2" mb={2}>
                {title}
              </Typography>
              {description && (
                <Typography variant="body2" component="p" mb={2}>
                  {description}
                </Typography>
              )}
              {children}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: "16px",
                }}
              >
                <Button
                  variant="contained"
                  color={isDelete ? "error" : "primary"}
                  onClick={handleAfterConfirm}
                >
                  Confirm
                </Button>
                <Button
                  variant="contained"
                  onClick={() => setOpen(false)}
                  sx={{ marginLeft: "8px", color: "text.white" }}
                  color="secondary"
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          </Fade>
        </Modal>
      )}
    </>
  );
}
