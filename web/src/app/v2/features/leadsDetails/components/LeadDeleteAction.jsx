"use client";

// <LeadDeleteAction> — the destructive "حذف العميل" action on the lead detail header. Replaces
// the standalone delete-by-id page (the old AdminLeadsOps DeleteLeadCard): delete now lives where
// the user already is, scoped to THIS lead, behind a confirm dialog (mirrors the assign/convert
// confirm pattern in LeadAssignActions).
//
// Gated on PERMISSIONS.ADMIN_RESIDUAL.LEAD_DELETE — the same code the BE route requires (base-role
// ADMIN-only there; we do NOT widen the FE gate). The lead-detail dto emits no per-record delete
// capability, so this gates on the permission code alone; the server re-enforces scope on the call.
// Hits the existing DELETE /v2/admin/client-leads/:id via the adminResidual service; on success it
// navigates back to the leads list. Single Arabic / RTL.

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { MdDeleteForever } from "react-icons/md";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { useToastContext } from "@/app/v2/providers/ToastProvider";
import { useT } from "@/app/v2/lib/i18n";
import { adminResidualService } from "@/app/v2/features/adminResidual/adminResidual.service.js";
import { runAdminResidualMutation } from "@/app/v2/features/adminResidual/adminResidual.mutations.js";

export function LeadDeleteAction({ lead, size = "medium" }) {
  const { hasPermission } = usePermission();
  const { setLoading } = useToastContext();
  const { t } = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // Gate on the same permission code the BE route requires; do NOT widen.
  if (!hasPermission(PERMISSIONS.ADMIN_RESIDUAL.LEAD_DELETE)) return null;
  if (!lead?.id) return null;

  const clientName = lead?.client?.name ?? `#${lead.id}`;

  async function runDelete() {
    setBusy(true);
    const res = await runAdminResidualMutation(() => adminResidualService.deleteLead(lead.id), {
      loading: t("leadsDetails.delete.loading"),
      setLoading,
    });
    setBusy(false);
    if (res) {
      setOpen(false);
      // The lead no longer exists — leave the detail and return to the leads list.
      router.push("/v2/leads");
    }
  }

  return (
    <>
      <Button
        variant="outlined"
        color="error"
        size={size}
        startIcon={<MdDeleteForever />}
        onClick={() => setOpen(true)}
        disabled={busy}
      >
        {t("leadsDetails.delete.button")}
      </Button>

      <Dialog
        open={open}
        onClose={() => !busy && setOpen(false)}
        maxWidth="xs"
        fullWidth
        dir="rtl"
      >
        <DialogTitle sx={{ borderBottom: 1, borderColor: "divider" }}>
          {t("leadsDetails.delete.confirmTitle")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mt: 2 }}>
            {t("leadsDetails.delete.confirmBody").replace("{name}", clientName)}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
          <Button onClick={() => setOpen(false)} variant="outlined" disabled={busy}>
            {t("leadsDetails.delete.cancel")}
          </Button>
          <Button onClick={runDelete} variant="contained" color="error" disabled={busy}>
            {t("leadsDetails.delete.confirmLabel")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default LeadDeleteAction;
