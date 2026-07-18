import { Box } from "@mui/material";
import LessonComponent from "../../Lesson";

// Lesson View with enhanced layout
const LessonView = ({ isCompleted, lesson, onComplete, mustAddHomeWork }) => (
  <Box sx={{ height: "100%" }}>
    <LessonComponent
      isCompleted={isCompleted}
      lessonId={lesson.id}
      courseId={lesson.courseId}
      onComplete={onComplete}
      noTest={lesson?.tests.length === 0}
      mustAddHomeWork={mustAddHomeWork}
    />
  </Box>
);

export default LessonView;
