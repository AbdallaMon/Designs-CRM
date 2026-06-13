// Single-language (Arabic) resolution for backend message CODES emitted by the questions
// domain API ({ success, message: CODE, translationKey: "questionsMessages" }). The backend
// stays language-neutral (packages/shared/messages-codes/questions/questions.js); this is the
// FE lookup. Every code the questions surface can emit has an entry here; unknown codes fall
// back to a generic string. Mirrors features/calendar/config/calendarMessages.js.

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

  // ── generic envelope codes (shared) ──────────────────────────────────────────────
  OK: "تمت العملية بنجاح",
  CREATED: "تم الإنشاء بنجاح",
  UPDATED: "تم التحديث بنجاح",
  DELETED: "تم الحذف بنجاح",
  FORBIDDEN: "لا تملك صلاحية تنفيذ هذا الإجراء",
  ACCESS_DENIED: "لا تملك صلاحية الوصول",
  VALIDATION_ERROR: "بيانات غير صحيحة",
  NOT_FOUND: "العنصر غير موجود",
};

/**
 * Resolve a backend message CODE to an Arabic display string.
 * @param {string} code
 * @param {{ fallback?: string }} [opts]
 */
export function resolveQuestionsMessage(code, { fallback } = {}) {
  if (code && questionsMessages[code]) return questionsMessages[code];
  return fallback ?? "تمت العملية";
}
