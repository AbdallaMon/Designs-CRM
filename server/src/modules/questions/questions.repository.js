// questions repository — Prisma I/O ONLY (no business rules, no AppError). The SPIN
// session-questions/answers + VERSA objection-handling Prisma logic is ported VERBATIM
// from the legacy service (services/main/shared-questions/shared-questions.js) so the
// observable shapes/order/seeding are preserved 1:1. The only ADDED queries are the
// parent-lead resolvers (findLeadIdBySessionQuestion / findLeadIdByVersaStep) used by
// the usecase to enforce the object-scope checker the legacy routes were MISSING.
import prisma from "../../infra/prisma/prisma.js";

// ── Default seed data (ported verbatim from the legacy service) ──────────────────
const defaultQuestionTypes = [
  { name: "SITUATION", label: "الوضع الحالي" },
  { name: "PROBLEM", label: "المشكلة" },
  { name: "IMPLICATION", label: "التأثير" },
  { name: "NEED_PAYOFF", label: "الحاجة والفائدة" },
];

const defaultBaseQuestions = {
  SITUATION: [
    "هل في بيت او فندق دخلته وحسيت حالك مرتاح فيه ؟",
    "من وين عم تأخذ الهامك وافكارك لتصميم البيت",
    "في حدا عم يساعدك في اتخاذ القرار ولا الأمر بالكامل عندك",
    "شو اكتر غرفة او مساحة حاسسها تمام حاليا",
  ],
  PROBLEM: [
    "شو اكثر غرفة حاسس بدها إعادة نظر",
    "هل حاسس مساحاتك مش مستغلة بشكل كويس",
    "هل لك تجربة سابقة بالتصميم وبالتنفيذ وكيف كانت كمية التطابق ؟",
  ],
  IMPLICATION: [
    "لو تركنا الوضع على ما هو كيف ممكن يأثر عليك",
    "برأيك لو ما انتبهنا لتوزيع الكهرباء والسباكة بشكل مثل فنادق هل ح يأثر على راحتكم ؟",
  ],
  NEED_PAYOFF: [
    "لو صار كل البيت مثل غرفة ../يلي ذكرها ب البند 4 خانة الوضع الحالي / هل رح تشعر ب راحة اكبر ؟",
    "اذا اشتغل معك فريق فاهم وعندك خطة واضحة من البداية للنهاية,كيف بتحس راح يكون الموضوع؟",
  ],
};

const defaultCategories = [
  { title: "Budget Objection", label: "اعتراض الميزانية" },
  { title: "Price Objection", label: "اعتراض السعر" },
  { title: "Know all stage costs", label: "بدي اعرف تكلفة مراحل كلها قبل ما ابدا" },
  { title: "I’m in another country", label: "انا ب دولة ثانية" },
  { title: "Design capability concern", label: "اعتراض علي قدرة تنفيذ تصميم في دولة تانية" },
  { title: "Mismatch between design & execution", label: "اغلب شركات بتصمم اشي ولما ينفذة بيطلع اشي تاني" },
  { title: "Few revisions", label: "كم عدد تعديلات ؟ قليل" },
  { title: "Why you not others?", label: "شو الفرق بينكم وبين شركات ثانية" },
  { title: "Let me ask my spouse", label: "خليني اشاور زوجتي" },
  { title: "Let me think & call back", label: "خليني افكر وارجع لك" },
  { title: "Others gave free design", label: "بقية شركات اعطوني تصميم ببلاش مقابل انفذ معهم" },
  { title: "I’m not sure I can complete all steps", label: "اظن مع اغضر اكمل كل مراحل معكم" },
];

class QuestionsRepository {
  // ── Parent-lead resolvers (the scope-check inputs) ─────────────────────────────
  // Resolve the clientLeadId behind a session question / VERSA step so the usecase can
  // run the leads object-scope checker on the parent lead.
  async findLeadIdBySessionQuestion({ sessionQuestionId }) {
    const row = await prisma.sessionQuestion.findUnique({
      where: { id: Number(sessionQuestionId) },
      select: { clientLeadId: true },
    });
    return row?.clientLeadId ?? null;
  }

  async findLeadIdByVersaStep({ stepId }) {
    const id = Number(stepId);
    // A VersaStep is referenced by exactly one VersaModel via one of v/e/r/s/a.
    const row = await prisma.versaModel.findFirst({
      where: {
        OR: [{ vId: id }, { eId: id }, { rId: id }, { sId: id }, { aId: id }],
      },
      select: { clientLeadId: true },
    });
    return row?.clientLeadId ?? null;
  }

