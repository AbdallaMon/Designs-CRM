// Prisma I/O ONLY. No business logic, no AppError. Methods accept an optional
// `client` so a usecase can compose them inside a prisma.$transaction. Queries are
// ported VERBATIM from `services/main/courses/adminCourseServices.js` (shapes,
// includes, ordering preserved) so the admin LMS contract is unchanged.
import prisma from "../../../infra/prisma/prisma.js";

export class AdminCourseRepository {
  // ── courses ──────────────────────────────────────────────────────────────────
  listCourses({ skip, take, client } = {}) {
    return (client ?? prisma).course.findMany({
      skip,
      take,
      include: {
        _count: { select: { lessons: true, tests: true } },
        roles: true,
      },
    });
  }

  countCourses({ client } = {}) {
    return (client ?? prisma).course.count();
  }

  createCourse({ data, client } = {}) {
    return (client ?? prisma).course.create({ data });
  }

  updateCourse({ id, data, client } = {}) {
    return (client ?? prisma).course.update({ where: { id }, data });
  }

  getCourseById({ id, select, client } = {}) {
    return (client ?? prisma).course.findUnique({
      where: { id },
      ...(select ? { select } : {}),
    });
  }

  // ── lessons ──────────────────────────────────────────────────────────────────
  listLessonsByCourseId({ courseId, client } = {}) {
    return (client ?? prisma).lesson.findMany({
      where: { courseId },
      orderBy: { order: "asc" },
      include: {
        videos: true,
        pdfs: true,
        links: true,
        _count: { select: { tests: true } },
      },
    });
  }

  getLessonById({ id, client } = {}) {
    return (client ?? prisma).lesson.findUnique({ where: { id } });
  }

  createLesson({ data, client } = {}) {
    return (client ?? prisma).lesson.create({ data });
  }

  updateLesson({ id, data, client } = {}) {
    return (client ?? prisma).lesson.update({ where: { id }, data });
  }

  updateLessonHomeworkFlag({ id, mustUploadHomework, client } = {}) {
    return (client ?? prisma).lesson.update({
      where: { id },
      data: { mustUploadHomework },
    });
  }

  // Cascade delete of a lesson and all of its dependent rows — ported verbatim from
  // legacy `deleteLesson`. Always runs inside a transaction.
  deleteLessonCascade({ lessonId }) {
    return prisma.$transaction(async (tx) => {
      await tx.selectedAnswer.deleteMany({
        where: { answer: { attempt: { test: { lessonId } } } },
      });
      await tx.userAnswer.deleteMany({
        where: { attempt: { test: { lessonId } } },
      });
      await tx.testAttempt.deleteMany({ where: { test: { lessonId } } });
      await tx.testChoice.deleteMany({
        where: { question: { test: { lessonId } } },
      });
      await tx.testQuestion.deleteMany({ where: { test: { lessonId } } });
      await tx.test.deleteMany({ where: { lessonId } });
      await tx.lessonPDF.deleteMany({ where: { lessonId } });
      await tx.lessonVideo.deleteMany({ where: { lessonId } });
      await tx.lessonLink.deleteMany({ where: { lessonId } });
      await tx.lesson.delete({ where: { id: lessonId } });
    });
  }

  // ── lesson videos ──────────────────────────────────────────────────────────────
  listVideosByLessonId({ lessonId, client } = {}) {
    return (client ?? prisma).lessonVideo.findMany({ where: { lessonId } });
  }

  createLessonVideo({ data, client } = {}) {
    return (client ?? prisma).lessonVideo.create({ data });
  }

  updateLessonVideo({ id, data, client } = {}) {
    return (client ?? prisma).lessonVideo.update({ where: { id }, data });
  }

  // Legacy deletes the video's child pdfs then the video. Wrapped in a transaction.
  deleteLessonVideo({ videoId }) {
    return prisma.$transaction(async (tx) => {
      await tx.lessonVideoPdf.deleteMany({ where: { videoId } });
      return tx.lessonVideo.delete({ where: { id: videoId } });
    });
  }

  // ── lesson pdfs ──────────────────────────────────────────────────────────────
  listPdfsByLessonId({ lessonId, client } = {}) {
    return (client ?? prisma).lessonPDF.findMany({ where: { lessonId } });
  }

