"use client";

// Notes tab — lists the lead's notes and exposes the Add-note dialog (header add-button). Gated
// on canAddNote (unchanged). Body = shared LeadRecordList; the note content is clamped to ~3
// lines so a long note never blows out the row. No status indicator for notes.

import { Typography } from "@mui/material";
import { MdNotes } from "react-icons/md";
import dayjs from "dayjs";
import { LeadRecordList } from "../LeadRecordList.jsx";
import { NewNoteDialog } from "../dialogs/NoteDialog.jsx";

export function NotesTab({ lead, onChanged, autoOpenAction, onAutoOpenConsumed }) {
  const caps = lead?.capabilities ?? {};
  const notes = Array.isArray(lead?.notes) ? lead.notes : [];

  return (
    <LeadRecordList
      title="الملاحظات"
      icon={<MdNotes />}
      items={notes}
      headerAction={
        <NewNoteDialog
          lead={lead}
          canAdd={caps.canAddNote}
          onCreated={onChanged}
          autoOpen={autoOpenAction === "add"}
          onAutoOpenConsumed={onAutoOpenConsumed}
        />
      }
      renderPrimary={(n) => (
        <Typography
          variant="body1"
          sx={{
            fontWeight: 500,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {n.content || "—"}
        </Typography>
      )}
      renderSecondary={(n) => (
        <Typography variant="body2" color="text.secondary" component="span">
          {n.user?.name ? `${n.user.name} · ` : ""}
          {n.createdAt ? dayjs(n.createdAt).format("YYYY-MM-DD HH:mm") : ""}
        </Typography>
      )}
      emptyTitle="لا توجد ملاحظات بعد"
      emptyDescription={
        caps.canAddNote
          ? "أضف ملاحظة لتوثيق تفاصيل التواصل مع هذا العميل."
          : "لم تُضف أي ملاحظة لهذا العميل بعد."
      }
    />
  );
}
