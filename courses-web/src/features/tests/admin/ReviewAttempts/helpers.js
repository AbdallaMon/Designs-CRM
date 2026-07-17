// Helper function to translate question types
export const getQuestionTypeInArabic = (type) => {
  const translations = {
    MULTIPLE_CHOICE: "اختيار متعدد",
    SINGLE_CHOICE: "اختيار واحد",
    TRUE_FALSE: "صح أم خطأ",
    TEXT: "إجابة نصية",
    ORDERING: "ترتيب",
  };
  return translations[type] || type;
};
