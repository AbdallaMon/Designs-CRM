// Single-language (Arabic) resolution for backend message CODES emitted by the questions
// domain API ({ success, message: CODE, translationKey: "questionsMessages" }). The backend
// stays language-neutral (packages/shared/messages-codes/questions/questions.js); this is the
// FE lookup. Every code the questions surface can emit has an entry here; unknown codes fall
// back to a generic string. Mirrors features/calendar/config/calendarMessages.js.

export const questionsMessages = {
  // ── reads ──────────────────────────────────────────────────────────────────────
  QUESTION_TYPES_FETCHED: "Question types fetched",
  SESSION_QUESTIONS_FETCHED: "Session questions fetched",
  VERSA_CATEGORIES_FETCHED: "Objection-handling categories fetched",
  VERSA_FETCHED: "Objection handling fetched",

  // ── writes ───────────────────────────────────────────────────────────────────────
  ANSWER_SAVED: "Answer saved",
  ANSWERS_SAVED: "Answers saved",
  CUSTOM_QUESTION_CREATED: "Custom question created",
  VERSA_CREATED: "Objection handling created",
  VERSA_STEP_SAVED: "Step saved",

  // ── errors / domain rules ─────────────────────────────────────────────────────────
  QUESTION_NOT_FOUND: "Question not found",
  VERSA_STEP_NOT_FOUND: "Step not found",
  QUESTION_ACCESS_DENIED: "You do not have access to this question",

  // ── generic envelope codes (shared) ──────────────────────────────────────────────
  OK: "Operation completed successfully",
  CREATED: "Created successfully",
  UPDATED: "Updated successfully",
  DELETED: "Deleted successfully",
  FORBIDDEN: "You do not have permission to perform this action",
  ACCESS_DENIED: "You do not have access",
  VALIDATION_ERROR: "Invalid data",
  NOT_FOUND: "Item not found",
};

/**
 * Resolve a backend message CODE to an Arabic display string.
 * @param {string} code
 * @param {{ fallback?: string }} [opts]
 */
export function resolveQuestionsMessage(code, { fallback } = {}) {
  if (code && questionsMessages[code]) return questionsMessages[code];
  return fallback ?? "Operation completed";
}
