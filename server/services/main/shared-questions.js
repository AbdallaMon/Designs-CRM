// data/defaults.js
import prisma from "../../prisma/prisma.js";

const defaultQuestionTypes = [
  { name: "SITUATION", label: "الوضع الحالي" },
  { name: "PROBLEM", label: "المشكلة" },
  { name: "IMPLICATION", label: "التأثير" },
  { name: "NEED_PAYOFF", label: "الحاجة والفائدة" },
];

const defaultBaseQuestions = {
  SITUATION: [
    "ممكن تحكيلي شوي عن بيتك؟ وين واصل حاليا؟",
    "هل عندك مخططات حاليا؟ او لسه مرحلة تحضيرية؟",
    "مين عم يشتغل معك حاليا؟ مهندس؟ مقاول؟ ولا لسه ما قررت؟",
  ],
  PROBLEM: [
    "شو اكتر شيء حاسس انه ماخرك حاليا؟ التصميم؟ الافكار؟ القرار؟",
    "في شيء حاسس انه ناقصك او مو عم تقدر توصله لحالك؟",
    "هل واجهت مشاكل سابقة مع مصممين او تنفيذ غير مرضي؟",
  ],
  IMPLICATION: [
    "اذا ضليت هيك شو بتتوقع يصير؟ تاخير؟ تكلفة اكبر؟ تعب نفسي؟",
    "شو حاسس ممكن تخسره اذا اختارت مصمم مش فاهمك او منفذ مش محترف",
    "هل اذا ضليت علي الوضع الحالي رح يكون بيتك فندقي",
  ],
  NEED_PAYOFF: [
    "اذا اشتغل معك فريق فاهم وعندك خطة واضحة من البداية للنهاية,كيف بتحس راح يكون الموضوع؟",
    "هل تدور علي شريك يمشي معك المشروع خطوة بخطوة ولا بس مصمم برسملك ويمشي؟",
  ],
};

export async function ensureDefaultCategoriesAndQuestions() {
  const count = await prisma.questionType.count();
  if (count > 0) return;
  for (const type of defaultQuestionTypes) {
    const existing = await prisma.questionType.findUnique({
      where: { name: type.name },
    });
    if (!existing) {
      await prisma.questionType.create({ data: type });
    }
  }

  for (const [typeName, questions] of Object.entries(defaultBaseQuestions)) {
    const type = await prisma.questionType.findUnique({
      where: { name: typeName },
    });
    for (let i = 0; i < questions.length; i++) {
      const title = questions[i];
      const exists = await prisma.baseQuestion.findFirst({
        where: { title, questionTypeId: type.id },
      });
      if (!exists) {
        await prisma.baseQuestion.create({
          data: {
            title,
            questionTypeId: type.id,
            order: i,
          },
        });
      }
    }
  }
}

export async function ensureSessionQuestions({ meetingReminderId, userId }) {
  meetingReminderId = Number(meetingReminderId);
  userId = Number(userId);
  const count = await prisma.sessionQuestion.count({
    where: { meetingReminderId },
  });
  if (count > 0) return;

  const baseQuestions = await prisma.baseQuestion.findMany({
    where: { isArchived: false },
    orderBy: { order: "asc" },
  });

  const sessionQuestions = baseQuestions.map((q) => ({
    title: q.title,
    questionTypeId: q.questionTypeId,
    isCustom: false,
    meetingReminderId,
    userId,
  }));

  await prisma.sessionQuestion.createMany({ data: sessionQuestions });
}
export async function getQuestionsTypes() {
  const types = await prisma.questionType.findMany({
    include: { baseQuestions: true },
  });
  return types;
}
export async function getSessionQuestionsByMettingId({
  meetingReminderId,
  questionTypeId,
}) {
  const sessionQuestions = await prisma.sessionQuestion.findMany({
    where: {
      meetingReminderId: Number(meetingReminderId),
      questionTypeId: Number(questionTypeId),
    },
    include: {
      questionType: true,
      answer: true,
    },
    orderBy: { order: "asc" },
  });
  return sessionQuestions;
}

export async function makeAnswerToAQuestion({
  sessionQuestionId,
  response,
  userId,
}) {
  sessionQuestionId = Number(sessionQuestionId);
  userId = Number(userId);
  const existing = await prisma.answer.findUnique({
    where: { sessionQuestionId },
  });
  if (existing) {
    const updated = await prisma.answer.update({
      where: { sessionQuestionId },
      data: { response, userId },
    });
    return updated;
  } else {
    const created = await prisma.answer.create({
      data: { sessionQuestionId, response, userId },
    });
    return created;
  }
}

export async function submitMoreThanAnswer({ answers, userId }) {
  userId = Number(userId);
  console.log(answers, "answers");
  for (const { sessionQuestionId, response } of answers) {
    sessionQuestionId = Number(sessionQuestionId);
    await makeAnswerToAQuestion({ sessionQuestionId, response, userId });
  }
  return answers;
}
export async function createCustomQuestion({
  title,
  questionTypeId,
  meetingReminderId,
  userId,
}) {
  questionTypeId = Number(questionTypeId);
  meetingReminderId = Number(meetingReminderId);
  userId = Number(userId);
  const lastQuestion = await prisma.sessionQuestion.findFirst({
    where: {
      questionTypeId,
      meetingReminderId,
    },
    orderBy: {
      order: "desc",
    },
    select: {
      order: true,
    },
  });

  const newOrder = lastQuestion ? lastQuestion.order + 1 : 0;

  const question = await prisma.sessionQuestion.create({
    data: {
      title,
      isCustom: true,
      questionTypeId,
      meetingReminderId,
      userId,
      order: newOrder,
    },
  });

  return question;
}
