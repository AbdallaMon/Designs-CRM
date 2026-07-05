"use client";
import React, { useEffect, useState } from "react";
import {
  alpha,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { GoPlus } from "react-icons/go";
import { MdStickyNote2 } from "react-icons/md";
import { useAlertContext } from "@/app/providers/MuiAlert.jsx";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit.js";
import { useAuth } from "@/app/providers/AuthProvider.jsx";
import { useToastContext } from "@/app/providers/ToastLoadingProvider.js";

import dayjs from "dayjs";

import utc from "dayjs/plugin/utc";

import { OpenButton } from "./OpenButton";

dayjs.extend(utc);

export const NewNoteDialog = ({
  lead,
  setNotes,
  type = "button",
  children,
  handleClose,
}) => {
  const [open, setOpen] = useState(false);
  const { setAlertError } = useAlertContext();
  const { user } = useAuth();
  const { setLoading } = useToastContext();
  const [newNote, setNewNote] = useState("");
  const theme = useTheme();
  const onClose = () => setOpen(false);
  function handleOpen() {
    setOpen(true);
  }
  const handleAddNote = async () => {
    if (!newNote.trim()) {
      setAlertError("You must write something in the note to create new one");
      return;
    }
    const request = await handleRequestSubmit(
      {
        content: newNote,
        userId: user.id,
      },
      setLoading,
      `shared/client-leads/${lead.id}/notes`,
      false,
      "Creating"
    );
    if (request.status === 200) {
      if (setNotes) {
        setNotes((oldNotes) => [request.data, ...oldNotes]);
      }
      if (handleClose) {
        handleClose(request.data);
      }
      setNewNote("");
      setOpen(false);
    }
  };
  return (
    <>
      {type === "button" ? (
        <Button
          endIcon={<GoPlus />}
          onClick={handleOpen}
          variant="contained"
          sx={{ width: "fit-content", textTransform: "none", fontWeight: 600 }}
        >
          Add new Note
        </Button>
      ) : (
        <OpenButton handleOpen={handleOpen}>{children}</OpenButton>
      )}
      {open && (
        <Dialog
          open={open}
          onClose={onClose}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              py: 2.5,
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                  color: theme.palette.primary.main,
                  fontSize: 20,
                }}
              >
                <MdStickyNote2 />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                  Add New Note
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Record an important detail about this lead
                </Typography>
              </Box>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ pt: 4 }}>
            <Stack direction="row" spacing={2} alignItems="flex-start">
              {lead.assignedTo && (
                <Avatar
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    fontWeight: 600,
                    mt: 0.5,
                  }}
                >
                  {lead.assignedTo.name[0]}
                </Avatar>
              )}
              <TextField
                label="Note"
                variant="outlined"
                fullWidth
                multiline
                minRows={4}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAddNote();
                  }
                }}
                placeholder="Write your note here..."
                helperText="Press Enter to save, Shift + Enter for a new line"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: 1, borderColor: "divider" }}>
            <Button
              onClick={onClose}
              variant="outlined"
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<GoPlus size={18} />}
              onClick={handleAddNote}
              disabled={!newNote.trim()}
              sx={{ textTransform: "none", fontWeight: 600, px: 3 }}
            >
              Add Note
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};
