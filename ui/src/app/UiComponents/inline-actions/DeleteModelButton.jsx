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

export default function DeleteModelButton({
  item,
  model,
  endpoint = "shared/delete",
  contentKey = "content",
  onDelete,
  timeLimit = 5,
  deleteModelesBeforeMain,
}) {
  const { user } = useAuth();
  const { setLoading } = useToastContext();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isOlderThanTimeLimit =
    dayjs().diff(dayjs(item.createdAt), "minute") > timeLimit;
  const isSuperSalesAndTimeNotExceedTwoDays =
    user.isSuperSales && dayjs().diff(dayjs(item.createdAt), "day") < 2;

  const isAdmin = checkIfAdmin(user);
  const isMeeting = model === "MeetingReminder";
  const canDelete =
    isAdmin ||
    !isOlderThanTimeLimit ||
    isSuperSalesAndTimeNotExceedTwoDays ||
    (isMeeting && user.isSuperSales);

  if (!canDelete) return null;

  const handleDeleteClick = () => {
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    const data = { model };
    if (deleteModelesBeforeMain) {
      data.deleteModelesBeforeMain = deleteModelesBeforeMain;
    }
    const deleteResponse = await handleRequestSubmit(
      data,
      setLoading,
      `${endpoint}/${item.id}`,
      false,
      `Deleting ${model.toLowerCase()}...`,
      false,
      "DELETE"
    );
    setIsDeleting(false);
    if (deleteResponse && deleteResponse.status === 200) {
      if (onDelete) {
        onDelete(item);
      }
      setConfirmOpen(false);
    }
  };

  const handleCancelDelete = () => {
    setConfirmOpen(false);
  };

  const getTooltipTitle = () => {
    if (isAdmin) return `Delete ${model.toLowerCase()} (Admin)`;
    if (isOlderThanTimeLimit) return `Delete ${model.toLowerCase()}`;
    return `Delete ${model.toLowerCase()} (${
      timeLimit - dayjs().diff(dayjs(item.createdAt), "minute")
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
          Delete {model}
        </DialogTitle>

        <DialogContent>
          <DialogContentText id="delete-dialog-description" sx={{ mb: 1 }}>
            Are you sure you want to delete this {model.toLowerCase()}? This
            action cannot be undone.
          </DialogContentText>

          {contentKey && item[contentKey] && (
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
              {item[contentKey].substring(0, 150)}
              {item[contentKey].length > 150 && "..."}
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
