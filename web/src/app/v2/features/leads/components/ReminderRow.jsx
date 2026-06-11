"use client";

// <ReminderRow> — a single upcoming call OR meeting reminder in the workspace cockpit. The
// reminder list items are CallReminder/MeetingReminder rows:
//   { id, time, status, clientLeadId, clientLead: { id, client: { name }, status } }
// (verified against lead.repository.js findNextCalls/findNextMeetings).
//
// Primary action = "تمت" → mark the reminder DONE via the existing reminder mutation
// (leadsService.updateCall / updateMeeting → PUT /call-reminders/:id | /meeting-reminders/:id).
// Those endpoints are server-side scope-checked (requireSpecialChecker) AND gated here on the
// CALL_MANAGE / MEETING_MANAGE permission. When the caller lacks that permission the row simply
// renders without the action — still a link to the lead (we never invent endpoints / never show
// an action the role can't perform). Failures toast the resolved error code. Arabic / RTL.

import { useState } from "react";
import { Button } from "@mui/material";
import { MdCheck } from "react-icons/md";
import dayjs from "dayjs";
import { useToastContext } from "@/app/v2/providers/ToastProvider";
import { useT } from "@/app/v2/lib/i18n";
import { StatusChip } from "@/app/v2/shared/components";
import { leadsService } from "../leads.service.js";
import { runLeadMutation } from "../leads.mutations.js";
import { WorkspaceRow } from "./WorkspaceRow.jsx";

export function ReminderRow({ reminder, kind, canManage, onChanged }) {
  const { setLoading } = useToastContext();
  const { t } = useT();
  const [busy, setBusy] = useState(false);

  const noTime = t("leads.reminder.noTime");
  function formatTime(time) {
    if (!time) return noTime;
    const d = dayjs(time);
    return d.isValid() ? d.format("YYYY-MM-DD HH:mm") : noTime;
  }

  const clientLeadId = reminder?.clientLeadId ?? reminder?.clientLead?.id;
  const name = reminder?.clientLead?.client?.name ?? t("leads.reminder.unknownClient");
  const leadStatus = reminder?.clientLead?.status;

  async function markDone() {
    setBusy(true);
    const run =
      kind === "call"
        ? () => leadsService.updateCall(reminder.id, { status: "DONE" })
        : () => leadsService.updateMeeting(reminder.id, { status: "DONE" });
    const res = await runLeadMutation(run, {
      setLoading,
      loading: kind === "call" ? t("leads.reminder.call.loading") : t("leads.reminder.meeting.loading"),
    });
    setBusy(false);
    if (res) onChanged?.();
  }

  const action = canManage ? (
    <Button
      size="small"
      variant="outlined"
      color="success"
      disabled={busy}
      onClick={markDone}
      startIcon={<MdCheck />}
    >
      {t("leads.reminder.done")}
    </Button>
  ) : null;

  return (
    <WorkspaceRow
      href={`/v2/leads/${clientLeadId}`}
      primary={name}
      secondary={formatTime(reminder?.time)}
      chip={leadStatus ? <StatusChip status={leadStatus} domain="lead" /> : null}
      action={action}
    />
  );
}

export default ReminderRow;
