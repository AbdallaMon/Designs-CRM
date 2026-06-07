// questions module message CODES. SCREAMING_SNAKE_CASE, key === value (the string
// IS the code). Carried in the API envelope `message` field; the client resolves
// (translationKey: questionsMessages, code) → displayed string. Language-neutral —
// never put Arabic/English prose here.
//
// Covers the SPIN session-questions/answers surface and the VERSA objection-handling
// surface (legacy `/shared/questions/*`). Global config reads are gated by the code;
// the lead-scoped reads/writes additionally pass through the leads-module object-scope
// checker (the IDOR fix). The heavy seeding/Prisma logic is owned by the v2 repo.
export const questionsMessagesCodes = {
  // ── reads ──────────────────────────────────────────────────────────────────────
  QUESTION_TYPES_FETCHED: "QUESTION_TYPES_FETCHED",
  SESSION_QUESTIONS_FETCHED: "SESSION_QUESTIONS_FETCHED",
  VERSA_CATEGORIES_FETCHED: "VERSA_CATEGORIES_FETCHED",
  VERSA_FETCHED: "VERSA_FETCHED",

  // ── writes ───────────────────────────────────────────────────────────────────────
  ANSWER_SAVED: "ANSWER_SAVED",
  ANSWERS_SAVED: "ANSWERS_SAVED",
  CUSTOM_QUESTION_CREATED: "CUSTOM_QUESTION_CREATED",
  VERSA_CREATED: "VERSA_CREATED",
  VERSA_STEP_SAVED: "VERSA_STEP_SAVED",

  // ── errors / domain rules ─────────────────────────────────────────────────────────
  QUESTION_NOT_FOUND: "QUESTION_NOT_FOUND",
  VERSA_STEP_NOT_FOUND: "VERSA_STEP_NOT_FOUND",
  QUESTION_ACCESS_DENIED: "QUESTION_ACCESS_DENIED",
};
