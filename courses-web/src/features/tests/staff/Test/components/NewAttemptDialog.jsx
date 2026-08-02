"use client";
import React from "react";
import {
  Typography,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { formatNumber } from "../helpers";

const NewAttemptDialog = ({ open, onClose, test, onConfirm }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>Start a new test attempt</DialogTitle>
    <DialogContent>
      <Typography variant="body1" sx={{ mb: 2 }}>
        You are about to start a new test attempt.
        {test.timeLimit &&
          ` You will have ${formatNumber(
            test.timeLimit
          )} minutes to complete the test.`}
      </Typography>
      <Alert severity="warning">
        Make sure you have a stable internet connection and enough time to finish the test.
      </Alert>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={onConfirm} variant="contained">
        Start test
      </Button>
    </DialogActions>
  </Dialog>
);

export default NewAttemptDialog;
