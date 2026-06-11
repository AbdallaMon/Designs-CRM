"use client";

// Create / accept-reject price-offer dialogs — ports the legacy PriceOffersDialog flow
// onto the v2 leads service. Create gated on capabilities.canAddPriceOffer; the
// accept/reject status change posts to /price-offers/change-status. Arabic.
//
// Create body matches LeadValidation.createPriceOffer: { priceOffer: { url, note,
// minPrice, maxPrice } }. Change-status body matches changePriceOfferStatus:
// { priceOfferId, isAccepted }.

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import { BsPlus } from "react-icons/bs";
import { useToastContext } from "@/app/v2/providers/ToastProvider";
import { useT } from "@/app/v2/lib/i18n";
import { leadsService } from "@/app/v2/features/leads/leads.service.js";
import { runLeadMutation } from "@/app/v2/features/leads/leads.mutations.js";

export function NewPriceOfferDialog({ lead, canAdd, onCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ url: "", note: "", minPrice: "", maxPrice: "" });
  const { setLoading } = useToastContext();
  const { t } = useT();

  if (!canAdd) return null;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleCreate() {
    const res = await runLeadMutation(
      () =>
        leadsService.createPriceOffer(lead.id, {
          priceOffer: {
            url: form.url || undefined,
            note: form.note || undefined,
            minPrice: form.minPrice || undefined,
            maxPrice: form.maxPrice || undefined,
          },
        }),
      { setLoading, loading: t("leadsDetails.priceOffer.create.loading") },
    );
    if (res) {
      onCreated?.(res.data);
      setForm({ url: "", note: "", minPrice: "", maxPrice: "" });
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
        {t("leadsDetails.priceOffer.add")}
      </Button>
      {open && (
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth dir="rtl">
          <DialogTitle sx={{ borderBottom: 1, borderColor: "divider" }}>{t("leadsDetails.priceOffer.title")}</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField label={t("leadsDetails.priceOffer.url")} value={form.url} onChange={set("url")} fullWidth />
              <Stack direction="row" spacing={2}>
                <TextField label={t("leadsDetails.priceOffer.minPrice")} value={form.minPrice} onChange={set("minPrice")} fullWidth />
                <TextField label={t("leadsDetails.priceOffer.maxPrice")} value={form.maxPrice} onChange={set("maxPrice")} fullWidth />
              </Stack>
              <TextField label={t("leadsDetails.priceOffer.note")} value={form.note} onChange={set("note")} fullWidth multiline rows={2} />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
            <Button onClick={() => setOpen(false)} variant="outlined">
              {t("leadsDetails.priceOffer.cancel")}
            </Button>
            <Button onClick={handleCreate} variant="contained" color="primary">
              {t("leadsDetails.priceOffer.save")}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}

/** Inline accept / reject buttons for a single price offer. */
export function PriceOfferStatusActions({ priceOffer, canManage, onChanged }) {
  const { setLoading } = useToastContext();
  const { t } = useT();
  if (!canManage) return null;

  async function change(isAccepted) {
    const res = await runLeadMutation(
      () => leadsService.changePriceOfferStatus({ priceOfferId: priceOffer.id, isAccepted }),
      { setLoading, loading: t("leadsDetails.priceOffer.change.loading") },
    );
    if (res) onChanged?.(res.data);
  }

  return (
    <Stack direction="row" spacing={1}>
      <Button size="small" color="success" variant="outlined" onClick={() => change(true)}>
        {t("leadsDetails.priceOffer.accept")}
      </Button>
      <Button size="small" color="error" variant="outlined" onClick={() => change(false)}>
        {t("leadsDetails.priceOffer.reject")}
      </Button>
    </Stack>
  );
}
