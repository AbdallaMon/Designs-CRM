import React from "react";
import {
  alpha,
  Avatar,
  Box,
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

import dayjs from "dayjs";

import { NewNoteDialog } from "@/app/UiComponents/DataViewer/leads/dialogs/NoteDialog";
import { MdStickyNote2 } from "react-icons/md";

import DeleteModelButton from "../../../common/DeleteModelButton";
import { SectionToolbar } from "../shared/SectionToolbar";
import { EmptyState } from "../shared/EmptyState";
import { TabLoading } from "../shared/TabLoading";
import { useLeadTab } from "../context/LeadDetailsContext";

export function LeadNotes({ lead, admin, notUser }) {
  const { data: notes, onMutated: setNotes, showLoading } = useLeadTab("notes", {
    fallback: lead?.notes,
  });
  const theme = useTheme();

  if (showLoading) return <TabLoading />;

  return (
    <Stack spacing={3}>
      <SectionToolbar
        icon={<MdStickyNote2 />}
        title="Notes"
        count={notes?.length || 0}
        countLabel="notes"
        action={
          !notUser ? <NewNoteDialog lead={lead} setNotes={setNotes} /> : null
        }
      />

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
        <Stack spacing={2}>
          {notes.map((note) => {
            const authorName = note.user?.name || "";
            return (
              <Paper
                key={note.id}
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  border: `1px solid ${theme.palette.divider}`,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    boxShadow: theme.shadows[3],
                    borderColor: alpha(theme.palette.primary.main, 0.4),
                  },
                }}
              >
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="flex-start"
                >
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: theme.palette.primary.main,
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {authorName ? authorName[0] : "?"}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      spacing={1}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="subtitle2"
                          fontWeight={600}
                          color="text.primary"
                          noWrap
                        >
                          {authorName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {dayjs(note.createdAt).format("DD MMM YYYY, h:mm A")}
                        </Typography>
                      </Box>
                      <DeleteModelButton
                        item={note}
                        model={"Note"}
                        contentKey="content"
                        onDelete={() => {
                          setNotes((oldNotes) =>
                            oldNotes.filter((n) => n.id !== note.id)
                          );
                        }}
                      />
                    </Stack>
                    <Typography
                      variant="body1"
                      sx={{
                        mt: 1,
                        color: "text.primary",
                        whiteSpace: "pre-wrap",
                        wordWrap: "break-word",
                      }}
                    >
                      {note.content}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
