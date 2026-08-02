// Helper function to translate question types
export const getQuestionTypeInArabic = (type) => {
  const translations = {
    MULTIPLE_CHOICE: "Multiple choice",
    SINGLE_CHOICE: "Single choice",
    TRUE_FALSE: "True or false",
    TEXT: "Text answer",
    ORDERING: "Ordering",
  };
  return translations[type] || type;
};
