import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Switch,
  Typography,
  Box,
  IconButton,
  Alert,
  CircularProgress,
  Grid,
} from "@mui/material";
import { MdClose, MdAdd, MdImage, MdCheck } from "react-icons/md";
import { ROLE_LABELS, USER_ROLES } from "@/app/helpers/constants";
import { checkIfAdmin } from "@/app/helpers/functions/utility";
import { useAuth } from "@/app/providers/AuthProvider";
import { useAlertContext } from "@/app/providers/MuiAlert";
import SimpleFileInput from "@/app/UiComponents/formComponents/SimpleFileInput";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { uploadInChunks } from "@/app/helpers/functions/uploadAsChunk";
import { useUploadContext } from "@/app/providers/UploadingProgressProvider";

function CreateCourseDialog({ open, onClose, onCourseCreate }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    file: "",
    isPublished: false,
    roles: [],
  });
  const { setAlertError } = useAlertContext();
  const [errors, setErrors] = useState({});
  const { toastLoading, setToastLoading } = useToastContext();
  const { user } = useAuth();
  const hasAdminAccess = checkIfAdmin(user);
  const { setProgress, setOverlay } = useUploadContext();

  const validateForm = () => {
    if (!formData.title.trim()) {
      setAlertError("Course title is required");
      return false;
    }

    if (formData.roles.length === 0) {
      setAlertError("At least one role must be selected");
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

  const handleRoleChange = (role, checked) => {
    setFormData((prev) => ({
      ...prev,
      roles: checked
        ? [...prev.roles, role]
        : prev.roles.filter((r) => r !== role),
    }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (formData.file) {
      const fileUpload = await uploadInChunks(
        formData.file,
        setProgress,
        setOverlay
      );
      formData.imageUrl = fileUpload.url;
    }
    delete formData.file;
    const req = await handleRequestSubmit(
      formData,
      setToastLoading,
      `admin/courses`,
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
      roles: [],
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
            You don't have permission to create courses. Only administrators can
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

          <FormControl component="fieldset" error={!!errors.roles}>
            <FormLabel component="legend">Allowed Roles</FormLabel>
            <FormGroup>
              <Grid gap={1} container>
                {Object.entries(USER_ROLES).map(([key, role]) => (
                  <Grid size={{ xs: 6, md: 3 }} key={role}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.roles.includes(role)}
                          onChange={(e) =>
                            handleRoleChange(role, e.target.checked)
                          }
                        />
                      }
                      label={ROLE_LABELS[role]}
                    />
                  </Grid>
                ))}
              </Grid>
            </FormGroup>
            {errors.roles && (
              <Typography color="error" variant="caption">
                {errors.roles}
              </Typography>
            )}
          </FormControl>

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
