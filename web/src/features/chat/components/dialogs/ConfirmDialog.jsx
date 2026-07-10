"use client";

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";

export function ConfirmDialog({
  open,
  title,
  description,
  onConfirm,
  onCancel,
  isLoading = false,
  confirmButtonText = "Delete",
  cancelButtonText = "Cancel",
  confirmButtonColor = "error",
  isDestructive = true,
}) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      sx={{
        zIndex: 1304,
      }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{description}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={isLoading}>
          {cancelButtonText}
        </Button>
        <Button
          variant="contained"
          color={confirmButtonColor}
          onClick={onConfirm}
          disabled={isLoading}
        >
          {confirmButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
