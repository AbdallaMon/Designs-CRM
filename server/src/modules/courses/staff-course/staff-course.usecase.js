// Business logic / orchestration for the STAFF (course-consumption) surface.
// Prisma never appears here — only repo calls. Errors are thrown as AppError(code,
// statusCode); success values are returned. Behavior is ported 1:1 from
// `services/main/courses/staffCoursesServices.js` — same gating, same scoring math,
// same outputs.
import { AppError } from "../../../shared/errors/AppError.js";
import { coursesMessagesCodes } from "@dms/shared";
import { staffCourseRepository } from "./staff-course.repository.js";

// Notification on a fully-consumed failed attempt. Injected so this module stays
// import-light and unit-testable; the default lazily loads the (not-yet-migrated)
// legacy notifier so observable behavior is preserved. Notifications are a Phase-11
// migration — we call the existing implementation rather than duplicate it.
async function defaultNotifyAttemptFailed({ testId, userId }) {
  const { attemptFailedByUser } = await import(
    "../../../../services/notification.js"
  );
  return attemptFailedByUser({ testId, userId });
}

export class StaffCourseUsecase {
  /**
   * @param {import("./staff-course.repository.js").StaffCourseRepository} repository
   * @param {{ notifyAttemptFailed?: Function }} [deps]
   */
  constructor(repository, { notifyAttemptFailed } = {}) {
    this.repository = repository;
    this.notifyAttemptFailed = notifyAttemptFailed || defaultNotifyAttemptFailed;
  }

  // ── Object-scope checker — attempts are OWNER-scoped ─────────────────────────────
  // Legacy loaded attempts with `where: { userId }`, so a user could only read their
  // own attempt. We enforce that explicitly: THROW 403 when the attempt is not the
  // caller's. Returns the (id, userId) row on success.
  async checkIfUserCanAccessAttempt({ attemptId, authUserId }) {
    const attempt = await this.repository.getAttemptOwner({ attemptId });
    if (!attempt) {
      throw new AppError(coursesMessagesCodes.ATTEMPT_NOT_FOUND, 404);
    }
    if (attempt.userId !== authUserId) {
      throw new AppError(coursesMessagesCodes.ATTEMPT_ACCESS_DENIED, 403);
    }
    return attempt;
  }

  // ── Object-scope checker — attempt MUTATIONS are OWNER-scoped (C1 / C2) ───────────
  // Wired via requireSpecialChecker on submit-answer + end-attempt. Identical owner
  // semantics to the access checker (404 missing / 403 not the caller's), but named
  // for the write surface so the layering reads correctly. Returns the loaded row
  // (id, userId, testId, endTime) on success.
  async checkIfUserCanMutateAttempt({ attemptId, authUserId }) {
    const attempt = await this.repository.getAttemptOwner({ attemptId });
    if (!attempt) {
      throw new AppError(coursesMessagesCodes.ATTEMPT_NOT_FOUND, 404);
    }
    if (attempt.userId !== authUserId) {
      throw new AppError(coursesMessagesCodes.ATTEMPT_ACCESS_DENIED, 403);
    }
    return attempt;
  }

  // ── courses ───────────────────────────────────────────────────────────────────
  async listCourses({ role, skip, take }) {
    return this.repository.listPublishedCoursesForRole({ role, skip, take });
  }

  async getCourse({ courseId, role, userId }) {
    const course = await this.repository.getPublishedCourseForRole({
      courseId,
      role,
      userId,
    });
    if (!course) return null;

    const [previewableLessonsCount, publishedTestsCount] = await Promise.all([
      this.repository.countPreviewableLessons({ courseId }),
      this.repository.countPublishedCourseTests({ courseId }),
    ]);

    return {
      ...course,
      _count: { lessons: previewableLessonsCount, tests: publishedTestsCount },
    };
  }

