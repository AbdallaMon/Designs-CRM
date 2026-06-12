// Questions feature barrel — the standalone, LEAD-SCOPED SPIN session-questions screen + its
// data layer (service / mutation runner / message resolver) and presentation config.
//
// NOTE — VERSA (objection-handling) is a SEPARATE sub-surface of the questions module
// (GET/POST /v2/questions/versa/*, PUT /versa/steps/:stepId). Its service helpers exist in
// questions.service.js (getVersaCategories / getVersaByCategory / createVersa / updateVersaStep)
// and its CODEs are gated by QUESTION.SESSION_VIEW (reads) / QUESTION.VERSA_MANAGE (writes), but
// the VERSA *board UI* is intentionally NOT part of this SPIN session-questions screen — it is a
// distinct objection-handling workflow that warrants its own dedicated screen. The data layer is
// ready for it; the screen is out of scope here.
export { QuestionsPanel, default as QuestionsPanelDefault } from "./pages/QuestionsPanel.jsx";
export { QuestionsLeadPicker } from "./components/QuestionsLeadPicker.jsx";
export { SessionQuestionsBoard } from "./components/SessionQuestionsBoard.jsx";
export { questionsService } from "./questions.service.js";
export { runQuestionsMutation } from "./questions.mutations.js";
export { resolveQuestionsMessage, questionsMessages } from "./config/questionsMessages.js";
export {
  QUESTION_TYPE_ORDER,
  QUESTION_TYPE_LABELS,
  labelForType,
  sortQuestionTypes,
  normalizeSessionQuestion,
} from "./config/questionsConfig.js";
