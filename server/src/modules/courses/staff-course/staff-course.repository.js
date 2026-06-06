// Prisma I/O ONLY. No business logic, no AppError. Methods accept an optional
// `client` so a usecase can compose them inside a prisma.$transaction. Queries are
// ported VERBATIM from `services/main/courses/staffCoursesServices.js` (shapes,
// includes, filters, ordering preserved) so the staff LMS contract is unchanged.
import prisma from "../../../infra/prisma/prisma.js";

export class StaffCourseRepository {
  // ── courses (published + role-gated) ────────────────────────────────────────────
  listPublishedCoursesForRole({ role, skip, take, client } = {}) {
    return (client ?? prisma).course.findMany({
      skip,
      take,
      include: { _count: { select: { lessons: true, tests: true } } },
      where: { isPublished: true, roles: { some: { role } } },
    });
  }

  getPublishedCourseForRole({ courseId, role, userId, client } = {}) {
    return (client ?? prisma).course.findFirst({
      where: { id: courseId, isPublished: true, roles: { some: { role } } },
      include: {
        lessons: {
          where: { isPreviewable: true },
          orderBy: { order: "asc" },
          include: {
            allowedUsers: { where: { userId } },
            tests: {
              where: { published: true },
              select: {
                id: true,
                title: true,
                timeLimit: true,
                attempts: {
                  where: { userId },
                  select: {
                    startTime: true,
                    endTime: true,
                    score: true,
                    passed: true,
                    id: true,
                    testId: true,
                    userId: true,
                  },
                },
              },
            },
          },
        },
        tests: {
          where: { published: true },
          select: {
            id: true,
            title: true,
            timeLimit: true,
            attempts: {
              where: { userId },
              select: {
                startTime: true,
                endTime: true,
                score: true,
                passed: true,
                id: true,
                testId: true,
                userId: true,
              },
            },
          },
        },
      },
    });
  }

  countPreviewableLessons({ courseId, client } = {}) {
    return (client ?? prisma).lesson.count({
      where: { courseId, isPreviewable: true },
    });
  }

  countPublishedCourseTests({ courseId, client } = {}) {
    return (client ?? prisma).test.count({
      where: { courseId, published: true },
    });
  }

  // ── progress ───────────────────────────────────────────────────────────────────
  listCompletedLessonIds({ userId, courseId, client } = {}) {
    return (client ?? prisma).completedLesson.findMany({
      where: { courseProgress: { userId, courseId } },
      select: { lessonId: true },
    });
  }

  listCompletedTestIds({ userId, courseId, client } = {}) {
    return (client ?? prisma).completedTest.findMany({
      where: { courseProgress: { userId, courseId } },
      select: { testId: true },
    });
  }

  listTestAttemptsForCourse({ userId, courseId, client } = {}) {
    return (client ?? prisma).testAttempt.findMany({
      where: { userId, test: { courseId } },
      select: { testId: true, passed: true, score: true },
    });
  }

  // ── lessons (staff view + access gating) ──────────────────────────────────────────
  getPreviewableLessonForRole({ lessonId, role, client } = {}) {
    return (client ?? prisma).lesson.findUnique({
      where: {
        id: lessonId,
        isPreviewable: true,
        course: { roles: { some: { role } } },
      },
      include: {
        videos: { include: { pdfs: true } },
        pdfs: true,
        links: true,
        course: { select: { title: true } },
      },
    });
  }

  getLessonAccess({ lessonId, userId, client } = {}) {
    return (client ?? prisma).lessonAccess.findUnique({
      where: { userId_lessonId: { lessonId, userId } },
    });
  }

  // Previous lessons in a course that require homework (the gating set).
  listPreviousHomeworkLessons({ courseId, order, client } = {}) {
    const where =
      order === undefined
        ? { courseId, mustUploadHomework: true }
        : { courseId, order: { lt: order }, mustUploadHomework: true };
    return (client ?? prisma).lesson.findMany({ where, select: { id: true } });
  }

  listCompletedLessonIdsIn({ userId, courseId, lessonIds, client } = {}) {
    return (client ?? prisma).completedLesson.findMany({
      where: {
        courseProgress: { userId, courseId },
        lessonId: { in: lessonIds },
      },
      select: { lessonId: true },
    });
  }

