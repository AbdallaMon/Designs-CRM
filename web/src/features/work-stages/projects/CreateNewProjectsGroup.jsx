import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { usePermission } from "@/app/hooks/usePermission";
import { ADMIN_RESIDUAL_CODES } from "@/app/helpers/permissionCodes";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Tooltip,
} from "@mui/material";
import { useState } from "react";
import { FaFolderPlus, FaTimes } from "react-icons/fa";
import { USER_FEEDBACK_MESSAGES as FEEDBACK } from "@dms/shared";

const CreateProjectsGroup = ({ clientLeadId, onGroupCreated }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const { setAlertError } = useAlertContext();
  const { setLoading } = useToastContext();
  // Approved normalization (profiles sweep): create-project-group affordance moved off
  // checkIfAdmin (ADMIN/SUPER_ADMIN/CONTACT_INITIATOR) to the admin_residual.project.group_create
  // code — drops CONTACT_INITIATOR, adds isSuperSales (matches the proper admin-tier grant).
  const { hasPermission } = usePermission();
  const isAdmin = hasPermission(ADMIN_RESIDUAL_CODES.PROJECT_GROUP_CREATE);
  const handleOpen = () => {
    setOpen(true);
    setTitle("");
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !title.trim()) {
      setAlertError(FEEDBACK.GROUP_TITLE_REQUIRED);
      return;
    }

    const response = await handleRequestSubmit(
      { title, clientLeadId },
      setLoading,
      `admin/projects/create-group`,
      false,
      "Creating"
    );

    if (response.status === 200) {
      onGroupCreated(response.data);
      handleClose();
    }
  };
  if (!isAdmin) return;
  return (
    <>
      <Tooltip title="Create New Project Group">
        <Button
          variant="outlined"
          color="primary"
          onClick={handleOpen}
          startIcon={<FaFolderPlus />}
          size="small"
        >
          New Projects Group
        </Button>
      </Tooltip>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box display="flex" alignItems="center" gap={1}>
              <FaFolderPlus />
              Create New Project Group
            </Box>
            <IconButton size="small" onClick={handleClose} aria-label="close">
              <FaTimes />
            </IconButton>
          </Box>
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Group Title"
              type="text"
              fullWidth
              variant="outlined"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleClose} color="inherit" variant="outlined">
              Cancel
            </Button>
            <Button
              type="submit"
              color="primary"
              variant="contained"
              startIcon={<FaFolderPlus />}
            >
              Create Group
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};
export default CreateProjectsGroup;