  async getUserCourseProgress({ courseId, userId }) {
    const [completedLessons, completedTests, testAttempts] = await Promise.all([
      this.repository.listCompletedLessonIds({ userId, courseId }),
      this.repository.listCompletedTestIds({ userId, courseId }),
      this.repository.listTestAttemptsForCourse({ userId, courseId }),
    ]);

    return {
      completedLessons: completedLessons.map((l) => l.lessonId),
      testAttempts,
      completedTests: completedTests.map((t) => t.testId),
    };
  }

  // ── lessons ──────────────────────────────────────────────────────────────────
  async getLesson({ role, lessonId, userId }) {
    const lesson = await this.repository.getPreviewableLessonForRole({
      lessonId,
      role,
    });
    if (!lesson) {
      throw new AppError(coursesMessagesCodes.LESSON_NOT_FOUND, 404);
    }
    await this.assertCanAccessLesson({ lesson, userId });
    return lesson;
  }

  // Mirrors legacy `canAccessAlesson`: requires an explicit LessonAccess row AND all
  // previous homework lessons completed AND their published tests passed.
  async assertCanAccessLesson({ lesson, userId }) {
    const access = await this.repository.getLessonAccess({
      lessonId: lesson.id,
      userId,
    });
    if (!access) {
      throw new AppError(coursesMessagesCodes.LESSON_ACCESS_DENIED, 403);
    }
    await this.assertPreviousLessonsCleared({
      courseId: lesson.courseId,
      order: lesson.order,
      userId,
    });
  }

  // Shared gate used by lesson-access and test-access (legacy canAccessALessonTest /
  // canAccessACourseTest). `order === undefined` means "all homework lessons in the
  // course" (course-level test gate); otherwise "previous lessons only".
  async assertPreviousLessonsCleared({ courseId, order, userId }) {
    const previousLessons = await this.repository.listPreviousHomeworkLessons({
      courseId,
      order,
    });
    const previousLessonIds = previousLessons.map((l) => l.id);

    const completed = await this.repository.listCompletedLessonIdsIn({
      userId,
      courseId,
      lessonIds: previousLessonIds,
    });
    const completedIds = completed.map((l) => l.lessonId);
    const allPreviousCompleted = previousLessonIds.every((id) =>
      completedIds.includes(id),
    );

    const lessonsWithTests = await this.repository.listLessonsWithPublishedTests({
      lessonIds: previousLessonIds,
    });

    let allPreviousTestsPassed = true;
    for (const lessonWithTest of lessonsWithTests) {
      for (const test of lessonWithTest.tests) {
        const attempt = await this.repository.findPassedAttempt({
          userId,
          testId: test.id,
        });
        if (!attempt) {
          allPreviousTestsPassed = false;
          break;
        }
      }
      if (!allPreviousTestsPassed) break;
    }

    if (!allPreviousCompleted || !allPreviousTestsPassed) {
      throw new AppError(
        coursesMessagesCodes.PREVIOUS_LESSONS_INCOMPLETE,
        403,
      );
    }
  }

  // ── homework ───────────────────────────────────────────────────────────────────
  async getHomeworks({ userId, lessonId }) {
    return this.repository.listHomeworks({ userId, lessonId });
  }

  // Legacy `createAHomeWork`: create a homework row, then if BOTH a VIDEO and a
  // SUMMARY exist for the lesson, mark the lesson complete.
  async createHomework({ data, lessonId, userId, courseId }) {
    await this.repository.createHomework({
      data: {
        lessonId,
        userId,
        url: data.url,
        type: data.type,
        title: data.title || data.type,
      },
    });

    const homeworks = await this.repository.listHomeworkTypes({
      userId,
      lessonId,
    });
    const hasVideo = homeworks.some((hw) => hw.type === "VIDEO");
    const hasSummary = homeworks.some((hw) => hw.type === "SUMMARY");
    if (hasSummary && hasVideo) {
      await this.markLessonAsCompleted({ lessonId, userId, courseId });
    }
    return;
  }

  async markLessonAsCompleted({ lessonId, courseId, userId }) {
    let courseProgress = await this.repository.findCourseProgress({
      courseId,
      userId,
    });
    if (!courseProgress) {
      courseProgress = await this.repository.createCourseProgress({
        courseId,
        userId,
      });
    }
    return this.repository.createCompletedLesson({
      lessonId,
      courseProgressId: courseProgress.id,
    });
  }

