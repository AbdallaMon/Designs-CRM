// Questions domain — API contract surface. All paths are RELATIVE to the v2 API base
// (apiFetch is configured with config.apiUrl === /v2; do NOT prefix with /v2 here). One
// place to edit if a backend path changes (reconciliation point vs
// server/src/modules/questions/questions.route.js).
//
// SCOPE: the SPIN session-questions/answers surface + the VERSA objection-handling surface
// (legacy `/shared/questions/*`, now `/v2/questions/*`). Auth is mounted once at the BE
// router; every route declares its QUESTION.* permission code (granted to every authed role
// via the legacy SHARED gate). The lead-scoped reads/writes additionally pass through the
// leads-module object-scope checker on the BE (the IDOR fix) — the dtos emit NO
// capabilities.*, so the FE gates authed actions on the QUESTION.* CODES only; the server
// enforces the lead scope. Numeric path params are coerced + validated on the BE (422 on bad).
//
// Backend contract (confirmed against questions.route.js / questions.validation.js):
//   GET  /question-types/:clientLeadId              → question-type config (+ default seeding)  [question.config.view]
//   GET  /session-questions/:clientLeadId?questionTypeId=  → session questions for a type        [question.session.view]
//   POST /answer/bulk                               → bulk-answer many session questions          [question.answer.submit]
//                                  body (.strict): { answers: [{ sessionQuestionId, response }] }
//   POST /:sessionQuestionId/answer                 → answer one session question                 [question.answer.submit]
//                                  body (.strict): { response }
//   POST /lead/:clientLeadId/custom-question        → create a lead custom question               [question.custom.create]
//                                  body (.strict): { questionTypeId, title, isCustom? (ignored) }
//   PUT  /versa/steps/:stepId                       → update a VERSA step                          [question.versa.manage]
//                                  body (.strict): { label?, question?, answer?, clientResponse? }
//   GET  /versa/:clientLeadId                       → VERSA categories for a lead                  [question.session.view]
//   GET  /versa/:clientLeadId/category/:categoryId  → VERSA steps for a category                   [question.session.view]
//   POST /versa/:clientLeadId/category/:categoryId  → create VERSA for a category                  [question.versa.manage]
//                                  body (.strict): { categoryId? (ignored — path is authoritative) }

export const QUESTIONS_BASE = "questions";

// config (global question types, lead-scoped read)
export const questionTypesUrl = (clientLeadId) =>
  `${QUESTIONS_BASE}/question-types/${clientLeadId}`;

// SPIN session questions / answers
export const sessionQuestionsUrl = (clientLeadId) =>
  `${QUESTIONS_BASE}/session-questions/${clientLeadId}`;
export const answerUrl = (sessionQuestionId) =>
  `${QUESTIONS_BASE}/${sessionQuestionId}/answer`;
export const BULK_ANSWER_URL = `${QUESTIONS_BASE}/answer/bulk`;
export const customQuestionUrl = (clientLeadId) =>
  `${QUESTIONS_BASE}/lead/${clientLeadId}/custom-question`;

// VERSA objection-handling
export const versaCategoriesUrl = (clientLeadId) =>
  `${QUESTIONS_BASE}/versa/${clientLeadId}`;
export const versaByCategoryUrl = (clientLeadId, categoryId) =>
  `${QUESTIONS_BASE}/versa/${clientLeadId}/category/${categoryId}`;
export const versaStepUrl = (stepId) => `${QUESTIONS_BASE}/versa/steps/${stepId}`;
