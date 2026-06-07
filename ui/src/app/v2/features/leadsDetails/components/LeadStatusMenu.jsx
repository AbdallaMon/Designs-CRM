"use client";

// Lead status-change menu — the workflow action. §5c: status change is
// POST /:id/actions/change-status and NO LONGER accepts a client oldStatus (the server
// derives the current status). We send only { status }. Gated on
// capabilities.canChangeStatus (the backend folded lead.change_status + scope + the
// non-admin locked-from-status rule into that one capability).
//
// The offered target statuses mirror the legacy menu: the full set for privileged /
// primary users, the beginner set otherwise. We expose both via the `beginner` prop the
// detail page derives from the user. (The server still enforces the real transition.)

import { useState } from "react";
import { Button, Menu, MenuItem } from "@mui/material";
import { MdArrowDropDown } from "react-icons/md";
import { useToastContext } from "@/app/v2/providers/ToastProvider";
import { leadsService } from "@/app/v2/features/leads/leads.service.js";
import { runLeadMutation } from "@/app/v2/features/leads/leads.mutations.js";
import {
  LEAD_STATUS_CHANGE_FULL,
  LEAD_STATUS_CHANGE_BEGINNER,
  statusLabel,
} from "@/app/v2/features/leads/config/leadsConstants.js";

export function LeadStatusMenu({ lead, canChangeStatus, beginner = false, onChanged }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const { setLoading } = useToastContext();

  if (!canChangeStatus) return null;

  const statuses = beginner ? LEAD_STATUS_CHANGE_BEGINNER : LEAD_STATUS_CHANGE_FULL;

  async function pick(status) {
    setAnchorEl(null);
    if (!status || status === lead.status) return;
    // §5c: send ONLY the target status — the server derives oldStatus.
    const res = await runLeadMutation(
      () => leadsService.changeStatus(lead.id, { status }),
      { setLoading, loading: "جاري تغيير الحالة..." },
    );
    if (res) onChanged?.(status);
  }

  return (
    <>
      <Button
        variant="outlined"
        endIcon={<MdArrowDropDown />}
        onClick={(e) => setAnchorEl(e.currentTarget)}
      >
        تغيير الحالة
      </Button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        {statuses.map((s) => (
          <MenuItem key={s} value={s} selected={s === lead.status} onClick={() => pick(s)}>
            {statusLabel(s)}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
