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

export async function ensureSessionQuestions({ clientLeadId, userId }) {
  clientLeadId = Number(clientLeadId);
  userId = Number(userId);
  const count = await prisma.sessionQuestion.count({
    where: { clientLeadId },
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
    clientLeadId,
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
export async function getSessionQuestionsByClientLeadId({
  clientLeadId,
  questionTypeId,
}) {
  const sessionQuestions = await prisma.sessionQuestion.findMany({
    where: {
      clientLeadId: Number(clientLeadId),
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
  clientLeadId,
  userId,
}) {
  questionTypeId = Number(questionTypeId);
  clientLeadId = Number(clientLeadId);
  userId = Number(userId);
  const lastQuestion = await prisma.sessionQuestion.findFirst({
    where: {
      questionTypeId,
      clientLeadId,
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
      clientLeadId,
      userId,
      order: newOrder,
    },
  });

  return question;
}

/// VERSA ////
const defaultCategories = [
  { title: "Budget Objection", label: "اعتراض الميزانية" },
  { title: "Price Objection", label: "اعتراض السعر" },
  {
    title: "Know all stage costs",
    label: "بدي اعرف تكلفة مراحل كلها قبل ما ابدا",
  },
  { title: "I’m in another country", label: "انا ب دولة ثانية" },
  {
    title: "Design capability concern",
    label: "اعتراض علي قدرة تنفيذ تصميم في دولة تانية",
  },
  {
    title: "Mismatch between design & execution",
    label: "اغلب شركات بتصمم اشي ولما ينفذة بيطلع اشي تاني",
  },
  { title: "Few revisions", label: "كم عدد تعديلات ؟ قليل" },
  { title: "Why you not others?", label: "شو الفرق بينكم وبين شركات ثانية" },
  { title: "Let me ask my spouse", label: "خليني اشاور زوجتي" },
  { title: "Let me think & call back", label: "خليني افكر وارجع لك" },
  {
    title: "Others gave free design",
    label: "بقية شركات اعطوني تصميم ببلاش مقابل انفذ معهم",
  },
  {
    title: "I’m not sure I can complete all steps",
    label: "اظن مع اغضر اكمل كل مراحل معكم",
  },
];

export async function ensureDefaultCategories() {
  const count = await prisma.objectionCategory.count();
  if (count === 0) {
    await prisma.objectionCategory.createMany({ data: defaultCategories });
  }
  return true;
}

export async function getCategoriesWithVersaStatus({ clientLeadId }) {
  await ensureDefaultCategories();

  const categories = await prisma.objectionCategory.findMany({
    include: {
      versas: {
        where: { clientLeadId: Number(clientLeadId) },
        select: { id: true },
      },
    },
  });

  const response = categories.map((cat) => ({
    ...cat,
    hasVersa: cat.versas.length > 0,
  }));

  return response;
}
export async function getVersaByCategory({ clientLeadId, categoryId }) {
  const versa = await prisma.versaModel.findFirst({
    where: {
      clientLeadId: Number(clientLeadId),
      categoryId: Number(categoryId),
    },
    include: {
      v: true,
      e: true,
      r: true,
      s: true,
      a: true,
    },
  });
}

export async function createVersaModel({ clientLeadId, userId, categoryId }) {
  clientLeadId = Number(clientLeadId);
  userId = Number(userId);
  categoryId = Number(categoryId);
  const stepEntries = await Promise.all(
    ["v", "e", "r", "s", "a"].map(() =>
      prisma.versaStep.create({
        data: {
          label: null,
          question: null,
          answer: null,
          clientResponse: null,
        },
      })
    )
  );

  const versa = await prisma.versaModel.create({
    data: {
      clientLeadId,
      userId,
      categoryId,
      vId: stepEntries[0].id,
      eId: stepEntries[1].id,
      rId: stepEntries[2].id,
      sId: stepEntries[3].id,
      aId: stepEntries[4].id,
    },
  });
  return versa;
}

export async function updateVersa({
  stepId,
  label,
  question,
  answer,
  clientResponse,
}) {
  const step = await prisma.versaStep.update({
    where: { id: parseInt(stepId) },
    data: { label, question, answer, clientResponse },
  });
  return step;
}
