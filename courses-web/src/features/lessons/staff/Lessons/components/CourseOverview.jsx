import {
  Box,
  Container,
  Typography,
  Chip,
  Button,
  Paper,
  Alert,
} from "@mui/material";
import {
  MdPlayArrow as PlayArrow,
  MdCheckCircle as CheckCircle,
  MdQuiz as Quiz,
  MdSchool as School,
} from "react-icons/md";

// Course Overview Component (when no lesson/test is selected)
const CourseOverview = ({
  course,
  userProgress,
  lastAvailableIndex,
  courseItems,
  isItemAccessible,
  handleItemClick,
}) => (
  <Container maxWidth="lg" sx={{ py: 3 }}>
    <Paper elevation={2} sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
      <School sx={{ fontSize: 80, color: "primary.main", mb: 2 }} />
      <Typography variant="h4" sx={{ fontWeight: "bold", mb: 2 }}>
        {course?.title}
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 4, maxWidth: 600, mx: "auto" }}
      >
        {course?.description}
      </Typography>

      {lastAvailableIndex === -1 ? (
        <Alert severity="warning" sx={{ mb: 3, maxWidth: 500, mx: "auto" }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
            No Access Yet
          </Typography>
          <Typography variant="body2">
            You do not have permission to access any lessons in this course.
            Please contact your instructor.
          </Typography>
        </Alert>
      ) : (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: "medium" }}>
            Ready to Start Learning?
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<PlayArrow />}
            onClick={() => {
              const firstAccessibleItem = courseItems.find((_, index) =>
                isItemAccessible(courseItems[index], index, courseItems)
              );
              if (firstAccessibleItem) {
                handleItemClick(firstAccessibleItem);
              }
            }}
            sx={{ px: 4, py: 1.5, fontSize: "1.1rem" }}
          >
            Start First Lesson
          </Button>
        </Box>
      )}

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Chip
          icon={<School />}
          label={`${course?._count.lessons} Lessons`}
          variant="outlined"
          color="primary"
        />
        <Chip
          icon={<CheckCircle />}
          label={`${userProgress?.completedLessons?.length || 0} Completed`}
          variant="outlined"
          color="success"
        />
        <Chip
          icon={<Quiz />}
          label={`${course?._count.tests} Tests`}
          variant="outlined"
        />
      </Box>
    </Paper>
  </Container>
);

export default CourseOverview;
