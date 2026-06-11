// Questions data-access service — the ONLY place that talks to the questions API. Wraps the
// canonical apiFetch (config.apiUrl === /v2). Components/hooks call these helpers, never
// fetch/apiFetch directly. All responses share the { success, message, data, translationKey }
// envelope; helpers return the parsed envelope.
//
// One AUTHED staff surface (apiFetch.* — credentialed, cookie auth) at /v2/questions. The
// SPIN session-questions/answers reads/writes and the VERSA objection-handling reads/writes
// are LEAD-SCOPED: the clientLeadId (or the sessionQuestionId / versa stepId from which the
// BE resolves the parent lead) is part of the path; the BE runs the leads-module object-scope
// checker before any read/write (the IDOR fix). The dtos emit NO capabilities.* — gate authed
// actions on the QUESTION.* CODES; the server enforces the lead scope.
//
// Mutating bodies are built to match the BE .strict() schemas exactly (no extra keys — the
// .strict() schema would 422 on unknown fields). See config/constant.js for the contract.

import apiFetch from "@/app/v2/lib/api/ApiFetch";
import {
  questionTypesUrl,
  sessionQuestionsUrl,
  answerUrl,
  BULK_ANSWER_URL,
  customQuestionUrl,
  versaCategoriesUrl,
  versaByCategoryUrl,
  versaStepUrl,
} from "./config/constant.js";

// Build a query string with top-level params (skips empty/null/undefined). apiFetch.get
// ignores a params arg, so query MUST be embedded in the path.
function buildQuery(base, params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `${base}?${s}` : base;
}

export const questionsService = {
  // ── config (lead-scoped read; global question types) ─────────────────────────────
  // GET /question-types/:clientLeadId   [question.config.view]
  getQuestionTypes: (clientLeadId) => apiFetch.get(questionTypesUrl(clientLeadId)),

  // ── SPIN session questions / answers ──────────────────────────────────────────────
  // GET /session-questions/:clientLeadId?questionTypeId=   [question.session.view]
  getSessionQuestions: (clientLeadId, { questionTypeId } = {}) =>
    apiFetch.get(buildQuery(sessionQuestionsUrl(clientLeadId), { questionTypeId })),
  // POST /:sessionQuestionId/answer — body (.strict): { response }   [question.answer.submit]
  submitAnswer: (sessionQuestionId, { response }) =>
    apiFetch.post(answerUrl(sessionQuestionId), { response }),
  // POST /answer/bulk — body (.strict): { answers: [{ sessionQuestionId, response }] }   [question.answer.submit]
  submitBulkAnswers: (answers = []) =>
    apiFetch.post(BULK_ANSWER_URL, {
      answers: (Array.isArray(answers) ? answers : []).map((a) => ({
        sessionQuestionId: a.sessionQuestionId,
        response: a.response,
      })),
    }),
  // POST /lead/:clientLeadId/custom-question — body (.strict): { questionTypeId, title }   [question.custom.create]
  createCustomQuestion: (clientLeadId, { questionTypeId, title }) =>
    apiFetch.post(customQuestionUrl(clientLeadId), { questionTypeId, title }),

  // ── VERSA objection-handling ──────────────────────────────────────────────────────
  // GET /versa/:clientLeadId   [question.session.view]
  getVersaCategories: (clientLeadId) => apiFetch.get(versaCategoriesUrl(clientLeadId)),
  // GET /versa/:clientLeadId/category/:categoryId   [question.session.view]
  getVersaByCategory: (clientLeadId, categoryId) =>
    apiFetch.get(versaByCategoryUrl(clientLeadId, categoryId)),
  // POST /versa/:clientLeadId/category/:categoryId — body (.strict): {} (path is authoritative)   [question.versa.manage]
  createVersa: (clientLeadId, categoryId) =>
    apiFetch.post(versaByCategoryUrl(clientLeadId, categoryId), {}),
  // PUT /versa/steps/:stepId — body (.strict): { label?, question?, answer?, clientResponse? }   [question.versa.manage]
  updateVersaStep: (stepId, body = {}) => {
    const out = {};
    ["label", "question", "answer", "clientResponse"].forEach((k) => {
      if (body[k] !== undefined) out[k] = body[k];
    });
    return apiFetch.put(versaStepUrl(stepId), out);
  },
};

export default questionsService;
