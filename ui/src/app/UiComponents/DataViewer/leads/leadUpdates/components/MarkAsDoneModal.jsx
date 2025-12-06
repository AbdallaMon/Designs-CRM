import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Box,
} from "@mui/material";
import { useState } from "react";
import { MdCheckCircle, MdUndo } from "react-icons/md";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { checkIfAdmin } from "@/app/helpers/functions/utility";
import { useAuth } from "@/app/providers/AuthProvider";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";

/**
 * MarkAsDoneModal Component
 * Handles marking updates as done/undone with confirmation dialog
 */
export function MarkAsDoneModal({
  handleMenuClose,
  sharedUpdate,
  isArchived,
  onToggleArchive,
  update,
  onUpdate,
}) {
  const [markDoneOpen, setMarkDoneOpen] = useState(false);
  const { setLoading } = useToastContext();
  const { user } = useAuth();
  const isAdmin = checkIfAdmin(user);

  // Dynamic text and icons based on archive status
  const actionText = isArchived ? "Mark as Undone" : "Mark as Done";
  const confirmText = isArchived
    ? "Are you sure you want to mark this update as undone? This will make it active again."
    : "Are you sure you want to mark this update as done? This action cannot be changed once confirmed.";
  const dialogTitle = isArchived ? "Mark as Undone" : "Mark as Done";
  const iconComponent = isArchived ? (
    <MdUndo fontSize="small" color="warning" />
  ) : (
    <MdCheckCircle fontSize="small" color="success" />
  );
  const buttonColor = isArchived ? "warning" : "success";
  const buttonStartIcon = isArchived ? <MdUndo /> : <MdCheckCircle />;
  const avatarBgColor = isArchived ? "warning.main" : "success.main";
  const avatarIcon = isArchived ? (
    <MdUndo fontSize="small" />
  ) : (
    <MdCheckCircle fontSize="small" />
  );

  // Non-admins can't mark as undone
  if (!isAdmin && isArchived) return null;

  const handleOpenMarkDone = () => {
    setMarkDoneOpen(true);
  };

  const handleMarkAsDone = async () => {
    const url = `shared/updates/shared-updates/${sharedUpdate.id}/archive`;
    const request = await handleRequestSubmit(
      { isArchived: !isArchived },
      setLoading,
      url,
      false,
      "Updating",
      false,
      "PUT"
    );

    if (request.status === 200) {
      if (onToggleArchive) {
        onToggleArchive(request.data, !isArchived);
      }
      setMarkDoneOpen(false);
      if (handleMenuClose) {
        handleMenuClose();
      }
      if (onUpdate) {
        onUpdate(request.data);
      }
    }
  };

  return (
    <>
      <MenuItem onClick={handleOpenMarkDone}>
        <ListItemIcon sx={{ minWidth: 36 }}>{iconComponent}</ListItemIcon>
        <ListItemText
          primary={actionText}
          primaryTypographyProps={{
            fontSize: "0.875rem",
            fontWeight: 500,
            color: `${buttonColor}.main`,
          }}
        />
      </MenuItem>

      <Dialog
        open={markDoneOpen}
        onClose={() => setMarkDoneOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            pb: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Avatar
            sx={{
              bgcolor: avatarBgColor,
              width: 32,
              height: 32,
            }}
          >
            {avatarIcon}
          </Avatar>
          <Box flex={1}>
            <Typography variant="h6" component="h2">
              {dialogTitle}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isArchived
                ? "Revert update status"
                : "Confirm completion of this update"}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {confirmText}
          </Typography>

          <Box
            sx={{
              p: 2,
              backgroundColor: "grey.50",
              borderRadius: 1,
              border: "1px solid",
              borderColor: "grey.200",
              mb: 2,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Update Details:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Title:</strong> {update.title}
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 2, gap: 1 }}>
          <Button
            onClick={() => setMarkDoneOpen(false)}
            variant="outlined"
            sx={{ minWidth: 100 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleMarkAsDone}
            variant="contained"
            color={buttonColor}
            startIcon={buttonStartIcon}
            sx={{ minWidth: 120 }}
          >
            {actionText}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
