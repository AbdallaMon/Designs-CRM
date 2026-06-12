"use client";

// Change-payment-level dialog — v2 port of the legacy kanban moveCard / status change.
// Builds the EXACT POST /v2/accounting/payments/:paymentId/actions/change-status strict
// body { newPaymentLevel }. §5c: the legacy client `oldPaymentLevel` is DROPPED — the
// server derives the previous level; sending it would 422 the .strict() schema.
// newPaymentLevel is constrained to the PaymentLevel enum (matches the BE z.enum).
// Gated on PAYMENT_CHANGE_LEVEL × capabilities.canChangeStatus.

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from "@mui/material";
import { MdSwapVert } from "react-icons/md";
import { useT } from "@/app/v2/lib/i18n";
import { accountingService } from "../accounting.service.js";
import { runAccountingMutation } from "../accounting.mutations.js";
import { PAYMENT_LEVELS } from "../config/accountingConstants.js";

export function ChangePaymentLevelDialog({ payment, onChanged }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState(payment.paymentLevel ?? "LEVEL_1");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const res = await runAccountingMutation(
      () => accountingService.changeStatus(payment.id, { newPaymentLevel: level }),
      { loading: t("accounting.changeLevel.loading"), setLoading: setSubmitting },
    );
    if (res) {
      onChanged?.(res.data);
      setOpen(false);
    }
  }

  return (
    <>
      <Button variant="outlined" size="small" startIcon={<MdSwapVert />} onClick={() => setOpen(true)}>
        {t("accounting.changeLevel.button")}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>
          {t("accounting.changeLevel.title").replace("{id}", String(payment.id))}
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            select
            fullWidth
            label={t("accounting.changeLevel.field")}
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            sx={{ mt: 1 }}
          >
            {Object.entries(PAYMENT_LEVELS).map(([k, label]) => (
              <MenuItem key={k} value={k}>
                {label}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t("accounting.action.cancel")}</Button>
          <Button variant="contained" disabled={submitting} onClick={handleSubmit}>
            {t("accounting.action.save")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default ChangePaymentLevelDialog;
