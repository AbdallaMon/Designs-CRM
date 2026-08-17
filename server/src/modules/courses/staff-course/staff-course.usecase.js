// Business logic / orchestration for the STAFF (course-consumption) surface.
// Prisma never appears here — only repo calls. Errors are thrown as AppError(code,
// statusCode); success values are returned. Behavior is ported 1:1 from
// the legacy staff course service — same gating, same scoring math,
// same outputs.
import { AppError } from "../../../shared/errors/AppError.js";
import {
  COURSE_QUESTION_TYPES,
  HOMEWORK_TYPES,
  coursesMessagesCodes,
  generalMessagesCodes,
} from "@dms/shared";
import { staffCourseRepository } from "./staff-course.repo.js";
import { courseRoleForAuthUser } from "./course-profile-role.js";
import { isValidPublishedTest } from "../course-test-validity.js";
import { sanitizeLearnerQuestions } from "./staff-course.dto.js";
// Notification on a fully-consumed failed attempt — the (not-yet-migrated) legacy notifier,
// called directly so observable behavior is preserved (Notifications are a Phase-11 migration).
import { attemptFailedByUser } from "../../../infra/notifications/index.js";

class StaffCourseUsecase {
  #courseRole(authUser) {
    const courseRole = courseRoleForAuthUser(authUser);
    if (!courseRole) {
      throw new AppError({
        code: coursesMessagesCodes.COURSE_ACCESS_DENIED,
        statusCode: 403,
      });
    }
    return courseRole;
  }

  #assertAttemptIdentity({ attempt, attemptId, testId, authUserId }) {
    if (!attempt) {
      throw new AppError({ code: coursesMessagesCodes.ATTEMPT_NOT_FOUND, statusCode: 404 });
    }
    if (authUserId != null && attempt.userId !== authUserId) {
      throw new AppError({ code: coursesMessagesCodes.ATTEMPT_ACCESS_DENIED, statusCode: 403 });
    }
    if (testId != null && attempt.testId !== testId) {
      throw new AppError({ code: coursesMessagesCodes.QUESTION_TEST_MISMATCH, statusCode: 400 });
    }
    return attempt;
  }

  #assertAttemptOpenAndInTime({ attempt, test }) {
    if (attempt.endTime) {
      throw new AppError({ code: coursesMessagesCodes.ATTEMPT_ALREADY_ENDED, statusCode: 409 });
    }
    if (
      test?.timeLimit > 0 &&
      attempt.startTime &&
      Date.now() >=
        new Date(attempt.startTime).getTime() + Number(test.timeLimit) * 60 * 1000
    ) {
      throw new AppError({ code: coursesMessagesCodes.ATTEMPT_ALREADY_ENDED, statusCode: 409 });
    }
  }

  // ── Object-scope checker — attempts are OWNER-scoped ─────────────────────────────
  // Legacy loaded attempts with `where: { userId }`, so a user could only read their
  // own attempt. We enforce that explicitly: THROW 403 when the attempt is not the
  // caller's. Returns the (id, userId) row on success.
  async checkIfUserCanAccessAttempt({
    attemptId,
    testId,
    authUserId,
    authUser,
  }) {
    const attempt = await staffCourseRepository.getAttemptOwner({ attemptId });
    this.#assertAttemptIdentity({ attempt, attemptId, testId, authUserId });
    await this.assertCanAccessTest({ testId: attempt.testId, userId: authUserId, authUser });
    return attempt;
  }

  // ── Object-scope checker — attempt MUTATIONS are OWNER-scoped (C1 / C2) ───────────
  // Wired via requireSpecialChecker on submit-answer + end-attempt. Identical owner
  // semantics to the access checker (404 missing / 403 not the caller's), but named
  // for the write surface so the layering reads correctly. Returns the loaded row
  // (id, userId, testId, endTime) on success.
  async checkIfUserCanMutateAttempt(args) {
    return this.checkIfUserCanAccessAttempt(args);
  }

  // ── courses ───────────────────────────────────────────────────────────────────
  async listCourses({ skip, take, authUser }) {
    const courseRole = courseRoleForAuthUser(authUser);
    if (!courseRole) return [];
    return staffCourseRepository.listPublishedCourses({ skip, take, courseRole });
  }

  async getCourse({ courseId, userId, authUser }) {
    const courseRole = courseRoleForAuthUser(authUser);
    if (!courseRole) return null;
    const course = await staffCourseRepository.getPublishedCourse({
      courseId,
      userId,
      courseRole,
    });
    if (!course) return null;

    const [previewableLessonsCount, publishedTestsCount] = await Promise.all([
      staffCourseRepository.countPreviewableLessons({ courseId }),
      staffCourseRepository.countPublishedCourseTests({ courseId }),
    ]);

    return {
      ...course,
      _count: { lessons: previewableLessonsCount, tests: publishedTestsCount },
    };
  }

  async getUserCourseProgress({ courseId, userId, authUser }) {
    const courseRole = this.#courseRole(authUser);
    const course = await staffCourseRepository.getPublishedCourse({
      courseId,
      userId,
      courseRole,
    });
    if (!course) {
      throw new AppError({ code: coursesMessagesCodes.COURSE_ACCESS_DENIED, statusCode: 403 });
    }
    const [completedLessons, completedTests, testAttempts] = await Promise.all([
      staffCourseRepository.listCompletedLessonIds({ userId, courseId }),
      staffCourseRepository.listCompletedTestIds({ userId, courseId }),
      staffCourseRepository.listTestAttemptsForCourse({ userId, courseId }),
    ]);

    return {
      completedLessons: completedLessons.map((l) => l.lessonId),
      testAttempts,
      completedTests: completedTests.map((t) => t.testId),
    };
  }

  // ── lessons ──────────────────────────────────────────────────────────────────
  async getLesson({ lessonId, courseId, userId, authUser }) {
    const courseRole = this.#courseRole(authUser);
    const lesson = await staffCourseRepository.getPreviewableLesson({
      lessonId,
      courseId,
      courseRole,
    });
    if (!lesson) {
      throw new AppError({ code: coursesMessagesCodes.LESSON_NOT_FOUND, statusCode: 404 });
    }
    await this.assertCanAccessLesson({ lesson, userId });
    return lesson;
  }

  // Mirrors legacy `canAccessAlesson`: requires an explicit LessonAccess row AND all
  // previous homework lessons completed AND their published tests passed.
  async assertCanAccessLesson({ lesson, userId, client }) {
    const access = await staffCourseRepository.getLessonAccess({
      lessonId: lesson.id,
      userId,
      client,
    });
    if (!access) {
      throw new AppError({ code: coursesMessagesCodes.LESSON_ACCESS_DENIED, statusCode: 403 });
    }
    await this.assertPreviousLessonsCleared({
      courseId: lesson.courseId,
      order: lesson.order,
      userId,
      client,
    });
  }

  // Shared gate used by lesson-access and test-access (legacy canAccessALessonTest /
  // canAccessACourseTest). `order === undefined` means "all homework lessons in the
  // course" (course-level test gate); otherwise "previous lessons only".
  async assertPreviousLessonsCleared({ courseId, order, userId, client }) {
    const previousLessons = await staffCourseRepository.listPreviousHomeworkLessons({
      courseId,
      order,
      client,
    });
    const previousLessonIds = previousLessons.map((l) => l.id);

    const completed = await staffCourseRepository.listCompletedLessonIdsIn({
      userId,
      courseId,
      lessonIds: previousLessonIds,
      client,
    });
    const completedIds = completed.map((l) => l.lessonId);
    const allPreviousCompleted = previousLessonIds.every((id) =>
      completedIds.includes(id),
    );

    const lessonsWithTests = await staffCourseRepository.listLessonsWithPublishedTests({
      lessonIds: previousLessonIds,
      client,
    });

    let allPreviousTestsPassed = true;
    for (const lessonWithTest of lessonsWithTests) {
      for (const test of lessonWithTest.tests) {
        const attempt = await staffCourseRepository.findPassedAttempt({
          userId,
          testId: test.id,
          client,
        });
        if (!attempt) {
          allPreviousTestsPassed = false;
          break;
        }
      }
      if (!allPreviousTestsPassed) break;
    }

    if (!allPreviousCompleted || !allPreviousTestsPassed) {
      throw new AppError({ code: coursesMessagesCodes.PREVIOUS_LESSONS_INCOMPLETE, statusCode: 403 });
    }
  }

  // ── homework ───────────────────────────────────────────────────────────────────
  async getHomeworks({ userId, lessonId, courseId, authUser }) {
    await this.getLesson({ lessonId, courseId, userId, authUser });
    return staffCourseRepository.listHomeworks({ userId, lessonId });
  }

  // Legacy `createAHomeWork`: create a homework row, then if BOTH a VIDEO and a
  // SUMMARY exist for the lesson, mark the lesson complete.
  async createHomework({ data, lessonId, userId, courseId, authUser }) {
    await this.getLesson({ lessonId, courseId, userId, authUser });
    await staffCourseRepository.createHomework({
      data: {
        lessonId,
        userId,
        url: data.url,
        type: data.type,
        title: data.title || data.type,
      },
    });

    const homeworks = await staffCourseRepository.listHomeworkTypes({
      userId,
      lessonId,
    });
    const hasVideo = homeworks.some((hw) => hw.type === HOMEWORK_TYPES.VIDEO);
    const hasSummary = homeworks.some((hw) => hw.type === HOMEWORK_TYPES.SUMMARY);
    if (hasSummary && hasVideo) {
      await this.markLessonAsCompleted({
        lessonId,
        userId,
        courseId,
        authUser,
      });
    }
    return;
  }

  async markLessonAsCompleted({ lessonId, courseId, userId, authUser }) {
    await this.getLesson({ lessonId, courseId, userId, authUser });

    return staffCourseRepository.runTransaction(async (tx) => {
      await staffCourseRepository.lockCourseForUpdate({ courseId, client: tx });
      let courseProgress = await staffCourseRepository.findCourseProgress({
        courseId,
        userId,
        client: tx,
      });
      if (!courseProgress) {
        courseProgress = await staffCourseRepository.createCourseProgress({
          courseId,
          userId,
          client: tx,
        });
      }
      const completed = await staffCourseRepository.findCompletedLesson({
        lessonId,
        courseProgressId: courseProgress.id,
        client: tx,
      });
      if (completed) return completed;
      return staffCourseRepository.createCompletedLesson({
        lessonId,
        courseProgressId: courseProgress.id,
        client: tx,
      });
    });
  }

  // ── tests (staff) ────────────────────────────────────────────────────────────────
  async assertCanAccessTest({ testId, userId, authUser, client }) {
    const courseRole = this.#courseRole(authUser);
    const test = await staffCourseRepository.getPublishedTestWithRelations({
      testId,
      courseRole,
      client,
    });
    if (!test) {
      throw new AppError({ code: coursesMessagesCodes.COURSE_ACCESS_DENIED, statusCode: 403 });
    }
    if (!isValidPublishedTest(test.questions)) {
      throw new AppError({ code: generalMessagesCodes.BAD_REQUEST, statusCode: 400 });
    }
    if (test.lesson) {
      await this.assertCanAccessLesson({ lesson: test.lesson, userId, client });
    } else if (test.course) {
      await this.assertPreviousLessonsCleared({
        courseId: test.course.id,
        order: undefined,
        userId,
        client,
      });
    } else {
      throw new AppError({ code: coursesMessagesCodes.COURSE_ACCESS_DENIED, statusCode: 403 });
    }
    return test;
  }

  async getUserTest({ testId, userId, authUser }) {
    const test = await this.assertCanAccessTest({ testId, userId, authUser });
    const { questions, ...learnerTest } = test;
    return learnerTest;
  }

  async getUserTestQuestions({ testId, userId, authUser }) {
    await this.assertCanAccessTest({ testId, userId, authUser });
    const questions = await staffCourseRepository.listTestQuestions({ testId });
    return sanitizeLearnerQuestions(questions);
  }

  // ── attempts (staff) ──────────────────────────────────────────────────────────
  async getUserAttempts({ testId, userId, authUser }) {
    await this.assertCanAccessTest({ testId, userId, authUser });
    return staffCourseRepository.listUserAttempts({ testId, userId });
  }

  async getUserAttempt({ attemptId, testId, userId, authUser }) {
    const attempt = await staffCourseRepository.getAttemptOwner({ attemptId });
    this.#assertAttemptIdentity({ attempt, attemptId, testId, authUserId: userId });
    await this.assertCanAccessTest({ testId, userId, authUser });
    return staffCourseRepository.getUserAttempt({ attemptId, userId });
  }

  // Legacy `createAttampt`: enforce the per-user attempt limit, then create.
  // M1 (TOCTOU): the limit check + insert run in ONE transaction, and the prior
  // attempt row is read `FOR UPDATE` so two concurrent requests serialize on it —
  // the second blocks until the first commits its new row, then re-reads it and is
  // correctly rejected. Same observable result/shape as before for serial callers.
  async createAttempt({ testId, userId, authUser }) {
    return staffCourseRepository.runTransaction(async (tx) => {
      const lockedTest = await staffCourseRepository.lockTestForUpdate({
        testId,
        client: tx,
      });
      if (!lockedTest) {
        throw new AppError({ code: coursesMessagesCodes.TEST_NOT_FOUND, statusCode: 404 });
      }
      const test = await this.assertCanAccessTest({
        testId,
        userId,
        authUser,
        client: tx,
      });
      const last = await staffCourseRepository.getLastUserAttemptForUpdate({
        testId,
        userId,
        client: tx,
      });
      const attemptLimit = Math.max(last?.attemptLimit ?? 0, test.attemptLimit);

      if (last && last.attemptCount >= last.attemptLimit) {
        throw new AppError({ code: coursesMessagesCodes.ATTEMPT_LIMIT_REACHED, statusCode: 400 });
      }

      const created = await staffCourseRepository.createAttempt({
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
  async submitAnswer({
    answer,
    attemptId,
    questionId,
    testId,
    authUserId,
    authUser,
  }) {
    return staffCourseRepository.runTransaction(async (tx) => {
      const attempt = await staffCourseRepository.getAttemptOwnerForUpdate({
        attemptId,
        client: tx,
      });
      this.#assertAttemptIdentity({ attempt, attemptId, testId, authUserId });
      const test = await this.assertCanAccessTest({
        testId: attempt.testId,
        userId: authUserId,
        authUser,
        client: tx,
      });
      this.#assertAttemptOpenAndInTime({ attempt, test });

      const question = await staffCourseRepository.getQuestionTestId({
        questionId,
        client: tx,
      });
      if (!question || question.testId !== attempt.testId) {
        throw new AppError({ code: coursesMessagesCodes.QUESTION_TEST_MISMATCH, statusCode: 400 });
      }

      const existing = await staffCourseRepository.findExistingAnswer({
        attemptId,
        questionId,
        client: tx,
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
          await staffCourseRepository.deleteSelectedAnswers({
            userAnswerId: existing.id,
            client: tx,
          });
        }
        return staffCourseRepository.updateUserAnswer({
          id: existing.id,
          data: { textAnswer: answer.textAnswer || null, selectedAnswers },
          client: tx,
        });
      }

      return staffCourseRepository.createUserAnswer({
        data: {
          attemptId,
          questionId,
          textAnswer: answer.textAnswer || null,
          selectedAnswers,
        },
        client: tx,
      });
    });
  }

  // Legacy `endAttempt`: score the attempt, persist, and notify on a fully-consumed
  // failure. Scoring math is copied VERBATIM. Also used by the admin surface after
  // approving a text answer.
  // `reScore` is passed ONLY by the admin approve-answer path (re-scoring an already
  // finalized attempt after manually approving a TEXT answer). Staff callers never
  // pass it, so a staff PUT on a finalized attempt (endTime set) is rejected (H1).
  async endAttempt({
    attemptId,
    testId,
    authUserId,
    authUser,
    reScore = false,
  }) {
    const result = await staffCourseRepository.runTransaction(async (tx) => {
      const owner = await staffCourseRepository.getAttemptOwnerForUpdate({
        attemptId,
        client: tx,
      });
      if (!reScore) {
        this.#assertAttemptIdentity({
          attempt: owner,
          attemptId,
          testId,
          authUserId,
        });
        await this.assertCanAccessTest({
          testId: owner.testId,
          userId: authUserId,
          authUser,
          client: tx,
        });
        if (owner.endTime) {
          throw new AppError({ code: coursesMessagesCodes.ATTEMPT_ALREADY_ENDED, statusCode: 409 });
        }
      } else if (!owner) {
        throw new AppError({ code: coursesMessagesCodes.ATTEMPT_NOT_FOUND, statusCode: 404 });
      }

      const attempt = await staffCourseRepository.getAttemptForScoring({
        attemptId,
        client: tx,
      });
      if (!attempt) {
        throw new AppError({ code: coursesMessagesCodes.ATTEMPT_NOT_FOUND, statusCode: 404 });
      }
      if (!isValidPublishedTest(attempt.test.questions)) {
        throw new AppError({ code: generalMessagesCodes.BAD_REQUEST, statusCode: 400 });
      }

      const totalQuestions = attempt.test.questions.length;
      let earnedPoints = 0;

      for (const answer of attempt.answers) {
        if (answer.question.type === COURSE_QUESTION_TYPES.TEXT) {
          if (answer.isApproved) earnedPoints += 1;
          continue;
        }

        const correctChoices = answer.question.choices
          .filter((c) => c.isCorrect)
          .map((c) => c.text);
        const selectedChoices = answer.selectedAnswers.map((c) => c.value);

        if (answer.question.type === COURSE_QUESTION_TYPES.ORDERING) {
          const correctOrder = [...answer.question.choices]
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

        if (answer.question.type === COURSE_QUESTION_TYPES.MULTIPLE_CHOICE) {
          const selectedCorrect = selectedChoices.filter((v) =>
            correctChoices.includes(v),
          ).length;
          earnedPoints += selectedCorrect / correctChoices.length;
        } else {
          const isCorrect =
            JSON.stringify(correctChoices.sort()) ===
            JSON.stringify(selectedChoices.sort());
          if (isCorrect) earnedPoints += 1;
        }
      }

      const computedScore = (earnedPoints / totalQuestions) * 100;
      const score = Number.isFinite(computedScore) ? computedScore : 0;
      const passed = score >= 80;
      await staffCourseRepository.updateAttemptScore({
        attemptId,
        score,
        passed,
        endTime: new Date(),
        client: tx,
      });
      return {
        score,
        passed,
        notifyFailure: !passed && attempt.attemptCount >= attempt.attemptLimit,
        testId: attempt.testId,
        userId: attempt.userId,
      };
    });

    if (result.notifyFailure) {
      await attemptFailedByUser({ testId: result.testId, userId: result.userId });
    }
    return { score: result.score, passed: result.passed };
  }

  // ── user dashboard ─────────────────────────────────────────────────────────────
  // Legacy `getUserDashboardStats` — aggregation ported verbatim.
  async getUserDashboardStats({ userId }) {
    const enrolledCourses = await staffCourseRepository.listEnrolledCourses({ userId });

    const totalEnrolledCourses = enrolledCourses.length;
    const publishedEnrolledCourses = enrolledCourses.filter(
      (progress) => progress.course.isPublished,
    ).length;

    let completedCourses = 0;
    const courseCompletionDetails = [];
    for (const progress of enrolledCourses) {
      const totalLessons = await staffCourseRepository.countCourseLessons({
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

    const lessonAccess = await staffCourseRepository.listLessonAccessForUser({ userId });
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

    const testAttempts = await staffCourseRepository.listUserTestAttemptsForDashboard({
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

    const certificates = await staffCourseRepository.countApprovedCertificates({
      userId,
    });
    const submittedHomeworks = await staffCourseRepository.countSubmittedHomeworks({
      userId,
    });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [attempts, recentHomeworks, recentLessons] = await Promise.all([
      staffCourseRepository.listRecentAttemptDates({ userId, since: thirtyDaysAgo }),
      staffCourseRepository.listRecentHomeworkDates({ userId, since: thirtyDaysAgo }),
      staffCourseRepository.listRecentCompletedLessonDates({
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

export const staffCourseUsecase = new StaffCourseUsecase();
export { StaffCourseUsecase };
