"use client";

import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiPlus, FiSave, FiX } from "react-icons/fi";

export const CreateLesson = ({ courseId }) => {
  const [open, setOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: "",
    order: 1,
    isPreviewable: false,
  });
  const { toastLoading: loading, setToastLoading } = useToastContext();
  function onLessonCreated(newLessonId) {
    window.location.href = `/dashboard/courses/${courseId}/lessons/${newLessonId}`;
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    const req = await handleRequestSubmit(
      formData,
      setToastLoading,
      `admin/courses/${courseId}/lessons`,
      false,
      "Creating"
    );
    if (req.status === 200) {
      onLessonCreated(req.data.id);
    }
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    // Reset form data when closing
    setFormData({
      title: "",
      description: "",
      duration: "",
      order: 1,
      isPreviewable: false,
    });
  };
  const isFormValid = formData.title.trim() && formData.duration;

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        onClick={handleOpen}
        startIcon={<FiPlus />}
        sx={{ mb: 2 }}
      >
        Create New Lesson
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: "500px" },
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="flex-end" alignItems="center">
            <IconButton onClick={handleClose} size="small">
              <FiX />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom color="primary">
                Create New Lesson
              </Typography>

              <Grid container spacing={3}>
                <Grid size={{ md: 6 }}>
                  <TextField
                    fullWidth
                    label="Title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    variant="outlined"
                    required
                  />
                </Grid>

                <Grid size={{ md: 3 }}>
                  <TextField
                    fullWidth
                    label="Duration (minutes)"
                    type="number"
                    value={formData.duration}
                    onChange={(e) =>
                      handleInputChange(
                        "duration",
                        parseInt(e.target.value) || ""
                      )
                    }
                    variant="outlined"
                    required
                  />
                </Grid>

                <Grid size={{ md: 3 }}>
                  <TextField
                    fullWidth
                    label="Order"
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      handleInputChange("order", parseInt(e.target.value) || 1)
                    }
                    variant="outlined"
                  />
                </Grid>

                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    variant="outlined"
                    multiline
                    rows={3}
                  />
                </Grid>

                <Grid size={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isPreviewable}
                        onChange={(e) =>
                          handleInputChange("isPreviewable", e.target.checked)
                        }
                      />
                    }
                    label="Allow Preview"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={handleClose}
            color="inherit"
            variant="outlined"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!isFormValid || loading}
            startIcon={<FiSave />}
          >
            {loading ? "Creating..." : "Create Lesson"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
