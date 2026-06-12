// SPIN session-questions presentation config — the canonical question-TYPE order + Arabic
// fallback labels, and the helpers the board UI needs to GROUP a lead's session questions by
// type and to normalize a session-question row.
//
// The backend is the source of truth for the question types (GET /question-types/:leadId
// returns the seeded QuestionType rows, each with a server `label`) and for the per-type
// session questions (GET /session-questions/:leadId?questionTypeId=). This file only describes
// the canonical SPIN ORDER + an Arabic label fallback (used if the server row lacks a label),
// and derives a per-type grouped view from the rows the reads return. Single-language, RTL.

// Canonical SPIN type ORDER (by QuestionType.name). Matches the backend seed order in
// server/src/modules/questions/questions.repository.js (defaultQuestionTypes).
export const QUESTION_TYPE_ORDER = ["SITUATION", "PROBLEM", "IMPLICATION", "NEED_PAYOFF"];

// Arabic display label per type NAME (single-language, RTL). Used ONLY as a fallback — the
// server emits its own `label` on each QuestionType row (see the repo seed), which wins.
export const QUESTION_TYPE_LABELS = {
  SITUATION: "الوضع الحالي",
  PROBLEM: "المشكلة",
  IMPLICATION: "التأثير",
  NEED_PAYOFF: "الحاجة والفائدة",
};

/** Resolve a display label for a QuestionType row (server label wins; fall back by name). */
export function labelForType(type) {
  if (!type) return "";
  return type.label || QUESTION_TYPE_LABELS[type.name] || type.name || `#${type.id}`;
}

// Sort question types into the canonical SPIN order; any unknown/extra type keeps a stable
// trailing position (sorted by id) so custom types never disappear.
export function sortQuestionTypes(types = []) {
  const list = Array.isArray(types) ? [...types] : [];
  return list.sort((a, b) => {
    const ia = QUESTION_TYPE_ORDER.indexOf(a?.name);
    const ib = QUESTION_TYPE_ORDER.indexOf(b?.name);
    const ra = ia === -1 ? QUESTION_TYPE_ORDER.length : ia;
    const rb = ib === -1 ? QUESTION_TYPE_ORDER.length : ib;
    if (ra !== rb) return ra - rb;
    return (a?.id ?? 0) - (b?.id ?? 0);
  });
}

/**
 * Normalize a raw SessionQuestion row (the shape GET /session-questions returns) into the
 * flat view the board renders.
 *
 * Bound shape (server/src/modules/questions/questions.repository.js → getSessionQuestionsByClientLeadId):
 *   { id, title, isCustom, order, questionTypeId, questionType: { id, name, label },
 *     answer: { id, response, userId, sessionQuestionId } | null }
 */
export function normalizeSessionQuestion(row) {
  return {
    id: row?.id,
    title: row?.title ?? "",
    isCustom: Boolean(row?.isCustom),
    order: row?.order ?? 0,
    questionTypeId: row?.questionTypeId,
    response: row?.answer?.response ?? "",
    isAnswered: Boolean(row?.answer?.response),
  };
}
