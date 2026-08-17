import {
  COURSE_QUESTION_TYPES,
  USER_FEEDBACK_MESSAGES as FEEDBACK,
} from "@dms/shared";

const toInteger = (value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  const number = Number(value);
  return Number.isInteger(number) ? number : value;
};

const choicePayload = (choice, { includeOperation = false } = {}) => {
  if (includeOperation && choice.type === "DELETE") {
    return { id: choice.id, type: "DELETE" };
  }
  const payload = {
    text: choice.text,
    value: choice.text,
    isCorrect: Boolean(choice.isCorrect),
  };
  const order = toInteger(choice.order);
  if (order !== undefined) payload.order = order;
  if (includeOperation) {
    if (choice.type === "CREATE") payload.type = "CREATE";
    else if (choice.id !== undefined) payload.id = choice.id;
  }
  return payload;
};

export function coursePayload(form) {
  return {
    title: form.title,
    description: form.description || null,
    imageUrl: form.imageUrl || null,
    isPublished: Boolean(form.isPublished),
  };
}

export function lessonPayload(form) {
  const payload = {
    title: form.title,
    description: form.description || null,
    isPreviewable: Boolean(form.isPreviewable),
  };
  const duration = toInteger(form.duration);
  const order = toInteger(form.order);
  if (duration !== undefined) payload.duration = duration;
  if (order !== undefined) payload.order = order;
  if (form.mustUploadHomework !== undefined) {
    payload.mustUploadHomework = Boolean(form.mustUploadHomework);
  }
  return payload;
}

export function videoPayload(video) {
  return {
    url: video.url,
    videoType: video.videoType,
    order: toInteger(video.order),
  };
}

export function pdfPayload(pdf) {
  return { url: pdf.url, order: toInteger(pdf.order) };
}

export function linkPayload(link) {
  return {
    url: link.url,
    title: link.title,
    order: toInteger(link.order),
  };
}

export function videoPdfPayload(pdf) {
  return { title: pdf.title, url: pdf.url };
}

export function testCreatePayload(form) {
  return {
    attemptLimit: toInteger(form.attemptLimit),
    testType: form.testType,
    title: form.title,
    timeLimit: toInteger(form.timeLimit),
    published: false,
  };
}

export function testEditPayload(form) {
  return {
    title: form.title,
    attemptLimit: toInteger(form.attemptLimit),
    timeLimit: toInteger(form.timeLimit),
    published: Boolean(form.published),
  };
}

export function questionCreatePayload(question) {
  return {
    type: question.type,
    question: question.question,
    choices: question.choices.map((choice) => choicePayload(choice)),
  };
}

export function questionEditPayload(question) {
  return {
    question: question.question,
    choices: question.choices.map((choice) =>
      choicePayload(choice, { includeOperation: true }),
    ),
  };
}

export function questionOrderPayload(questions) {
  return questions.map(({ id }) => ({ id }));
}

export function homeworkPayload(homework) {
  return {
    url: homework.url,
    type: homework.type,
    title: homework.title,
  };
}

export function validateQuestionDraft(question) {
  if (!question?.question?.trim()) return FEEDBACK.QUESTION_TEXT_REQUIRED;
  if (!question.type) return FEEDBACK.QUESTION_TYPE_REQUIRED;
  if (question.type === COURSE_QUESTION_TYPES.TEXT) return null;

  const choices = (question.choices || []).filter(
    (choice) => choice.type !== "DELETE",
  );
  if (choices.length < 2) return FEEDBACK.QUESTION_CHOICES_MIN_TWO;
  if (choices.some((choice) => !choice.text?.trim())) {
    return FEEDBACK.QUESTION_CHOICES_TEXT_REQUIRED;
  }
  const normalizedTexts = choices.map((choice) => choice.text.trim().toLowerCase());
  if (new Set(normalizedTexts).size !== normalizedTexts.length) {
    return FEEDBACK.QUESTION_CHOICES_UNIQUE;
  }
  if (question.type === COURSE_QUESTION_TYPES.ORDERING) {
    const orders = choices.map((choice) => toInteger(choice.order));
    if (
      orders.some((order) => !Number.isInteger(order) || order < 0) ||
      new Set(orders).size !== orders.length
    ) {
      return FEEDBACK.ORDERING_POSITIONS_UNIQUE;
    }
    return null;
  }

  const correctCount = choices.filter((choice) => choice.isCorrect).length;
  if (
    question.type === COURSE_QUESTION_TYPES.MULTIPLE_CHOICE &&
    correctCount < 1
  ) {
    return FEEDBACK.CORRECT_ANSWER_REQUIRED;
  }
  if (
    [COURSE_QUESTION_TYPES.SINGLE_CHOICE, COURSE_QUESTION_TYPES.TRUE_FALSE].includes(
      question.type,
    ) &&
    correctCount !== 1
  ) {
    return FEEDBACK.EXACTLY_ONE_CORRECT_ANSWER_REQUIRED;
  }
  return null;
}
