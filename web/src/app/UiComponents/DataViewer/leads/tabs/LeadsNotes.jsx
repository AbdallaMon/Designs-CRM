import React from "react";
import { Stack, Typography } from "@mui/material";
import dayjs from "dayjs";

import { NewNoteDialog } from "@/app/UiComponents/DataViewer/leads/dialogs/NoteDialog";
import { MdStickyNote2 } from "react-icons/md";

import DeleteModelButton from "../../../common/DeleteModelButton";
import { EmptyState } from "../shared/EmptyState";
import { TabLoading } from "../shared/TabLoading";
import { useLeadTab } from "../context/LeadDetailsContext";
import { TabSection, RecordCard, NameAvatar } from "../shared/tabKit";

export function LeadNotes({ lead, admin, notUser }) {
  const { data: notes, onMutated: setNotes, showLoading } = useLeadTab("notes", {
    fallback: lead?.notes,
  });

  if (showLoading) return <TabLoading />;

  return (
    <TabSection
      icon={<MdStickyNote2 />}
      title="Notes"
      count={notes?.length || 0}
      action={!notUser ? <NewNoteDialog lead={lead} setNotes={setNotes} /> : null}
    >
      {!notes?.length ? (
        <EmptyState
          icon={<MdStickyNote2 />}
          title="No notes yet"
          description={
            notUser
              ? "There are no notes recorded for this lead."
              : "Add the first note to keep track of important details about this lead."
          }
        />
      ) : (
        <Stack spacing={1.5}>
          {notes.map((note) => (
            <RecordCard
              key={note.id}
              leading={<NameAvatar name={note.user?.name} />}
              title={note.user?.name || "Unknown"}
              subtitle={dayjs(note.createdAt).format("DD MMM YYYY, h:mm A")}
              status={
                <DeleteModelButton
                  item={note}
                  model={"Note"}
                  contentKey="content"
                  onDelete={() =>
                    setNotes((old) => old.filter((n) => n.id !== note.id))
                  }
                />
              }
            >
              <Typography
                variant="body1"
                sx={{
                  color: "text.primary",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {note.content}
              </Typography>
            </RecordCard>
          ))}
        </Stack>
      )}
    </TabSection>
  );
}