  // ── tests (staff) ────────────────────────────────────────────────────────────────
  // Legacy `getUserTest`: admins pass a falsy userId and skip the access gates.
  async getUserTest({ testId, userId }) {
    const test = await this.repository.getPublishedTestWithRelations({ testId });
    if (userId) {
      if (test?.lesson) {
        await this.assertPreviousLessonsCleared({
          courseId: test.lesson.courseId,
          order: test.lesson.order,
          userId,
        });
      }
      if (test?.course) {
        await this.assertPreviousLessonsCleared({
          courseId: test.course.id,
          order: undefined,
          userId,
        });
      }
    }
    return test;
  }

  async getUserTestQuestions({ testId }) {
    return this.repository.listTestQuestions({ testId });
  }

  // ── attempts (staff) ──────────────────────────────────────────────────────────
  async getUserAttempts({ testId, userId }) {
    return this.repository.listUserAttempts({ testId, userId });
  }

  async getUserAttempt({ attemptId, userId }) {
    return this.repository.getUserAttempt({ attemptId, userId });
  }

  // Legacy `createAttampt`: enforce the per-user attempt limit, then create.
  // M1 (TOCTOU): the limit check + insert run in ONE transaction, and the prior
  // attempt row is read `FOR UPDATE` so two concurrent requests serialize on it —
  // the second blocks until the first commits its new row, then re-reads it and is
  // correctly rejected. Same observable result/shape as before for serial callers.
  async createAttempt({ testId, userId }) {
    const test = await this.repository.getTestById({ testId });
    if (!test) throw new AppError(coursesMessagesCodes.TEST_NOT_FOUND, 404);

    return this.repository.runTransaction(async (tx) => {
      const last = await this.repository.getLastUserAttemptForUpdate({
        testId,
        userId,
        client: tx,
      });
      const attemptLimit = Math.max(last?.attemptLimit ?? 0, test.attemptLimit);

      if (last && last.attemptCount >= last.attemptLimit) {
        throw new AppError(coursesMessagesCodes.ATTEMPT_LIMIT_REACHED, 400);
      }

      const created = await this.repository.createAttempt({
        client: tx,
        data: {
          testId,
          userId,
          attemptCount: (last?.attemptCount || 0) + 1,
          attemptLimit,
          startTime: new Date(),
        },
      });
      // Legacy re-fetched the row before returning; the created row is equivalent.
      return created;
    });
  }

  // Legacy `submitAnswer`: upsert the answer + its selected choices.
  // Security hardening (the route also wires the owner special checker — C1):
  //   • C1 — owner re-asserted here (defence in depth + testable in isolation).
  //   • H1 — reject when the attempt is already finalized (endTime set, 409).
  //   • H2 — the question must belong to the attempt's test AND the route's
  //          :testId must match the attempt's test (foreign-test question → 400).
  async submitAnswer({ answer, attemptId, questionId, testId, authUserId }) {
    const attempt = await this.repository.getAttemptOwner({ attemptId });
    if (!attempt) {
      throw new AppError(coursesMessagesCodes.ATTEMPT_NOT_FOUND, 404);
    }
    if (authUserId != null && attempt.userId !== authUserId) {
      throw new AppError(coursesMessagesCodes.ATTEMPT_ACCESS_DENIED, 403);
    }
    if (attempt.endTime) {
      throw new AppError(coursesMessagesCodes.ATTEMPT_ALREADY_ENDED, 409);
    }
    if (testId != null && attempt.testId !== testId) {
      throw new AppError(coursesMessagesCodes.QUESTION_TEST_MISMATCH, 400);
    }

    const question = await this.repository.getQuestionTestId({ questionId });
    if (!question || question.testId !== attempt.testId) {
      throw new AppError(coursesMessagesCodes.QUESTION_TEST_MISMATCH, 400);
    }

    const existing = await this.repository.findExistingAnswer({
      attemptId,
      questionId,
    });

    const selectedAnswers = answer.selectedAnswers
      ? {
          create: answer.selectedAnswers.map((value, index) => ({
            value,
            order: index + 1,
          })),
        }
      : undefined;

    if (existing) {
      if (existing.selectedAnswers.length > 0) {
        await this.repository.deleteSelectedAnswers({
          userAnswerId: existing.id,
        });
      }
      return this.repository.updateUserAnswer({
        id: existing.id,
        data: { textAnswer: answer.textAnswer || null, selectedAnswers },
      });
    }

    return this.repository.createUserAnswer({
      data: {
        attemptId,
        questionId,
        textAnswer: answer.textAnswer || null,
        selectedAnswers,
      },
    });
  }

