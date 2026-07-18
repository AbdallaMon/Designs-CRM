"use client";
import { Box, Typography, Button, Paper, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import EditLessonInfo from "./components/EditLessonInfo";
import VideosSection from "./components/VideosSection";
import PDFsSection from "./components/PDFsSection";
import LinksSection from "./components/LinksSection";

// Enhanced Main Component
export const LessonManagement = ({ lessonId, courseId }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        p: 3,
        maxWidth: "1200px",
        mx: "auto",
        backgroundColor: theme.palette.grey[50],
        minHeight: "100vh",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: "white",
          display: "flex",
          gap: 2,
          alignItems: "center",
        }}
      >
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Lesson Management
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9 }}>
          Lesson #{lessonId} • Course #{courseId}
        </Typography>
        <Button
          href={`/dashboard/courses/${courseId}/lessons`}
          variant="outlined"
          sx={{
            color: "black",
            background: theme.palette.secondary.main,
          }}
        >
          Back to course lessons
        </Button>
      </Paper>

      <Stack spacing={3}>
        <EditLessonInfo lessonId={lessonId} courseId={courseId} />
        <VideosSection lessonId={lessonId} courseId={courseId} />
        <PDFsSection lessonId={lessonId} courseId={courseId} />
        <LinksSection lessonId={lessonId} courseId={courseId} />
      </Stack>
    </Box>
  );
};
