"use client";

import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Grid,
  Container,
  AppBar,
  Toolbar,
  FormControlLabel,
  Switch,
} from "@mui/material";
import {
  MdPlayArrow,
  MdPictureAsPdf,
  MdLink,
  MdEdit,
  MdPreview,
  MdAccessTime,
  MdVisibility,
  MdVisibilityOff,
  MdOndemandVideo,
  MdQuiz,
  MdDelete,
} from "react-icons/md";
import Link from "next/link";
import FullScreenLoader from "@/app/UiComponents/feedback/loaders/FullscreenLoader";
import { CreateLesson } from "./CreateNewLesson";
import DeleteModal from "@/app/models/DeleteModal";
import LessonAccessDialog from "./LessonAccess";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";

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

  const formatDuration = (duration) => {
    if (!duration) return "No duration set";
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const getVideoTypeIcon = (videoType) => {
    return videoType === "IFRAME" ? <MdOndemandVideo /> : <MdPlayArrow />;
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
            <Grid item xs={12} md={6} xl={4} key={lesson.id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: 3,
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    mb={2}
                  >
                    <Typography
                      variant="h6"
                      component="h3"
                      gutterBottom
                      sx={{ flex: 1, mr: 2 }}
                    >
                      {lesson.title}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        label={`Order : ${lesson.order}`}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                      <DeleteModal
                        buttonType="ICON"
                        item={lesson}
                        href={`admin/courses/${courseId}/lessons`}
                        handleClose={getLessons}
                      />
                    </Box>
                  </Box>
                  <Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={lesson.mustUploadHomework}
                          onChange={async (e) => {
                            await toggleMustUploadHomeWork({ lesson });
                          }}
                          color="primary"
                        />
                      }
                      label="Must upload home works"
                      sx={{ ml: 0 }}
                    />
                  </Box>
                  {lesson.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        display: "-webkit-box",
                        "-webkit-line-clamp": 3,
                        "-webkit-box-orient": "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {lesson.description}
                    </Typography>
                  )}

                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <MdAccessTime size={16} />
                      <Typography variant="body2" color="text.secondary">
                        {formatDuration(lesson.duration)}
                      </Typography>
                    </Box>

                    <Box display="flex" alignItems="center" gap={0.5}>
                      {lesson.isPreviewable ? (
                        <MdVisibility size={16} color="green" />
                      ) : (
                        <MdVisibilityOff size={16} color="gray" />
                      )}
                      <Typography variant="body2" color="text.secondary">
                        {lesson.isPreviewable
                          ? "Previewable"
                          : "Not previewable"}
                      </Typography>
                    </Box>
                  </Box>

                  <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                    {lesson.videos?.length > 0 && (
                      <Chip
                        icon={<MdOndemandVideo />}
                        label={`${lesson.videos.length} video${
                          lesson.videos.length > 1 ? "s" : ""
                        }`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    <Chip
                      icon={<MdPictureAsPdf />}
                      label={`${lesson.pdfs?.length || 0} PDF${
                        (lesson.pdfs?.length || 0) !== 1 ? "s" : ""
                      }`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      icon={<MdLink />}
                      label={`${lesson.links?.length || 0} link${
                        (lesson.links?.length || 0) !== 1 ? "s" : ""
                      }`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      icon={<MdQuiz />}
                      label={`${lesson._count.tests} test${
                        lesson._count.tests > 1 ? "s" : ""
                      }`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>

                  <Box mt="auto">
                    <LessonAccessDialog
                      courseId={courseId}
                      lessonId={lesson.id}
                    />
                  </Box>
                </CardContent>

                {/* Enhanced Actions Section */}
                <Box sx={{ p: 2, pt: 1, borderTop: 1, borderColor: "divider" }}>
                  {/* Primary Actions Row */}
                  <Box display="flex" gap={1} mb={1}>
                    <Button
                      startIcon={<MdPreview />}
                      onClick={() => handlePreview(lesson)}
                      variant="outlined"
                      size="small"
                      sx={{ flex: 1 }}
                    >
                      Preview
                    </Button>
                    <Button
                      startIcon={<MdEdit />}
                      variant="contained"
                      size="small"
                      component={Link}
                      href={`/dashboard/courses/${lesson.courseId}/lessons/${lesson.id}`}
                      sx={{ flex: 1 }}
                    >
                      Edit
                    </Button>
                  </Box>

                  {/* Secondary Actions Row */}
                  <Box display="flex" gap={1}>
                    <Button
                      component={Link}
                      href={`/dashboard/courses/${lesson.courseId}/lessons/${lesson.id}/home-works`}
                      variant="outlined"
                      size="small"
                      sx={{ flex: 1 }}
                    >
                      Homework
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<MdQuiz />}
                      component={Link}
                      href={`/dashboard/courses/${lesson.courseId}/lessons/${lesson.id}/tests`}
                      sx={{ flex: 1 }}
                    >
                      Tests
                    </Button>
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
      {/* Preview Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">{selectedLesson?.title}</Typography>

            <Chip
              label={`Lesson #${selectedLesson?.order}`}
              size="small"
              variant="outlined"
              color="primary"
            />
          </Box>
        </DialogTitle>

        <DialogContent>
          {selectedLesson && (
            <Box>
              {selectedLesson.description && (
                <Box mb={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedLesson.description}
                  </Typography>
                </Box>
              )}

              <Box display="flex" gap={4} mb={3}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Duration
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDuration(selectedLesson.duration)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Preview Status
                  </Typography>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    {selectedLesson.isPreviewable ? (
                      <MdVisibility size={16} color="green" />
                    ) : (
                      <MdVisibilityOff size={16} color="gray" />
                    )}
                    <Typography variant="body2" color="text.secondary">
                      {selectedLesson.isPreviewable
                        ? "Previewable"
                        : "Not previewable"}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              {selectedLesson.videos?.length > 0 && (
                <Box mb={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Videos ({selectedLesson.videos.length})
                  </Typography>
                  <List dense>
                    {selectedLesson.videos.map((video, index) => (
                      <ListItem key={video.id}>
                        <ListItemIcon>
                          {getVideoTypeIcon(video.videoType)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <a
                              href={video.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              underline="hover"
                            >
                              Video url {video.url}
                            </a>
                          }
                          secondary={`Type: ${video.videoType}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {selectedLesson.pdfs?.length > 0 && (
                <Box mb={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    PDFs ({selectedLesson.pdfs.length})
                  </Typography>
                  <List dense>
                    {selectedLesson.pdfs.map((pdf, index) => (
                      <ListItem key={pdf.id}>
                        <ListItemIcon>
                          <MdPictureAsPdf />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <a
                              href={pdf.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              underline="hover"
                            >
                              PDF {pdf.url}
                            </a>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {selectedLesson.links?.length > 0 && (
                <Box mb={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Links ({selectedLesson.links.length})
                  </Typography>
                  <List dense>
                    {selectedLesson.links.map((link) => (
                      <ListItem key={link.id}>
                        <ListItemIcon>
                          <MdLink />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              underline="hover"
                            >
                              {link.title}
                            </a>
                          }
                          secondary={link.url}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {selectedLesson.tests?.length > 0 && (
                <Box mb={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Tests ({selectedLesson.tests.length})
                  </Typography>
                  <List dense>
                    {selectedLesson.tests.map((test, index) => (
                      <ListItem key={test.id}>
                        <ListItemIcon>
                          <MdQuiz />
                        </ListItemIcon>
                        <ListItemText primary={`Test ${index + 1}`} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="caption" color="text.secondary">
                  Created:{" "}
                  {new Date(selectedLesson.createdAt).toLocaleDateString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Updated:{" "}
                  {new Date(selectedLesson.updatedAt).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
