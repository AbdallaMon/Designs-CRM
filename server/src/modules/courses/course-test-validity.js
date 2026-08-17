import { COURSE_QUESTION_TYPES, coursesMessagesCodes } from "@dms/shared";

const MIN_CHOICE_COUNT = 2;

export function getCourseQuestionValidationMessage(question) {
  const choices = Array.isArray(question?.choices) ? question.choices : [];
  if (question?.type === COURSE_QUESTION_TYPES.TEXT) return null;

  if (!question?.type) return coursesMessagesCodes.QUESTION_TYPE_REQUIRED;
  if (choices.length < MIN_CHOICE_COUNT) {
    return coursesMessagesCodes.QUESTION_CHOICES_MIN_TWO;
  }
  if (
    choices.some(
      (choice) => typeof choice?.text !== "string" || !choice.text.trim(),
    )
  ) {
    return coursesMessagesCodes.QUESTION_CHOICE_TEXT_REQUIRED;
  }
  const normalizedTexts = choices.map((choice) => choice.text.trim().toLowerCase());
  if (new Set(normalizedTexts).size !== normalizedTexts.length) {
    return coursesMessagesCodes.QUESTION_CHOICES_UNIQUE;
  }

  if (question?.type === COURSE_QUESTION_TYPES.MULTIPLE_CHOICE) {
    return choices.some((choice) => choice.isCorrect === true)
      ? null
      : coursesMessagesCodes.QUESTION_CORRECT_ANSWER_REQUIRED;
  }

  if (
    [COURSE_QUESTION_TYPES.SINGLE_CHOICE, COURSE_QUESTION_TYPES.TRUE_FALSE].includes(
      question?.type,
    )
  ) {
    return choices.filter((choice) => choice.isCorrect === true).length === 1
      ? null
      : coursesMessagesCodes.QUESTION_EXACTLY_ONE_CORRECT;
  }

  if (question?.type === COURSE_QUESTION_TYPES.ORDERING) {
    if (
      choices.length < MIN_CHOICE_COUNT ||
      choices.some(
        (choice) =>
          typeof choice?.text !== "string" ||
          !choice.text.trim() ||
          !Number.isInteger(choice.order) ||
          choice.order < 0,
      )
    ) {
      return coursesMessagesCodes.ORDERING_POSITION_INVALID;
    }
    return new Set(choices.map((choice) => choice.order)).size === choices.length
      ? null
      : coursesMessagesCodes.ORDERING_POSITION_UNIQUE;
  }

  return coursesMessagesCodes.QUESTION_TYPE_UNSUPPORTED;
}

export function isValidCourseQuestion(question) {
  return getCourseQuestionValidationMessage(question) === null;
}

export function isValidPublishedTest(questions) {
  return (
    Array.isArray(questions) &&
    questions.length > 0 &&
    questions.every(isValidCourseQuestion)
  );
}
