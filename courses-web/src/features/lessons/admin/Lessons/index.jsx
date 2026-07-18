"use client";

import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { useState, useEffect } from "react";
import {
  Typography,
  Box,
  Alert,
  Grid,
  Container,
  AppBar,
  Toolbar,
} from "@mui/material";
import FullScreenLoader from "@/shared/components/feedback/loaders/FullscreenLoader";
import { CreateLesson } from "../CreateNewLesson";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import LessonCard from "./components/LessonCard";
import LessonPreviewDialog from "./components/LessonPreviewDialog";

export function Lessons({ courseId }) {
  const [data, setData] = useState({ courseTitle: "", lessons: [] });
  const [loading, setLoading] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { setToastLoading } = useToastContext();
  useEffect(() => {
    if (courseId) {
      getLessons();
    }
  }, [courseId]);

  async function getLessons() {
    await getDataAndSet({
      url: `admin/courses/${courseId}/lessons`,
      setData,
      setLoading,
    });
  }
  async function toggleMustUploadHomeWork({ lesson }) {
    const req = await handleRequestSubmit(
      { mustUploadHomework: !lesson.mustUploadHomework },
      setToastLoading,
      `admin/courses/${courseId}/lessons/${lesson.id}/home-works/toggle`,
      false,
      "Updating"
    );
    if (req.status === 200) {
      setData((old) => {
        return {
          ...old,
          lessons: old.lessons.map((l) => {
            if (l.id === lesson.id) {
              return { ...l, mustUploadHomework: !l.mustUploadHomework };
            }
            return l;
          }),
        };
      });
    }
  }
  const handlePreview = (lesson) => {
    setSelectedLesson(lesson);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedLesson(null);
  };

  console.log(data, "data");
  return (
    <Box>
      <AppBar position="static" elevation={1}>
        {loading && <FullScreenLoader />}
        <Container maxWidth="lg">
          <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="h5" component="h2" sx={{ flexGrow: 1 }}>
              Lessons for course {data.courseTitle}
            </Typography>
            <CreateLesson courseId={courseId} />
          </Toolbar>
        </Container>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {data?.lessons.length === 0 && !loading && (
            <Alert severity="info">
              No lessons found for this course. Create your first lesson to get
              started.
            </Alert>
          )}
          {data?.lessons?.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              courseId={courseId}
              getLessons={getLessons}
              toggleMustUploadHomeWork={toggleMustUploadHomeWork}
              handlePreview={handlePreview}
            />
          ))}
        </Grid>
      </Container>
      {/* Preview Dialog */}
      <LessonPreviewDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        selectedLesson={selectedLesson}
      />
    </Box>
  );
}
