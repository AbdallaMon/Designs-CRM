"use client";

// Assign / convert actions — collection-level lead mutations, shared between the list
// rows and the detail header. Each button is gated on the record's capabilities (§5c):
//   - "claim" (assign to self)    → capabilities.canAssignSelf  → PUT /  body { id }
//   - "convert" (move to deal)    → capabilities.canConvert     → PUT /convert body { id }
// assign-to-other and bulk-convert are admin-tier (capabilities.canAssignToOther) and
// surfaced separately (LeadAdminAssignAction on the detail header; bulk on the list page).
//
// BOTH the claim and the convert action open a CONFIRM dialog first (showing the client
// name) and only fire the mutation on confirm — these are pipeline-altering writes the
// user should not trigger by accident.
//
// All writes go through the leads service + runLeadMutation (code→Arabic toast).

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
} from "@mui/material";
import { useToastContext } from "@/app/v2/providers/ToastProvider";
import { useT } from "@/app/v2/lib/i18n";
import { leadsService } from "../leads.service.js";
import { runLeadMutation } from "../leads.mutations.js";

export function LeadAssignActions({ lead, onChanged, size = "small" }) {
  const { setLoading } = useToastContext();
  const { t } = useT();
  const [busy, setBusy] = useState(false);
  // Which confirm dialog is open: null | "claim" | "convert".
  const [confirm, setConfirm] = useState(null);
  const caps = lead?.capabilities ?? {};
  const clientName = lead?.client?.name ?? `#${lead?.id ?? ""}`;

  async function runClaim() {
    setBusy(true);
    const res = await runLeadMutation(() => leadsService.assignLead({ id: lead.id }), {
      setLoading,
      loading: t("leads.assign.claim.loading"),
    });
    setBusy(false);
    setConfirm(null);
    if (res) onChanged?.(res.data);
  }

  async function runConvert() {
    setBusy(true);
    const res = await runLeadMutation(() => leadsService.convertLead({ id: lead.id }), {
      setLoading,
      loading: t("leads.assign.convert.loading"),
    });
    setBusy(false);
    setConfirm(null);
    if (res) onChanged?.(res.data);
  }

  if (!caps.canAssignSelf && !caps.canConvert) return null;

  const dialog =
    confirm === "claim"
      ? {
          title: t("leads.assign.claim.confirmTitle"),
          body: t("leads.assign.claim.confirmBody").replace("{name}", clientName),
          confirmLabel: t("leads.assign.claim.confirmLabel"),
          onConfirm: runClaim,
        }
      : confirm === "convert"
        ? {
            title: t("leads.assign.convert.confirmTitle"),
            body: t("leads.assign.convert.confirmBody").replace("{name}", clientName),
            confirmLabel: t("leads.assign.convert.confirmLabel"),
            onConfirm: runConvert,
          }
        : null;

  return (
    <>
      <Stack direction="row" spacing={1}>
        {caps.canAssignSelf && (
          <Button
            variant="outlined"
            size={size}
            disabled={busy}
            onClick={() => setConfirm("claim")}
          >
            {t("leads.assign.claim")}
          </Button>
        )}
        {caps.canConvert && (
          <Button
            variant="contained"
            size={size}
            disabled={busy}
            onClick={() => setConfirm("convert")}
          >
            {t("leads.assign.convert")}
          </Button>
        )}
      </Stack>

      <Dialog open={Boolean(dialog)} onClose={() => !busy && setConfirm(null)} maxWidth="xs" fullWidth dir="rtl">
        <DialogTitle sx={{ borderBottom: 1, borderColor: "divider" }}>{dialog?.title}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mt: 2 }}>{dialog?.body}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
          <Button onClick={() => setConfirm(null)} variant="outlined" disabled={busy}>
            {t("leads.assign.cancel")}
          </Button>
          <Button onClick={() => dialog?.onConfirm?.()} variant="contained" disabled={busy}>
            {dialog?.confirmLabel}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