  createLessonPdf({ data, client } = {}) {
    return (client ?? prisma).lessonPDF.create({ data });
  }

  updateLessonPdf({ id, data, client } = {}) {
    return (client ?? prisma).lessonPDF.update({ where: { id }, data });
  }

  deleteLessonPdf({ id, client } = {}) {
    return (client ?? prisma).lessonPDF.delete({ where: { id } });
  }

  // ── lesson links ───────────────────────────────────────────────────────────────
  listLinksByLessonId({ lessonId, client } = {}) {
    return (client ?? prisma).lessonLink.findMany({ where: { lessonId } });
  }

  createLessonLink({ data, client } = {}) {
    return (client ?? prisma).lessonLink.create({ data });
  }

  updateLessonLink({ id, data, client } = {}) {
    return (client ?? prisma).lessonLink.update({ where: { id }, data });
  }

  deleteLessonLink({ id, client } = {}) {
    return (client ?? prisma).lessonLink.delete({ where: { id } });
  }

  // ── lesson video pdfs ──────────────────────────────────────────────────────────
  listVideoPdfs({ videoId, client } = {}) {
    return (client ?? prisma).lessonVideoPdf.findMany({ where: { videoId } });
  }

  createVideoPdf({ data, client } = {}) {
    return (client ?? prisma).lessonVideoPdf.create({ data });
  }

  deleteVideoPdf({ id, client } = {}) {
    return (client ?? prisma).lessonVideoPdf.delete({ where: { id } });
  }

  // ── lesson access / allowed roles ───────────────────────────────────────────────
  getAllowedRoles({ courseId, client } = {}) {
    return (client ?? prisma).courseRole.findMany({ where: { courseId } });
  }

