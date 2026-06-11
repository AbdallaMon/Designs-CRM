import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { checkIfAdmin } from "@/app/helpers/functions/utility";
import { useAuth } from "@/app/providers/AuthProvider";
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

const CreateProjectsGroup = ({ clientLeadId, onGroupCreated }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const { setAlertError } = useAlertContext();
  const { setLoading } = useToastContext();
  const { user } = useAuth();
  const isAdmin = checkIfAdmin(user);
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
      setAlertError("Group title is required");
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
