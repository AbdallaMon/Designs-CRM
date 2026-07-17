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

export const USER_ROLES = {
  STAFF: "STAFF",
  THREE_D_DESIGNER: "THREE_D_DESIGNER",
  TWO_D_DESIGNER: "TWO_D_DESIGNER",
  ACCOUNTANT: "ACCOUNTANT",
  SUPER_ADMIN: "SUPER_ADMIN",
};

export const ROLE_LABELS = {
  [USER_ROLES.ADMIN]: "Admin",
  [USER_ROLES.STAFF]: "Sales",
  [USER_ROLES.THREE_D_DESIGNER]: "3D Designer",
  [USER_ROLES.TWO_D_DESIGNER]: "2D Designer",
  [USER_ROLES.ACCOUNTANT]: "Accountant",
  [USER_ROLES.SUPER_ADMIN]: "Super Admin",
};

export const QuestionTypes = {
  MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
  SINGLE_CHOICE: "SINGLE_CHOICE",
  TRUE_FALSE: "TRUE_FALSE",
  TEXT: "TEXT",
  ORDERING: "ORDERING",
};

export const QuestionTypesLabels = {
  MULTIPLE_CHOICE: "اختيار من متعدد",
  SINGLE_CHOICE: "اختيار واحد",
  TRUE_FALSE: "صح أو خطأ",
  TEXT: "إجابة نصية",
  ORDERING: "ترتيب",
};
