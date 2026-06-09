// Central Arabic map for the QUESTIONS message CODES
// (packages/shared/messages-codes/questions/questions.js → questionsMessagesCodes).
// translationKey namespace: "questionsMessages". Harvested from
// features/questions/config/questionsMessages.js. CODE → عربي.

export const questionsMessages = {
  // ── reads ──────────────────────────────────────────────────────────────────────
  QUESTION_TYPES_FETCHED: "تم جلب أنواع الأسئلة",
  SESSION_QUESTIONS_FETCHED: "تم جلب أسئلة الجلسة",
  VERSA_CATEGORIES_FETCHED: "تم جلب فئات معالجة الاعتراضات",
  VERSA_FETCHED: "تم جلب معالجة الاعتراضات",

  // ── writes ───────────────────────────────────────────────────────────────────────
  ANSWER_SAVED: "تم حفظ الإجابة",
  ANSWERS_SAVED: "تم حفظ الإجابات",
  CUSTOM_QUESTION_CREATED: "تم إنشاء السؤال المخصص",
  VERSA_CREATED: "تم إنشاء معالجة الاعتراضات",
  VERSA_STEP_SAVED: "تم حفظ الخطوة",

  // ── errors / domain rules ─────────────────────────────────────────────────────────
  QUESTION_NOT_FOUND: "السؤال غير موجود",
  VERSA_STEP_NOT_FOUND: "الخطوة غير موجودة",
  QUESTION_ACCESS_DENIED: "لا تملك صلاحية الوصول إلى هذا السؤال",
};
