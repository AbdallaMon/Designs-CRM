"use client";

// Assign / convert actions — collection-level lead mutations, shared between the list
// rows and the detail header. Each button is gated on the record's capabilities (§5c):
//   - "claim" (assign to self)    → capabilities.canAssignSelf  → PUT /  body { id }
//   - "convert" (move to deal)    → capabilities.canConvert     → PUT /convert body { id }
// assign-to-other and bulk-convert are admin-tier (capabilities.canAssignToOther) and
// surfaced on the list page header (bulk) — see LeadsPage.
//
// All writes go through the leads service + runLeadMutation (code→Arabic toast).

import { useState } from "react";
import { Button, Stack } from "@mui/material";
import { useToastContext } from "@/app/v2/providers/ToastProvider";
import { leadsService } from "../leads.service.js";
import { runLeadMutation } from "../leads.mutations.js";

export function LeadAssignActions({ lead, onChanged, size = "small" }) {
  const { setLoading } = useToastContext();
  const [busy, setBusy] = useState(false);
  const caps = lead?.capabilities ?? {};

  async function claim() {
    setBusy(true);
    const res = await runLeadMutation(() => leadsService.assignLead({ id: lead.id }), {
      setLoading,
      loading: "جاري الإسناد...",
    });
    setBusy(false);
    if (res) onChanged?.(res.data);
  }

  async function convert() {
    setBusy(true);
    const res = await runLeadMutation(() => leadsService.convertLead({ id: lead.id }), {
      setLoading,
      loading: "جاري التحويل...",
    });
    setBusy(false);
    if (res) onChanged?.(res.data);
  }

  if (!caps.canAssignSelf && !caps.canConvert) return null;

  return (
    <Stack direction="row" spacing={1}>
      {caps.canAssignSelf && (
        <Button variant="outlined" size={size} disabled={busy} onClick={claim}>
          استلام العميل
        </Button>
      )}
      {caps.canConvert && (
        <Button variant="contained" size={size} disabled={busy} onClick={convert}>
          تحويل إلى صفقة
        </Button>
      )}
    </Stack>
  );
}
