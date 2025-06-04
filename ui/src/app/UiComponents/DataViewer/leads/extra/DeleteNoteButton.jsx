"use client";
import React, { useState } from "react";
import dayjs from "dayjs";
import {
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Fade,
  CircularProgress,
  Box,
} from "@mui/material";
import { MdDelete, MdDeleteForever } from "react-icons/md";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { useAuth } from "@/app/providers/AuthProvider";
import { checkIfAdmin } from "@/app/helpers/functions/utility";

export default function DeleteNoteButton({ note, onDelete }) {
  const { user } = useAuth();
  const { setLoading } = useToastContext();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isOlderThan5Minutes = dayjs().diff(dayjs(note.createdAt), "minute") > 5;
  const canDelete = checkIfAdmin(user) || !isOlderThan5Minutes;
  const isAdmin = checkIfAdmin(user);

  if (!canDelete) return null;

  const handleDeleteClick = () => {
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setConfirmOpen(false);

    try {
      const deleteNote = await handleRequestSubmit(
        {},
        setLoading,
        `shared/notes/${note.id}`,
        false,
        "Deleting note...",
        false,
        "DELETE"
      );

      if (deleteNote && deleteNote.status === 200) {
        if (onDelete) {
          onDelete(note);
        }
      }
    } catch (error) {
      console.error("Error deleting note:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setConfirmOpen(false);
  };

  // Dynamic tooltip based on user permissions
  const getTooltipTitle = () => {
    if (isAdmin) return "Delete note (Admin)";
    if (isOlderThan5Minutes) return "Delete note";
    return `Delete note (${
      5 - dayjs().diff(dayjs(note.createdAt), "minute")
    } min left)`;
  };

  return (
    <>
      <Tooltip title={getTooltipTitle()} placement="top" arrow>
        <Box sx={{ position: "relative", display: "inline-block" }}>
          <IconButton
            color="error"
            onClick={handleDeleteClick}
            disabled={isDeleting}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            sx={{
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                backgroundColor: "error.light",
                transform: "scale(1.05)",
              },
              "&:active": {
                transform: "scale(0.95)",
              },
            }}
          >
            <Fade in={!isDeleting}>
              <Box sx={{ display: isDeleting ? "none" : "block" }}>
                {isHovered ? (
                  <MdDeleteForever size={20} />
                ) : (
                  <MdDelete size={20} />
                )}
              </Box>
            </Fade>
            {isDeleting && (
              <CircularProgress
                size={20}
                color="error"
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  marginTop: "-10px",
                  marginLeft: "-10px",
                }}
              />
            )}
          </IconButton>
        </Box>
      </Tooltip>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        onClose={handleCancelDelete}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 320,
          },
        }}
      >
        <DialogTitle
          id="delete-dialog-title"
          sx={{
            pb: 1,
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: "error.main",
          }}
        >
          <MdDeleteForever size={24} />
          Delete Note
        </DialogTitle>

        <DialogContent>
          <DialogContentText id="delete-dialog-description" sx={{ mb: 1 }}>
            Are you sure you want to delete this note? This action cannot be
            undone.
          </DialogContentText>

          {note.content && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                backgroundColor: "grey.50",
                borderRadius: 1,
                border: "1px solid",
                borderColor: "grey.200",
                maxHeight: 100,
                overflow: "hidden",
                fontSize: "0.875rem",
                color: "text.secondary",
              }}
            >
              {note.content.substring(0, 150)}
              {note.content.length > 150 && "..."}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleCancelDelete}
            variant="outlined"
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 500,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            autoFocus
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 500,
              ml: 1,
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
