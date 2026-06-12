"use client";

// Pay-a-payment dialog — v2 port of the legacy "Pay" CreateModal (in OverduePayments.jsx).
// Builds the EXACT POST /v2/accounting/payments/:paymentId/actions/pay strict body
// { amount, issuedDate, file? }. The attachment is uploaded via the v2 chunk uploader and
// only its returned URL string is sent (the BE `file` field is a string URL, not a blob).
// Money is validated client-side (positive finite) for UX; the server is the source of
// truth (.refine finite > 0). Gated on PAYMENT_PROCESS × capabilities.canPay.

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { MdPayments, MdAttachFile } from "react-icons/md";
import dayjs from "dayjs";
import { useOverlay } from "@/app/v2/hooks/useOverlay";
import { useUpload } from "@/app/v2/hooks/useUpload";
import { UploadOverlay } from "@/app/v2/shared/components/feedback/UploadOverlay";
import { useT } from "@/app/v2/lib/i18n";
import { accountingService } from "../accounting.service.js";
import { runAccountingMutation } from "../accounting.mutations.js";

export function PayPaymentDialog({ payment, onPaid }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { isOpen, open: openOverlay, close: closeOverlay } = useOverlay();
  const { uploadAsChunk, progress, fileName, uploadSpeed, isUploading } = useUpload({
    onUploadStart: openOverlay,
    onUploadEnd: closeOverlay,
  });

  const { control, handleSubmit, reset } = useForm({
    defaultValues: { amount: "", issuedDate: dayjs().format("YYYY-MM-DD") },
  });

  function close() {
    setOpen(false);
    setFile(null);
    reset({ amount: "", issuedDate: dayjs().format("YYYY-MM-DD") });
  }

  async function onSubmit(values) {
    let fileUrl;
    if (file) {
      const uploaded = await uploadAsChunk({ file, withThumbnail: false });
      if (uploaded?.status === 200) fileUrl = uploaded.url;
    }
    const res = await runAccountingMutation(
      () =>
        accountingService.pay(payment.id, {
          amount: Number(values.amount),
          issuedDate: values.issuedDate,
          file: fileUrl,
        }),
      { loading: t("accounting.pay.loading"), setLoading: setSubmitting },
    );
    if (res) {
      onPaid?.(res.data);
      close();
    }
  }

  return (
    <>
      <Button variant="outlined" size="small" startIcon={<MdPayments />} onClick={() => setOpen(true)}>
        {t("accounting.pay.button")}
      </Button>

      <UploadOverlay
        progress={progress}
        fileName={fileName}
        uploadSpeed={uploadSpeed}
        isUploading={isUploading}
        showOverlay={isOpen}
      />

      <Dialog open={open} onClose={close} fullWidth maxWidth="xs">
        <DialogTitle>{t("accounting.pay.title").replace("{id}", String(payment.id))}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent dividers>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Controller
                name="amount"
                control={control}
                rules={{
                  required: t("accounting.validation.amountRequired"),
                  validate: (v) => {
                    const n = Number(v);
                    return (Number.isFinite(n) && n > 0) || t("accounting.validation.amountPositive");
                  },
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    type="number"
                    label={t("accounting.pay.amount")}
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                name="issuedDate"
                control={control}
                rules={{ required: t("accounting.validation.paymentDateRequired") }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    type="date"
                    label={t("accounting.pay.date")}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
              <Button component="label" variant="text" size="small" startIcon={<MdAttachFile />}>
                {file ? file.name : t("accounting.pay.attach")}
                <input type="file" hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </Button>
              <Typography variant="caption" color="text.secondary">
                {t("accounting.pay.remaining").replace(
                  "{amount}",
                  String(payment.amountLeft ?? payment.amount),
                )}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={close}>{t("accounting.action.cancel")}</Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {t("accounting.pay.button")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}

export default PayPaymentDialog;
