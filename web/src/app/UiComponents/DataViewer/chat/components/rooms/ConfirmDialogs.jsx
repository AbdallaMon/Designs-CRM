"use client";

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

export function DeleteConfirmDialog({ open, onClose, onConfirm }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      sx={{
        zIndex: 1304,
      }}
    >
      <DialogTitle>Delete Chat?</DialogTitle>
      <DialogContent>
        <Typography>
          This action cannot be undone. All messages will be deleted.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} variant="contained" color="error">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function LeaveConfirmDialog({ open, onClose, onConfirm }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      sx={{
        zIndex: 1304,
      }}
    >
      <DialogTitle>Leave Chat?</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to leave this chat? You will no longer receive
          messages from this room.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} variant="contained" color="error">
          Leave
        </Button>
      </DialogActions>
    </Dialog>
  );
}
