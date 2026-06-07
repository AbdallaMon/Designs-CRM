"use client";

// Meetings tab — lists the lead's meeting reminders and exposes the New-meeting dialog +
// per-reminder result dialog. Capability-gated on canAddMeeting.

import { List, ListItem, ListItemText, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import {
  NewCallMeetingDialog,
  CallMeetingResultDialog,
} from "../dialogs/CallMeetingDialogs.jsx";

export function MeetingsTab({ lead, onChanged }) {
  const caps = lead?.capabilities ?? {};
  const meetings = Array.isArray(lead?.meetingReminders) ? lead.meetingReminders : [];

  return (
    <Stack spacing={2}>
      <NewCallMeetingDialog lead={lead} reminderType="MEETING" canAdd={caps.canAddMeeting} onCreated={onChanged} />
      {meetings.length === 0 ? (
        <Typography color="text.secondary">لا توجد اجتماعات</Typography>
      ) : (
        <List>
          {meetings.map((m) => (
            <ListItem
              key={m.id}
              divider
              secondaryAction={
                <CallMeetingResultDialog
                  reminder={m}
                  reminderType="MEETING"
                  canManage={caps.canAddMeeting}
                  onUpdated={onChanged}
                />
              }
            >
              <ListItemText
                primary={m.reminderReason || "—"}
                secondary={
                  <>
                    {m.time ? dayjs(m.time).format("YYYY-MM-DD HH:mm") : ""} · {m.status || ""}
                    {m.meetingResult ? ` · ${m.meetingResult}` : ""}
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Stack>
  );
}
