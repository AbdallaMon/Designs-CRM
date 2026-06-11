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
import { StatusChip } from "@/app/v2/shared/components";
import { leadsService } from "../leads.service.js";
import { runLeadMutation } from "../leads.mutations.js";
import { WorkspaceRow } from "./WorkspaceRow.jsx";

function formatTime(time) {
  if (!time) return "بدون موعد محدد";
  const d = dayjs(time);
  return d.isValid() ? d.format("YYYY-MM-DD HH:mm") : "بدون موعد محدد";
}

export function ReminderRow({ reminder, kind, canManage, onChanged }) {
  const { setLoading } = useToastContext();
  const [busy, setBusy] = useState(false);

  const clientLeadId = reminder?.clientLeadId ?? reminder?.clientLead?.id;
  const name = reminder?.clientLead?.client?.name ?? "عميل غير معروف";
  const leadStatus = reminder?.clientLead?.status;

  async function markDone() {
    setBusy(true);
    const run =
      kind === "call"
        ? () => leadsService.updateCall(reminder.id, { status: "DONE" })
        : () => leadsService.updateMeeting(reminder.id, { status: "DONE" });
    const res = await runLeadMutation(run, {
      setLoading,
      loading: kind === "call" ? "جاري تحديث المكالمة..." : "جاري تحديث الاجتماع...",
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
      تمت
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
