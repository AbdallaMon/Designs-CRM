// Questions feature barrel (foundation phase — data layer + a thin lead-scoped wiring panel).
export { QuestionsPanel, default as QuestionsPanelDefault } from "./pages/QuestionsPanel.jsx";
export { questionsService } from "./questions.service.js";
export { runQuestionsMutation } from "./questions.mutations.js";
export { resolveQuestionsMessage, questionsMessages } from "./config/questionsMessages.js";
