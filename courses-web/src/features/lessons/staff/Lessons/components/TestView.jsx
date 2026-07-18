import { Container } from "@mui/material";
import TestComponent from "@/features/tests/staff/Test";

// Test View with enhanced layout
const TestView = ({ test, mustAddHomeWork, courseId, onComplete }) => (
  <Container maxWidth="md" sx={{ py: 2, px: 0 }}>
    <TestComponent
      testId={test.id}
      courseId={courseId}
      onComplete={onComplete}
      mustAddHomeWork={mustAddHomeWork}
    />
  </Container>
);

export default TestView;