  listLessonsWithPublishedTests({ lessonIds, client } = {}) {
    return (client ?? prisma).lesson.findMany({
      where: { id: { in: lessonIds }, tests: { some: { published: true } } },
      select: {
        id: true,
        courseId: true,
        tests: { where: { published: true }, select: { id: true } },
      },
    });
  }

  findPassedAttempt({ userId, testId, client } = {}) {
    return (client ?? prisma).testAttempt.findFirst({
      where: { userId, testId, passed: true },
    });
  }

  // ── homework ───────────────────────────────────────────────────────────────────
  listHomeworks({ userId, lessonId, client } = {}) {
    return (client ?? prisma).lessonHomework.findMany({
      where: { lessonId, userId },
    });
  }

  createHomework({ data, client } = {}) {
    return (client ?? prisma).lessonHomework.create({ data });
  }

  listHomeworkTypes({ userId, lessonId, client } = {}) {
    return (client ?? prisma).lessonHomework.findMany({
      where: { userId, lessonId },
      select: { type: true },
    });
  }

  // ── course progress / completion ───────────────────────────────────────────────
  findCourseProgress({ courseId, userId, client } = {}) {
    return (client ?? prisma).courseProgress.findFirst({
      where: { courseId, userId },
    });
  }

  createCourseProgress({ courseId, userId, client } = {}) {
    return (client ?? prisma).courseProgress.create({
      data: { courseId, userId },
    });
  }

  createCompletedLesson({ lessonId, courseProgressId, client } = {}) {
    return (client ?? prisma).completedLesson.create({
      data: { lessonId, courseProgressId },
    });
  }

  // ── tests (staff) ────────────────────────────────────────────────────────────────
  getPublishedTestWithRelations({ testId, client } = {}) {
    return (client ?? prisma).test.findUnique({
      where: { id: testId, published: true },
      include: { course: true, lesson: true },
    });
  }

  getTestById({ testId, client } = {}) {
    return (client ?? prisma).test.findUnique({ where: { id: testId } });
  }

  listTestQuestions({ testId, client } = {}) {
    return (client ?? prisma).testQuestion.findMany({
      where: { testId },
      orderBy: { order: "asc" },
      include: { choices: true },
    });
  }

  // ── attempts (staff, owner-scoped) ──────────────────────────────────────────────
  listUserAttempts({ testId, userId, client } = {}) {
    return (client ?? prisma).testAttempt.findMany({
      where: { testId, userId },
      // L2: do not leak the full User row (password hash, tokens, etc.). Expose
      // only the identity fields the admin/staff views actually render.
      include: {
        user: { select: { id: true, name: true, email: true } },
        answers: { include: { selectedAnswers: true } },
      },
    });
  }

  getUserAttempt({ attemptId, userId, client } = {}) {
    return (client ?? prisma).testAttempt.findUnique({
      where: { id: attemptId, userId },
      include: { answers: { include: { selectedAnswers: true } } },
    });
  }

  // Used by the attempt scope checker — load the attempt owner. Also returns the
  // attempt's testId + endTime so the mutate checker can be reused for binding /
  // terminal-state assertions without a second round-trip.
  getAttemptOwner({ attemptId, client } = {}) {
    return (client ?? prisma).testAttempt.findUnique({
      where: { id: attemptId },
      select: { id: true, userId: true, testId: true, endTime: true },
    });
  }

  // Question → owning testId (binding check; H2). Null when the question is missing.
  getQuestionTestId({ questionId, client } = {}) {
    return (client ?? prisma).testQuestion.findUnique({
      where: { id: questionId },
      select: { id: true, testId: true },
    });
  }

  getLastUserAttempt({ testId, userId, client } = {}) {
    return (client ?? prisma).testAttempt.findFirst({
      where: { testId, userId },
      orderBy: { createdAt: "desc" },
    });
  }

