import { COURSE_QUESTION_TYPES } from "@dms/shared";

export const initialPageLimit = 20;
export const totalLimitPages = [10, 20, 50, 100];
export const simpleModalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  maxHeight: "90%",
  overflow: "auto",
  width: {
    xs: "95%",
    sm: "80%",
    md: "60%",
  },
  maxWidth: {
    md: "600px",
  },
  bgcolor: "background.paper",
  boxShadow: 24,
  borderRadius: 2,
  p: 4,
};

export const NotificationType = {
  OTHER: "Other",
};

export const QuestionTypes = COURSE_QUESTION_TYPES;

export const QuestionTypesLabels = {
  MULTIPLE_CHOICE: "Multiple choice",
  SINGLE_CHOICE: "Single choice",
  TRUE_FALSE: "True or false",
  TEXT: "Text answer",
  ORDERING: "Ordering",
};