  // Legacy `endAttempt`: score the attempt, persist, and notify on a fully-consumed
  // failure. Scoring math is copied VERBATIM. Also used by the admin surface after
  // approving a text answer.
  // `reScore` is passed ONLY by the admin approve-answer path (re-scoring an already
  // finalized attempt after manually approving a TEXT answer). Staff callers never
  // pass it, so a staff PUT on a finalized attempt (endTime set) is rejected (H1).
  async endAttempt({ attemptId, reScore = false }) {
    const attempt = await this.repository.getAttemptForScoring({ attemptId });
    if (!attempt) throw new AppError(coursesMessagesCodes.ATTEMPT_NOT_FOUND, 404);

    if (!reScore && attempt.endTime) {
      throw new AppError(coursesMessagesCodes.ATTEMPT_ALREADY_ENDED, 409);
    }

    const totalQuestions = attempt.test.questions.length;
    let earnedPoints = 0;

    for (const answer of attempt.answers) {
      if (answer.question.type === "TEXT") {
        if (answer.isApproved) earnedPoints += 1;
        continue;
      }

      const correctChoices = answer.question.choices
        .filter((c) => c.isCorrect)
        .map((c) => c.text);
      const selectedChoices = answer.selectedAnswers.map((c) => c.value);

      if (answer.question.type === "ORDERING") {
        const correctOrder = answer.question.choices
          .sort((a, b) => a.order - b.order)
          .map((c) => c.text);
        const isCorrect =
          JSON.stringify(correctOrder) === JSON.stringify(selectedChoices);
        if (isCorrect) {
          earnedPoints += 1;
        } else {
          let correctPositions = 0;
          for (let i = 0; i < correctOrder.length; i++) {
            if (selectedChoices[i] === correctOrder[i]) correctPositions += 1;
          }
          earnedPoints += correctPositions / correctOrder.length;
        }
        continue;
      }

      if (answer.question.type === "MULTIPLE_CHOICE") {
        const totalCorrect = correctChoices.length;
        const selectedCorrect = selectedChoices.filter((v) =>
          correctChoices.includes(v),
        ).length;
        earnedPoints += selectedCorrect / totalCorrect;
      } else {
        const isCorrect =
          JSON.stringify(correctChoices.sort()) ===
          JSON.stringify(selectedChoices.sort());
        if (isCorrect) earnedPoints += 1;
      }
    }

    const score = (earnedPoints / totalQuestions) * 100;
    const passed = score >= 80;
    await this.repository.updateAttemptScore({
      attemptId,
      score,
      passed,
      endTime: new Date(),
    });

    if (!passed && attempt.attemptCount >= attempt.attemptLimit) {
      await this.notifyAttemptFailed({
        testId: attempt.testId,
        userId: attempt.userId,
      });
    }
    return { score, passed };
  }

