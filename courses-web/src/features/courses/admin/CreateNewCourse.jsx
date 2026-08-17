import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Typography,
  Box,
  IconButton,
  Alert,
  CircularProgress,
} from "@mui/material";
import { MdClose, MdAdd, MdImage, MdCheck } from "react-icons/md";
import { checkIfAdmin } from "@/app/helpers/functions/utility";
import { useAuth } from "@/app/providers/AuthProvider";
import { useAlertContext } from "@/app/providers/MuiAlert";
import SimpleFileInput from "@/shared/components/formComponents/SimpleFileInput";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { uploadInChunks } from "@/app/helpers/functions/uploadAsChunk";
import { useUploadContext } from "@/app/providers/UploadingProgressProvider";
import { coursePayload } from "@/app/helpers/contracts/coursePayloads";
import { USER_FEEDBACK_MESSAGES as FEEDBACK } from "@dms/shared";

function CreateCourseDialog({ open, onClose, onCourseCreate }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    file: "",
    isPublished: false,
  });
  const { setAlertError } = useAlertContext();
  const [errors, setErrors] = useState({});
  const { toastLoading, setToastLoading } = useToastContext();
  const { user } = useAuth();
  const hasAdminAccess = checkIfAdmin(user);
  const { setProgress, setOverlay } = useUploadContext();

  const validateForm = () => {
    if (!formData.title.trim()) {
      setAlertError(FEEDBACK.COURSE_TITLE_REQUIRED);
      return false;
    }

    return true;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    let imageUrl = formData.imageUrl || null;
    if (formData.file) {
      const fileUpload = await uploadInChunks(
        formData.file,
        setProgress,
        setOverlay
      );
      if (!fileUpload.url) return;
      imageUrl = fileUpload.url;
    }
    const req = await handleRequestSubmit(
      coursePayload({ ...formData, imageUrl }),
      setToastLoading,
      "courses",
      false,
      "Creating"
    );
    if (req.status === 200) {
      handleClose();
      await onCourseCreate();
    }
  };

  const handleClose = () => {
    setFormData({
      title: "",
      description: "",
      file: "",
      isPublished: false,
    });
    setErrors({});
    onClose();
  };

  if (!hasAdminAccess) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Access Denied</DialogTitle>
        <DialogContent>
          <Alert severity="error">
            You do not have permission to create courses. Only administrators can
            perform this action.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Create New Course</Typography>
          <IconButton onClick={handleClose} size="small">
            <MdClose />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box display="flex" flexDirection="column" gap={3}>
          <TextField
            label="Course Title"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            error={!!errors.title}
            helperText={errors.title}
            fullWidth
            required
          />

          <TextField
            label="Description"
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            multiline
            rows={4}
            fullWidth
            placeholder="Enter course description..."
          />

          <SimpleFileInput
            id="file"
            setData={setFormData}
            label={"Course banner"}
            input={{ accept: "image/*" }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={formData.isPublished}
                onChange={(e) =>
                  handleInputChange("isPublished", e.target.checked)
                }
              />
            }
            label="Publish course immediately"
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={toastLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={toastLoading}
          startIcon={toastLoading ? <CircularProgress size={20} /> : <MdAdd />}
        >
          {toastLoading ? "Creating..." : "Create Course"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function CreateCourse({ onUpdate }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <Box p={3}>
      <Button
        variant="contained"
        onClick={() => setDialogOpen(true)}
        startIcon={<MdAdd />}
      >
        Create Course
      </Button>

      <CreateCourseDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCourseCreate={onUpdate}
      />
    </Box>
  );
}
