"use client";
import React, { useEffect, useState } from "react";
import {
  Avatar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  useTheme,
} from "@mui/material";
import { BsPlus } from "react-icons/bs";
import { GoPlus } from "react-icons/go";
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
          sx={{ width: "fit-content" }}
        >
          Add new Note
        </Button>
      ) : (
        <OpenButton handleOpen={handleOpen}>{children}</OpenButton>
      )}
      {open && (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ borderBottom: 1, borderColor: "divider" }}>
            Add New Note
          </DialogTitle>
          <DialogContent>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                my: 2,
                backgroundColor: theme.palette.background.paper,
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                {lead.assignedTo && (
                  <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                    {lead.assignedTo.name[0]}
                  </Avatar>
                )}
                <TextField
                  label="Add a new note"
                  variant="outlined"
                  fullWidth
                  multiline
                  rows={2}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAddNote();
                    }
                  }}
                  placeholder="Write your note here..."
                />
              </Stack>
            </Paper>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
            <Button onClick={onClose} variant="outlined">
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<BsPlus size={16} />}
              onClick={handleAddNote}
              disabled={!newNote.trim()}
            >
              Add
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};
