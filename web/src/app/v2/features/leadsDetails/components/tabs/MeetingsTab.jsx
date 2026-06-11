"use client";

// Meetings tab — lists the lead's meeting reminders and exposes the New-meeting dialog (header
// add-button) + per-reminder result dialog (row action). Capability-gated on canAddMeeting
// (unchanged). Body = shared LeadRecordList; result status reads as a <StatusChip>.

import { Stack, Typography } from "@mui/material";
import { MdGroups } from "react-icons/md";
import dayjs from "dayjs";
import { StatusChip } from "@/app/v2/shared/components";
import { LeadRecordList } from "../LeadRecordList.jsx";
import {
  NewCallMeetingDialog,
  CallMeetingResultDialog,
} from "../dialogs/CallMeetingDialogs.jsx";

export function MeetingsTab({ lead, onChanged }) {
  const caps = lead?.capabilities ?? {};
  const meetings = Array.isArray(lead?.meetingReminders) ? lead.meetingReminders : [];

  return (
    <LeadRecordList
      title="الاجتماعات"
      icon={<MdGroups />}
      items={meetings}
      headerAction={
        <NewCallMeetingDialog
          lead={lead}
          reminderType="MEETING"
          canAdd={caps.canAddMeeting}
          onCreated={onChanged}
        />
      }
      renderPrimary={(m) => (
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {m.reminderReason || "—"}
        </Typography>
      )}
      renderSecondary={(m) => (
        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" rowGap={0.5}>
          <Typography variant="body2" color="text.secondary" component="span">
            {m.time ? dayjs(m.time).format("YYYY-MM-DD HH:mm") : "—"}
          </Typography>
          {m.meetingResult && (
            <Typography variant="body2" color="text.secondary" component="span">
              · {m.meetingResult}
            </Typography>
          )}
        </Stack>
      )}
      renderStatus={(m) =>
        m.status ? <StatusChip domain="reminder" status={m.status} /> : null
      }
      renderRowAction={(m) => (
        <CallMeetingResultDialog
          reminder={m}
          reminderType="MEETING"
          canManage={caps.canAddMeeting}
          onUpdated={onChanged}
        />
      )}
      emptyTitle="لا توجد اجتماعات"
      emptyDescription={
        caps.canAddMeeting
          ? "جدول اجتماعاً مع هذا العميل المحتمل."
          : "لم تتم جدولة أي اجتماع لهذا العميل بعد."
      }
    />
  );
}
