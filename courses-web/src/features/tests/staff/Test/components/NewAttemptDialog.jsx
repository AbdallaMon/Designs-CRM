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
import { toArabicNumerals } from "../helpers";

const NewAttemptDialog = ({ open, onClose, test, onConfirm }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>بدء محاولة اختبار جديدة</DialogTitle>
    <DialogContent>
      <Typography variant="body1" sx={{ mb: 2 }}>
        أنت على وشك بدء محاولة اختبار جديدة.
        {test.timeLimit &&
          ` سيكون لديك ${toArabicNumerals(
            test.timeLimit
          )} دقيقة لإكمال الاختبار.`}
      </Typography>
      <Alert severity="warning">
        تأكد من أن لديك اتصال إنترنت مستقر ووقت كافي لإكمال الاختبار.
      </Alert>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>إلغاء</Button>
      <Button onClick={onConfirm} variant="contained">
        بدء الاختبار
      </Button>
    </DialogActions>
  </Dialog>
);

export default NewAttemptDialog;
