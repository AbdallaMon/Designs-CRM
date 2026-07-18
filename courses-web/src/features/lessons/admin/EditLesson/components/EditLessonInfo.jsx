"use client";
import { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Skeleton,
  Stack,
  Avatar,
  Grid,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { FiEdit2, FiSave, FiChevronDown } from "react-icons/fi";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import LoadingOverlay from "@/shared/components/feedback/loaders/LoadingOverlay";

// Enhanced Edit Lesson Info Component
const EditLessonInfo = ({ courseId, lessonId }) => {
  const theme = useTheme();
  const [lesson, setLesson] = useState({});
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: "",
    order: 1,
    isPreviewable: false,
  });
  const { toastLoading, setToastLoading } = useToastContext();
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  async function getLessonData() {
    const req = await getDataAndSet({
      url: `admin/courses/${courseId}/lessons/${lessonId}`,
      setData: setLesson,
      setLoading,
    });
    console.log(req, "req");
    if (req.status === 200) {
      const lesson = req.data;
      setFormData({
        title: lesson.title || "",
        description: lesson.description || "",
        duration: lesson.duration || "",
        order: lesson.order || 1,
        isPreviewable: lesson.isPreviewable || false,
      });
      setHasLoaded(true);
    }
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
      `admin/courses/${courseId}/lessons/${lessonId}`,
      false,
      "Updating",
      false,
      "PUT"
    );
    if (req.status === 200) {
      await getLessonData();
    }
  };

  const handleAccordionChange = (event, isExpanded) => {
    if (isExpanded && !hasLoaded) {
      getLessonData();
    }
  };

  return (
    <Accordion
      onChange={handleAccordionChange}
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderRadius: 2,
        boxShadow: theme.shadows[1],
        "&:before": {
          display: "none",
        },
        "&.Mui-expanded": {
          margin: 0,
        },
      }}
    >
      <AccordionSummary
        expandIcon={<FiChevronDown />}
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          borderRadius: "8px 8px 0 0",
          minHeight: 64,
          "&.Mui-expanded": {
            minHeight: 64,
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ bgcolor: theme.palette.primary.dark }}>
            <FiEdit2 />
          </Avatar>
          <Typography variant="h6" fontWeight="medium">
            Lesson Information
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ position: "relative", p: 3 }}>
        {loading && <LoadingOverlay />}
        {!hasLoaded && !loading ? (
          <Stack spacing={2}>
            <Skeleton variant="rectangular" height={56} />
            <Skeleton variant="rectangular" height={56} />
            <Skeleton variant="rectangular" height={120} />
          </Stack>
        ) : (
          <Grid container spacing={3}>
            <Grid size={{ md: 6 }}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                variant="outlined"
                size="medium"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid size={{ md: 3 }}>
              <TextField
                fullWidth
                label="Duration (minutes)"
                type="number"
                value={formData.duration}
                onChange={(e) =>
                  handleInputChange("duration", parseInt(e.target.value) || "")
                }
                variant="outlined"
                size="medium"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
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
                size="medium"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid size={10}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                variant="outlined"
                multiline
                rows={4}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid size={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isPreviewable}
                    onChange={(e) =>
                      handleInputChange("isPreviewable", e.target.checked)
                    }
                    color="primary"
                  />
                }
                label="Allow Preview"
                sx={{ ml: 0 }}
              />
            </Grid>

            <Grid>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                startIcon={<FiSave />}
                size="large"
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  px: 4,
                  py: 1.5,
                }}
              >
                {loading ? "Updating..." : "Update Lesson Info"}
              </Button>
            </Grid>
          </Grid>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default EditLessonInfo;