  versaStepExists({ stepId }) {
    return prisma.versaStep.findUnique({
      where: { id: Number(stepId) },
      select: { id: true },
    });
  }

  // ── Global config / seeding (ported verbatim) ──────────────────────────────────
  async ensureDefaultCategoriesAndQuestions() {
    const count = await prisma.questionType.count();
    if (count > 0) return;
    for (const type of defaultQuestionTypes) {
      const existing = await prisma.questionType.findUnique({ where: { name: type.name } });
      if (!existing) {
        await prisma.questionType.create({ data: type });
      }
    }
    for (const [typeName, questions] of Object.entries(defaultBaseQuestions)) {
      const type = await prisma.questionType.findUnique({ where: { name: typeName } });
      for (let i = 0; i < questions.length; i++) {
        const title = questions[i];
        const exists = await prisma.baseQuestion.findFirst({
          where: { title, questionTypeId: type.id },
        });
        if (!exists) {
          await prisma.baseQuestion.create({
            data: { title, questionTypeId: type.id, order: i },
          });
        }
      }
    }
  }

  async ensureSessionQuestions({ clientLeadId, userId }) {
    clientLeadId = Number(clientLeadId);
    userId = Number(userId);
    const count = await prisma.sessionQuestion.count({ where: { clientLeadId } });
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

  getQuestionsTypes() {
    return prisma.questionType.findMany({ include: { baseQuestions: true } });
  }

  getSessionQuestionsByClientLeadId({ clientLeadId, questionTypeId }) {
    return prisma.sessionQuestion.findMany({
      where: {
        clientLeadId: Number(clientLeadId),
        questionTypeId: Number(questionTypeId),
      },
      include: { questionType: true, answer: true },
      orderBy: { order: "asc" },
    });
  }

  // ── Answers (ported verbatim) ──────────────────────────────────────────────────
  async upsertAnswer({ sessionQuestionId, response, userId }) {
    sessionQuestionId = Number(sessionQuestionId);
    userId = Number(userId);
    const existing = await prisma.answer.findUnique({ where: { sessionQuestionId } });
    if (existing) {
      return prisma.answer.update({
        where: { sessionQuestionId },
        data: { response, userId },
      });
    }
    return prisma.answer.create({ data: { sessionQuestionId, response, userId } });
  }

  // ── Custom question (ported verbatim — order = last+1 within the type/lead) ──────
  async createCustomQuestion({ title, questionTypeId, clientLeadId, userId }) {
    questionTypeId = Number(questionTypeId);
    clientLeadId = Number(clientLeadId);
    userId = Number(userId);
    const lastQuestion = await prisma.sessionQuestion.findFirst({
      where: { questionTypeId, clientLeadId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const newOrder = lastQuestion ? lastQuestion.order + 1 : 0;
    return prisma.sessionQuestion.create({
      data: { title, isCustom: true, questionTypeId, clientLeadId, userId, order: newOrder },
    });
  }

  // ── VERSA (ported verbatim) ────────────────────────────────────────────────────
  async ensureDefaultCategories() {
    const count = await prisma.objectionCategory.count();
    if (count === 0) {
      await prisma.objectionCategory.createMany({ data: defaultCategories });
    }
    return true;
  }

  async getCategoriesWithVersaStatus({ clientLeadId }) {
    await this.ensureDefaultCategories();
    const categories = await prisma.objectionCategory.findMany({
      include: {
        versas: { where: { clientLeadId: Number(clientLeadId) }, select: { id: true } },
      },
    });
    return categories.map((cat) => ({ ...cat, hasVersa: cat.versas.length > 0 }));
  }

  getVersaByCategory({ clientLeadId, categoryId }) {
    return prisma.versaModel.findFirst({
      where: { clientLeadId: Number(clientLeadId), categoryId: Number(categoryId) },
      include: { v: true, e: true, r: true, s: true, a: true },
    });
  }

  async createVersaModel({ clientLeadId, userId, categoryId }) {
    clientLeadId = Number(clientLeadId);
    userId = Number(userId);
    categoryId = Number(categoryId);
    const stepEntries = await Promise.all(
      ["v", "e", "r", "s", "a"].map(() =>
        prisma.versaStep.create({
          data: { label: null, question: null, answer: null, clientResponse: null },
        }),
      ),
    );
    return prisma.versaModel.create({
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
  }

  updateVersaStep({ stepId, label, question, answer, clientResponse }) {
    return prisma.versaStep.update({
      where: { id: Number(stepId) },
      data: { label, question, answer, clientResponse },
    });
  }
}

export const questionsRepository = new QuestionsRepository();
