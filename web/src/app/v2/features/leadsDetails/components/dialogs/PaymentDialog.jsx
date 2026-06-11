"use client";

// Add-payment dialog — ports the legacy AddPayments flow onto the v2 leads service.
// Gated on capabilities.canAddPayment. Body matches LeadValidation.makePayments:
// { paymentType, payments: [{ amount, paymentReason }], note }. A minimal faithful
// single-payment form (the legacy dialog let you queue several rows; here one row per
// submit, which posts the same { payments: [...] } array shape the BE expects).

import { useEffect, useRef, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { BsPlus } from "react-icons/bs";
import { useToastContext } from "@/app/v2/providers/ToastProvider";
import { useT } from "@/app/v2/lib/i18n";
import { leadsService } from "@/app/v2/features/leads/leads.service.js";
import { runLeadMutation } from "@/app/v2/features/leads/leads.mutations.js";

// Payment-level options: `value` is the API enum, `labelKey` is resolved via t() at render.
const PAYMENT_LEVELS = [
  { value: "LEVEL_1", labelKey: "leadsDetails.payment.level1" },
  { value: "LEVEL_2", labelKey: "leadsDetails.payment.level2" },
  { value: "LEVEL_3", labelKey: "leadsDetails.payment.level3" },
  { value: "LEVEL_4", labelKey: "leadsDetails.payment.level4" },
  { value: "LEVEL_5", labelKey: "leadsDetails.payment.level5" },
];

export function AddPaymentDialog({ lead, canAdd, onCreated, autoOpen = false, onAutoOpenConsumed }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentReason, setPaymentReason] = useState("LEVEL_1");
  const [note, setNote] = useState("");
  const { setLoading } = useToastContext();
  const { t } = useT();

  // One-click daily verbs (item 4): open once when a deep-link asks, then clear the URL flag.
  const consumedRef = useRef(false);
  useEffect(() => {
    if (autoOpen && canAdd && !consumedRef.current) {
      consumedRef.current = true;
      setOpen(true);
      onAutoOpenConsumed?.();
    }
  }, [autoOpen, canAdd, onAutoOpenConsumed]);

  if (!canAdd) return null;

  async function handleAdd() {
    if (!amount) return;
    const res = await runLeadMutation(
      () =>
        leadsService.makePayments(lead.id, {
          payments: [{ amount: Number(amount), paymentReason }],
          note: note || undefined,
        }),
      { setLoading, loading: t("leadsDetails.payment.loading") },
    );
    if (res) {
      onCreated?.(res.data);
      setAmount("");
      setNote("");
      setOpen(false);
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="contained"
        startIcon={<BsPlus size={20} />}
        sx={{ alignSelf: "flex-start" }}
      >
        {t("leadsDetails.payment.add")}
      </Button>
      {open && (
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth dir="rtl">
          <DialogTitle sx={{ borderBottom: 1, borderColor: "divider" }}>{t("leadsDetails.payment.title")}</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField
                label={t("leadsDetails.payment.amount")}
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                fullWidth
              />
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  {t("leadsDetails.payment.levelLabel")}
                </Typography>
                <Select value={paymentReason} onChange={(e) => setPaymentReason(e.target.value)}>
                  {PAYMENT_LEVELS.map((l) => (
                    <MenuItem key={l.value} value={l.value}>
                      {t(l.labelKey)}
                    </MenuItem>
                  ))}
                </Select>
              </Stack>
              <TextField label={t("leadsDetails.payment.note")} value={note} onChange={(e) => setNote(e.target.value)} fullWidth multiline rows={2} />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
            <Button onClick={() => setOpen(false)} variant="outlined">
              {t("leadsDetails.payment.cancel")}
            </Button>
            <Button onClick={handleAdd} variant="contained" color="primary" disabled={!amount}>
              {t("leadsDetails.payment.confirm")}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}
