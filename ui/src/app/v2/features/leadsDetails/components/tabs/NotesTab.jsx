"use client";

// Notes tab — lists the lead's notes and exposes the Add-note dialog. Gated on canAddNote.

import { List, ListItem, ListItemText, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import { NewNoteDialog } from "../dialogs/NoteDialog.jsx";

export function NotesTab({ lead, onChanged }) {
  const caps = lead?.capabilities ?? {};
  const notes = Array.isArray(lead?.notes) ? lead.notes : [];

  return (
    <Stack spacing={2}>
      <NewNoteDialog lead={lead} canAdd={caps.canAddNote} onCreated={onChanged} />
      {notes.length === 0 ? (
        <Typography color="text.secondary">لا توجد ملاحظات</Typography>
      ) : (
        <List>
          {notes.map((n) => (
            <ListItem key={n.id} divider>
              <ListItemText
                primary={n.content}
                secondary={
                  <>
                    {n.user?.name ? `${n.user.name} · ` : ""}
                    {n.createdAt ? dayjs(n.createdAt).format("YYYY-MM-DD HH:mm") : ""}
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