  // Atomic attempt-limit enforcement (M1). Inside a $transaction, take a row lock on
  // the user's latest attempt for this test (`FOR UPDATE`) so two concurrent
  // create-attempt requests serialize on it and cannot both pass the limit check.
  // Returns the locked row (or undefined when the user has no prior attempt).
  async getLastUserAttemptForUpdate({ testId, userId, client } = {}) {
    const db = client ?? prisma;
    const rows = await db.$queryRaw`
      SELECT * FROM \`TestAttempt\`
      WHERE \`testId\` = ${testId} AND \`userId\` = ${userId}
      ORDER BY \`createdAt\` DESC
      LIMIT 1
      FOR UPDATE`;
    return rows[0];
  }

  createAttempt({ data, client } = {}) {
    return (client ?? prisma).testAttempt.create({ data });
  }

  // Transaction runner exposed so the usecase can compose the limit check + insert
  // atomically (M1) without importing prisma directly.
  runTransaction(fn) {
    return prisma.$transaction(fn);
  }

  // ── answers ──────────────────────────────────────────────────────────────────────
  findExistingAnswer({ attemptId, questionId, client } = {}) {
    return (client ?? prisma).userAnswer.findFirst({
      where: { attemptId, questionId },
      include: { selectedAnswers: true },
    });
  }

  deleteSelectedAnswers({ userAnswerId, client } = {}) {
    return (client ?? prisma).selectedAnswer.deleteMany({
      where: { userAnswerId },
    });
  }

  updateUserAnswer({ id, data, client } = {}) {
    return (client ?? prisma).userAnswer.update({ where: { id }, data });
  }

  createUserAnswer({ data, client } = {}) {
    return (client ?? prisma).userAnswer.create({ data });
  }

  // ── scoring (endAttempt) ──────────────────────────────────────────────────────────
  getAttemptForScoring({ attemptId, client } = {}) {
    return (client ?? prisma).testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        test: { include: { questions: { include: { choices: true } } } },
        answers: {
          include: {
            question: { include: { choices: true } },
            selectedAnswers: true,
          },
        },
      },
    });
  }

  updateAttemptScore({ attemptId, score, passed, endTime, client } = {}) {
    return (client ?? prisma).testAttempt.update({
      where: { id: attemptId },
      data: { score, passed, endTime },
    });
  }

  // ── user dashboard ─────────────────────────────────────────────────────────────
  listEnrolledCourses({ userId, client } = {}) {
    return (client ?? prisma).courseProgress.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            imageUrl: true,
            isPublished: true,
          },
        },
        completedLessons: true,
        completedTests: true,
      },
    });
  }

  countCourseLessons({ courseId, client } = {}) {
    return (client ?? prisma).lesson.count({ where: { courseId } });
  }

  listLessonAccessForUser({ userId, client } = {}) {
    return (client ?? prisma).lessonAccess.findMany({
      where: { userId },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            duration: true,
            courseId: true,
            course: { select: { title: true } },
            videos: { select: { id: true } },
            pdfs: { select: { id: true } },
            links: { select: { id: true } },
          },
        },
      },
    });
  }

  listUserTestAttemptsForDashboard({ userId, client } = {}) {
    return (client ?? prisma).testAttempt.findMany({
      where: { userId },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            type: true,
            courseId: true,
            lessonId: true,
            course: { select: { title: true } },
            lesson: { select: { title: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  countApprovedCertificates({ userId, client } = {}) {
    return (client ?? prisma).testAttempt.count({
      where: { userId, passed: true, test: { certificateApprovedByAdmin: true } },
    });
  }

  countSubmittedHomeworks({ userId, client } = {}) {
    return (client ?? prisma).lessonHomework.count({ where: { userId } });
  }

  listRecentAttemptDates({ userId, since, client } = {}) {
    return (client ?? prisma).testAttempt.findMany({
      where: { userId, createdAt: { gte: since } },
      select: { createdAt: true },
    });
  }

  listRecentHomeworkDates({ userId, since, client } = {}) {
    return (client ?? prisma).lessonHomework.findMany({
      where: { userId, createdAt: { gte: since } },
      select: { createdAt: true },
    });
  }

  listRecentCompletedLessonDates({ userId, since, client } = {}) {
    return (client ?? prisma).completedLesson.findMany({
      where: { courseProgress: { userId }, completedAt: { gte: since } },
      select: { completedAt: true },
    });
  }
}

export const staffCourseRepository = new StaffCourseRepository();
