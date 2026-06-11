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

import { useMemo, useState } from "react";
import { Button, ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";
import { MdArrowDropDown, MdCheck } from "react-icons/md";
import { useToastContext } from "@/app/v2/providers/ToastProvider";
import { useT } from "@/app/v2/lib/i18n";
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
  const { t } = useT();

  // §5/M6 — error prevention: build the offered list in real pipeline order and ALWAYS include
  // the lead's current status (so the user sees where they are), even when it isn't in the
  // change-set (e.g. NEW / FINALIZED). The current status is marked (checked + disabled) and
  // cannot be re-selected. We don't have a client-side legal-transition map, so we don't hide
  // other targets — the server still enforces the real transition.
  const ordered = useMemo(() => {
    const base = beginner ? LEAD_STATUS_CHANGE_BEGINNER : LEAD_STATUS_CHANGE_FULL;
    const current = lead?.status;
    if (current && !base.includes(current)) {
      // Surface the current status first so "where am I?" is answered, then the legal change-set.
      return [current, ...base];
    }
    return base;
  }, [beginner, lead?.status]);

  if (!canChangeStatus) return null;

  async function pick(status) {
    setAnchorEl(null);
    if (!status || status === lead.status) return;
    // §5c: send ONLY the target status — the server derives oldStatus.
    const res = await runLeadMutation(
      () => leadsService.changeStatus(lead.id, { status }),
      { setLoading, loading: t("leadsDetails.statusMenu.loading") },
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
        {t("leadsDetails.statusMenu.button")}
      </Button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        {ordered.map((s) => {
          const isCurrent = s === lead?.status;
          return (
            <MenuItem
              key={s}
              value={s}
              selected={isCurrent}
              disabled={isCurrent}
              onClick={() => pick(s)}
            >
              {isCurrent && (
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <MdCheck />
                </ListItemIcon>
              )}
              <ListItemText
                primary={statusLabel(s)}
                inset={!isCurrent}
                slotProps={{ primary: { sx: { fontWeight: isCurrent ? 700 : 400 } } }}
              />
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
