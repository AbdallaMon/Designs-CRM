import React from "react";
import { Button, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";

import { NewNoteDialog } from "@/app/UiComponents/DataViewer/leads/dialogs/NoteDialog";
import { MdStickyNote2 } from "react-icons/md";

import DeleteModelButton from "@/app/UiComponents/common/DeleteModelButton.jsx";
import { EmptyState } from "@/app/UiComponents/DataViewer/leads/shared/EmptyState.jsx";
import { TabLoading } from "@/app/UiComponents/DataViewer/leads/shared/TabLoading.jsx";
import { useLeadTab } from "@/app/UiComponents/DataViewer/leads/context/LeadDetailsContext.jsx";
import { TabSection, RecordCard, NameAvatar } from "@/app/UiComponents/DataViewer/leads/shared/tabKit.jsx";

export function LeadNotes({ lead, admin, notUser }) {
  const {
    data: notes,
    onMutated: setNotes,
    showLoading,
    error,
    refetch,
  } = useLeadTab("notes", {
    fallback: lead?.notes,
  });

  if (showLoading) return <TabLoading />;

  if (error) {
    return (
      <TabSection icon={<MdStickyNote2 />} title="Notes">
        <EmptyState
          icon={<MdStickyNote2 />}
          title="Couldn't load notes"
          description="Something went wrong while loading the notes. Please try again."
          action={
            <Button
              variant="outlined"
              onClick={() => refetch()}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Retry
            </Button>
          }
        />
      </TabSection>
    );
  }

  const canCreate = lead?.capabilities
    ? Boolean(lead.capabilities.canAddNote)
    : !notUser;

  return (
    <TabSection
      icon={<MdStickyNote2 />}
      title="Notes"
      count={notes?.length || 0}
      action={canCreate ? <NewNoteDialog lead={lead} setNotes={setNotes} /> : null}
    >
      {!notes?.length ? (
        <EmptyState
          icon={<MdStickyNote2 />}
          title="No notes yet"
          description={
            !canCreate
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
