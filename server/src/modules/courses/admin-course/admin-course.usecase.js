// Business logic / orchestration for the ADMIN (management) course surface. Prisma
// never appears here — only repo calls. Errors are thrown as AppError(code, status);
// success values are returned. Behavior is ported 1:1 from
// the legacy admin course service (same shapes, same aggregation,
// same side effects), restructured into the layered module.
import { AppError } from "../../../shared/errors/AppError.js";
import { coursesMessagesCodes, generalMessagesCodes } from "@dms/shared";
import { adminCourseRepository } from "./admin-course.repo.js";
import { staffCourseUsecase } from "../staff-course/staff-course.usecase.js";
import {
  getCourseQuestionValidationMessage,
  isValidPublishedTest,
} from "../course-test-validity.js";

// `endAttempt` re-scores an attempt after a text answer is approved (legacy imported it
// from the staff service). Delegates to the staff usecase's scoring routine — the single
// source of scoring math.
const endAttempt = (args) => staffCourseUsecase.endAttempt(args);

class AdminCourseUsecase {
  #assertValidQuestion(question) {
    const message = getCourseQuestionValidationMessage(question);
    if (message) {
      throw new AppError({
        code: generalMessagesCodes.VALIDATION_ERROR,
        statusCode: 422,
        details: [{ path: "choices", message }],
      });
    }
  }

  // ── courses ──────────────────────────────────────────────────────────────────
  // Legacy `getCourses({ limit, skip })` → { data: courses, totalPages, total }.
  async listCourses({ skip, take }) {
    const [courses, total] = await Promise.all([
      adminCourseRepository.listCourses({ skip, take }),
      adminCourseRepository.countCourses(),
    ]);
    const totalPages = take ? Math.ceil(total / take) : 1;
    return { courses, total, totalPages };
  }

  // Legacy `createNewCourse` — nested-create the course roles.
  async createCourse({ data }) {
    return adminCourseRepository.createCourse({
      data: {
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        isPublished: data.isPublished,
      },
    });
  }

  // Legacy `editCourse` — replace roles wholesale when provided. M2: only assign
  // explicitly-whitelisted scalars (no blind spread of the request body into Prisma).
  async editCourse({ data, courseId }) {
    const update = {};
    if (data.title !== undefined) update.title = data.title;
    if (data.description !== undefined) update.description = data.description;
    if (data.imageUrl !== undefined) update.imageUrl = data.imageUrl;
    if (data.isPublished !== undefined) update.isPublished = data.isPublished;
    return adminCourseRepository.updateCourse({ id: courseId, data: update });
  }

  // ── lessons ──────────────────────────────────────────────────────────────────
  // Legacy `getLessonsByCourseId` → { lessons, courseTitle }.
  async getLessonsByCourseId({ courseId }) {
    const [lessons, course] = await Promise.all([
      adminCourseRepository.listLessonsByCourseId({ courseId }),
      adminCourseRepository.getCourseById({ id: courseId, select: { title: true } }),
    ]);
    return { lessons, courseTitle: course?.title };
  }

  async getLessonById({ lessonId }) {
    return adminCourseRepository.getLessonById({ id: lessonId });
  }

  // Legacy `createNewLesson` — coerce order/duration, set courseId. M2: build the
  // payload from whitelisted lesson fields only (Zod strict already rejects extras).
  async createLesson({ data, courseId }) {
    const payload = { ...this.#lessonFields(data), courseId };
    return adminCourseRepository.createLesson({ data: payload });
  }

  async editLesson({ data, lessonId }) {
    return adminCourseRepository.updateLesson({
      id: lessonId,
      data: this.#lessonFields(data),
    });
  }

  // Whitelisted, coerced Lesson scalars (M2).
  #lessonFields(data) {
    const out = {};
    if (data.title !== undefined) out.title = data.title;
    if (data.description !== undefined) out.description = data.description;
    if (data.duration != null) out.duration = Number(data.duration);
    if (data.order != null) out.order = Number(data.order);
    if (data.isPreviewable !== undefined) out.isPreviewable = data.isPreviewable;
    if (data.mustUploadHomework !== undefined)
      out.mustUploadHomework = data.mustUploadHomework;
    return out;
  }

  async toggleMustUploadHomework({ lessonId, mustUploadHomework }) {
    return adminCourseRepository.updateLessonHomeworkFlag({
      id: lessonId,
      mustUploadHomework,
    });
  }

  async deleteLesson({ lessonId }) {
    return adminCourseRepository.deleteLessonCascade({ lessonId });
  }

  // ── lesson videos ────────────────────────────────────────────────────────────
  async getVideosByLessonId({ lessonId }) {
    return adminCourseRepository.listVideosByLessonId({ lessonId });
  }

  async createLessonVideo({ data, lessonId }) {
    return adminCourseRepository.createLessonVideo({
      data: { ...this.#videoFields(data), lessonId },
    });
  }

  async editLessonVideo({ data, videoId }) {
    return adminCourseRepository.updateLessonVideo({
      id: videoId,
      data: this.#videoFields(data),
    });
  }

  // Whitelisted, coerced LessonVideo scalars (M2).
  #videoFields(data) {
    const out = {};
    if (data.url !== undefined) out.url = data.url;
    if (data.videoType !== undefined) out.videoType = data.videoType;
    if (data.order != null) out.order = Number(data.order);
    return out;
  }

  async deleteLessonVideo({ videoId }) {
    return adminCourseRepository.deleteLessonVideo({ videoId });
  }

  // ── lesson pdfs ────────────────────────────────────────────────────────────────
  async getPdfsByLessonId({ lessonId }) {
    return adminCourseRepository.listPdfsByLessonId({ lessonId });
  }

  async createLessonPdf({ data, lessonId }) {
    return adminCourseRepository.createLessonPdf({
      data: { ...this.#pdfFields(data), lessonId },
    });
  }

  async editLessonPdf({ data, pdfId }) {
    return adminCourseRepository.updateLessonPdf({
      id: pdfId,
      data: this.#pdfFields(data),
    });
  }

  // Whitelisted, coerced LessonPDF scalars (M2).
  #pdfFields(data) {
    const out = {};
    if (data.url !== undefined) out.url = data.url;
    if (data.order != null) out.order = Number(data.order);
    return out;
  }

  async deleteLessonPdf({ pdfId }) {
    return adminCourseRepository.deleteLessonPdf({ id: pdfId });
  }

  // ── lesson links ───────────────────────────────────────────────────────────────
  async getLinksByLessonId({ lessonId }) {
    return adminCourseRepository.listLinksByLessonId({ lessonId });
  }

  async createLessonLink({ data, lessonId }) {
    return adminCourseRepository.createLessonLink({
      data: { ...this.#linkFields(data), lessonId },
    });
  }

  async editLessonLink({ data, linkId }) {
    return adminCourseRepository.updateLessonLink({
      id: linkId,
      data: this.#linkFields(data),
    });
  }

  // Whitelisted, coerced LessonLink scalars (M2).
  #linkFields(data) {
    const out = {};
    if (data.url !== undefined) out.url = data.url;
    if (data.title !== undefined) out.title = data.title;
    if (data.order != null) out.order = Number(data.order);
    return out;
  }

  async deleteLessonLink({ linkId }) {
    return adminCourseRepository.deleteLessonLink({ id: linkId });
  }

  // ── lesson video pdfs ──────────────────────────────────────────────────────────
  async getLessonVideoPdfs({ videoId }) {
    return adminCourseRepository.listVideoPdfs({ videoId });
  }

  async createLessonVideoPdf({ title, url, videoId }) {
    return adminCourseRepository.createVideoPdf({ data: { title, url, videoId } });
  }

  async deleteLessonVideoPdf({ pdfId }) {
    return adminCourseRepository.deleteVideoPdf({ id: pdfId });
  }

  // ── lesson access / allowed roles ────────────────────────────────────────────────
  async getAllowedLessonUsers({ lessonId }) {
    return adminCourseRepository.getAllowedLessonUsers({ lessonId });
  }

  async grantLessonAccess({ lessonId, userId }) {
    return adminCourseRepository.createLessonAccess({ lessonId, userId });
  }

  async deleteLessonAccess({ id }) {
    return adminCourseRepository.deleteLessonAccess({ id });
  }

  // ── homeworks (admin review) ─────────────────────────────────────────────────────
  // Legacy `getListOfHomeWorks` — group homeworks by user.
  async getListOfHomeworks({ lessonId }) {
    const rows = await adminCourseRepository.listHomeworksByLessonId({ lessonId });
    return Object.values(
      rows.reduce((acc, hw) => {
        const uid = hw.user.id;
        if (!acc[uid]) {
          acc[uid] = {
            name: hw.user.name,
            email: hw.user.email,
            listOfHomeworks: [],
          };
        }
        const { id, title, url, type, createdAt } = hw;
        acc[uid].listOfHomeworks.push({ id, title, url, type, createdAt });
        return acc;
      }, {}),
    );
  }

  // ── tests ──────────────────────────────────────────────────────────────────────
  // Legacy `getTests({ key, id })` → { title, tests }.
  async getTests({ key, id }) {
    const item = await adminCourseRepository.getTestOwnerTitle({ key, id });
    let where = { [key]: id };
    if (key === "courseId") {
      where = { OR: [{ courseId: id }, { lesson: { courseId: id } }] };
    }
    const tests = await adminCourseRepository.listTests({ where });
    return { title: item?.title, tests };
  }

  // Legacy `getTestData` returns just the ordered questions list.
  async getTestData({ testId }) {
    const test = await adminCourseRepository.getTestQuestionsOrdered({ testId });
    return test?.questions;
  }

  // Legacy `createTest({ key, id, attemptLimit, type, timeLimit, title, published })`.
  async createTest({ key, id, attemptLimit, type, timeLimit, title, published }) {
    if (published) {
      throw new AppError({
        code: generalMessagesCodes.VALIDATION_ERROR,
        statusCode: 422,
        details: [
          {
            path: "published",
            message: coursesMessagesCodes.TEST_MUST_START_AS_DRAFT,
          },
        ],
      });
    }
    return adminCourseRepository.createTest({
      data: {
        [key]: id,
        title,
        attemptLimit: attemptLimit ? Number(attemptLimit) : 0,
        type,
        timeLimit: Number(timeLimit) || 0,
        published,
      },
    });
  }

  // M2: assign only whitelisted Test scalars; coerce numeric fields. FKs
  // (courseId/lessonId/id) are intentionally NOT assignable via edit.
  async editTest({ data, testId }) {
    if (data.published === true) {
      const test = await adminCourseRepository.getTestForPublishing({ id: testId });
      if (!test) {
        throw new AppError({ code: coursesMessagesCodes.TEST_NOT_FOUND, statusCode: 404 });
      }
      if (!isValidPublishedTest(test.questions)) {
        throw new AppError({
          code: generalMessagesCodes.VALIDATION_ERROR,
          statusCode: 422,
          details: [
            {
              path: "published",
              message: coursesMessagesCodes.TEST_VALID_QUESTION_REQUIRED,
            },
          ],
        });
      }
    }
    const update = {};
    if (data.title !== undefined) update.title = data.title;
    if (data.type !== undefined) update.type = data.type;
    if (data.attemptLimit != null) update.attemptLimit = Number(data.attemptLimit);
    if (data.timeLimit != null) update.timeLimit = Number(data.timeLimit);
    if (data.published !== undefined) update.published = data.published;
    if (data.certificateApprovedByAdmin !== undefined)
      update.certificateApprovedByAdmin = data.certificateApprovedByAdmin;
    return adminCourseRepository.updateTest({ id: testId, data: update });
  }

  async deleteTest({ testId }) {
    await adminCourseRepository.deleteTestCascade({ testId });
    return true;
  }

  // ── test questions ────────────────────────────────────────────────────────────────
  // Legacy `reOrderTestQuestions` — set order = index + 1 for each posted id.
  async reorderTestQuestions({ data }) {
    for (let index = 0; index < data.length; index++) {
      await adminCourseRepository.reorderQuestion({
        id: Number(data[index].id),
        order: index + 1,
      });
    }
    return true;
  }

  async getTestQuestionData({ id }) {
    return adminCourseRepository.getQuestionById({ id });
  }

  // Legacy `createTestQuestion` — next order, nested-create choices.
  async createTestQuestion({ id, data }) {
    this.#assertValidQuestion(data);
    const last = await adminCourseRepository.getLastQuestionOrder({ testId: id });
    const nextOrder = last ? last.order + 1 : 1;
    const choices = data.choices.map((choice) => ({
      text: choice.text,
      value: choice.value,
      isCorrect: choice.isCorrect,
      order: choice.order,
    }));
    return adminCourseRepository.createQuestion({
      data: {
        testId: id,
        type: data.type,
        question: data.question,
        order: nextOrder,
        choices: { create: choices },
      },
    });
  }

  // Legacy `editQuestion` — per-choice CREATE/DELETE/update, then update the text.
  async editQuestion({ data, questionId }) {
    const current = await adminCourseRepository.getQuestionById({ id: questionId });
    if (!current) {
      throw new AppError({ code: coursesMessagesCodes.TEST_NOT_FOUND, statusCode: 404 });
    }
    const finalChoices = new Map(
      current.choices.map((choice) => [Number(choice.id), { ...choice }]),
    );
    const createdChoices = [];
    for (const choice of data.choices) {
      if (choice.type === "DELETE") {
        finalChoices.delete(Number(choice.id));
      } else if (choice.type === "CREATE") {
        createdChoices.push({
          text: choice.text,
          isCorrect: choice.isCorrect,
          order: choice.order,
        });
      } else {
        const existing = finalChoices.get(Number(choice.id));
        if (existing) {
          finalChoices.set(Number(choice.id), {
            ...existing,
            text: choice.text,
            isCorrect: choice.isCorrect,
            order: choice.order,
          });
        }
      }
    }
    this.#assertValidQuestion({
      type: current.type,
      choices: [...finalChoices.values(), ...createdChoices],
    });

    for (const choice of data.choices) {
      if (choice.type === "DELETE") {
        await adminCourseRepository.deleteChoice({ id: Number(choice.id) });
      } else if (choice.type === "CREATE") {
        await adminCourseRepository.createChoice({
          data: {
            isCorrect: choice.isCorrect,
            text: choice.text,
            value: choice.text,
            questionId,
            order: choice.order,
          },
        });
      } else {
        await adminCourseRepository.updateChoice({
          id: Number(choice.id),
          data: {
            text: choice.text,
            value: choice.text,
            isCorrect: choice.isCorrect,
            order: choice.order,
          },
        });
      }
    }
    await adminCourseRepository.updateQuestionText({
      id: questionId,
      question: data.question,
    });
    return true;
  }

  async deleteQuestion({ questionId }) {
    await adminCourseRepository.deleteQuestionCascade({ questionId });
    return true;
  }

  // ── attempts (admin) ───────────────────────────────────────────────────────────
  // Legacy admin `/tests/:testId/attampts/user` reused the staff service's
  // `getUserAttampts` (full attempt records for one user). We delegate to the staff
  // usecase so the query/shape stays the single source of truth.
  async getUserAttempts({ testId, userId }) {
    return staffCourseUsecase.getUserAttempts({ testId, userId });
  }

  // Legacy `getTestAttemptsSummary({ testId, userId })` — group by user.
  async getTestAttemptsSummary({ testId, userId }) {
    const where = { testId };
    if (userId) where.userId = userId;
    const attempts = await adminCourseRepository.listAttemptsForSummary({ where });
    return this.#groupAttemptsByUser(attempts);
  }

  // Legacy `getAttemptsSummary({ limit, skip, userId })` → paginated { data, total, totalPages }.
  async getAttemptsSummary({ skip, take, userId }) {
    const where = {};
    if (userId) where.userId = userId;
    const [attempts, total] = await Promise.all([
      adminCourseRepository.listAttemptsForSummary({ where, skip, take }),
      adminCourseRepository.countAttempts(),
    ]);
    const totalPages = take ? Math.ceil(total / take) : 1;
    return { attempts, total, totalPages };
  }

  // Legacy `approveUserAnswer` — flip approval, then re-score the attempt.
  async approveUserAnswer({ attemptId, questionId, isApproved }) {
    await adminCourseRepository.updateUserAnswerApproval({
      questionId,
      attemptId,
      isApproved,
    });
    // H1: admin re-score path explicitly bypasses the staff terminal-state guard —
    // approving a TEXT answer legitimately re-scores an already-finalized attempt.
    await endAttempt({ attemptId, reScore: true });
    return true;
  }

  // Legacy `increaseAttemptToUser` — bump the latest attempt's limit by one.
  async increaseAttemptToUser({ testId, userId }) {
    const last = await adminCourseRepository.getLastUserAttempt({ testId, userId });
    if (!last) throw new AppError({ code: coursesMessagesCodes.ATTEMPT_NOT_FOUND, statusCode: 404 });
    await adminCourseRepository.updateAttemptLimit({
      id: last.id,
      attemptLimit: last.attemptLimit + 1,
    });
    return true;
  }

  // Legacy `decreaseAttemptToUser` — guard against dropping below consumed count.
  async decreaseAttemptToUser({ testId, userId }) {
    const last = await adminCourseRepository.getLastUserAttempt({ testId, userId });
    if (!last) throw new AppError({ code: coursesMessagesCodes.ATTEMPT_NOT_FOUND, statusCode: 404 });
    if (last.attemptLimit === last.attemptCount) {
      throw new AppError({ code: coursesMessagesCodes.ATTEMPT_CANNOT_DECREASE, statusCode: 400 });
    }
    await adminCourseRepository.updateAttemptLimit({
      id: last.id,
      attemptLimit: last.attemptLimit - 1,
    });
    return true;
  }

  // ── admin dashboard ────────────────────────────────────────────────────────────
  // Legacy `getDashBoardDataForAdmin` — aggregation ported verbatim.
  async getDashboardData() {
    const testStats = await adminCourseRepository.aggregateTestAttempts();
    const totalAttempts = testStats._count;
    const averageScore = Number((testStats._avg.score ?? 0).toFixed(2));
    const passedAttempts = await adminCourseRepository.countPassedAttempts();
    const failedAttempts = totalAttempts - passedAttempts;

    const totalCourses = await adminCourseRepository.countCourses();
    const publishedCourses = await adminCourseRepository.countPublishedCourses();
    const totalLessons = await adminCourseRepository.countLessons();
    const totalVideos = await adminCourseRepository.countVideos();
    const totalPDFs = await adminCourseRepository.countPdfs();
    const totalTestAttempts = await adminCourseRepository.countAttempts();
    const passedTests = await adminCourseRepository.countPassedAttempts();
    const courseCompletions = await adminCourseRepository.countCourseCompletions();

    const progressData = await adminCourseRepository.listAllProgressForDashboard();
    const progressList = progressData.map((cp) => {
      const totalItems = cp.course.lessons.length;
      const completedItems = cp.completedLessons.length;
      return totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
    });
    const avgCourseProgress = Number(
      (
        progressList.reduce((sum, p) => sum + p, 0) /
        (progressList.length || 1)
      ).toFixed(2),
    );

    const totalHomeworkSubmissions = await adminCourseRepository.countHomeworks();
    const topCoursesRaw = await adminCourseRepository.listTopCourses();
    const topCourses = topCoursesRaw.map((course) => {
      const enrollments = course.progress.length;
      const totalItems = course.lessons?.length || 0;
      const totalCompletionRates = course.progress.map((cp) => {
        const completed = cp.completedLessons.length;
        return (completed / totalItems) * 100;
      });
      const completionRate =
        totalCompletionRates.reduce((a, b) => a + b, 0) /
        (totalCompletionRates.length || 1);
      const allScores = course.tests.flatMap((test) =>
        test.attempts.map((a) => a.score ?? 0),
      );
      const courseAverageScore =
        allScores.reduce((a, b) => a + b, 0) / (allScores.length || 1);
      return {
        id: course.id,
        title: course.title,
        enrollments,
        completionRate: Math.round(completionRate),
        averageScore: Math.round(courseAverageScore),
      };
    });

    return {
      testStats: { totalAttempts, passedAttempts, failedAttempts, averageScore },
      totalCourses,
      publishedCourses,
      totalLessons,
      totalVideos,
      totalPDFs,
      totalTestAttempts,
      passedTests,
      courseCompletions,
      avgCourseProgress,
      totalHomeworkSubmissions,
      topCourses,
    };
  }

  // Private — legacy `getTestAttemptsSummary` grouping (kept identical).
  #groupAttemptsByUser(attempts) {
    const grouped = attempts.reduce((acc, attempt) => {
      const userId = attempt.userId;
      if (!acc[userId]) {
        acc[userId] = {
          name: attempt.user.name,
          email: attempt.user.email,
          profile: attempt.user.currentProfile,
          attempts: 1,
          maxScore: attempt.score ?? 0,
          passed: attempt.passed,
          lastAttempt: attempt.endTime ?? null,
          userId,
        };
      } else {
        acc[userId].attempts++;
        acc[userId].maxScore = Math.max(
          acc[userId].maxScore,
          attempt.score ?? 0,
        );
        acc[userId].passed = acc[userId].passed || attempt.passed;
        if (
          attempt.endTime &&
          (!acc[userId].lastAttempt || acc[userId].lastAttempt < attempt.endTime)
        ) {
          acc[userId].lastAttempt = attempt.endTime;
        }
      }
      return acc;
    }, {});
    return Object.values(grouped);
  }
}

export const adminCourseUsecase = new AdminCourseUsecase();
export { AdminCourseUsecase };