  getAllowedLessonUsers({ lessonId, client } = {}) {
    return (client ?? prisma).lessonAccess.findMany({
      where: { lessonId },
      select: {
        id: true,
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  }

  createLessonAccess({ lessonId, userId, client } = {}) {
    return (client ?? prisma).lessonAccess.create({
      data: { lessonId, userId },
    });
  }

  deleteLessonAccess({ id, client } = {}) {
    return (client ?? prisma).lessonAccess.delete({ where: { id } });
  }

  // ── homeworks (admin review) ─────────────────────────────────────────────────────
  listHomeworksByLessonId({ lessonId, client } = {}) {
    return (client ?? prisma).lessonHomework.findMany({
      where: { lessonId },
      include: { user: { select: { name: true, email: true, id: true } } },
    });
  }

  // ── tests ──────────────────────────────────────────────────────────────────────
  getTestOwnerTitle({ key, id, client } = {}) {
    return (client ?? prisma)[key === "courseId" ? "course" : "lesson"].findUnique(
      { where: { id }, select: { title: true } },
    );
  }

  listTests({ where, client } = {}) {
    return (client ?? prisma).test.findMany({
      where,
      include: { _count: { select: { attempts: true, questions: true } } },
    });
  }

  getTestById({ id, client } = {}) {
    return (client ?? prisma).test.findUnique({ where: { id } });
  }

  getTestQuestionsOrdered({ testId, client } = {}) {
    return (client ?? prisma).test.findUnique({
      where: { id: testId },
      select: {
        id: true,
        attemptLimit: true,
        questions: {
          orderBy: { order: "asc" },
          select: { id: true, order: true },
        },
      },
    });
  }

  createTest({ data, client } = {}) {
    return (client ?? prisma).test.create({ data });
  }

  updateTest({ id, data, client } = {}) {
    return (client ?? prisma).test.update({ where: { id }, data });
  }

  // Cascade delete of a test and its dependent rows — ported verbatim.
  deleteTestCascade({ testId }) {
    return prisma.$transaction(async (tx) => {
      await tx.testChoice.deleteMany({ where: { question: { testId } } });
      await tx.userAnswer.deleteMany({ where: { question: { testId } } });
      await tx.testQuestion.deleteMany({ where: { testId } });
      await tx.testAttempt.deleteMany({ where: { testId } });
      await tx.test.deleteMany({ where: { id: testId } });
    });
  }

  // ── test questions ───────────────────────────────────────────────────────────────
  getLastQuestionOrder({ testId, client } = {}) {
    return (client ?? prisma).testQuestion.findFirst({
      where: { testId },
      orderBy: { order: "desc" },
    });
  }

  getQuestionById({ id, client } = {}) {
    return (client ?? prisma).testQuestion.findUnique({
      where: { id },
      include: { choices: { orderBy: { order: "asc" } } },
    });
  }

  createQuestion({ data, client } = {}) {
    return (client ?? prisma).testQuestion.create({ data });
  }

  updateQuestionText({ id, question, client } = {}) {
    return (client ?? prisma).testQuestion.update({
      where: { id },
      data: { question },
    });
  }

  reorderQuestion({ id, order, client } = {}) {
    return (client ?? prisma).testQuestion.update({
      where: { id },
      data: { order },
    });
  }

  // Cascade delete of a question and its dependent rows — ported verbatim.
  deleteQuestionCascade({ questionId }) {
    return prisma.$transaction(async (tx) => {
      await tx.testChoice.deleteMany({ where: { questionId } });
      await tx.userAnswer.deleteMany({ where: { questionId } });
      await tx.testQuestion.deleteMany({ where: { id: questionId } });
    });
  }

  // ── test choices ─────────────────────────────────────────────────────────────────
  createChoice({ data, client } = {}) {
    return (client ?? prisma).testChoice.create({ data });
  }

  updateChoice({ id, data, client } = {}) {
    return (client ?? prisma).testChoice.update({ where: { id }, data });
  }

  deleteChoice({ id, client } = {}) {
    return (client ?? prisma).testChoice.delete({ where: { id } });
  }

  // ── attempts (admin) ───────────────────────────────────────────────────────────
  listAttemptsForSummary({ where, skip, take, client } = {}) {
    return (client ?? prisma).testAttempt.findMany({
      where,
      ...(skip !== undefined ? { skip } : {}),
      ...(take !== undefined ? { take } : {}),
      select: {
        userId: true,
        score: true,
        passed: true,
        endTime: true,
        user: { select: { name: true, email: true, role: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  countAttempts({ client } = {}) {
    return (client ?? prisma).testAttempt.count();
  }

  getLastUserAttempt({ testId, userId, client } = {}) {
    return (client ?? prisma).testAttempt.findFirst({
      where: { testId, userId },
      orderBy: { createdAt: "desc" },
    });
  }

  updateAttemptLimit({ id, attemptLimit, client } = {}) {
    return (client ?? prisma).testAttempt.update({
      where: { id },
      data: { attemptLimit },
    });
  }

  updateUserAnswerApproval({ questionId, attemptId, isApproved, client } = {}) {
    return (client ?? prisma).userAnswer.updateMany({
      where: { questionId, attemptId },
      data: { isApproved },
    });
  }

  // ── admin dashboard aggregates ───────────────────────────────────────────────────
  aggregateTestAttempts({ client } = {}) {
    return (client ?? prisma).testAttempt.aggregate({
      _count: true,
      _avg: { score: true },
    });
  }

  countPassedAttempts({ client } = {}) {
    return (client ?? prisma).testAttempt.count({ where: { passed: true } });
  }

  countLessons({ client } = {}) {
    return (client ?? prisma).lesson.count();
  }

  countVideos({ client } = {}) {
    return (client ?? prisma).lessonVideo.count();
  }

  countPdfs({ client } = {}) {
    return (client ?? prisma).lessonPDF.count();
  }

  countPublishedCourses({ client } = {}) {
    return (client ?? prisma).course.count({ where: { isPublished: true } });
  }

  countHomeworks({ client } = {}) {
    return (client ?? prisma).lessonHomework.count();
  }

  countCourseCompletions({ client } = {}) {
    return (client ?? prisma).courseProgress.count({
      where: { AND: [{ completedLessons: { some: {} } }, {}] },
    });
  }

  listAllProgressForDashboard({ client } = {}) {
    return (client ?? prisma).courseProgress.findMany({
      include: {
        course: { include: { lessons: true, tests: true } },
        completedLessons: true,
      },
    });
  }

  listTopCourses({ client } = {}) {
    return (client ?? prisma).course.findMany({
      take: 4,
      orderBy: { progress: { _count: "desc" } },
      include: {
        progress: { include: { completedLessons: true } },
        tests: { include: { attempts: true } },
        lessons: true,
      },
    });
  }
}

export const adminCourseRepository = new AdminCourseRepository();