  // ── user dashboard ─────────────────────────────────────────────────────────────
  // Legacy `getUserDashboardStats` — aggregation ported verbatim.
  async getUserDashboardStats({ userId }) {
    const enrolledCourses = await this.repository.listEnrolledCourses({ userId });

    const totalEnrolledCourses = enrolledCourses.length;
    const publishedEnrolledCourses = enrolledCourses.filter(
      (progress) => progress.course.isPublished,
    ).length;

    let completedCourses = 0;
    const courseCompletionDetails = [];
    for (const progress of enrolledCourses) {
      const totalLessons = await this.repository.countCourseLessons({
        courseId: progress.courseId,
      });
      const completedLessonsCount = progress.completedLessons.length;
      const completionPercentage =
        totalLessons > 0
          ? Number(((completedLessonsCount / totalLessons) * 100).toFixed(2))
          : 0;
      if (completionPercentage === 100) completedCourses++;
      courseCompletionDetails.push({
        ...progress.course,
        completionPercentage,
        completedLessons: completedLessonsCount,
        totalLessons,
        lastActivity: progress.updatedAt,
      });
    }

    const lessonAccess = await this.repository.listLessonAccessForUser({ userId });
    const totalAccessibleLessons = lessonAccess.length;
    const totalVideosAccessible = lessonAccess.reduce(
      (sum, access) => sum + access.lesson.videos.length,
      0,
    );
    const totalPDFsAccessible = lessonAccess.reduce(
      (sum, access) => sum + access.lesson.pdfs.length,
      0,
    );
    const totalLinksAccessible = lessonAccess.reduce(
      (sum, access) => sum + access.lesson.links.length,
      0,
    );

    const testAttempts = await this.repository.listUserTestAttemptsForDashboard({
      userId,
    });
    const totalAttempts = testAttempts.length;
    const passedAttempts = testAttempts.filter((a) => a.passed).length;
    const failedAttempts = totalAttempts - passedAttempts;
    const averageScore = totalAttempts
      ? Math.round(
          testAttempts.reduce((sum, a) => sum + (a.score || 0), 0) /
            totalAttempts,
        )
      : 0;

    const recentTestAttempts = testAttempts.slice(0, 5).map((attempt) => ({
      id: attempt.id,
      testTitle: attempt.test.title || "Untitled Test",
      courseTitle:
        attempt.test.course?.title || attempt.test.lesson?.title || "Unknown",
      score: attempt.score,
      passed: attempt.passed,
      createdAt: attempt.createdAt,
      testType: attempt.test.type,
    }));

    const certificates = await this.repository.countApprovedCertificates({
      userId,
    });
    const submittedHomeworks = await this.repository.countSubmittedHomeworks({
      userId,
    });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [attempts, recentHomeworks, recentLessons] = await Promise.all([
      this.repository.listRecentAttemptDates({ userId, since: thirtyDaysAgo }),
      this.repository.listRecentHomeworkDates({ userId, since: thirtyDaysAgo }),
      this.repository.listRecentCompletedLessonDates({
        userId,
        since: thirtyDaysAgo,
      }),
    ]);

    const recentActivity = [
      ...attempts.map((a) => a.createdAt),
      ...recentHomeworks.map((a) => a.createdAt),
      ...recentLessons.map((a) => a.completedAt),
    ].sort((a, b) => b.getTime() - a.getTime());

    let learningStreak = 0;
    if (recentActivity.length > 0) {
      const today = new Date();
      const activityDates = recentActivity.map((date) => date.toDateString());
      const uniqueDates = [...new Set(activityDates)].sort(
        (a, b) => new Date(b) - new Date(a),
      );
      let currentDate = new Date(today);
      for (const dateStr of uniqueDates) {
        const activityDate = new Date(dateStr);
        const diffTime = currentDate - activityDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 1) {
          learningStreak++;
          currentDate = activityDate;
        } else {
          break;
        }
      }
    }

    return {
      overview: {
        totalEnrolledCourses,
        publishedEnrolledCourses,
        completedCourses,
        totalCertificates: certificates,
        learningStreak,
      },
      learningStats: {
        totalAccessibleLessons,
        totalVideosAccessible,
        totalPDFsAccessible,
        totalLinksAccessible,
        submittedHomeworks,
      },
      testStats: {
        totalAttempts,
        passedAttempts,
        failedAttempts,
        averageScore,
        recentTestAttempts,
      },
      courseProgress: courseCompletionDetails.sort(
        (a, b) => b.completionPercentage - a.completionPercentage,
      ),
    };
  }
}

export const staffCourseUsecase = new StaffCourseUsecase(staffCourseRepository);
