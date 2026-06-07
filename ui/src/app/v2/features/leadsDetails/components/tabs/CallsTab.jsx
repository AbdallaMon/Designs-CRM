"use client";

// Calls tab — lists the lead's call reminders (nested on the detail payload) and exposes
// the New-call dialog + per-reminder result dialog. Capability-gated on canAddCall.

import { List, ListItem, ListItemText, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import {
  NewCallMeetingDialog,
  CallMeetingResultDialog,
} from "../dialogs/CallMeetingDialogs.jsx";

export function CallsTab({ lead, onChanged }) {
  const caps = lead?.capabilities ?? {};
  const calls = Array.isArray(lead?.callReminders) ? lead.callReminders : [];

  return (
    <Stack spacing={2}>
      <NewCallMeetingDialog lead={lead} reminderType="CALL" canAdd={caps.canAddCall} onCreated={onChanged} />
      {calls.length === 0 ? (
        <Typography color="text.secondary">لا توجد مكالمات</Typography>
      ) : (
        <List>
          {calls.map((c) => (
            <ListItem
              key={c.id}
              divider
              secondaryAction={
                <CallMeetingResultDialog
                  reminder={c}
                  reminderType="CALL"
                  canManage={caps.canAddCall}
                  onUpdated={onChanged}
                />
              }
            >
              <ListItemText
                primary={c.reminderReason || "—"}
                secondary={
                  <>
                    {c.time ? dayjs(c.time).format("YYYY-MM-DD HH:mm") : ""} · {c.status || ""}
                    {c.callResult ? ` · ${c.callResult}` : ""}
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
